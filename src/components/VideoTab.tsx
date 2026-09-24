"use client";

import React, { useState } from "react";
import { Project, StoryboardShot } from "@/types";
import { 
  Video, 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Play, 
  Sliders, 
  Film,
  CheckSquare,
  Square
} from "lucide-react";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface VideoTabProps {
  project: Project;
  onProjectUpdated: (p: Project) => void;
}

export const VideoTab: React.FC<VideoTabProps> = ({
  project,
  onProjectUpdated,
}) => {
  const [renderingShotIds, setRenderingShotIds] = useState<Set<string>>(new Set());
  const [selectedShotIds, setSelectedShotIds] = useState<Set<string>>(new Set());
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [customMotionPrompt, setCustomMotionPrompt] = useState("");
  const [videoModel, setVideoModel] = useState<string>("minimax/h3-max-turbo/image-to-video");

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const isAnyRendering = renderingShotIds.size > 0;

  // Multi-selection handlers
  const handleToggleSelect = (shotId: string) => {
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

  const handleSelectAllReadyKeyframes = () => {
    setSelectedShotIds(new Set(project.shots.filter((s) => s.keyframeUrl).map((s) => s.id)));
  };

  const handleSelectWithoutVideos = () => {
    setSelectedShotIds(
      new Set(project.shots.filter((s) => s.keyframeUrl && !s.videoUrl && !s.videoLocalPath).map((s) => s.id))
    );
  };

  const handleClearSelection = () => {
    setSelectedShotIds(new Set());
  };

  // Render single video
  const handleRenderVideo = async (shot: StoryboardShot, promptOverride?: string) => {
    if (!shot.keyframeUrl) {
      alert("Сначала необходимо сгенерировать ключевой кадр для этой сцены.");
      return;
    }

    setRenderingShotIds((prev) => new Set(prev).add(shot.id));
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          shotId: shot.id,
          model: videoModel,
          customPrompt: promptOverride || shot.motionPrompt,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Не удалось сгенерировать видео");
      }
      
      const freshRes = await fetch(`/api/projects/${project.id}`);
      const freshData = await freshRes.json();
      if (freshData.success) {
        onProjectUpdated(freshData.project);
      } else {
        onProjectUpdated(data.project);
      }
    } catch (err: any) {
      alert(`Ошибка генерации видео сцены #${shot.shotNumber}: ${err.message}`);
    } finally {
      setRenderingShotIds((prev) => {
        const next = new Set(prev);
        next.delete(shot.id);
        return next;
      });
    }
  };

  // TRUE PARALLEL BATCH RENDERING (одновременная генерация всех выбранных видеоклипов)
  const handleBatchRenderSelected = async () => {
    const eligibleShots = project.shots.filter(
      (s) => selectedShotIds.has(s.id) && s.keyframeUrl
    );

    if (eligibleShots.length === 0) {
      // Fallback: all shots with keyframe but without video
      const missingVideos = project.shots.filter(
        (s) => s.keyframeUrl && !s.videoUrl && !s.videoLocalPath
      );
      if (missingVideos.length === 0) {
        alert("Нет готовых ключевых кадров для рендера видео. Сначала сгенерируйте кадры во вкладке Раскадровки.");
        return;
      }
      return handleBatchRenderMissing();
    }

    // Set all to rendering state at once
    setRenderingShotIds((prev) => {
      const next = new Set(prev);
      eligibleShots.forEach((s) => next.add(s.id));
      return next;
    });

    try {
      await Promise.all(
        eligibleShots.map(async (shot) => {
          try {
            const res = await fetch("/api/generate-video", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId: project.id,
                shotId: shot.id,
                model: videoModel,
                customPrompt: shot.motionPrompt,
              }),
            });
            const data = await res.json();
            if (!data.success) {
              console.error(`Ошибка генерации видео сцены #${shot.shotNumber}:`, data.error);
            }
          } catch (err: any) {
            console.error(`Ошибка запроса видео сцены #${shot.shotNumber}:`, err);
          } finally {
            setRenderingShotIds((prev) => {
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
    } catch (batchErr: any) {
      alert(`Ошибка пакетного рендера видео: ${batchErr.message}`);
    } finally {
      setSelectedShotIds(new Set());
    }
  };

  const handleBatchRenderMissing = async () => {
    const missing = project.shots.filter((s) => s.keyframeUrl && !s.videoUrl && !s.videoLocalPath);
    if (missing.length === 0) return;

    setRenderingShotIds((prev) => {
      const next = new Set(prev);
      missing.forEach((s) => next.add(s.id));
      return next;
    });

    try {
      await Promise.all(
        missing.map(async (shot) => {
          try {
            await fetch("/api/generate-video", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId: project.id,
                shotId: shot.id,
                model: videoModel,
                customPrompt: shot.motionPrompt,
              }),
            });
          } catch (err) {
            console.error(`Ошибка генерации видео сцены #${shot.shotNumber}:`, err);
          } finally {
            setRenderingShotIds((prev) => {
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

  const [downloadingShotId, setDownloadingShotId] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const readyVideosCount = project.shots.filter((s) => s.videoUrl || s.videoLocalPath).length;
  const readyKeyframesCount = project.shots.filter((s) => s.keyframeUrl).length;

  const handleDownloadShot = async (shot: StoryboardShot) => {
    const videoSrc = shot.videoLocalPath || shot.videoUrl;
    if (!videoSrc) return;

    const cleanProjectName = (project.name || "AIDrama").replace(/[^\w\u0400-\u04FF-]/g, "_");
    const filename = `${cleanProjectName}_shot_${shot.shotNumber}.mp4`;

    setDownloadingShotId(shot.id);
    try {
      const downloadUrl = shot.videoLocalPath
        ? `${shot.videoLocalPath}?download=1&filename=${encodeURIComponent(filename)}`
        : videoSrc;

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Не удалось загрузить видео с сервера");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: "video/mp4" }));

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    } catch (err) {
      console.warn("Direct blob download failed, falling back to media route:", err);
      const fallbackUrl = shot.videoLocalPath
        ? `${shot.videoLocalPath}?download=1&filename=${encodeURIComponent(filename)}`
        : videoSrc;
      const a = document.createElement("a");
      a.href = fallbackUrl;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingShotId(null);
    }
  };

  const handleDownloadAll = async () => {
    const readyShots = project.shots.filter((s) => s.videoUrl || s.videoLocalPath);
    if (readyShots.length === 0 || isDownloadingAll) return;

    setIsDownloadingAll(true);
    for (const shot of readyShots) {
      await handleDownloadShot(shot);
      await new Promise((r) => setTimeout(r, 600));
    }
    setIsDownloadingAll(false);
  };

  return (
    <div className="space-y-5">
      {/* Верхний баннер и панель одновременного рендеринга */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-zinc-400" />
              <h2 className="text-base font-bold text-zinc-100">
                Генерация видео (MiniMax I2V)
              </h2>
              <span className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                {readyVideosCount}/{project.shots.length} клипов готово
              </span>
              {selectedShotIds.size > 0 && (
                <span className="rounded bg-zinc-700/80 border border-zinc-600 px-2 py-0.5 text-[10px] font-mono text-zinc-100">
                  Выбрано: {selectedShotIds.size}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Превращает каждый 5-секундный ключевой кадр в живое видео с микродвижениями камеры и персонажей. Поддерживает параллельный рендер.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Выбор модели */}
            <select
              value={videoModel}
              onChange={(e) => setVideoModel(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="minimax/h3-max-turbo/image-to-video">
                MiniMax H3 Max Turbo (Быстрый, 5с)
              </option>
              <option value="minimax/h3-max/image-to-video">
                MiniMax H3 Max (Кинематографичный)
              </option>
              <option value="minimax/h3-max/reference-to-video">
                MiniMax H3 Max Reference-to-Video
              </option>
            </select>

            {/* Скачать все */}
            <button
              onClick={handleDownloadAll}
              disabled={readyVideosCount === 0 || isDownloadingAll}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition disabled:opacity-40"
            >
              {isDownloadingAll ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Загрузка .mp4 файлов...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Скачать все .mp4 ({readyVideosCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Панель параллельного выбора и запуска */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">Выбор:</span>
            <button
              onClick={handleSelectAllReadyKeyframes}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
            >
              Все с кадрами ({readyKeyframesCount})
            </button>
            <button
              onClick={handleSelectWithoutVideos}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
            >
              Только без видео ({project.shots.filter((s) => s.keyframeUrl && !s.videoUrl && !s.videoLocalPath).length})
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

          <div className="w-full sm:w-auto">
            <button
              onClick={handleBatchRenderSelected}
              disabled={isAnyRendering || readyKeyframesCount === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-zinc-200 hover:bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition disabled:opacity-50"
              title="Запустить рендер всех выбранных видео одновременно"
            >
              {isAnyRendering ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Рендеринг ({renderingShotIds.size} одновременно)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-zinc-900" />
                  <span>
                    {selectedShotIds.size > 0
                      ? `⚡ Сгенерировать выбранные видео (${selectedShotIds.size}) — одновременно`
                      : "⚡ Сгенерировать недостающие видео — одновременно"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Сетка видео-сцен */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {project.shots.map((shot) => {
          const isRendering = renderingShotIds.has(shot.id);
          const isSelected = selectedShotIds.has(shot.id);
          const is916 = project.aspectRatio === "9:16";
          const hasVideo = !!(shot.videoUrl || shot.videoLocalPath);
          const activeVideoSource = shot.videoLocalPath || shot.videoUrl;

          return (
            <div
              key={shot.id}
              className={`flex flex-col justify-between rounded-xl border bg-zinc-900/60 p-4 space-y-3 transition ${
                isSelected ? "border-zinc-500 bg-zinc-900/90" : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Шапка сцены с чекбоксом выбора */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs">
                <div className="flex items-center gap-2">
                  {shot.keyframeUrl && (
                    <button
                      onClick={() => handleToggleSelect(shot.id)}
                      className="text-zinc-400 hover:text-zinc-100 transition"
                      title={isSelected ? "Снять выбор" : "Выбрать для одновременного рендера"}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-zinc-200" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-600 hover:text-zinc-400" />
                      )}
                    </button>
                  )}

                  <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
                    #{shot.shotNumber}
                  </span>
                  <div>
                    <span className="font-semibold text-zinc-200 block">{shot.framing}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <span>{shot.cameraMovement}</span>
                      {hasVideo && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-300 font-mono">
                            {is916 ? "768×1344" : "1344×768"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {hasVideo ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      <CheckCircle2 className="h-3 w-3" /> MP4 Готово
                    </span>
                  ) : shot.keyframeUrl ? (
                    <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      Кадр готов
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      Нет кадра
                    </span>
                  )}
                </div>
              </div>

              {/* Плеер или превью кадра */}
              <div
                className={`relative w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center ${
                  is916 ? "aspect-[9/16] max-h-[380px]" : "aspect-[16/9]"
                }`}
              >
                {activeVideoSource ? (
                  <video
                    src={activeVideoSource}
                    controls
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : shot.keyframeUrl ? (
                  <div
                    className="group relative h-full w-full cursor-pointer"
                    onClick={() =>
                      setLightboxImage({
                        url: shot.keyframeUrl!,
                        title: `Кадр Сцены #${shot.shotNumber}`,
                        subtitle: shot.visualDescription,
                      })
                    }
                  >
                    <img
                      src={shot.keyframeUrl}
                      alt={`Сцена ${shot.shotNumber}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/90 text-zinc-200 border border-zinc-700">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-1.5">
                    <Film className="h-8 w-8 text-zinc-700 mx-auto" />
                    <span className="text-xs text-zinc-500 block">
                      Сначала создайте ключевой кадр
                    </span>
                  </div>
                )}

                {/* Оверлей загрузки */}
                {isRendering && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-3 text-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-transparent mb-2" />
                    <span className="text-xs text-zinc-200 font-semibold">
                      Рендеринг видео MiniMax...
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      Создание кинематографичного движения
                    </span>
                  </div>
                )}
              </div>

              {/* Описание движения */}
              <div className="space-y-1 text-xs">
                <p className="text-zinc-300 text-[11px] leading-relaxed line-clamp-2">
                  <span className="font-medium text-zinc-500">Движение:</span> {shot.motionPrompt}
                </p>

                {shot.dialogue && (
                  <p className="rounded bg-zinc-950 p-2 text-zinc-300 text-[11px] italic border border-zinc-800">
                    «{shot.dialogue}»
                  </p>
                )}
              </div>

              {/* Редактирование motion prompt */}
              {editingShotId === shot.id ? (
                <div className="space-y-2 border-t border-zinc-800 pt-2">
                  <label className="block text-[10px] font-medium text-zinc-400">
                    Свой промпт движения (Motion prompt)
                  </label>
                  <textarea
                    value={customMotionPrompt}
                    onChange={(e) => setCustomMotionPrompt(e.target.value)}
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
                        handleRenderVideo(shot, customMotionPrompt);
                        setEditingShotId(null);
                      }}
                      className="rounded bg-zinc-200 px-3 py-1 text-[10px] font-bold text-zinc-950 hover:bg-white"
                    >
                      Рендерить с промптом
                    </button>
                  </div>
                </div>
              ) : (
                /* Кнопки действий */
                <div className="flex items-center gap-1.5 border-t border-zinc-800 pt-2.5">
                  <button
                    onClick={() => handleRenderVideo(shot)}
                    disabled={isRendering || !shot.keyframeUrl}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition disabled:opacity-40"
                  >
                    <Sparkles className="h-3 w-3 text-zinc-400" />
                    <span>{hasVideo ? "Перегенерировать видео" : "Сгенерировать видео"}</span>
                  </button>

                  {hasVideo && (
                    <button
                      onClick={() => handleDownloadShot(shot)}
                      disabled={downloadingShotId === shot.id}
                      className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 hover:text-white hover:border-zinc-700 transition disabled:opacity-50"
                      title="Скачать видео (.mp4)"
                    >
                      {downloadingShotId === shot.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-zinc-300" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingShotId(shot.id);
                      setCustomMotionPrompt(shot.motionPrompt);
                    }}
                    className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 text-zinc-400 hover:text-white hover:border-zinc-700"
                    title="Настроить промпт движения"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Модальное окно просмотра кадра */}
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
