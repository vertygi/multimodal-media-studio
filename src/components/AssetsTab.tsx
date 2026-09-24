"use client";

import React, { useState } from "react";
import { Project, Asset } from "@/types";
import { 
  User, 
  MapPin, 
  Package, 
  Sparkles, 
  Upload, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  CheckSquare,
  Square,
  Layers,
  RefreshCw
} from "lucide-react";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface AssetsTabProps {
  project: Project;
  onProjectUpdated: (p: Project) => void;
  onNextTab: () => void;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({
  project,
  onProjectUpdated,
  onNextTab,
}) => {
  const [generatingAssetIds, setGeneratingAssetIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<"all" | "characters" | "locations" | "props">("all");
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const allAssets: Asset[] = [
    ...project.characters,
    ...project.locations,
    ...project.props,
  ];

  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedAssetIds(new Set(allAssets.map((a) => a.id)));
  };

  const selectPendingOnly = () => {
    setSelectedAssetIds(new Set(allAssets.filter((a) => !a.imageUrl).map((a) => a.id)));
  };

  const deselectAll = () => {
    setSelectedAssetIds(new Set());
  };

  const handleGenerateAsset = async (asset: Asset) => {
    setGeneratingAssetIds((prev) => new Set(prev).add(asset.id));
    try {
      const res = await fetch("/api/generate-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          assetId: asset.id,
          customPrompt: asset.prompt,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Ошибка генерации ассета");
      }
      onProjectUpdated(data.project);
    } catch (err: any) {
      alert(`Ошибка генерации: ${err.message}`);
    } finally {
      setGeneratingAssetIds((prev) => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    }
  };

  // TRUE CONCURRENT PARALLEL BATCH GENERATION (all selected assets simultaneously)
  const handleBatchGenerateSelected = async () => {
    if (isBatchGenerating || selectedAssetIds.size === 0) return;
    setIsBatchGenerating(true);

    const targetAssets = allAssets.filter((a) => selectedAssetIds.has(a.id));
    setBatchProgress({ current: 0, total: targetAssets.length });

    // Mark all target assets as generating concurrently
    setGeneratingAssetIds(new Set(targetAssets.map((a) => a.id)));

    let completedCount = 0;

    // Launch ALL selected assets simultaneously via Promise.all
    await Promise.all(
      targetAssets.map(async (asset) => {
        try {
          const res = await fetch("/api/generate-asset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: project.id,
              assetId: asset.id,
              customPrompt: asset.prompt,
            }),
          });
          const data = await res.json();
          if (data.success && data.project) {
            onProjectUpdated(data.project);
          }
        } catch (err: any) {
          console.error(`Ошибка генерации ассета ${asset.name}:`, err);
        } finally {
          completedCount++;
          setBatchProgress({ current: completedCount, total: targetAssets.length });
          setGeneratingAssetIds((prev) => {
            const next = new Set(prev);
            next.delete(asset.id);
            return next;
          });
        }
      })
    );

    setIsBatchGenerating(false);
    setBatchProgress(null);
  };

  const handleFileUpload = async (asset: Asset, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Update asset locally
      const updatedProject = { ...project };
      const findAndUpdate = (list: Asset[]) => {
        const item = list.find((a) => a.id === asset.id);
        if (item) {
          item.imageUrl = data.url;
          item.status = "ready" as const;
        }
      };
      findAndUpdate(updatedProject.characters);
      findAndUpdate(updatedProject.locations);
      findAndUpdate(updatedProject.props);

      // Save updated project
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });

      onProjectUpdated(updatedProject);
    } catch (err: any) {
      alert(`Ошибка загрузки: ${err.message}`);
    }
  };

  const renderAssetCard = (asset: Asset) => {
    const isGenerating = generatingAssetIds.has(asset.id) || asset.status === "generating";
    const isSelected = selectedAssetIds.has(asset.id);
    const isCharacter = asset.type === "character";
    const isLocation = asset.type === "location";
    const isProp = asset.type === "prop";

    return (
      <div
        key={asset.id}
        className={`flex flex-col justify-between rounded-xl border p-4 transition ${
          isSelected
            ? "border-zinc-500 bg-zinc-850 ring-1 ring-zinc-500"
            : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
        }`}
      >
        <div className="space-y-3">
          {/* Card Top: Checkbox, Name, Tag */}
          <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSelectAsset(asset.id)}
                className="text-zinc-300 hover:text-white transition"
              >
                {isSelected ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4 text-zinc-500" />
                )}
              </button>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                  {isCharacter ? (
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                  ) : isLocation ? (
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  ) : (
                    <Package className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                  {asset.name}
                </h3>
              </div>
            </div>

            <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 font-mono text-[10px] text-zinc-300">
              {asset.tag}
            </span>
          </div>

          {/* Middle: Photo container & description */}
          <div className="flex gap-3.5">
            {/* Photo Thumbnail */}
            <div
              className="group relative h-36 w-28 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center transition"
              onClick={() => {
                if (asset.imageUrl) {
                  setLightboxImage({
                    url: asset.imageUrl,
                    title: asset.name,
                    subtitle: asset.roleDescription,
                  });
                }
              }}
            >
              {asset.imageUrl ? (
                <>
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="h-full w-full object-cover transition duration-150 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-white bg-black/70 px-2 py-1 rounded">
                      <Eye className="h-3 w-3" /> Просмотр
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-2 space-y-1">
                  {isCharacter ? (
                    <User className="h-6 w-6 text-zinc-700 mx-auto" />
                  ) : isLocation ? (
                    <MapPin className="h-6 w-6 text-zinc-700 mx-auto" />
                  ) : (
                    <Package className="h-6 w-6 text-zinc-700 mx-auto" />
                  )}
                  <span className="text-[10px] text-zinc-500 block">Нет фото</span>
                </div>
              )}

              {/* Status Badge */}
              {asset.imageUrl && !isGenerating && (
                <div className="absolute top-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-emerald-400 font-medium border border-zinc-700">
                  Готов
                </div>
              )}

              {/* Generating Spinner */}
              {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-2 text-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent mb-1" />
                  <span className="text-[10px] text-zinc-300 font-medium">Генерация...</span>
                </div>
              )}
            </div>

            {/* Description & Prompt Details */}
            <div className="flex-1 space-y-1.5 text-xs">
              <div>
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">
                  {isCharacter ? "Роль" : isLocation ? "Атмосфера" : "Реквизит"}
                </span>
                <p className="text-zinc-200 line-clamp-2 leading-relaxed">
                  {asset.roleDescription}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">
                  Внешний вид
                </span>
                <p className="text-zinc-400 text-[11px] line-clamp-2 leading-relaxed">
                  {asset.visualDescription}
                </p>
              </div>

              {asset.error && (
                <div className="rounded border border-rose-900/50 bg-rose-950/40 p-1.5 text-[10px] text-rose-300 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span className="truncate">{asset.error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-3 flex items-center gap-2 border-t border-zinc-800 pt-2.5">
          <button
            onClick={() => handleGenerateAsset(asset)}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition disabled:opacity-40"
          >
            <Sparkles className="h-3 w-3 text-zinc-400" />
            <span>{asset.imageUrl ? "Перегенерировать" : "Сгенерировать фото"}</span>
          </button>

          <label className="flex items-center justify-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white cursor-pointer">
            <Upload className="h-3 w-3" />
            <span>Загрузить</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(asset, e)}
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Верхний баннер */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-zinc-400" />
            <h2 className="text-base font-bold text-zinc-100">
              Библиотека ассетов проекта
            </h2>
            <span className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
              {allAssets.filter((a) => a.imageUrl).length}/{allAssets.length} фото готово
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Кастинг персонажей, локации и реквизит. Вы можете генерировать фото по отдельности или пакетом для выбранных ассетов.
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Пакетная генерация */}
          <button
            onClick={handleBatchGenerateSelected}
            disabled={isBatchGenerating || selectedAssetIds.size === 0}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition disabled:opacity-40"
          >
            {isBatchGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>
                  Генерация ({batchProgress?.current}/{batchProgress?.total})...
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
                <span>Сгенерировать выбранные ({selectedAssetIds.size})</span>
              </>
            )}
          </button>

          <button
            onClick={onNextTab}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-200 hover:bg-white px-4 py-1.5 text-xs font-bold text-zinc-950 transition"
          >
            <span>В Мастерскую кадров</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Фильтры категорий и выбор чекбоксов */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        {/* Категории */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === "all"
                ? "bg-zinc-200 text-zinc-950 font-semibold"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Все ассеты</span>
            <span className="rounded bg-black/20 px-1 py-0.2 text-[10px] font-mono">
              {allAssets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory("characters")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === "characters"
                ? "bg-zinc-200 text-zinc-950 font-semibold"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Персонажи ({project.characters.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory("locations")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === "locations"
                ? "bg-zinc-200 text-zinc-950 font-semibold"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Локации ({project.locations.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory("props")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === "props"
                ? "bg-zinc-200 text-zinc-950 font-semibold"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Реквизит ({project.props.length})</span>
          </button>
        </div>

        {/* Быстрый выбор */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px]">Выбрать:</span>
          <button
            onClick={selectAll}
            className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
          >
            Все
          </button>
          <button
            onClick={selectPendingOnly}
            className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
          >
            Без фото
          </button>
          <button
            onClick={deselectAll}
            className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-500 hover:bg-zinc-800"
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* Все ассеты */}
      {activeCategory === "all" && (
        <div className="space-y-6">
          {/* Персонажи */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <User className="h-4 w-4 text-zinc-400" /> Персонажи ({project.characters.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.characters.map(renderAssetCard)}
            </div>
          </div>

          {/* Локации */}
          <div className="space-y-2.5 border-t border-zinc-800 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-zinc-400" /> Локации ({project.locations.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.locations.map(renderAssetCard)}
            </div>
          </div>

          {/* Реквизит */}
          {project.props.length > 0 && (
            <div className="space-y-2.5 border-t border-zinc-800 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-zinc-400" /> Реквизит ({project.props.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.props.map(renderAssetCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Персонажи */}
      {activeCategory === "characters" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.characters.map(renderAssetCard)}
        </div>
      )}

      {/* Локации */}
      {activeCategory === "locations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.locations.map(renderAssetCard)}
        </div>
      )}

      {/* Реквизит */}
      {activeCategory === "props" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.props.map(renderAssetCard)}
        </div>
      )}

      {/* Полноэкранный Lightbox */}
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
