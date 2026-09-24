"use client";

import React, { useState } from "react";
import { Project, StoryboardShot } from "@/types";
import { 
  Film, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  Eye,
  Sliders,
  Wand2,
  Plus,
  Copy,
  Trash2,
  Link2,
  CheckSquare,
  Square,
  Camera
} from "lucide-react";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface StoryboardTabProps {
  project: Project;
  onProjectUpdated: (p: Project) => void;
  onNextTab: () => void;
  onOpenWorkbench?: (shotNumber?: number) => void;
}

export const StoryboardTab: React.FC<StoryboardTabProps> = ({
  project,
  onProjectUpdated,
  onNextTab,
  onOpenWorkbench,
}) => {
  const [generatingShotIds, setGeneratingShotIds] = useState<Set<string>>(new Set());
  const [selectedShotIds, setSelectedShotIds] = useState<Set<string>>(new Set());
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const isAnyGenerating = generatingShotIds.size > 0;

  // Selection handlers
  const handleToggleSelectShot = (shotId: string) => {
    setSelectedShotIds((prev) => {
      const next = new Set(prev);
      if (next.has(shotId)) {
        next.delete(shotId);
      } else {
        next.add(shotId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedShotIds(new Set(project.shots.map((s) => s.id)));
  };

  const handleSelectWithoutKeyframes = () => {
    setSelectedShotIds(new Set(project.shots.filter((s) => !s.keyframeUrl).map((s) => s.id)));
  };

  const handleClearSelection = () => {
    setSelectedShotIds(new Set());
  };

  // Generate single keyframe
  const handleGenerateKeyframe = async (shot: StoryboardShot, promptOverride?: string) => {
    setGeneratingShotIds((prev) => new Set(prev).add(shot.id));
    try {
      const res = await fetch("/api/generate-keyframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          shotId: shot.id,
          customPrompt: promptOverride || shot.keyframePrompt,
          usePreviousShotReference: shot.usePreviousShotReference ?? true,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Не удалось сгенерировать ключевой кадр");
      
      // Fetch fresh project
      const freshRes = await fetch(`/api/projects/${project.id}`);
      const freshData = await freshRes.json();
      if (freshData.success) {
        onProjectUpdated(freshData.project);
      } else {
        onProjectUpdated(data.project);
      }
    } catch (err: any) {
      alert(`Ошибка генерации: ${err.message}`);
    } finally {
      setGeneratingShotIds((prev) => {
        const next = new Set(prev);
        next.delete(shot.id);
        return next;
      });
    }
  };

  // TRUE PARALLEL BATCH GENERATION (одновременная генерация всех выбранных сцен)
  const handleBatchGenerateSelected = async () => {
    const targetShots = project.shots.filter((s) => selectedShotIds.has(s.id));
    if (targetShots.length === 0) {
      // Default fallback to all shots without keyframes
      const missing = project.shots.filter((s) => !s.keyframeUrl);
      if (missing.length === 0) {
        alert("Все кадры уже сгенерированы! Выберите нужные сцены чекбоксами для перегенерации.");
        return;
      }
      return handleBatchGenerateAllMissing();
    }

    // Set all selected shots to generating state at once
    setGeneratingShotIds((prev) => {
      const next = new Set(prev);
      targetShots.forEach((s) => next.add(s.id));
      return next;
    });

    try {
      // Fire all generation requests concurrently in parallel
      await Promise.all(
        targetShots.map(async (shot) => {
          try {
            const res = await fetch("/api/generate-keyframe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId: project.id,
                shotId: shot.id,
                customPrompt: shot.keyframePrompt,
                usePreviousShotReference: shot.usePreviousShotReference ?? true,
              }),
            });
            const data = await res.json();
            if (!data.success) {
              console.error(`Ошибка генерации сцены #${shot.shotNumber}:`, data.error);
            }
          } catch (err: any) {
            console.error(`Ошибка запроса сцены #${shot.shotNumber}:`, err);
          } finally {
            // Remove this shot from generating set as soon as it finishes
            setGeneratingShotIds((prev) => {
              const next = new Set(prev);
              next.delete(shot.id);
              return next;
            });
          }
        })
      );

      // Fetch clean, synchronized project state after all parallel jobs complete
      const freshRes = await fetch(`/api/projects/${project.id}`);
      const freshData = await freshRes.json();
      if (freshData.success) {
        onProjectUpdated(freshData.project);
      }
    } catch (batchErr: any) {
      alert(`Ошибка при пакетной генерации: ${batchErr.message}`);
    } finally {
      // Clear selection after batch run
      setSelectedShotIds(new Set());
    }
  };

  // Batch generate all missing keyframes concurrently
  const handleBatchGenerateAllMissing = async () => {
    const missing = project.shots.filter((s) => !s.keyframeUrl);
    if (missing.length === 0) return;

    setGeneratingShotIds((prev) => {
      const next = new Set(prev);
      missing.forEach((s) => next.add(s.id));
      return next;
    });

    try {
      await Promise.all(
        missing.map(async (shot) => {
          try {
            await fetch("/api/generate-keyframe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId: project.id,
                shotId: shot.id,
                customPrompt: shot.keyframePrompt,
                usePreviousShotReference: shot.usePreviousShotReference ?? true,
              }),
            });
          } catch (err) {
            console.error(`Ошибка генерации сцены #${shot.shotNumber}:`, err);
          } finally {
            setGeneratingShotIds((prev) => {
              const next = new Set(prev);
              next.delete(shot.id);
              return next;
            });
          }
        })
      );

      const freshRes = await fetch(`/api/projects/${project.id}`);
      const freshData = await freshRes.json();
      if (freshData.success) {
        onProjectUpdated(freshData.project);
      }
    } finally {
      setSelectedShotIds(new Set());
    }
  };

  // Toggle continuity reference for a shot
  const handleToggleContinuity = async (shotId: string) => {
    const targetShot = project.shots.find((s) => s.id === shotId);
    if (!targetShot) return;

    const currentVal = targetShot.usePreviousShotReference ?? true;
    const newVal = !currentVal;

    const updatedShots = project.shots.map((s) => {
      if (s.id === shotId) {
        return { ...s, usePreviousShotReference: newVal };
      }
      return s;
    });

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shots: updatedShots }),
      });
      const data = await res.json();
      if (data.success) {
        onProjectUpdated(data.project);
      }
    } catch (err) {
      console.error("Failed to update continuity toggle:", err);
    }
  };

  // Duplicate shot / Create new angle with continuity link
  const handleDuplicateWithAngle = async (shot: StoryboardShot) => {
    setIsSaving(true);
    try {
      // Determine cinematic alternate angle
      let newFraming = "Reverse Angle Close-Up";
      let angleDesc = "Обратный ракурс на собеседника / смена угла камеры на 180°";
      if (shot.framing.toLowerCase().includes("wide") || shot.framing.toLowerCase().includes("общий")) {
        newFraming = "Medium Close-Up (Reverse Angle)";
        angleDesc = "Сближение камеры, средний обратный ракурс на лица персонажей";
      } else if (shot.framing.toLowerCase().includes("medium") || shot.framing.toLowerCase().includes("средний")) {
        newFraming = "Over-the-Shoulder (OTS) Reaction Shot";
        angleDesc = "Ракурс через плечо (OTS) с фокусом на эмоциональную реакцию";
      } else {
        newFraming = "Tight Dramatic Close-Up (Eyeline Match)";
        angleDesc = "Сверхкрупный кинематографичный план с акцентом на взгляд";
      }

      const newShotId = `shot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const targetIndex = project.shots.findIndex((s) => s.id === shot.id);

      const newShot: StoryboardShot = {
        id: newShotId,
        projectId: project.id,
        shotNumber: shot.shotNumber + 1,
        duration: shot.duration || 5,
        characterTags: [...shot.characterTags],
        settingTag: shot.settingTag,
        propTags: shot.propTags ? [...shot.propTags] : [],
        framing: newFraming,
        cameraMovement: "Subtle handheld breathing",
        visualDescription: `${angleDesc}. Сохранение визуального стиля, костюмов и освещения Сцены #${shot.shotNumber}. ${shot.visualDescription}`,
        motionPrompt: shot.motionPrompt || "Subtle cinematic character micro-movement and eyeline shift",
        dialogue: "",
        keyframePrompt: `${shot.keyframePrompt}, dynamic alternate angle: ${newFraming}, strict costume and facial continuity`,
        status: "draft",
        usePreviousShotReference: true,
        createdAt: Date.now(),
      };

      // Insert and renumber subsequent shots
      const newShots = [...project.shots];
      newShots.splice(targetIndex + 1, 0, newShot);
      newShots.forEach((s, idx) => {
        s.shotNumber = idx + 1;
      });

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shots: newShots }),
      });
      const data = await res.json();
      if (data.success) {
        onProjectUpdated(data.project);
      }
    } catch (err: any) {
      alert(`Ошибка создания сцены: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add new blank shot
  const handleAddNewShot = async () => {
    setIsSaving(true);
    try {
      const defaultSetting = project.locations[0]?.tag || "@Location";
      const defaultChars = project.characters.slice(0, 2).map((c) => c.tag);
      const newShotNumber = project.shots.length + 1;

      const newShot: StoryboardShot = {
        id: `shot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId: project.id,
        shotNumber: newShotNumber,
        duration: 5,
        characterTags: defaultChars,
        settingTag: defaultSetting,
        framing: "Medium Shot (Cinematic 3/4 Angle)",
        cameraMovement: "Slow push-in glide",
        visualDescription: "Кинематографичная сцена с акцентом на драматическое взаимодействие персонажей.",
        motionPrompt: "Cinematic subtle character interaction and atmospheric lighting drift",
        keyframePrompt: "Cinematic Chinese drama scene, expressive actors in tense dialogue, volumetric cinematic lighting",
        status: "draft",
        usePreviousShotReference: true,
        createdAt: Date.now(),
      };

      const newShots = [...project.shots, newShot];

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shots: newShots }),
      });
      const data = await res.json();
      if (data.success) {
        onProjectUpdated(data.project);
      }
    } catch (err: any) {
      alert(`Ошибка добавления сцены: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete shot with renumbering
  const handleDeleteShot = async (shot: StoryboardShot) => {
    if (!confirm(`Удалить Сцену #${shot.shotNumber}?`)) return;

    setIsSaving(true);
    try {
      const remainingShots = project.shots
        .filter((s) => s.id !== shot.id)
        .map((s, idx) => ({ ...s, shotNumber: idx + 1 }));

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shots: remainingShots }),
      });
      const data = await res.json();
      if (data.success) {
        onProjectUpdated(data.project);
      }
    } catch (err: any) {
      alert(`Ошибка удаления сцены: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const readyKeyframesCount = project.shots.filter((s) => s.keyframeUrl).length;
  const missingKeyframesCount = project.shots.length - readyKeyframesCount;

  return (
    <div className="space-y-6">
      {/* Top Banner & Multi-Task Control Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-zinc-400" />
              <h2 className="text-base font-bold text-zinc-100">
                Раскадровка и ключевые кадры
              </h2>
              <span className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                {readyKeyframesCount}/{project.shots.length} готово
              </span>
              {selectedShotIds.size > 0 && (
                <span className="rounded bg-zinc-700/80 border border-zinc-600 px-2 py-0.5 text-[10px] font-mono text-zinc-100">
                  Выбрано: {selectedShotIds.size}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Профессиональная кинематографичная раскадровка: проходные референсы ракурсов (OTS, Reverse Angle), сохранение костюмов и одновременная параллельная генерация.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenWorkbench && (
              <button
                onClick={() => onOpenWorkbench()}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition"
              >
                <Wand2 className="h-3.5 w-3.5 text-zinc-400" />
                <span>Мастерская кадров</span>
              </button>
            )}

            <button
              onClick={handleAddNewShot}
              disabled={isSaving || isAnyGenerating}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition disabled:opacity-50"
              title="Добавить новую сцену в конец раскадровки"
            >
              <Plus className="h-3.5 w-3.5 text-zinc-400" />
              <span>+ Сцена</span>
            </button>

            <button
              onClick={onNextTab}
              disabled={readyKeyframesCount === 0}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-200 hover:bg-white px-4 py-1.5 text-xs font-bold text-zinc-950 transition disabled:opacity-40"
            >
              <span>К генерации видео</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Batch Selection & Simultaneous Generation Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">Выбор:</span>
            <button
              onClick={handleSelectAll}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
            >
              Все ({project.shots.length})
            </button>
            <button
              onClick={handleSelectWithoutKeyframes}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
            >
              Только без кадров ({missingKeyframesCount})
            </button>
            {selectedShotIds.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] transition"
              >
                Сбросить
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Parallel Batch Generation Button */}
            <button
              onClick={handleBatchGenerateSelected}
              disabled={isAnyGenerating || (selectedShotIds.size === 0 && missingKeyframesCount === 0)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-zinc-200 hover:bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition disabled:opacity-50"
              title="Запустить генерацию всех выбранных кадров одновременно"
            >
              {isAnyGenerating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>
                    Генерация ({generatingShotIds.size} одновременно)...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-zinc-900" />
                  <span>
                    {selectedShotIds.size > 0
                      ? `⚡ Сгенерировать выбранные (${selectedShotIds.size}) — одновременно`
                      : `⚡ Сгенерировать все недостающие (${missingKeyframesCount}) — одновременно`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Storyboard Shots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {project.shots.map((shot, shotIdx) => {
          const isGenerating = generatingShotIds.has(shot.id);
          const isSelected = selectedShotIds.has(shot.id);
          const is916 = project.aspectRatio === "9:16";

          // Find predecessor shot for continuity reference
          const prevShot = shotIdx > 0 ? project.shots[shotIdx - 1] : null;
          const hasPrevKeyframe = !!prevShot?.keyframeUrl;
          const continuityActive = shot.usePreviousShotReference ?? true;

          return (
            <div
              key={shot.id}
              className={`flex flex-col justify-between rounded-xl border bg-zinc-900/60 p-4 space-y-3 transition ${
                isSelected ? "border-zinc-500 bg-zinc-900/90" : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Card Header with Checkbox, Shot Number, Framing & Actions */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleToggleSelectShot(shot.id)}
                    className="text-zinc-400 hover:text-zinc-100 transition"
                    title={isSelected ? "Снять выбор" : "Выбрать для пакетной генерации"}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-zinc-200" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-600 hover:text-zinc-400" />
                    )}
                  </button>

                  <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-xs font-mono font-bold text-zinc-300">
                    #{shot.shotNumber}
                  </span>

                  <div>
                    <span className="font-semibold text-zinc-200 block">{shot.framing}</span>
                    <span className="text-[10px] text-zinc-400">{shot.cameraMovement}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-zinc-400">
                  <div className="flex items-center gap-1 text-[11px] font-mono mr-1">
                    <Clock className="h-3 w-3" /> {shot.duration}с
                  </div>

                  <button
                    onClick={() => handleDuplicateWithAngle(shot)}
                    disabled={isSaving || isAnyGenerating}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition"
                    title="Сменить ракурс / дублировать сцену с привязкой референса"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {project.shots.length > 1 && (
                    <button
                      onClick={() => handleDeleteShot(shot)}
                      disabled={isSaving || isAnyGenerating}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition"
                      title="Удалить сцену"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inter-shot Continuity Reference Bar (Проходной референс) */}
              {hasPrevKeyframe && (
                <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-2 text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded border border-zinc-700 bg-zinc-900">
                      <img
                        src={prevShot.keyframeUrl}
                        alt={`Сцена #${prevShot.shotNumber}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1 text-zinc-300 font-medium truncate">
                        <Link2 className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                        <span className="truncate">Проходной референс: Сцена #{prevShot.shotNumber}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block truncate">
                        {continuityActive ? "Костюмы и свет зафиксированы" : "Отключен"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleContinuity(shot.id)}
                    className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
                      continuityActive
                        ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                        : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
                    }`}
                    title={continuityActive ? "Отключить привязку к предыдущему кадру" : "Включить привязку к предыдущему кадру"}
                  >
                    {continuityActive ? "Вкл" : "Выкл"}
                  </button>
                </div>
              )}

              {/* Keyframe Visual Preview Container with Click-to-Zoom */}
              <div
                onClick={() => {
                  if (shot.keyframeUrl) {
                    setLightboxImage({
                      url: shot.keyframeUrl,
                      title: `Сцена #${shot.shotNumber} — ${shot.framing}`,
                      subtitle: shot.visualDescription,
                    });
                  }
                }}
                className={`group relative w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-pointer transition ${
                  is916 ? "aspect-[9/16] max-h-[380px]" : "aspect-[16/9]"
                }`}
              >
                {shot.keyframeUrl ? (
                  <>
                    <img
                      src={shot.keyframeUrl}
                      alt={`Сцена ${shot.shotNumber}`}
                      className="h-full w-full object-cover transition duration-150 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <span className="flex items-center gap-1 text-xs font-medium text-zinc-100 bg-zinc-900/90 px-2.5 py-1.5 rounded border border-zinc-700">
                        <Eye className="h-3.5 w-3.5" /> На весь экран
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-1.5">
                    <Film className="h-8 w-8 text-zinc-700 mx-auto" />
                    <span className="text-xs text-zinc-500 font-medium block">
                      Кадр еще не сгенерирован
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono block">
                      Формат: {project.aspectRatio}
                    </span>
                  </div>
                )}

                {/* Overlay Generation State for Simultaneous Multi-generation */}
                {isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-3 text-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-transparent mb-2" />
                    <span className="text-xs text-zinc-200 font-semibold">Генерация кадра...</span>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      {continuityActive && hasPrevKeyframe
                        ? `Смена ракурса с привязкой к Сцене #${prevShot.shotNumber}`
                        : "Сохранение внешности актеров"}
                    </span>
                  </div>
                )}

                {/* Status Badge in corner */}
                {shot.keyframeUrl && !isGenerating && (
                  <div className="absolute top-2 right-2 rounded bg-black/70 px-1.5 py-0.5 flex items-center gap-1 text-[10px] text-emerald-400 font-medium border border-zinc-700">
                    <CheckCircle2 className="h-3 w-3" /> Готов
                  </div>
                )}
              </div>

              {/* Error Notice if any */}
              {shot.status === "error" && shot.error && (
                <div className="rounded-lg border border-rose-900/50 bg-rose-950/40 p-2 text-[11px] text-rose-300">
                  <div className="font-semibold flex items-center gap-1 mb-0.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Заметка генерации:
                  </div>
                  <p className="line-clamp-2">{shot.error}</p>
                </div>
              )}

              {/* Associated Tags & Dialogue */}
              <div className="space-y-1.5 text-xs">
                {/* Character & Setting Tags */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                    {shot.settingTag}
                  </span>
                  {shot.characterTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Visual description */}
                <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-2">
                  {shot.visualDescription}
                </p>

                {shot.dialogue && (
                  <p className="rounded bg-zinc-950 p-2 text-zinc-300 text-[11px] italic border border-zinc-800">
                    «{shot.dialogue}»
                  </p>
                )}
              </div>

              {/* Edit Prompt Toggle */}
              {editingShotId === shot.id ? (
                <div className="space-y-2 border-t border-zinc-800 pt-2">
                  <label className="block text-[10px] font-medium text-zinc-400">
                    Свой промпт для кадра
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-[11px] text-zinc-100 focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingShotId(null)}
                      className="rounded px-2 py-1 text-[10px] text-zinc-400 hover:text-white"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => {
                        handleGenerateKeyframe(shot, customPrompt);
                        setEditingShotId(null);
                      }}
                      className="rounded bg-zinc-200 px-3 py-1 text-[10px] font-bold text-zinc-950 hover:bg-white"
                    >
                      Сгенерировать с промптом
                    </button>
                  </div>
                </div>
              ) : (
                /* Action Buttons */
                <div className="flex items-center gap-1.5 border-t border-zinc-800 pt-2.5">
                  <button
                    onClick={() => handleGenerateKeyframe(shot)}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3 text-zinc-400" />
                    <span>{shot.keyframeUrl ? "Перегенерировать" : "Сгенерировать кадр"}</span>
                  </button>

                  {shot.keyframeUrl && (
                    <button
                      onClick={() =>
                        setLightboxImage({
                          url: shot.keyframeUrl!,
                          title: `Сцена #${shot.shotNumber} — ${shot.framing}`,
                          subtitle: shot.visualDescription,
                        })
                      }
                      className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                      title="Открыть на весь экран"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingShotId(shot.id);
                      setCustomPrompt(shot.keyframePrompt);
                    }}
                    className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                    title="Редактировать промпт кадра"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                  </button>

                  {onOpenWorkbench && (
                    <button
                      onClick={() => onOpenWorkbench(shot.shotNumber)}
                      className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 hover:text-amber-400 hover:border-zinc-700 transition"
                      title={`Открыть Сцену #${shot.shotNumber} в мастерской кадров`}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Add Scene Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleAddNewShot}
          disabled={isSaving || isAnyGenerating}
          className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/40 hover:bg-zinc-900/80 px-6 py-3 text-xs font-semibold text-zinc-300 hover:text-white transition"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить новую сцену (+1 кадр)</span>
        </button>
      </div>

      {/* High-Resolution Lightbox Modal */}
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
