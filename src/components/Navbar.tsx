"use client";

import React, { useState } from "react";
import { Project, AspectRatio } from "@/types";
import { 
  Clapperboard, 
  Settings as SettingsIcon, 
  Plus, 
  Smartphone, 
  Monitor, 
  ChevronDown,
  Wifi
} from "lucide-react";
import { MobileAccessModal } from "./MobileAccessModal";

import { TOONFLOW_STORY_GENRES } from "@/lib/skills/toonflow-skills-data";

interface NavbarProps {
  currentProject: Project | null;
  projects: Array<{ id: string; name: string; aspectRatio: string; genre: string }>;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, aspectRatio: AspectRatio, genre: any) => void;
  onUpdateAspectRatio: (ratio: AspectRatio) => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onCreateProject,
  onUpdateAspectRatio,
  onOpenSettings,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newRatio, setNewRatio] = useState<AspectRatio>("9:16");
  const [newGenre, setNewGenre] = useState<string>("Urban_workplace_drama");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onCreateProject(newProjName.trim(), newRatio, newGenre);
    setNewProjName("");
    setShowNewModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          {/* Логотип и Название */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
              <Clapperboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-200" />
            </div>
            <div className="hidden xs:block sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-xs sm:text-base text-zinc-100">
                  AIDRAMA
                </span>
                <span className="hidden sm:inline-block rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400">
                  9:16 & 16:9
                </span>
              </div>
            </div>
          </div>

          {/* Центр: Выбор проекта */}
          <div className="relative min-w-0 flex-1 max-w-[160px] sm:max-w-[220px]">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-850"
            >
              <span className="truncate">
                {currentProject ? currentProject.name : "Выбрать проект"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            </button>

            {showDropdown && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl z-50">
                <div className="mb-1.5 px-2 py-1 text-[11px] font-medium text-zinc-400">
                  Проекты ({projects.length})
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p.id);
                        setShowDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                        currentProject?.id === p.id
                          ? "bg-zinc-800 text-zinc-100 font-semibold"
                          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] opacity-60 font-mono uppercase">{p.aspectRatio}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-zinc-800 pt-2">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowNewModal(true);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Новый проект
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Справа: Формат 9:16 / 16:9 и Настройки */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Переключатель формата */}
            {currentProject && (
              <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs font-medium text-zinc-300">
                <button
                  onClick={() => onUpdateAspectRatio("9:16")}
                  className={`flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-1 transition text-[11px] sm:text-xs ${
                    currentProject.aspectRatio === "9:16"
                      ? "bg-zinc-200 text-zinc-950 font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="9:16 Вертикальный (Shorts, Reels, TikTok)"
                >
                  <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>9:16</span>
                </button>
                <button
                  onClick={() => onUpdateAspectRatio("16:9")}
                  className={`flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-1 transition text-[11px] sm:text-xs ${
                    currentProject.aspectRatio === "16:9"
                      ? "bg-zinc-200 text-zinc-950 font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="16:9 Горизонтальный (YouTube, Кино)"
                >
                  <Monitor className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">16:9</span>
                </button>
              </div>
            )}

            {/* Создать проект (desktop) */}
            <button
              onClick={() => setShowNewModal(true)}
              className="hidden md:flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Создать</span>
            </button>

            {/* Вход с телефона по Wi-Fi */}
            <button
              onClick={() => setShowMobileModal(true)}
              className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              title="Открыть на телефоне по Wi-Fi (QR-код)"
            >
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden lg:inline text-[11px]">Телефон</span>
            </button>

            {/* Кнопка Настройки */}
            <button
              onClick={onOpenSettings}
              className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              title="Настройки API (Omniroute, fal.ai)"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Модальное окно создания проекта */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Clapperboard className="h-4 w-4 text-zinc-400" /> Создать новую ИИ-дораму
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Укажите название, формат соотношения сторон и базовый жанр ToonFlow.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Название дорамы
                </label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Например: Месть отвергнутой наследницы"
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Формат кадра
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRatio("9:16")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition ${
                      newRatio === "9:16"
                        ? "border-zinc-400 bg-zinc-800 text-zinc-100 font-semibold"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" /> 9:16 (Shorts / TikTok)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRatio("16:9")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition ${
                      newRatio === "16:9"
                        ? "border-zinc-400 bg-zinc-800 text-zinc-100 font-semibold"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" /> 16:9 (Кино / YouTube)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Режиссерский жанр (ToonFlow)
                </label>
                <select
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none"
                >
                  {TOONFLOW_STORY_GENRES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-200 px-4 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-white"
                >
                  Создать проект
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно доступа с телефона */}
      <MobileAccessModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />
    </>
  );
};
