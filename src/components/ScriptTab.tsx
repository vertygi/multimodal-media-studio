"use client";

import React, { useState, useEffect } from "react";
import { Project, StoryGenreItem, ArtStyleItem } from "@/types";
import { 
  TOONFLOW_STORY_GENRES, 
  TOONFLOW_ART_STYLES,
  getStoryGenre,
  getArtStyle
} from "@/lib/skills/toonflow-skills-data";
import { 
  Sparkles, 
  Film, 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Tag, 
  Plus, 
  Palette, 
  ChevronDown, 
  Check, 
  X, 
  Trash2,
  HelpCircle,
  Clapperboard,
  SlidersHorizontal,
  Flame,
  Wand2
} from "lucide-react";

interface ScriptTabProps {
  project: Project;
  onProjectUpdated: (p: Project) => void;
  onNextTab: () => void;
}

const TEST_STORY_SAMPLES = [
  {
    title: "Городская дорама: Тайный покровитель",
    genre: "Urban_workplace_drama",
    artStyle: "realpeople_modern_city",
    story: "Линь Вань три года терпела унижения в роли тихой жены самодовольного технологического магната Лу Чэня. Когда в дождливую полночь Лу Чэнь бросает ей документы о разводе ради богатой наследницы, она спокойно подписывает бумаги. Но в кабинет врывается финансовый директор: водяной знак на контракте показывает, что именно Линь Вань тайно выкупила все долги корпорации. С холодной улыбкой она объявляет, что с завтрашнего утра он уволен.",
  },
  {
    title: "Сянься: Клятва Бессмертного Меча",
    genre: "Xianxia_fantasy",
    artStyle: "2D_chinese_guofeng",
    story: "Ученик изгнанного даосского ордена Е Чэнь во время затмения на Пике Грозовых Облаков обнаруживает древний запечатанный клинок. Чтобы защитить младшую сестру от верховных старейшин Небесного Чертога, он разрушает печать девяти небесных молний и принимает истинную силу Падшего Бессмертного.",
  },
  {
    title: "Детективный триллер: Блэкаут в небоскребе",
    genre: "Mystery_thriller",
    artStyle: "realpeople_urban_modern",
    story: "Во время масштабного блэкаута в финансовом центре следователь Гу Е запирает своего бывшего наставника в подземном хранилище небоскреба. У него есть ровно 60 секунд до включения аварийных генераторов, чтобы выбить признание в преступлении десятилетней давности, пока спецназ не вскрыл бронированные двери.",
  },
  {
    title: "3D Киберпанк Гофэн: Неоновый Лотос",
    genre: "Scifi_post_apocalypse",
    artStyle: "3D_guofeng_cyber",
    story: "В неоновом мегаполисе под кислотным дождем кибер-курьер Сун Лин перевозит запретный био-чип с сознанием последней императрицы династии. За ним охотятся боевые дроны корпорации 'Небесный Дракон'. Уклоняясь от погони на антигравитационном катере, он активирует голографический меч.",
  }
];

