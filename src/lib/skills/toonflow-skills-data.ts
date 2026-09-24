export interface StoryGenreItem {
  id: string;
  name: string;
  nameEn: string;
  tagline: string;
  description: string;
  narrativePhilosophy: string[];
  isCustom?: boolean;
}

export interface ArtStyleItem {
  id: string;
  name: string;
  nameEn: string;
  category: "live_action" | "2d_anime" | "3d_render" | "stylized";
  categoryLabel: string;
  primaryStyle: string;
  textureAnchors: string;
  emotionalKeynote: string;
  prohibitedTerms: string;
  isCustom?: boolean;
}

/**
 * 12 Официальных режиссерских жанровых техник ToonFlow (story_skills)
 */
export const TOONFLOW_STORY_GENRES: StoryGenreItem[] = [
  {
    id: "Urban_workplace_drama",
    name: "Городская драма и офисные интриги",
    nameEn: "Urban Workplace Drama",
    tagline: "Реализм карьеры, подковерные войны за влияние и достоинство простых тружеников",
    description: "Напряженные противостояния в корпорациях, союзы и предательства, скрытые мотивы под маской вежливости.",
    narrativePhilosophy: [
      "Достоверность — сила: зритель должен узнавать свои трудовые будни и борьбу.",
      "Подводная борьба за власть: конфликт решается не кулаками, а рычагами влияния и информацией.",
      "Цена восхождения: каждый карьерный прорыв требует компромиссов и личной жертвы.",
      "Достоинство аутсайдера: стойкость обычных сотрудников против бездушной бюрократии.",
    ],
  },
  {
    id: "Xianxia_fantasy",
    name: "Сянься и культивация (Восточное фэнтези)",
    nameEn: "Ancient Xianxia & Fantasy",
    tagline: "Бессмертные кланы, небесные законы, полет мечей и восстание против судьбы",
    description: "Древние школы культивации, небесные кары, даосская эстетика и поэтическое противостояние року.",
    narrativePhilosophy: [
      "Поэтическая атмосфера (Ицзин): каждый туманный пик и облако несут эмоциональный посыл.",
      "Гармония неба, земли и человека: чувства героя вызывают отклик в природе — бурю, молнии или рассвет.",
      "Судьба против бунта: чем непреклоннее небесный приговор, тем возвышеннее неповиновение.",
      "Невысказанное Дао: глубочайшие истины и преданность передаются через тишину, вино и клинок под снегом.",
    ],
  },
  {
    id: "Historical_epic",
    name: "Историческая сага и дворцовые интриги",
    nameEn: "Historical Epic & Palace Intrigue",
    tagline: "Судьбы людей в водовороте эпох, борьба за трон и трагическое величие истории",
    description: "Дворцовые заговоры династий, клановые войны, церемониальный этикет и непоколебимая честь.",
    narrativePhilosophy: [
      "Смертные в жерновах эпох: сила эпоса не в хрониках царей, а в нравственном выборе простых людей.",
      "Неотвратимость рока: конфликт человеческой воли с безжалостными течениями времени.",
      "Величие через ритуал: клятвы, битвы и отречения наделяют моменты монументальным весом.",
      "Безмолвное величие: красота упорства и верности принципам вопреки неизбежному падению.",
    ],
  },
  {
    id: "Mystery_thriller",
    name: "Детективный триллер и саспенс",
    nameEn: "Mystery & Suspense Thriller",
    tagline: "Асимметрия информации, ложные следы, нарастающая тревога и неожиданный финал",
    description: "Запутанные расследования, психологические ловушки, опасные тайны и пошаговое снятие масок.",
    narrativePhilosophy: [
      "Управление информацией: напряжение рождается из того, кто именно, когда и что узнает.",
      "Ненадежное повествование: камера способна вводить в заблуждение ракурсами и акцентами.",
      "Снятие слоев: каждая разгадка порождает еще более тревожные вопросы.",
      "Детали как улики: любая незаметная вещь в кадре обретает решающее значение в финале.",
    ],
  },
  {
    id: "Psychological_drama",
    name: "Психологическая драма и игры разума",
    nameEn: "Psychological Drama & Mind Games",
    tagline: "В тихом омуте: полутона слов, многоходовки и скрытые психологические ловушки",
    description: "Борьба интеллектов, манипуляции, подавленные травмы и скрытые мотивы каждого персонажа.",
    narrativePhilosophy: [
      "В тихом омуте: произносимые слова противоречат скрытым мыслям, каждая фраза — ловушка.",
      "Информация как оружие: тот, кто скрывает знание, правит ситуацией.",
      "Многоуровневая игра: я знаю, что ты лжешь, и ты знаешь, что я об этом знаю.",
      "Моральная неоднозначность: у каждого игрока есть своя отчаянная и логичная правда.",
    ],
  },
  {
    id: "Sweet_romance_novel",
    name: "Романтическая дорама и мелодрама",
    nameEn: "Sweet Romance & Melodrama",
    tagline: "Эмоциональное притяжение, красноречивые паузы, нежные взгляды и буря чувств",
    description: "Трогательная история любви, невысказанные признания, преграды статуса и романтические развязки.",
    narrativePhilosophy: [
      "Сдержанность чувств: эмоциональный резонанс строится на микро-взглядах и паузах, а не на криках.",
      "Мощь мелких деталей: затаенное дыхание, задетая ветром пола одежды, едва заметная улыбка.",
      "Ритм притяжения: сближение → сомнение → непонимание → разлука → триумфальное воссоединение.",
      "Сила молчания: в кульминационный момент тишина бьет сильнее тысячи слов.",
    ],
  },
  {
    id: "Hot_blooded_action",
    name: "Боевик и героический экшен (Сёнэн)",
    nameEn: "Hot-Blooded Action & Shonen Battle",
    tagline: "Преодоление невозможного, сила воли, ярость удара и братство по оружию",
    description: "Динамичные схватки, взрывной адреналин, камбэки из безнадежных ситуаций и боевое товарищество.",
    narrativePhilosophy: [
      "Кривая воспламенения: накал растет от отчаяния к сокрушительному прорыву.",
      "Визуализация воли: несгибаемый дух выражается через сжатые кулаки, яростный взгляд и шрамы.",
      "Победа андердога: преодоление многократно превосходящих сил врага.",
      "Братство по оружию: доверие товарищей и взаимная верность — главный катализатор победы.",
    ],
  },
  {
    id: "Horror_supernatural",
    name: "Мистика и сверхъестественный хоррор",
    nameEn: "Horror & Supernatural",
    tagline: "Ужас неведомого, трещины в привычной реальности и леденящее душу предчувствие",
    description: "Сверхъестественные явления, древние проклятия, тревожная тишина и тьма человеческой природы.",
    narrativePhilosophy: [
      "Неизвестность рождает страх: воображение зрителя страшнее любых прямых монстров.",
      "Трещины в обыденности: самый пугающий ужас проникает в привычные, знакомые места.",
      "Медленное наступление: чувство тревоги сжимает кольцо, пока бежать становится некуда.",
      "Человеческое зло глубже призраков: мистика лишь отражает внутреннюю тьму героев.",
    ],
  },
  {
    id: "Scifi_post_apocalypse",
    name: "Научная фантастика и постапокалипсис",
    nameEn: "Sci-Fi & Post-Apocalypse",
    tagline: "Руины былого величия, выживание на грани, искры надежды среди пепла",
    description: "Технологические катастрофы, выживание среди пустошей, кибернетика и проверка человечности.",
    narrativePhilosophy: [
      "Эстетика руин: скелеты городов рассказывают историю мощнее тысячи диалогов.",
      "Выживание как главный мотив: все ценности и мораль проходят испытание голодом и холодом.",
      "Горнило человечности: кто жертвует собой, а кто предает в отчаянный момент.",
      "Гравитация надежды: одинокий зеленый росток среди бетона весит больше океана слов.",
    ],
  },
  {
    id: "Comedy_humor",
    name: "Комедия и ситком",
    nameEn: "Comedy & Humor",
    tagline: "Слом ожиданий, идеальный тайминг, яркие столкновения характеров и смех сквозь слезы",
    description: "Остроумные диалоги, курьезные ситуации, фарс, контрасты характеров и жизнеутверждающий финал.",
    narrativePhilosophy: [
      "Слом ожиданий: юмор возникает там, где зритель ждет одного, но случается неожиданное.",
      "Тайминг решает всё: пауза перед панчлайном делает шутку вирусной.",
      "Характер важнее гэгов: лучший юмор органически вырастает из столкновения противоположных личностей.",
      "Смех сквозь слезы: искренняя человеческая уязвимость внутри абсурда трогает зрителя за живое.",
    ],
  },
  {
    id: "Coming_of_age",
    name: "Взросление и молодежная драма",
    nameEn: "Coming of Age & Youth",
    tagline: "Первая любовь, первые ошибки, неповторимая искренность и светлая ностальгия",
    description: "Школьные и университетские годы, поиск своего пути, верная дружба и прощание с детством.",
    narrativePhilosophy: [
      "Ценность первых открытий: первая любовь, первая ошибка, первый мужественный поступок.",
      "Неловкость — это подлинность: поспешность, смущение и искренность делают юность живой.",
      "Необратимость времени: светлая грусть от того, что эти мгновения невозможно повторить.",
      "Командный резонанс: компания друзей, соперники и учителя создают общий хор эпохи.",
    ],
  },
  {
    id: "Family_warmth",
    name: "Семейная сага и теплота быта",
    nameEn: "Family Warmth & Everyday Life",
    tagline: "Сила в простом: забота без громких слов, связь поколений и тепло домашнего очага",
    description: "Семейные взаимоотношения, преодоление недопонимания между поколениями, согревающий уют и поддержка.",
    narrativePhilosophy: [
      "Обыденное необыкновенно: глубочайшая преданность кроется в повседневных мелочах.",
      "Любовь на кончике языка: настоящие чувства выражаются в горячем супе и заботливом молчании.",
      "Связь поколений: когда ребенок неосознанно повторяет жест отца, эстафета передана.",
      "Священность ритуала: семейный ужин и вечерние разговоры создают несокрушимую опору.",
    ],
  },
];

