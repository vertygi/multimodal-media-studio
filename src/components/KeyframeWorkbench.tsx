"use client";

import React, { useState } from "react";
import { Project, Asset, AspectRatio, StoryboardShot, SavedKeyframe } from "@/types";
import { 
  Wand2, 
  Sparkles, 
  Plus, 
  X, 
  Image as ImageIcon, 
  Check, 
  Download, 
  Eye, 
  Upload, 
  Film,
  ArrowRight,
  Maximize2,
  Copy,
  Trash2,
  Layers,
  RefreshCw
} from "lucide-react";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface KeyframeWorkbenchProps {
  project: Project;
  onProjectUpdated: (p: Project) => void;
  onGoToStoryboard: () => void;
  initialShotNumber?: number;
}

export const KeyframeWorkbench: React.FC<KeyframeWorkbenchProps> = ({
  project,
  onProjectUpdated,
  onGoToStoryboard,
  initialShotNumber = 1,
}) => {
  // Active selected references for the keyframe
  const [activeReferences, setActiveReferences] = useState<Array<{ id: string; name: string; tag: string; url: string }>>([]);
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);

  // Prompt and configuration
  const [userPrompt, setUserPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || "9:16");
  const [selectedModel, setSelectedModel] = useState<string>("openai/gpt-image-2.5/sunburst/edit");
  const [selectedShotNumber, setSelectedShotNumber] = useState<number>(initialShotNumber || 1);

  // Processing states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [assignedSuccess, setAssignedSuccess] = useState(false);

  // Current preview
  const [currentKeyframeUrl, setCurrentKeyframeUrl] = useState<string | null>(null);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Reference Category Filter
  const [refCategory, setRefCategory] = useState<"all" | "assets" | "shots" | "saved">("all");

  // Cinematic Angle Presets for depth and eliminating flat staging
  const CINEMATIC_ANGLE_PRESETS = [
    {
      label: "🔄 Обратный ракурс (Reverse Angle)",
      text: "Обратный ракурс на 180 градусов (Reverse angle shot), съемка с противоположной стороны сцены, строгое сохранение костюмов, причесок и направления света из предыдущего кадра",
    },
    {
      label: "🎬 Проходной ракурс / Сдвиг 45°",
      text: "Проходной ракурс со смещением камеры на 45 градусов, средний кинематографичный план, сохранение позы и мизансцены из предыдущего кадра",
    },
    {
      label: "🎬 Из-за плеча (OTS)",
      text: "Ракурс из-за плеча (Over-The-Shoulder), силуэт собеседника на переднем плане в мягком фокусе, резкий фокус на лице главного героя, многослойная глубина кадра",
    },
    {
      label: "👥 Диалог 3/4 (Глаза в глаза)",
      text: "Динамичный ракурс три четверти (3/4 profile), персонажи развернуты друг к другу с эмоциональным напряжением, взгляд строго мимо камеры",
    },
    {
      label: "📐 Нижний ракурс (Драма)",
      text: "Драматичный нижний ракурс снизу вверх (Low-angle shot), монументальная перспектива и объемное контрастное кино-освещение",
    },
    {
      label: "🚪 Глубина / Dirty Frame",
      text: "Многослойная глубина кадра, съемка сквозь передний план (дверной проем / разбитое стекло / капли дождя на окне), кинематографичный боке",
    },
    {
      label: "🔍 Детали / Руки и предметы",
      text: "Интимный макро-план (Macro Close-up), эмоциональный фокус на дрожащих пальцах, руках и фактуре предметов",
    },
    {
      label: "💡 Контровой свет (Chiaroscuro)",
      text: "Кинематографичный контровой и боковой свет (Chiaroscuro rim lighting), объемные глубокие тени и сильный контраст",
    },
  ];

  const handleApplyAnglePreset = (presetText: string) => {
    setUserPrompt((prev) => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return presetText;
      if (cleanPrev.includes(presetText)) return cleanPrev;
      return `${cleanPrev}. ${presetText}`;
    });
  };

  // All available project assets that have images
  const assetItems = [
    ...project.characters,
    ...project.locations,
    ...project.props,
  ].filter((a) => !!a.imageUrl).map((a) => ({
    id: a.id,
    name: a.name,
    tag: a.tag,
    imageUrl: a.imageUrl!,
    category: "asset" as const,
    subType: a.type,
  }));

  // Available shot keyframes for inter-shot / continuity references
  const shotKeyframeItems = project.shots
    .filter((s) => !!s.keyframeUrl)
    .map((s) => ({
      id: `shot_kf_${s.id}`,
      name: `Сцена #${s.shotNumber} (${s.framing})`,
      tag: `@Кадр${s.shotNumber}`,
      imageUrl: s.keyframeUrl!,
      category: "shot" as const,
      shotNumber: s.shotNumber,
    }));

  // Saved keyframes library
  const savedKeyframeItems = (project.savedKeyframes || [])
    .filter((kf) => !!kf.imageUrl)
    .map((kf, idx) => ({
      id: `saved_kf_${kf.id}`,
      name: `Кадр ${idx + 1} (${kf.assignedShotNumber ? `Сцена #${kf.assignedShotNumber}` : "Библиотека"})`,
      tag: `@Кадр${kf.assignedShotNumber || idx + 1}`,
      imageUrl: kf.imageUrl,
      category: "saved" as const,
    }));

  const allAvailableItems = [
    ...assetItems,
    ...shotKeyframeItems,
    ...savedKeyframeItems,
  ];

  const filteredReferenceItems = allAvailableItems.filter((item) => {
    if (refCategory === "assets") return item.category === "asset";
    if (refCategory === "shots") return item.category === "shot";
    if (refCategory === "saved") return item.category === "saved";
    return true;
  });

  // Add item to active references
  const handleAddReference = (item: { id: string; name: string; tag: string; imageUrl?: string }) => {
    if (!item.imageUrl) return;
    if (activeReferences.some((r) => r.id === item.id)) return;
    setActiveReferences((prev) => [
      ...prev,
      {
        id: item.id,
        name: item.name,
        tag: item.tag,
        url: item.imageUrl!,
      },
    ]);
  };

  // Quick action: attach previous shot keyframe as continuity reference
  const handleAttachPreviousShotReference = (prevShot: StoryboardShot) => {
    if (!prevShot.keyframeUrl) return;
    const refId = `shot_kf_${prevShot.id}`;
    if (!activeReferences.some((r) => r.id === refId)) {
      setActiveReferences((prev) => [
        ...prev,
        {
          id: refId,
          name: `Сцена #${prevShot.shotNumber} (${prevShot.framing})`,
          tag: `@Кадр${prevShot.shotNumber}`,
          url: prevShot.keyframeUrl!,
        },
      ]);
    }

    const currentShot = project.shots.find((s) => s.shotNumber === selectedShotNumber);
    const framing = currentShot?.framing || "новый ракурс";
    const continuityInstruction = `Смена ракурса камеры на ${framing}. Строго сохранить костюмы, внешность, прически и светотеневой рисунок из кадра Сцены #${prevShot.shotNumber}.`;
    
    setUserPrompt((prev) => {
      if (prev.includes(`Сцены #${prevShot.shotNumber}`)) return prev;
      return prev.trim() ? `${prev.trim()}\n\n${continuityInstruction}` : continuityInstruction;
    });
  };

  const handleRemoveReference = (id: string) => {
    setActiveReferences((prev) => prev.filter((r) => r.id !== id));
  };

  // Upload custom reference image
  const uploadImageFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        const customRef = {
          id: `upload_${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, "") || "Свой референс",
          tag: "@Пользовательский",
          url: data.url,
        };
        setActiveReferences((prev) => [...prev, customRef]);
      } else {
        alert("Ошибка загрузки файла");
      }
    } catch (err: any) {
      alert(`Ошибка загрузки: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragStartAsset = (e: React.DragEvent, asset: Asset) => {
    e.dataTransfer.setData("application/json", JSON.stringify(asset));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropOnDropzone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDropzone(false);

    // 1. Check if files were dropped from desktop/finder
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        uploadImageFile(file);
      } else {
        alert("Пожалуйста, перетащите файл изображения (.jpg, .png, .webp).");
      }
      return;
    }

    // 2. Check if an asset was dragged from the left list
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw) {
        const asset: Asset = JSON.parse(raw);
        handleAddReference(asset);
      }
    } catch (err) {
      console.warn("Drag parse error:", err);
    }
  };

  // Select scene and auto-load its prompt, character/location references and preview
  const handleSelectScene = (shotNum: number) => {
    setSelectedShotNumber(shotNum);
    const shot = project.shots.find((s) => s.shotNumber === shotNum);
    if (!shot) return;

    setUserPrompt(shot.keyframePrompt || shot.visualDescription || "");

    const newRefs: Array<{ id: string; name: string; tag: string; url: string }> = [];
    
    shot.characterTags.forEach((t) => {
      const char = project.characters.find((c) => c.tag.toLowerCase() === t.toLowerCase());
      if (char?.imageUrl && !newRefs.some((r) => r.id === char.id)) {
        newRefs.push({ id: char.id, name: char.name, tag: char.tag, url: char.imageUrl });
      }
    });

    if (shot.settingTag) {
      const loc = project.locations.find((l) => l.tag.toLowerCase() === shot.settingTag.toLowerCase());
      if (loc?.imageUrl && !newRefs.some((r) => r.id === loc.id)) {
        newRefs.push({ id: loc.id, name: loc.name, tag: loc.tag, url: loc.imageUrl });
      }
    }

    (shot.propTags || []).forEach((t) => {
      const p = project.props.find((pr) => pr.tag.toLowerCase() === t.toLowerCase());
      if (p?.imageUrl && !newRefs.some((r) => r.id === p.id)) {
        newRefs.push({ id: p.id, name: p.name, tag: p.tag, url: p.imageUrl });
      }
    });

    setActiveReferences(newRefs);

    if (shot.keyframeUrl) {
      setCurrentKeyframeUrl(shot.keyframeUrl);
    }
  };

  // Auto-select scene on first mount or when initialShotNumber changes
  React.useEffect(() => {
    handleSelectScene(initialShotNumber || 1);
  }, [initialShotNumber]);

  // Enhance prompt with AI
  const handleEnhancePrompt = async () => {
    if (!userPrompt.trim()) return;
    setIsEnhancing(true);

    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt,
          referenceNames: activeReferences.map((r) => `${r.name} (${r.tag})`),
          genre: project.genre,
        }),
      });

      const data = await res.json();
      if (data.success && data.enhancedPrompt) {
        setUserPrompt(data.enhancedPrompt);
      }
    } catch (err: any) {
      console.error("Enhance prompt error:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Generate Keyframe
  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      alert("Пожалуйста, введите описание сцены (промпт).");
      return;
    }

    setIsGenerating(true);
    setAssignedSuccess(false);

    try {
      const targetShot = project.shots.find((s) => s.shotNumber === selectedShotNumber);

      const res = await fetch("/api/generate-keyframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          shotId: targetShot?.id,
          customPrompt: userPrompt,
          referenceUrls: activeReferences.map((r) => r.url),
          aspectRatio,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Ошибка генерации ключевого кадра");
      }

      setCurrentKeyframeUrl(data.keyframeUrl || data.shot?.keyframeUrl);
      onProjectUpdated(data.project);
    } catch (err: any) {
      alert(`Ошибка генерации: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Assign current preview or saved keyframe to a specific shot
  const handleAssignKeyframeToShot = async (imageUrl: string, targetShotNum: number) => {
    const updatedShots = project.shots.map((s) => {
      if (s.shotNumber === targetShotNum) {
        return {
          ...s,
          keyframeUrl: imageUrl,
          status: "keyframe_ready" as const,
        };
      }
      return s;
    });

    const updatedProject: Project = {
      ...project,
      shots: updatedShots,
    };

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });
      const data = await res.json();
      if (data.success) {
        onProjectUpdated(data.project);
        setAssignedSuccess(true);
        setTimeout(() => setAssignedSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(`Ошибка прикрепления кадра: ${err.message}`);
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const is916 = aspectRatio === "9:16";
  const savedKeyframes = project.savedKeyframes || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-zinc-400" />
            Мастерская кадров
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Рабочее место создания ключевых кадров: перетаскивайте референсы, улучшайте промпт через ИИ и привязывайте готовый результат к сценам.
          </p>
        </div>

        <button
          onClick={onGoToStoryboard}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition"
        >
          <span>Перейти к раскадровке</span>
          <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Available References (4 Cols) */}
        <div className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-zinc-400" />
              Референсы ({filteredReferenceItems.length})
            </h3>

            <label className="flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition">
              <Upload className="h-3 w-3" />
              <span>{isUploading ? "Загрузка..." : "Загрузить фото"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImageFile(f);
                }}
              />
            </label>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800">
            <button
              type="button"
              onClick={() => setRefCategory("all")}
              className={`rounded px-2 py-1 text-[11px] font-medium transition shrink-0 ${
                refCategory === "all"
                  ? "bg-zinc-200 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Все ({allAvailableItems.length})
            </button>
            <button
              type="button"
              onClick={() => setRefCategory("shots")}
              className={`rounded px-2 py-1 text-[11px] font-medium transition shrink-0 flex items-center gap-1 ${
                refCategory === "shots"
                  ? "bg-zinc-200 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Film className="h-3 w-3" />
              <span>Кадры сцен ({shotKeyframeItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setRefCategory("assets")}
              className={`rounded px-2 py-1 text-[11px] font-medium transition shrink-0 ${
                refCategory === "assets"
                  ? "bg-zinc-200 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Ассеты ({assetItems.length})
            </button>
            <button
              type="button"
              onClick={() => setRefCategory("saved")}
              className={`rounded px-2 py-1 text-[11px] font-medium transition shrink-0 ${
                refCategory === "saved"
                  ? "bg-zinc-200 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Сохраненные ({savedKeyframeItems.length})
            </button>
          </div>

          <p className="text-[11px] text-zinc-400">
            Перетащите карточку мышкой в поле референсов или кликните по ней:
          </p>

          {filteredReferenceItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
              В этой категории пока нет изображений. Вы можете загрузить фото вручную или сгенерировать кадры.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredReferenceItems.map((item) => {
                const isSelected = activeReferences.some((r) => r.id === item.id);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify(item));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveReference(item.id);
                      } else {
                        handleAddReference(item);
                      }
                    }}
                    className={`group relative flex flex-col items-center rounded-lg border p-2 text-left cursor-grab active:cursor-grabbing transition select-none ${
                      isSelected
                        ? "border-zinc-500 bg-zinc-800"
                        : "border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="relative h-24 w-full overflow-hidden rounded bg-zinc-900">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 rounded-full bg-zinc-200 p-0.5 text-zinc-950">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                      {item.category === "shot" && (
                        <div className="absolute bottom-1 left-1 rounded bg-zinc-950/85 px-1 py-0.5 text-[9px] font-mono text-zinc-300 border border-zinc-700">
                          Проходной
                        </div>
                      )}
                    </div>
                    <div className="w-full mt-1.5">
                      <div className="text-[11px] font-medium text-zinc-200 truncate">{item.name}</div>
                      <div className="text-[9px] font-mono text-zinc-500 truncate">{item.tag}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CENTER COLUMN: Dropzone, Prompt & Controls (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
          
          {/* Active Working Scene Selector Bar */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-zinc-400" />
                <span>Рабочая сцена для генерации:</span>
              </span>

              {/* Dropdown for scene selection */}
              <select
                value={selectedShotNumber}
                onChange={(e) => handleSelectScene(Number(e.target.value))}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-100 focus:outline-none"
              >
                {project.shots.map((s) => (
                  <option key={s.id} value={s.shotNumber}>
                    Сцена #{s.shotNumber} ({s.framing}) — {s.keyframeUrl ? "✓ Кадр готов" : "Нет кадра"}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Scene Pills 1..N */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {project.shots.map((s) => {
                const isCurrent = s.shotNumber === selectedShotNumber;
                const hasKeyframe = !!s.keyframeUrl;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectScene(s.shotNumber)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition shrink-0 ${
                      isCurrent
                        ? "border border-zinc-400 bg-zinc-800 text-white shadow-sm"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <span>#{s.shotNumber}</span>
                    {hasKeyframe && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Кадр создан" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Scene Context */}
            {(() => {
              const currentShot = project.shots.find((s) => s.shotNumber === selectedShotNumber);
              if (!currentShot) return null;

              const prevShot = selectedShotNumber > 1
                ? project.shots.find((s) => s.shotNumber === selectedShotNumber - 1)
                : null;

              return (
                <div className="rounded bg-zinc-900/90 p-2 text-[11px] text-zinc-400 space-y-2 border border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="font-semibold text-zinc-300">План: {currentShot.framing}</span>
                    <span>•</span>
                    <span className="text-zinc-400">Камера: {currentShot.cameraMovement}</span>
                    {currentShot.characterTags.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-300 font-mono">{currentShot.characterTags.join(" ")}</span>
                      </>
                    )}
                    {currentShot.settingTag && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-400">{currentShot.settingTag}</span>
                      </>
                    )}
                  </div>
                  <p className="line-clamp-2 text-zinc-300 italic">
                    «{currentShot.visualDescription}»
                  </p>

                  {/* One-click inter-shot continuity reference */}
                  {prevShot?.keyframeUrl && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleAttachPreviousShotReference(prevShot)}
                        className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:text-white transition shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
                        <span>⚡ Использовать Сцену #{prevShot.shotNumber} как референс ракурса</span>
                      </button>
                      <span className="text-[10px] text-zinc-500 font-mono truncate">{prevShot.framing}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Active References Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">
                Активные референсы ({activeReferences.length})
              </span>
              {activeReferences.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveReferences([])}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Очистить все
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOverDropzone(true);
              }}
              onDragLeave={() => setIsDragOverDropzone(false)}
              onDrop={handleDropOnDropzone}
              className={`rounded-lg border-2 border-dashed p-3 transition min-h-[90px] flex items-center justify-center ${
                isDragOverDropzone
                  ? "border-zinc-400 bg-zinc-800"
                  : "border-zinc-800 bg-zinc-950/60"
              }`}
            >
              {activeReferences.length === 0 ? (
                <div className="text-center p-2 text-xs text-zinc-500">
                  <span>Перетащите сюда карточки ассетов или файлы изображений с компьютера</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 w-full">
                  {activeReferences.map((ref, idx) => (
                    <div
                      key={ref.id}
                      className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 pr-2 text-xs text-zinc-200"
                    >
                      <img src={ref.url} alt={ref.name} className="h-8 w-8 rounded object-cover" />
                      <div>
                        <div className="text-[10px] text-zinc-400 font-mono">Реф #{idx + 1}</div>
                        <div className="text-[11px] font-medium truncate max-w-[100px]">{ref.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveReference(ref.id)}
                        className="ml-1 text-zinc-500 hover:text-rose-400"
                        title="Удалить"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prompt Area with Scene Prefill & AI Enhancer */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <label className="font-semibold text-zinc-300">
                Описание кадра (на русском или английском)
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectScene(selectedShotNumber)}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded transition"
                  title="Сбросить промпт и заново загрузить данные выбранной сцены"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Сбросить к Сцене #{selectedShotNumber}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !userPrompt.trim()}
                  className="flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-200 transition disabled:opacity-40"
                  title="ИИ улучшает формулировку для кинокамеры ARRI Alexa и добавляет реалистичные детали"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>{isEnhancing ? "Улучшение..." : "✨ Улучшить промпт ИИ"}</span>
                </button>
              </div>
            </div>

            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={5}
              placeholder="Напишите своими словами, например: Крупный план, заплаканная Цзинь Ли в темной куртке с золотыми прожилками на груди сидит за старым столом в мрачном подвале, глядя на тяжелый нож..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none leading-relaxed resize-y"
            />

            {/* Кино-ракурсы для живой глубины */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span className="font-medium">
                  Кино-ракурсы для живой глубины (чтобы персонажи не смотрели в камеру):
                </span>
                <span className="text-[9px] text-zinc-500">Нажмите, чтобы добавить в промпт</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CINEMATIC_ANGLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyAnglePreset(preset.text)}
                    className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 hover:bg-zinc-800/60 transition"
                    title={preset.text}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model & Aspect Ratio */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400">Модель</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="openai/gpt-image-2.5/sunburst/edit">
                  GPT Image 2.5 Edit (С референсами)
                </option>
                <option value="openai/gpt-image-2.5/sunburst/text-to-image">
                  GPT Image 2.5 (Только текст)
                </option>
                <option value="fal-ai/flux/schnell">
                  FLUX.1 Schnell (Быстрый драфт)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400">Формат</label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio("9:16")}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                    aspectRatio === "9:16"
                      ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                      : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  9:16 (Shorts)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio("16:9")}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                    aspectRatio === "16:9"
                      ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                      : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  16:9 (Широкий)
                </button>
              </div>
            </div>
          </div>

          {/* Generate Button (User-Initiated) */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !userPrompt.trim()}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-zinc-200 hover:bg-white py-2.5 text-xs font-bold text-zinc-950 transition disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <span>Генерация кадра...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>Сгенерировать ключевой кадр</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: Current Result & Assign to Scene (3 Cols) */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
            <span>Результат</span>
            {currentKeyframeUrl && (
              <span className="text-[10px] text-zinc-400 font-medium">Сгенерирован</span>
            )}
          </h3>

          {/* Preview Canvas */}
          <div
            className={`group relative w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center ${
              is916 ? "aspect-[9/16] max-h-[340px]" : "aspect-[16/9]"
            }`}
          >
            {currentKeyframeUrl ? (
              <>
                <img
                  src={currentKeyframeUrl}
                  alt="Ключевой кадр"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLightboxImage({
                      url: currentKeyframeUrl,
                      title: `Ключевой кадр (Сцена #${selectedShotNumber})`,
                      subtitle: userPrompt,
                    })
                  }
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition"
                  title="Открыть в полном разрешении"
                >
                  <span className="flex items-center gap-1 text-xs font-medium text-zinc-100 bg-zinc-900/90 px-2.5 py-1.5 rounded border border-zinc-700">
                    <Maximize2 className="h-3.5 w-3.5" /> На весь экран
                  </span>
                </button>
              </>
            ) : (
              <div className="p-4 text-center text-zinc-600 text-xs">
                <Film className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <span>Здесь появится готовый ключевой кадр</span>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-3 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent mb-1" />
                <span className="text-[11px] text-zinc-300 font-medium">Рендеринг кадра...</span>
              </div>
            )}
          </div>

          {/* Attach to Scene Controls */}
          {currentKeyframeUrl && (
            <div className="space-y-2 border-t border-zinc-800 pt-3">
              <label className="block text-[11px] font-medium text-zinc-400">
                Прикрепить к сцене:
              </label>

              <select
                value={selectedShotNumber}
                onChange={(e) => setSelectedShotNumber(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
              >
                {project.shots.map((shot) => (
                  <option key={shot.id} value={shot.shotNumber}>
                    Сцена #{shot.shotNumber} ({shot.framing}, {shot.duration}с)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleAssignKeyframeToShot(currentKeyframeUrl, selectedShotNumber)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 py-2 text-xs font-semibold text-zinc-100 transition border border-zinc-700"
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Прикрепить к Сцене #{selectedShotNumber}</span>
              </button>

              {assignedSuccess && (
                <div className="text-center text-[11px] text-emerald-400 font-medium">
                  ✓ Кадр прикреплен к сцене #{selectedShotNumber}!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Saved Keyframes Shelf (Коллекция кадров проекта) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Сохраненные кадры проекта ({savedKeyframes.length})
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500">
            Все сгенерированные кадры хранятся здесь. Нажмите на кадр, чтобы посмотреть или привязать к сцене.
          </span>
        </div>

        {savedKeyframes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800/80 p-6 text-center text-xs text-zinc-500">
            Здесь будет галерея всех ключевых кадров, которые вы создадите в воркбенче.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {savedKeyframes.map((kf, idx) => (
              <div
                key={kf.id || idx}
                className="group relative flex flex-col rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden hover:border-zinc-700 transition"
              >
                <div
                  className="relative aspect-[9/16] w-full overflow-hidden bg-zinc-900 cursor-pointer"
                  onClick={() =>
                    setLightboxImage({
                      url: kf.imageUrl,
                      title: `Кадр #${savedKeyframes.length - idx}`,
                      subtitle: kf.prompt,
                    })
                  }
                >
                  <img src={kf.imageUrl} alt="Кадр" className="h-full w-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Maximize2 className="h-4 w-4 text-white" />
                  </div>
                  {kf.assignedShotNumber && (
                    <div className="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300 border border-zinc-700">
                      Сцена #{kf.assignedShotNumber}
                    </div>
                  )}
                </div>

                <div className="p-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(kf.prompt)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                      title="Скопировать промпт"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Промпт</span>
                    </button>

                    <a
                      href={kf.imageUrl}
                      download={`keyframe_${kf.id}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                      title="Скачать"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Assign dropdown */}
                  <div className="pt-1">
                    <select
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val > 0) {
                          handleAssignKeyframeToShot(kf.imageUrl, val);
                        }
                      }}
                      defaultValue=""
                      className="w-full rounded border border-zinc-800 bg-zinc-900 px-1 py-1 text-[10px] text-zinc-300 focus:outline-none"
                    >
                      <option value="" disabled>
                        Привязать к...
                      </option>
                      {project.shots.map((s) => (
                        <option key={s.id} value={s.shotNumber}>
                          Сцена #{s.shotNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <ImageLightboxModal
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
          imageUrl={lightboxImage.url}
          title={lightboxImage.title}
          subtitle={lightboxImage.subtitle}
        />
      )}
    </div>
  );
};