export const ScriptTab: React.FC<ScriptTabProps> = ({
  project,
  onProjectUpdated,
  onNextTab,
}) => {
  // Never pre-fill with hardcoded Lin Wan by default! Use user's story or empty
  const [rawStory, setRawStory] = useState(project.rawStory || "");
  const [genre, setGenre] = useState<string>(project.genre || "Urban_workplace_drama");
  const [artStyle, setArtStyle] = useState<string>(project.artStyle || "realpeople_modern_city");
  const [shotCount, setShotCount] = useState<number>(project.shots?.length || 8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Skills library states
  const [allGenres, setAllGenres] = useState<StoryGenreItem[]>(TOONFLOW_STORY_GENRES);
  const [allArtStyles, setAllArtStyles] = useState<ArtStyleItem[]>(TOONFLOW_ART_STYLES);
  const [showSamplesPopover, setShowSamplesPopover] = useState(false);

  // Custom modals
  const [isAddGenreOpen, setIsAddGenreOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState("");
  const [newGenreTagline, setNewGenreTagline] = useState("");
  const [newGenreDesc, setNewGenreDesc] = useState("");

  const [isAddStyleOpen, setIsAddStyleOpen] = useState(false);
  const [newStyleName, setNewStyleName] = useState("");
  const [newStyleCategory, setNewStyleCategory] = useState<"live_action" | "2d_anime" | "3d_render" | "stylized">("2d_anime");
  const [newStylePrimary, setNewStylePrimary] = useState("");
  const [newStyleAnchors, setNewStyleAnchors] = useState("");

  // Load custom skills from server
  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      if (data.success) {
        if (data.storyGenres && data.storyGenres.length > 0) {
          setAllGenres(data.storyGenres);
        }
        if (data.artStyles && data.artStyles.length > 0) {
          setAllArtStyles(data.artStyles);
        }
      }
    } catch (err) {
      console.warn("Не удалось подгрузить кастомные навыки с сервера, используем дефолтные:", err);
    }
  };

  const handleGenerateScript = async () => {
    const cleanStory = rawStory.trim();
    if (!cleanStory) {
      setErrorMsg("Пожалуйста, введите ваш сюжет или идею в поле ввода перед адаптацией.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          rawStory: cleanStory,
          genre,
          artStyle,
          targetShotCount: shotCount,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Не удалось адаптировать сценарий через ИИ");
      }
      onProjectUpdated(data.project);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCustomGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;

    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "genre",
          item: {
            name: newGenreName.trim(),
            nameEn: newGenreName.trim(),
            tagline: newGenreTagline.trim() || "Пользовательский жанр",
            description: newGenreDesc.trim() || newGenreName.trim(),
            narrativePhilosophy: [newGenreDesc.trim() || "Следовать замыслу автора."],
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.item) {
        setAllGenres((prev) => [...prev, data.item]);
        setGenre(data.item.id);
        setIsAddGenreOpen(false);
        setNewGenreName("");
        setNewGenreTagline("");
        setNewGenreDesc("");
      }
    } catch (err: any) {
      alert("Ошибка при сохранении жанра: " + err.message);
    }
  };

  const handleCreateCustomArtStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyleName.trim()) return;

    try {
      const categoryLabels: Record<string, string> = {
        live_action: "Кинематограф",
        "2d_anime": "2D Анимация",
        "3d_render": "3D Графика",
        stylized: "Стилизация",
      };

      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "artStyle",
          item: {
            name: newStyleName.trim(),
            nameEn: newStyleName.trim(),
            category: newStyleCategory,
            categoryLabel: categoryLabels[newStyleCategory] || "Свой стиль",
            primaryStyle: newStylePrimary.trim() || `${newStyleName.trim()} visual aesthetic`,
            textureAnchors: newStyleAnchors.trim() || "High quality visual rendering, distinctive style",
            emotionalKeynote: "Atmospheric",
            prohibitedTerms: "low quality, blur, watermark, deformed",
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.item) {
        setAllArtStyles((prev) => [...prev, data.item]);
        setArtStyle(data.item.id);
        setIsAddStyleOpen(false);
        setNewStyleName("");
        setNewStylePrimary("");
        setNewStyleAnchors("");
      }
    } catch (err: any) {
      alert("Ошибка при сохранении стиля: " + err.message);
    }
  };

  const handleDeleteCustomSkill = async (type: "genre" | "artStyle", id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Удалить этот пользовательский пресет?")) return;

    try {
      await fetch(`/api/skills?type=${type}&id=${id}`, { method: "DELETE" });
      if (type === "genre") {
        setAllGenres((prev) => prev.filter((g) => g.id !== id));
        if (genre === id) setGenre(TOONFLOW_STORY_GENRES[0].id);
      } else {
        setAllArtStyles((prev) => prev.filter((s) => s.id !== id));
        if (artStyle === id) setArtStyle(TOONFLOW_ART_STYLES[0].id);
      }
    } catch (err: any) {
      console.error("Ошибка при удалении:", err);
    }
  };

  const selectedGenreObj = getStoryGenre(genre, allGenres);
  const selectedArtStyleObj = getArtStyle(artStyle, allArtStyles);

  return (
    <div className="space-y-5">
      {/* Главный блок адаптации сценария */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
        
        {/* Заголовок + Справка + Кнопка Примеров */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 shrink-0" />
              <span>Адаптация авторского сюжета в сценарий</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Вставьте ваш текст, черновик или идею. ИИ разобьет сюжет на кинематографичные 5-секундные сцены по правилам режиссуры ToonFlow.
            </p>
          </div>

          {/* Тестовые примеры */}
          <div className="relative self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowSamplesPopover(!showSamplesPopover)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-zinc-700 hover:text-white transition"
            >
              <Wand2 className="h-3.5 w-3.5 text-zinc-400" />
              <span>Примеры сюжетов</span>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            {showSamplesPopover && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-30">
                <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 border-b border-zinc-800/80 pb-1.5 mb-1.5 flex items-center justify-between">
                  <span>Готовые сюжеты для тестирования:</span>
                  <button onClick={() => setShowSamplesPopover(false)} className="text-zinc-500 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {TEST_STORY_SAMPLES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setRawStory(sample.story);
                        setGenre(sample.genre);
                        setArtStyle(sample.artStyle);
                        setShowSamplesPopover(false);
                      }}
                      className="w-full text-left rounded-lg p-2 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition text-xs"
                    >
                      <div className="font-semibold text-zinc-200">{sample.title}</div>
                      <div className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{sample.story}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Текстовая область ввода сюжета */}
        <div className="mt-3.5">
          <textarea
            value={rawStory}
            onChange={(e) => setRawStory(e.target.value)}
            rows={5}
            placeholder="Вставьте ваш сюжет своими словами, диалог, синопсис или главу веб-новеллы... ИИ адаптирует именно ваш текст без подмены."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:p-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none font-normal leading-relaxed resize-y"
          />
        </div>

        {/* Сетка селекторов: Жанр (Story Skills) и Визуальный стиль (Art Skills) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5 border-t border-zinc-800/80">
          
          {/* Селектор 1: Жанр сюжета (ToonFlow Story Skills) */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Clapperboard className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Жанр сюжета (Story Skills)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddGenreOpen(true)}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition"
                  title="Добавить свой жанр"
                >
                  <Plus className="h-3 w-3" />
                  <span>Свой жанр</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                >
                  <optgroup label="Официальные жанры ToonFlow">
                    {allGenres.filter((g) => !g.isCustom).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </optgroup>
                  {allGenres.some((g) => g.isCustom) && (
                    <optgroup label="Пользовательские жанры">
                      {allGenres.filter((g) => g.isCustom).map((g) => (
                        <option key={g.id} value={g.id}>
                          ⭐ {g.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Описание выбранного жанра */}
              <div className="mt-2 text-[11px] text-zinc-400 bg-zinc-900/50 rounded p-2 border border-zinc-800/50">
                <span className="font-semibold text-zinc-300 block mb-0.5">{selectedGenreObj.tagline}</span>
                <p className="line-clamp-2">{selectedGenreObj.description}</p>
                {selectedGenreObj.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCustomSkill("genre", selectedGenreObj.id, e)}
                    className="mt-1.5 flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" /> Удалить свой жанр
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Селектор 2: Визуальный стиль (ToonFlow Art Skills) */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Визуальный стиль (Art Skills)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddStyleOpen(true)}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition"
                  title="Добавить свой стиль"
                >
                  <Plus className="h-3 w-3" />
                  <span>Свой стиль</span>
                </button>
              </div>

              <div className="relative">
                <select
                  value={artStyle}
                  onChange={(e) => setArtStyle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                >
                  <optgroup label="🎬 Кинематограф (Живые актеры)">
                    {allArtStyles.filter((s) => s.category === "live_action" && !s.isCustom).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🎨 2D Анимация (Дунхуа / Аниме)">
                    {allArtStyles.filter((s) => s.category === "2d_anime" && !s.isCustom).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🎮 3D Графика">
                    {allArtStyles.filter((s) => s.category === "3d_render" && !s.isCustom).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="✨ Стилизация">
                    {allArtStyles.filter((s) => s.category === "stylized" && !s.isCustom).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                  {allArtStyles.some((s) => s.isCustom) && (
                    <optgroup label="Пользовательские стили">
                      {allArtStyles.filter((s) => s.isCustom).map((s) => (
                        <option key={s.id} value={s.id}>
                          ⭐ {s.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Описание выбранного стиля */}
              <div className="mt-2 text-[11px] text-zinc-400 bg-zinc-900/50 rounded p-2 border border-zinc-800/50">
                <span className="font-semibold text-zinc-300 block mb-0.5">
                  {selectedArtStyleObj.categoryLabel}: {selectedArtStyleObj.primaryStyle}
                </span>
                <p className="line-clamp-2 text-[10px] text-zinc-500">{selectedArtStyleObj.textureAnchors}</p>
                {selectedArtStyleObj.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCustomSkill("artStyle", selectedArtStyleObj.id, e)}
                    className="mt-1.5 flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" /> Удалить свой стиль
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя панель действий: Количество сцен + Кнопка адаптации (Mobile responsive stack) */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-t border-zinc-800 pt-3.5">
          {/* Сцены */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-medium text-zinc-300">
              Количество сцен: <span className="font-bold text-white">{shotCount}</span> ({shotCount * 5} сек
              {Math.floor((shotCount * 5) / 60) > 0 ? ` ~ ${Math.floor((shotCount * 5) / 60)} мин ${(shotCount * 5) % 60} сек` : ""})
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShotCount((prev) => Math.max(1, prev - 1))}
                  className="h-7 w-7 rounded border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-sm font-bold transition"
                  title="Уменьшить сцену"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={shotCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 50) setShotCount(val);
                  }}
                  className="h-7 w-12 rounded border border-zinc-700 bg-zinc-900 text-xs font-mono font-bold text-center text-zinc-100 focus:outline-none focus:border-zinc-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setShotCount((prev) => Math.min(50, prev + 1))}
                  className="h-7 w-7 rounded border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-sm font-bold transition"
                  title="Увеличить сцену"
                >
                  +
                </button>
              </div>

              {/* Быстрые пресеты */}
              <div className="flex items-center gap-1">
                {[4, 6, 8, 10, 12, 16].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setShotCount(num)}
                    className={`rounded px-2 py-1 text-[11px] font-mono transition ${
                      shotCount === num
                        ? "bg-zinc-200 text-zinc-950 font-bold"
                        : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Кнопка генерации - на мобильном полная ширина */}
          <button
            onClick={handleGenerateScript}
            disabled={isGenerating || !rawStory.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-zinc-200 hover:bg-white px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold text-zinc-950 transition disabled:opacity-40 shadow-lg"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <span>Адаптация сценария через ИИ...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-zinc-800" />
                <span>Адаптировать в сценарий</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3.5 rounded-lg border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-start gap-2">
            <X className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}
      </div>

      {/* Сгенерированный сценарий (если готов) */}
      {project.scriptTitle && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Адаптированный сценарий серии
                </span>
                <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 text-[10px] text-zinc-300">
                  {selectedGenreObj.name}
                </span>
                <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.2 text-[10px] text-zinc-300">
                  {selectedArtStyleObj.name}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-100 mt-1">{project.scriptTitle}</h3>
              {project.scriptLogline && (
                <p className="mt-1 text-xs text-zinc-400 italic">
                  «{project.scriptLogline}»
                </p>
              )}
            </div>

            <button
              onClick={onNextTab}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-200 hover:bg-white text-zinc-950 px-4 py-2 text-xs font-bold transition shadow"
            >
              <span>К ассетам и кастингу</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Список 5-секундных сцен */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Film className="h-3.5 w-3.5 text-zinc-400" /> Сцены ({project.shots.length})
              </h4>
              <span className="text-[11px] text-zinc-500 font-mono">
                Всего: {project.shots.length * 5} сек
              </span>
            </div>

            <div className="grid gap-3">
              {project.shots.map((shot) => (
                <div
                  key={shot.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 transition hover:border-zinc-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-mono font-bold text-zinc-200">
                        {shot.shotNumber}
                      </span>
                      <span className="font-semibold text-zinc-200">{shot.framing}</span>
                      <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                        {shot.cameraMovement}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 5с
                      </span>
                      <span className="rounded border border-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-300">
                        {shot.settingTag}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-2 text-xs text-zinc-300">
                    <p className="leading-relaxed">
                      <span className="font-medium text-zinc-500">Визуал кадра:</span> {shot.visualDescription}
                    </p>
                    {shot.dialogue && (
                      <p className="rounded bg-zinc-900/80 p-2.5 text-zinc-200 font-medium border border-zinc-800">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Реплика / Субтитры:</span>
                        «{shot.dialogue}»
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-1">
                      <Tag className="h-3 w-3 text-zinc-500" />
                      {shot.characterTags.map((t, idx) => (
                        <span key={idx} className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-300 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                    {shot.audioCue && (
                      <span className="text-[10px] text-zinc-500 italic">
                        Звук: {shot.audioCue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Добавить свой жанр */}
      {isAddGenreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Clapperboard className="h-4 w-4 text-zinc-400" /> Добавить собственный жанр
              </h3>
              <button onClick={() => setIsAddGenreOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomGenre} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Название жанра</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Постапокалиптический вестерн"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Краткий слоган / Подзаголовок</label>
                <input
                  type="text"
                  placeholder="Например: Выжженные пустоши, дуэли на револьверах и древние тайны"
                  value={newGenreTagline}
                  onChange={(e) => setNewGenreTagline(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Режиссерские правила и стилистика повествования</label>
                <textarea
                  rows={3}
                  placeholder="Опишите темп, характер конфликтов, эмоциональную атмосферу..."
                  value={newGenreDesc}
                  onChange={(e) => setNewGenreDesc(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddGenreOpen(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-200 px-4 py-1.5 font-bold text-zinc-950 hover:bg-white"
                >
                  Сохранить жанр
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно: Добавить свой визуальный стиль */}
      {isAddStyleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Palette className="h-4 w-4 text-zinc-400" /> Добавить собственный визуальный стиль
              </h3>
              <button onClick={() => setIsAddStyleOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomArtStyle} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Название стиля</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Темное готическое аниме или Масляная живопись"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Базовая категория</label>
                <select
                  value={newStyleCategory}
                  onChange={(e: any) => setNewStyleCategory(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-100 focus:outline-none focus:border-zinc-500"
                >
                  <option value="2d_anime">2D Анимация (Аниме, манхва, целл-шейдинг)</option>
                  <option value="3d_render">3D Графика (PBR, Unreal Engine, 3D дунхуа)</option>
                  <option value="live_action">Кинематограф (Живые актеры, 35mm плёнка)</option>
                  <option value="stylized">Стилизация (Флэт, акварель, стоп-моушн)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Промпт-определение стиля (Primary Style)</label>
                <input
                  type="text"
                  placeholder="Например: Dark Gothic Anime aesthetic, Bloodborne inspired visual rendering"
                  value={newStylePrimary}
                  onChange={(e) => setNewStylePrimary(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Якоря текстур и света (Texture Anchors)</label>
                <textarea
                  rows={2}
                  placeholder="Например: Chiaroscuro lighting, heavy ink cross-hatching, crimson accents, deep shadows"
                  value={newStyleAnchors}
                  onChange={(e) => setNewStyleAnchors(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddStyleOpen(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-200 px-4 py-1.5 font-bold text-zinc-950 hover:bg-white"
                >
                  Сохранить стиль
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