/**
 * 11 Официальных визуальных стилей ToonFlow (art_skills)
 */
export const TOONFLOW_ART_STYLES: ArtStyleItem[] = [
  {
    id: "realpeople_modern_city",
    name: "Живые актеры: Современный город (35mm Кино)",
    nameEn: "Live-Action Urban Cinema",
    category: "live_action",
    categoryLabel: "Кинематограф",
    primaryStyle: "Live-action contemporary urban cinema, real human photography",
    textureAnchors: "Real skin pores visible, natural garment draping, 35mm film texture, ARRI Alexa color science, shallow depth of field, non-airbrushed",
    emotionalKeynote: "Grounded realism, modern corporate sophistication, unvarnished human intimacy",
    prohibitedTerms: "3D render, CGI, anime, cartoon, airbrushed plastic skin, doll face, fake CGI background",
  },
  {
    id: "realpeople_ancient_chinese",
    name: "Живые актеры: Древний Китай (Костюмированное кино)",
    nameEn: "Photorealistic Ancient Chinese Drama",
    category: "live_action",
    categoryLabel: "Кинематограф",
    primaryStyle: "Photorealistic ancient Chinese costume drama, 35mm feature film cinematography",
    textureAnchors: "Authentic silk Hanfu drapery, delicate gold embroidery, visible natural skin texture, period jade ornaments, candlelit chiaroscuro, natural film grain",
    emotionalKeynote: "Classical imperial gravity, restrained tragic romance, poetic ancient atmosphere",
    prohibitedTerms: "modern clothes, 3D render, CGI, cartoon, western fantasy, plastic armor, anime",
  },
  {
    id: "realpeople_urban_modern",
    name: "Живые актеры: Городской нуар и нео-реализм",
    nameEn: "Photorealistic Modern Urban Noir",
    category: "live_action",
    categoryLabel: "Кинематограф",
    primaryStyle: "Live-action gritty urban drama, cinematic neo-noir photography",
    textureAnchors: "Rain reflections on wet asphalt, dramatic window blind shadows, tactile fabric weaves, high dynamic range, crisp eye reflections",
    emotionalKeynote: "Tense psychological standoff, cold investigative realism, nocturnal suspense",
    prohibitedTerms: "3D render, anime, fantasy elements, cartoonish saturation, airbrushed smoothness",
  },
  {
    id: "2D_chinese_guofeng",
    name: "2D Китайский Гофэн / Дунхуа Нео-Шик",
    nameEn: "Guofeng Anime Neo-Chic",
    category: "2d_anime",
    categoryLabel: "2D Анимация",
    primaryStyle: "Chinese Style Anime Neo-Chic (Guofeng Anime Neo-Chic), 2D Donghua animation",
    textureAnchors: "Cel coloring, delicate ink brushwork, modern anime rendering, cinematic composition, oriental decorative motifs, flowing silk ribbons",
    emotionalKeynote: "Oriental classical charm, neo-chic fashion, cinematic texture, poetic depth",
    prohibitedTerms: "photorealistic human skin, 3D CGI render, western cartoon style, clay, stop-motion",
  },
  {
    id: "2D_mature_urban_romance",
    name: "2D Взрослая городская романтика (Манхва / Дзёсэй)",
    nameEn: "Mature Urban Romance Anime",
    category: "2d_anime",
    categoryLabel: "2D Анимация",
    primaryStyle: "Mature Urban Romance 2D Anime, Korean manhwa aesthetic, high-end webtoon key visual",
    textureAnchors: "Crisp detailed line art, sophisticated cel shading, dramatic low-key romantic lighting, fashionable modern designer wardrobe, glossy hair highlights",
    emotionalKeynote: "Sultry romantic tension, emotional depth, upscale cosmopolitan allure",
    prohibitedTerms: "chibi, deformed, childish cartoon, 3D model render, historical costume",
  },
  {
    id: "2D_90s_japanese_anime",
    name: "2D Ретро аниме 90-х (Целл-шейдинг)",
    nameEn: "1990s Japanese Anime Cel",
    category: "2d_anime",
    categoryLabel: "2D Анимация",
    primaryStyle: "1990s Japanese Anime cel aesthetic, hand-drawn vintage animation",
    textureAnchors: "Clean fluid linework, classic opaque cel shading, soft warm CRT color palette, subtle analog film grain, hand-painted watercolor background",
    emotionalKeynote: "Nostalgic warmth, tender romantic melancholy, retro cinematic charm",
    prohibitedTerms: "digital vector, 3D CGI render, photorealism, glossy modern 3D shading",
  },
  {
    id: "2D_flat_design",
    name: "2D Графический минимализм (Флэт-дизайн)",
    nameEn: "2D Flat Graphic Design",
    category: "stylized",
    categoryLabel: "Стилизация",
    primaryStyle: "2D Flat Design, minimalist graphic illustration, modern poster aesthetic",
    textureAnchors: "Clean geometric lines, solid color fills, bold color block contrast, elegant negative space, stylized silhouette composition",
    emotionalKeynote: "Sophisticated minimalism, conceptual clarity, modern editorial aesthetic",
    prohibitedTerms: "realistic gradients, 3D textures, photorealism, volumetric fog, noise grain",
  },
  {
    id: "3D_chinese_traditional",
    name: "3D Традиционный Китайский (3D Дунхуа)",
    nameEn: "Chinese Traditional 3D Render",
    category: "3d_render",
    categoryLabel: "3D Графика",
    primaryStyle: "Chinese Traditional 3D Render, high-budget 3D Donghua theatrical animation",
    textureAnchors: "PBR physical material rendering, realistic silk and brocade sheen, volumetric ray-traced lighting, ambient occlusion, exquisite hair groom simulation",
    emotionalKeynote: "Majestic mythical grandeur, refined Oriental fantasy, high-budget CG prestige",
    prohibitedTerms: "flat 2D anime, hand-drawn sketch, low-poly, pixelated, amateur clay",
  },
  {
    id: "3D_anime_render",
    name: "3D Стилизованный аниме рендер",
    nameEn: "3D Stylized Anime Render",
    category: "3d_render",
    categoryLabel: "3D Графика",
    primaryStyle: "3D Stylized Anime Render, Genshin / Ufotable aesthetic, cel-shaded 3D next-gen model",
    textureAnchors: "Clear outline strokes, high-detail stylized shaders, soft warm lighting bounce, radiant specular highlights on eyes, clean smooth topology",
    emotionalKeynote: "Energetic, vibrant, contemporary high-end game cinematic presentation",
    prohibitedTerms: "hyper-realistic skin pores, photoreal live-action, grainy vintage film, flat vector",
  },
  {
    id: "3D_guofeng_cyber",
    name: "3D Киберпанк Гофэн (Неоновый ориентализм)",
    nameEn: "Chinese Cyberpunk 3D",
    category: "3d_render",
    categoryLabel: "3D Графика",
    primaryStyle: "Chinese Cyberpunk 3D, Oriental Neon Futurism, high-poly Unreal Engine 5 render",
    textureAnchors: "Cinnabar red and teal green neon hues, holographic azurite projections, Hanfu techwear fusion, chrome and jade reflections, rainy street volumetric fog",
    emotionalKeynote: "Futuristic rebellion, high-tech oriental intrigue, hypnotic cyber elegance",
    prohibitedTerms: "pure historical ancient scene without tech, flat 2D cartoon, low-poly, daytime sunny pastoral",
  },
  {
    id: "3D_clay_stopmotion",
    name: "3D Пластилиновый стоп-моушн",
    nameEn: "Stop-Motion Claymation",
    category: "stylized",
    categoryLabel: "Стилизация",
    primaryStyle: "Stop-Motion Claymation, tactile handcrafted puppet animation",
    textureAnchors: "Plasticine clay surface, subtle visible finger impressions, miniature set tactile textures, soft macro shallow depth of field, warm tungsten practical lighting",
    emotionalKeynote: "Charming artisanal warmth, whimsical comedy, endearing tactile intimacy",
    prohibitedTerms: "smooth digital CGI, live-action human skin, 2D vector, anime drawing",
  },
];

