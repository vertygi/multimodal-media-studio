"use client";

import React, { useState, useEffect } from "react";
import { Project, AspectRatio } from "@/types";
import { Navbar } from "@/components/Navbar";
import { SettingsModal } from "@/components/SettingsModal";
import { ScriptTab } from "@/components/ScriptTab";
import { AssetsTab } from "@/components/AssetsTab";
import { KeyframeWorkbench } from "@/components/KeyframeWorkbench";
import { StoryboardTab } from "@/components/StoryboardTab";
import { VideoTab } from "@/components/VideoTab";
import { 
  BookOpen, 
  User, 
  Wand2, 
  Film, 
  Video, 
  CheckCircle2, 
  ArrowRight
} from "lucide-react";

export default function StudioHome() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string; aspectRatio: string; genre: string }>>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<"script" | "assets" | "workbench" | "storyboard" | "video">("script");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workbenchShotNumber, setWorkbenchShotNumber] = useState<number>(1);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
        if (data.projects.length > 0) {
          loadProject(data.projects[0].id);
        } else {
          createStarterProject();
        }
      }
    } catch (err) {
      console.error("Не удалось загрузить проекты:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createStarterProject = async () => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Контракт золотых рук",
          description: "Городская дорама (9:16 Shorts)",
          aspectRatio: "9:16",
          genre: "modern_urban",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects([{ id: data.project.id, name: data.project.name, aspectRatio: data.project.aspectRatio, genre: data.project.genre }]);
        setCurrentProject(data.project);
      }
    } catch (err) {
      console.error("Не удалось создать проект:", err);
    }
  };

  const loadProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (data.success) {
        setCurrentProject(data.project);
      }
    } catch (err) {
      console.error("Не удалось загрузить проект:", err);
    }
  };

  const handleCreateProject = async (name: string, aspectRatio: AspectRatio, genre: any) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, aspectRatio, genre }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects([
          { id: data.project.id, name: data.project.name, aspectRatio: data.project.aspectRatio, genre: data.project.genre },
          ...projects,
        ]);
        setCurrentProject(data.project);
        setActiveTab("script");
      }
    } catch (err) {
      console.error("Не удалось создать проект:", err);
    }
  };

  const handleUpdateAspectRatio = async (ratio: AspectRatio) => {
    if (!currentProject) return;
    const updated = { ...currentProject, aspectRatio: ratio };
    setCurrentProject(updated);
    try {
      await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Не удалось обновить соотношение сторон:", err);
    }
  };

  if (isLoading || !currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          <span className="text-xs font-medium tracking-wide">Загрузка студии AIDRAMA...</span>
        </div>
      </div>
    );
  }

  const keyframesReady = currentProject.shots.filter((s) => s.keyframeUrl).length;
  const videosReady = currentProject.shots.filter((s) => s.videoUrl).length;
  const assetsCount = currentProject.characters.length + currentProject.locations.length + (currentProject.props?.length || 0);
  const savedKeyframesCount = currentProject.savedKeyframes?.length || 0;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Верхняя панель навигации */}
      <Navbar
        currentProject={currentProject}
        projects={projects}
        onSelectProject={(id) => loadProject(id)}
        onCreateProject={handleCreateProject}
        onUpdateAspectRatio={handleUpdateAspectRatio}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Основная рабочая область */}
      <main className="flex-1 px-3 py-3 sm:px-6 sm:py-5 max-w-7xl mx-auto w-full space-y-4 sm:space-y-5">
        
        {/* Шаги пайплайна */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-0 sm:flex-wrap rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5 sm:p-2 scrollbar-none -webkit-overflow-scrolling-touch">
          
          {/* Шаг 1: Сценарий */}
          <button
            onClick={() => setActiveTab("script")}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "script"
                ? "bg-zinc-200 text-zinc-950 font-semibold"
                : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>1. Сценарий</span>
            {currentProject.scriptTitle && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 opacity-90" />
            )}
          </button>

          {/* Шаг 2: Ассеты */}
          <button
            onClick={() => setActiveTab("assets")}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "assets"
                ? "bg-zinc-200 text-zinc-950 font-semibold"
                : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>2. Ассеты</span>
            {assetsCount > 0 && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                {assetsCount}
              </span>
            )}
          </button>

          {/* Шаг 3: Мастерская кадров */}
          <button
            onClick={() => setActiveTab("workbench")}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "workbench"
                ? "bg-zinc-200 text-zinc-950 font-semibold"
                : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>3. Мастерская кадров</span>
            {savedKeyframesCount > 0 && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                {savedKeyframesCount}
              </span>
            )}
          </button>

          {/* Шаг 4: Раскадровка */}
          <button
            onClick={() => setActiveTab("storyboard")}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "storyboard"
                ? "bg-zinc-200 text-zinc-950 font-semibold"
                : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>4. Раскадровка</span>
            {keyframesReady > 0 && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                {keyframesReady}/{currentProject.shots.length}
              </span>
            )}
          </button>

          {/* Шаг 5: Генерация видео */}
          <button
            onClick={() => setActiveTab("video")}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "video"
                ? "bg-zinc-200 text-zinc-950 font-semibold"
                : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>5. Генерация видео</span>
            {videosReady > 0 && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                {videosReady}/{currentProject.shots.length}
              </span>
            )}
          </button>
        </div>

        {/* Содержимое активного шага */}
        {activeTab === "script" && (
          <ScriptTab
            project={currentProject}
            onProjectUpdated={setCurrentProject}
            onNextTab={() => setActiveTab("assets")}
          />
        )}

        {activeTab === "assets" && (
          <AssetsTab
            project={currentProject}
            onProjectUpdated={setCurrentProject}
            onNextTab={() => setActiveTab("workbench")}
          />
        )}

        {activeTab === "workbench" && (
          <KeyframeWorkbench
            project={currentProject}
            onProjectUpdated={setCurrentProject}
            onGoToStoryboard={() => setActiveTab("storyboard")}
            initialShotNumber={workbenchShotNumber}
          />
        )}

        {activeTab === "storyboard" && (
          <StoryboardTab
            project={currentProject}
            onProjectUpdated={setCurrentProject}
            onNextTab={() => setActiveTab("video")}
            onOpenWorkbench={(shotNum) => {
              if (shotNum) setWorkbenchShotNumber(shotNum);
              setActiveTab("workbench");
            }}
          />
        )}

        {activeTab === "video" && (
          <VideoTab
            project={currentProject}
            onProjectUpdated={setCurrentProject}
          />
        )}
      </main>

      {/* Модальное окно настроек API */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
