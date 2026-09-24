"use client";

import React, { useState, useEffect } from "react";
import { AppSettings, CustomModelConfig } from "@/types";
import { X, Check, Key, Cpu, Sparkles, Plus, Trash2, Globe, Video, Image as ImageIcon } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<"omniroute" | "falai" | "custom">("omniroute");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Custom Model form state
  const [newModelName, setNewModelName] = useState("");
  const [newModelType, setNewModelType] = useState<"image" | "video" | "text">("image");
  const [newModelEndpoint, setNewModelEndpoint] = useState("");
  const [newModelFormat, setNewModelFormat] = useState<"fal_queue" | "openai_chat" | "custom_post">("fal_queue");

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Ошибка загрузки настроек:", err);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Ошибка сохранения настроек:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomModel = () => {
    if (!settings || !newModelName || !newModelEndpoint) return;
    const newModel: CustomModelConfig = {
      id: `custom_${Date.now()}`,
      name: newModelName,
      type: newModelType,
      endpoint: newModelEndpoint,
      requestFormat: newModelFormat,
    };

    let vendors = [...(settings.customVendors || [])];
    if (vendors.length === 0) {
      vendors.push({
        id: "custom-vendor-1",
        name: "Custom TS / REST APIs",
        description: "Пользовательские эндпоинты",
        enabled: true,
        models: [newModel],
      });
    } else {
      vendors[0].models.push(newModel);
    }

    setSettings({ ...settings, customVendors: vendors });
    setNewModelName("");
    setNewModelEndpoint("");
  };

  const handleRemoveCustomModel = (modelId: string) => {
    if (!settings) return;
    const vendors = settings.customVendors.map((v) => ({
      ...v,
      models: v.models.filter((m) => m.id !== modelId),
    }));
    setSettings({ ...settings, customVendors: vendors });
  };

  if (!isOpen || !settings) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3.5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-100">
              Настройки API и моделей студии
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-zinc-800 px-6 bg-zinc-950/50">
          <button
            onClick={() => setActiveTab("omniroute")}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium transition ${
              activeTab === "omniroute"
                ? "border-zinc-300 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Key className="h-3.5 w-3.5" /> OmniRoute (Текстовая LLM)
          </button>
          <button
            onClick={() => setActiveTab("falai")}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium transition ${
              activeTab === "falai"
                ? "border-zinc-300 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> fal.ai (GPT Image & MiniMax)
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-medium transition ${
              activeTab === "custom"
                ? "border-zinc-300 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> Кастомные API
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* OmniRoute Tab */}
          {activeTab === "omniroute" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400 leading-relaxed">
                OmniRoute подключается к OpenAI-совместимым LLM для адаптации сценария, извлечения ассетов и улучшения кинематографичных промптов.
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Базовый URL (Base URL)
                </label>
                <input
                  type="text"
                  value={settings.omniroute.baseUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      omniroute: { ...settings.omniroute, baseUrl: e.target.value },
                    })
                  }
                  placeholder="https://api.omniroute.ai/v1"
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  API-ключ
                </label>
                <input
                  type="password"
                  value={settings.omniroute.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      omniroute: { ...settings.omniroute, apiKey: e.target.value },
                    })
                  }
                  placeholder="sk-..."
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  Модель LLM
                </label>
                <input
                  type="text"
                  value={settings.omniroute.model}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      omniroute: { ...settings.omniroute, model: e.target.value },
                    })
                  }
                  placeholder="Например: gpt-4o, deepseek-v3, claude-3-5-sonnet"
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* fal.ai Tab */}
          {activeTab === "falai" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400 leading-relaxed">
                fal.ai используется для генерации ключевых кадров с референсами (<code className="text-zinc-200 font-mono">openai/gpt-image-2.5/sunburst/edit</code>) 
                и видеогенерации MiniMax (<code className="text-zinc-200 font-mono">minimax/h3-max-turbo/image-to-video</code>).
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">
                  API-ключ fal.ai
                </label>
                <input
                  type="password"
                  value={settings.falai.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      falai: { ...settings.falai, apiKey: e.target.value },
                    })
                  }
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxxxxxx..."
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Модель видео по умолчанию (MiniMax)
                  </label>
                  <select
                    value={settings.falai.defaultVideoModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        falai: { ...settings.falai, defaultVideoModel: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="minimax/h3-max-turbo/image-to-video">
                      MiniMax H3 Max Turbo (Быстрая, 5с)
                    </option>
                    <option value="minimax/h3-max/image-to-video">
                      MiniMax H3 Max (Кино качество)
                    </option>
                    <option value="minimax/h3-max/reference-to-video">
                      MiniMax H3 Max Reference-to-Video
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    Модель ключевых кадров
                  </label>
                  <select
                    value={settings.falai.defaultImageModel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        falai: { ...settings.falai, defaultImageModel: e.target.value },
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="openai/gpt-image-2.5/sunburst/edit">
                      GPT Image 2.5 Sunburst Edit (С референсами)
                    </option>
                    <option value="openai/gpt-image-2.5/sunburst/text-to-image">
                      GPT Image 2.5 Sunburst Text-to-Image
                    </option>
                    <option value="fal-ai/flux/schnell">
                      FLUX.1 Schnell (Быстрый драфт)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400">
                    Качество GPT Image
                  </label>
                  <select
                    value={settings.falai.gptImageQuality}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        falai: { ...settings.falai, gptImageQuality: e.target.value as any },
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="high">high (Высокое)</option>
                    <option value="xhigh">xhigh (Максимальное)</option>
                    <option value="max">max</option>
                    <option value="medium">medium</option>
                    <option value="auto">auto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400">
                    Формат вывода фото
                  </label>
                  <select
                    value={settings.falai.gptImageOutputFormat}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        falai: { ...settings.falai, gptImageOutputFormat: e.target.value as any },
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="png">png</option>
                    <option value="jpeg">jpeg</option>
                    <option value="webp">webp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400">
                    Фон кадра
                  </label>
                  <select
                    value={settings.falai.gptImageBackground}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        falai: { ...settings.falai, gptImageBackground: e.target.value as any },
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="opaque">opaque (Непрозрачный)</option>
                    <option value="auto">auto</option>
                    <option value="transparent">transparent</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Custom Vendors Tab */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400 leading-relaxed">
                Добавляйте собственные REST эндпоинты или кастомные модели.
              </div>

              {/* Список добавленных моделей */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-300">Настроенные модели</h4>
                {settings.customVendors?.flatMap((v) => v.models).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Пока нет добавленных кастомных моделей.</p>
                ) : (
                  <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950">
                    {settings.customVendors.flatMap((v) =>
                      v.models.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {m.type === "video" ? (
                              <Video className="h-3.5 w-3.5 text-zinc-400" />
                            ) : (
                              <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                            )}
                            <div>
                              <div className="font-semibold text-zinc-200">{m.name}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {m.endpoint} ({m.requestFormat})
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCustomModel(m.id)}
                            className="rounded p-1 text-zinc-500 hover:text-rose-400 transition"
                            title="Удалить"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Форма добавления */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-zinc-400" /> Добавить эндпоинт / модель
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400">Название</label>
                    <input
                      type="text"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      placeholder="Например: Wan2.1 I2V / Hunyuan Video"
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400">Тип</label>
                    <select
                      value={newModelType}
                      onChange={(e) => setNewModelType(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="image">Генерация фото (Image)</option>
                      <option value="video">Генерация видео (I2V)</option>
                      <option value="text">Генерация текста (LLM)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-400">URL эндпоинта</label>
                    <input
                      type="text"
                      value={newModelEndpoint}
                      onChange={(e) => setNewModelEndpoint(e.target.value)}
                      placeholder="https://queue.fal.run/... или https://api..."
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400">Формат запроса</label>
                    <select
                      value={newModelFormat}
                      onChange={(e) => setNewModelFormat(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="fal_queue">fal.ai Queue</option>
                      <option value="custom_post">Generic REST POST</option>
                      <option value="openai_chat">OpenAI Chat</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomModel}
                  className="mt-1 flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Добавить модель
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-3 bg-zinc-950/50">
          <div>
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Настройки успешно сохранены!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
            >
              Закрыть
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-200 px-4 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-white disabled:opacity-40"
            >
              {loading ? "Сохранение..." : "Сохранить настройки"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