export function getStoryGenre(id: string, customList?: StoryGenreItem[]): StoryGenreItem {
  const found = (customList || []).find((g) => g.id === id) || TOONFLOW_STORY_GENRES.find((g) => g.id === id);
  if (found) return found;

  // Fallback for legacy ids
  if (id === "modern_urban") return TOONFLOW_STORY_GENRES[0];
  if (id === "ancient_palace") return TOONFLOW_STORY_GENRES[1];
  if (id === "suspense_thriller") return TOONFLOW_STORY_GENRES[3];

  return {
    id,
    name: id,
    nameEn: id,
    tagline: "Пользовательский жанр",
    description: "Собственный жанр сюжета",
    narrativePhilosophy: ["Следовать индивидуальной задумке автора."],
    isCustom: true,
  };
}

export function getArtStyle(id: string, customList?: ArtStyleItem[]): ArtStyleItem {
  const found = (customList || []).find((s) => s.id === id) || TOONFLOW_ART_STYLES.find((s) => s.id === id);
  if (found) return found;

  // Defaults based on common terms
  if (id?.toLowerCase().includes("ancient") || id?.toLowerCase().includes("palace")) {
    return TOONFLOW_ART_STYLES[1]; // realpeople_ancient_chinese
  }
  if (id?.toLowerCase().includes("anime") || id?.toLowerCase().includes("guofeng") || id?.toLowerCase().includes("2d")) {
    return TOONFLOW_ART_STYLES[3]; // 2D_chinese_guofeng
  }

  // Default to realpeople_modern_city
  if (!id || id === "modern_urban" || id === "default") {
    return TOONFLOW_ART_STYLES[0];
  }

  return {
    id,
    name: id,
    nameEn: id,
    category: "stylized",
    categoryLabel: "Свой стиль",
    primaryStyle: `${id} artistic visual style`,
    textureAnchors: "High detail, cinematic lighting, artistic composition",
    emotionalKeynote: "Custom aesthetic",
    prohibitedTerms: "low quality, blur, watermark, distorted anatomy",
    isCustom: true,
  };
}
