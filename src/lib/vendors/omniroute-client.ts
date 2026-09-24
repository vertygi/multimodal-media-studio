import { getSettings } from "@/storage";
import { StoryboardShot, Asset, GenreStyle } from "@/types";
import { getStoryGenre, getArtStyle } from "@/lib/skills/toonflow-skills-data";

export interface AdaptedScriptResponse {
  title: string;
  logline: string;
  synopsis: string;
  characters: Array<{
    name: string;
    tag: string;
    gender: "male" | "female";
    roleDescription: string;
    visualDescription: string;
  }>;
  locations: Array<{
    name: string;
    tag: string;
    settingDescription: string;
    timeOfDay: string;
    lighting: string;
  }>;
  props: Array<{
    name: string;
    tag: string;
    roleDescription: string;
  }>;
  shots: Array<{
    shotNumber: number;
    duration: number;
    characterTags: string[];
    settingTag: string;
    propTags?: string[];
    framing: string;
    cameraMovement: string;
    visualDescription: string;
    actionPrompt: string;
    dialogue?: string;
    audioCue?: string;
    emotion: string;
  }>;
}

export async function adaptStoryToScriptAndAssets(
  rawStory: string,
  genre: string = "Urban_workplace_drama",
  targetShotCount: number = 8,
  aspectRatio: "9:16" | "16:9" = "9:16",
  artStyle: string = "realpeople_modern_city"
): Promise<AdaptedScriptResponse> {
  const cleanStory = (rawStory || "").trim();
  if (!cleanStory) {
    throw new Error("Пожалуйста, введите текст сюжета или идеи для адаптации в сценарий.");
  }

  const settings = getSettings();
  const baseUrl = (settings.omniroute?.baseUrl || "https://api.omniroute.ai/v1").replace(/\/$/, "");
  const apiKey = settings.omniroute?.apiKey || process.env.OMNIROUTE_API_KEY || "";
  const preferredModel = settings.omniroute?.model || "auto/gemini";

  if (!apiKey) {
    throw new Error("API ключ Omniroute не настроен. Откройте Настройки (иконка шестеренки в шапке) и укажите рабочий API ключ.");
  }

  const storyGenre = getStoryGenre(genre);
  const visualStyle = getArtStyle(artStyle);

  const systemPrompt = `You are a Master Screenwriter and Showrunner specializing in high-grossing episodic dramas for vertical (9:16 Shorts/Reels/TikTok) and horizontal (16:9) formats.
Your primary task is to adapt the USER's specific story, premise, and characters into an ultra-compelling cinematic episode of exactly ${targetShotCount} sequential 5-second shots.

ABSOLUTE MANDATORY DIRECTIVES:
1. STRICT STORY ADAPTATION: You MUST adapt the USER's provided story idea, characters, and events. Do NOT invent a generic preset story. Every shot, character, and location must directly emerge from the user's plot.
2. GENRE: ${storyGenre.nameEn} (${storyGenre.name}) - ${storyGenre.description}
   Director Philosophy & Narrative Rules:
   ${storyGenre.narrativePhilosophy.map((p) => `- ${p}`).join("\n")}
3. VISUAL ART MEDIUM & STYLE: ${visualStyle.nameEn} (${visualStyle.name})
   - Primary Style: ${visualStyle.primaryStyle}
   - Texture Anchors: ${visualStyle.textureAnchors}
   - Emotional Keynote: ${visualStyle.emotionalKeynote}
   ${visualStyle.prohibitedTerms ? `- Strictly avoid: ${visualStyle.prohibitedTerms}` : ""}

CINEMATOGRAPHY RULES & TOONFLOW PRODUCTION LAWS:
1. SHOT SCALE PROGRESSION (ANTI-FATIGUE):
   - Unjustified consecutive identical shot scales are strictly FORBIDDEN. Alternate dynamically: Wide Establishing -> Entrance Full Shot -> Over-The-Shoulder (OTS) -> Close-Up Detail -> Reverse Angle -> Intimate Two-Shot -> ECU Reaction -> Dynamic Climax.
2. THE 3-LAYER DEPTH COMPOSITION:
   Every visualDescription MUST describe at least 2-3 distinct spatial layers:
   - FOREGROUND: Soft-focus foreground element providing depth (e.g. shooting past shoulder in soft focus, edge of a glass, doorframe, rainy window).
   - MIDGROUND: Sharp focus on characters in intense physical proximity or contact.
   - BACKGROUND: Atmospheric depth, setting geometry, bokeh lights.
3. 180° ACTION AXIS & SPATIAL ORIENTATION:
   - In dialogue, characters face EACH OTHER (3/4 front).
   - Over-The-Shoulder (OTS): Foreground figure back to camera in soft focus; background figure facing lens in sharp focus.
   - Strictly NO characters staring directly into the camera lens (strictly forbid front-facing passport portraits).
4. PURE PHYSICAL BLOCKING IN VISUAL DESCRIPTION:
   - visualDescription carries physical staging, spatial relations, and poses only.
   - Write as a Director of Photography blocking note: "Foreground: [soft focus element]. Midground: [Character name] is [exact physical pose/body angle], looking with [emotion] at [other character/object]. Background: [atmospheric depth]."

Extract the assets:
- Characters: Name, @Tag (e.g. @HeroName, @RivalName), gender ("male"|"female"), role description, visual appearance description (reflecting the chosen visual medium).
- Locations: Name, @Tag (e.g. @PenthouseOffice, @RainyBoulevard), atmosphere, lighting, time of day.
- Props: Key story objects, @Tag (e.g. @SecretContract, @PhoneRecord).

For each shot (shot 1 to ${targetShotCount}):
- shotNumber (1, 2, ...)
- duration: 5 (seconds)
- characterTags: array of @Tags present in this shot
- settingTag: 1 @Tag for the location
- propTags: array of @Tags for visible props
- framing: "Extreme Wide Shot", "Wide Establishing Shot", "Full Shot", "Medium Shot", "Medium Close-up", "Close-up", "Extreme Close-up", "Over-the-Shoulder"
- cameraMovement: "Slow push-in", "Subtle handheld float", "Steadicam glide", "Rack focus", "Low angle tilt"
- visualDescription: Precise description of the opening frozen composition following the 3-layer rule
- actionPrompt: what happens during these 5 seconds
- dialogue: short, intense spoken line or subtitle (if any)
- audioCue: sound effect, ambient sound, heartbeat, tense strings
- emotion: dominant emotional state

YOU MUST OUTPUT ONLY VALID JSON matching this schema:
{
  "title": "...",
  "logline": "...",
  "synopsis": "...",
  "characters": [
    { "name": "...", "tag": "@...", "gender": "male"|"female", "roleDescription": "...", "visualDescription": "..." }
  ],
  "locations": [
    { "name": "...", "tag": "@...", "settingDescription": "...", "timeOfDay": "...", "lighting": "..." }
  ],
  "props": [
    { "name": "...", "tag": "@...", "roleDescription": "..." }
  ],
  "shots": [
    {
      "shotNumber": 1,
      "duration": 5,
      "characterTags": ["@..."],
      "settingTag": "@...",
      "propTags": ["@..."],
      "framing": "...",
      "cameraMovement": "...",
      "visualDescription": "...",
      "actionPrompt": "...",
      "dialogue": "...",
      "audioCue": "...",
      "emotion": "..."
    }
  ]
}`;

  const candidateModels = Array.from(
    new Set([preferredModel, "auto/gemini", "auto/claude-sonnet", "agy/gemini-3-flash"].filter(Boolean))
  );

  let lastError: Error | null = null;
  for (const m of candidateModels) {
    try {
      console.log(`[Omniroute] Calling model ${m} for script adaptation...`);
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: "system", content: systemPrompt },
            { 
              role: "user", 
              content: `Adapt this story into an intense ${storyGenre.nameEn} episode (${aspectRatio} format, ${targetShotCount} shots of 5s each):\n\n${cleanStory}` 
            },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Omniroute] Model ${m} returned HTTP ${res.status}: ${errText}`);
        lastError = new Error(`Omniroute (${m}) HTTP ${res.status}: ${errText}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      if (!content) {
        throw new Error(`Empty response content from ${m}`);
      }

      let jsonStr = content.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);
      if (!parsed.shots || !Array.isArray(parsed.shots) || parsed.shots.length === 0) {
        throw new Error("Invalid script structure: 'shots' array missing or empty");
      }

      console.log(`[Omniroute] Successfully adapted script with model ${m}: ${parsed.shots.length} shots`);
      return parsed;
    } catch (err: any) {
      console.warn(`[Omniroute] Failed attempt with ${m}:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`Не удалось адаптировать сценарий через ИИ: ${lastError?.message || "Все доступные модели вернули ошибку"}. Проверьте соединение или настройки Omniroute.`);
}

function getFallbackDramaScript(
  rawStory: string,
  genre: GenreStyle,
  shotCount: number,
  aspectRatio: "9:16" | "16:9"
): AdaptedScriptResponse {
  const isAncient = genre === "ancient_palace";

  if (isAncient) {
    const ancientShotBlueprints = [
      {
        framing: "Wide Establishing Shot",
        cameraMovement: "Slow push-in through misty courtyard willows",
        characterTags: ["@XiaoYan"],
        propTags: [],
        visualDescription: "Foreground weeping willow branches sway in soft focus; midground General Xiao Yan stands solitary at the stone pavilion balustrade in dark ink Hanfu, gazing down at the misty courtyard; background imperial palace roof eaves silhouette against the cold midnight moon.",
        actionPrompt: "Xiao Yan turns his head slowly in 3/4 profile, his hand resting on his sword hilt, alert to an approaching presence.",
        emotion: "Cold vigilance and suppressed tension",
        dialogue: undefined,
        audioCue: "Night wind rustling willow leaves, distant court gong, midnight wind",
      },
      {
        framing: "Full Shot",
        cameraMovement: "Steadicam lateral glide following her steps",
        characterTags: ["@ZhaoWaner"],
        propTags: ["@CeladonGoblet"],
        visualDescription: "Foreground carved stone lantern casts warm amber glow; midground Princess Zhao Wan'er in flowing moon-white silk Hanfu steps gracefully onto the stone veranda, carrying an ancient celadon goblet on a dark lacquer tray; background bamboo shadows flicker against whitewashed palace walls.",
        actionPrompt: "She halts three paces away, holding the tray firmly, her knuckles whitening as she maintains a facade of icy composure.",
        emotion: "Masked fear and royal dignity",
        dialogue: undefined,
        audioCue: "Soft silk fabric rustling, faint porcelain clink",
      },
      {
        framing: "Over-the-Shoulder Shot",
        cameraMovement: "Subtle handheld breathing over shoulder",
        characterTags: ["@XiaoYan", "@ZhaoWaner"],
        propTags: ["@CeladonGoblet"],
        visualDescription: "Shooting past Xiao Yan's broad dark-armored shoulder in soft foreground focus; sharp midground focus on Wan'er facing him in 3/4 view, lifting the celadon cup in offering with eyes locked on his; cold lunar mist floats in the deep background.",
        actionPrompt: "Wan'er raises the cup in formal offering, her voice trembling slightly under her breath.",
        emotion: "Tense confrontation and psychological standoff",
        dialogue: "You summoned me at midnight, General. Will you drink this imperial tribute wine?",
        audioCue: "Tense violin tremolo, sudden silence of crickets",
      },
      {
        framing: "Extreme Close-Up",
        cameraMovement: "Micro rack-focus across the goblet rim",
        characterTags: ["@ZhaoWaner"],
        propTags: ["@CeladonGoblet"],
        visualDescription: "Macro focus on the ancient celadon wine goblet held in trembling slender fingers; a dark iridescent droplet clings to the pale green glazed rim, reflecting the moonlight; background completely blurred into smooth indigo bokeh.",
        actionPrompt: "Her slender fingertips tremble imperceptibly against the cold porcelain as the wine surface ripples under the moonlight.",
        emotion: "Fatal hesitation and hidden remorse",
        dialogue: undefined,
        audioCue: "Faint ripple of wine, low sub-bass drone",
      },
      {
        framing: "Medium Close-up",
        cameraMovement: "Slow push-in on his unyielding gaze",
        characterTags: ["@XiaoYan"],
        propTags: ["@CeladonGoblet"],
        visualDescription: "Foreground lacquer tray edge blurred; midground Xiao Yan in sharp 3/4 profile accepts the goblet, his dark piercing eyes locked directly on Wan'er's face off-camera, lifting the cup deliberately toward his lips; warm lantern highlights outline his sharp jawline.",
        actionPrompt: "He tilts the rim toward his mouth with unflinching resolve, showing he knows the brew is poisoned.",
        emotion: "Fatal resolve and tragic devotion",
        dialogue: "If dying by your hand clears your clan's treason charge, I regret nothing.",
        audioCue: "Muted heartbeat rhythm, heavy cello note",
      },
      {
        framing: "Intimate Two-Shot",
        cameraMovement: "Rapid Steadicam pivot into close proximity",
        characterTags: ["@XiaoYan", "@ZhaoWaner"],
        propTags: ["@CeladonGoblet"],
        visualDescription: "Xiao Yan's free hand grips Wan'er's slender wrist, pulling her close into the shadow of the pavilion pillar; their faces inches apart in mutual 3/4 profile, the goblet suspended millimeters from his lips; background moonlight spills across the courtyard flagstones.",
        actionPrompt: "Wan'er gasps, her free hand instinctively gripping his chest armor to push the cup away.",
        emotion: "Suppressed passion and desperate terror",
        dialogue: "You knew this cup was poisoned, yet you drank it?!",
        audioCue: "Sudden sharp breath, fabric friction, dramatic orchestral swell",
      },
      {
        framing: "Close-Up",
        cameraMovement: "Static hold, capturing micro-expressions",
        characterTags: ["@ZhaoWaner"],
        propTags: [],
        visualDescription: "Tight close-up on Wan'er's delicate porcelain face, almond eyes shimmering with unshed tears, loose strands of hair brushing against her cheek in the draft; soft amber lantern light reflects off her damp lashes against dark indigo shadows.",
        actionPrompt: "A single tear spills over her lashes as her defensive coldness completely shatters.",
        emotion: "Shattered pride and raw vulnerability",
        dialogue: undefined,
        audioCue: "Melancholy solo Erhu phrase, distant thunder rumble",
      },
      {
        framing: "Dynamic Low Angle Wide Shot",
        cameraMovement: "Rapid pull-back crane revealing surrounding danger",
        characterTags: ["@XiaoYan", "@ZhaoWaner"],
        propTags: [],
        visualDescription: "Low angle looking up at the pavilion: Xiao Yan shields Wan'er behind his back, his silver sword half-drawn catching the moon; in the foreground shadows and courtyard perimeter, silhouette figures of imperial shadow guards emerge with drawn blades; heavy rain begins to fall.",
        actionPrompt: "Xiao Yan positions his body defensively in front of her, facing the surrounding shadows.",
        emotion: "Fierce defiance and impending battle",
        dialogue: "Stay behind me, Wan'er. Tonight, no one takes you.",
        audioCue: "Metallic blade unsheathing clang, rolling thunder, sudden torrential rain",
      },
      {
        framing: "Medium Shot",
        cameraMovement: "Quick tracking arc around the defensive stance",
        characterTags: ["@XiaoYan", "@ZhaoWaner"],
        propTags: [],
        visualDescription: "Foreground rain streaks blur across the frame; midground Xiao Yan deflects an incoming steel throwing dagger with his forearm vambrace while holding Wan'er tightly against his side; sparks burst against the stone pillar.",
        actionPrompt: "He spins Wan'er behind the pillar as curved steel blades strike the pavilion wood.",
        emotion: "High-octane adrenaline and protective instinct",
        dialogue: undefined,
        audioCue: "Sparks hiss, metal on metal clash, wooden splinter crack",
      },
      {
        framing: "Medium Close-up",
        cameraMovement: "Handheld pan tracking her counteraction",
        characterTags: ["@ZhaoWaner"],
        propTags: [],
        visualDescription: "Wan'er draws a hidden silver hairpin blade from her updo, her eyes blazing with fierce resolve beside Xiao Yan's shoulder; rain drips from her porcelain jawline; dark courtyard shadows swirl in the background.",
        actionPrompt: "She steps up back-to-back with Xiao Yan, ready to fight together.",
        emotion: "Fierce solidarity and mutual trust",
        dialogue: "We live together, or we die together in this pavilion!",
        audioCue: "High-pitched silver blade chime, rising heroic tempo",
      },
      {
        framing: "Over-the-Shoulder Two-Shot",
        cameraMovement: "Slow orbital glide around their shared defense",
        characterTags: ["@XiaoYan", "@ZhaoWaner"],
        propTags: [],
        visualDescription: "Back-to-back combat stance: Xiao Yan facing left with gleaming blade, Wan'er facing right guarding his blind spot; rain pouring in sheets through the pavilion roof eaves, illuminated by lightning flash.",
        actionPrompt: "Their hands touch briefly behind their backs, an unspoken vow sealed before the clash.",
        emotion: "Sacred bond under mortal threat",
        dialogue: undefined,
        audioCue: "Heavy rain pouring, deep thunder clap, battle roar",
      },
      {
        framing: "Extreme Wide Establishing Shot",
        cameraMovement: "Slow crane up into the midnight sky",
        characterTags: ["@XiaoYan", "@ZhaoWaner"],
        propTags: [],
        visualDescription: "Extreme wide high-angle view of the imperial pavilion surrounded by torchlit guards in the pouring midnight storm; two lone figures stand unified at the center of the terrace under the flashing sky; the grand imperial palace looms behind in dark majesty.",
        actionPrompt: "Lightning flashes, freezing the two heroes in iconic martial silhouette at the episode cliffhanger.",
        emotion: "Epic grandeur and climactic suspense",
        dialogue: undefined,
        audioCue: "Thunder crescendo, cliffhanger chord fade into ending theme",
      },
    ];

    const finalShots = Array.from({ length: shotCount }).map((_, i) => {
      const blueprint = ancientShotBlueprints[i % ancientShotBlueprints.length];
      return {
        shotNumber: i + 1,
        duration: 5,
        characterTags: blueprint.characterTags,
        settingTag: "@PhoenixPavilion",
        propTags: blueprint.propTags,
        framing: blueprint.framing,
        cameraMovement: blueprint.cameraMovement,
        visualDescription: blueprint.visualDescription,
        actionPrompt: blueprint.actionPrompt,
        dialogue: blueprint.dialogue,
        audioCue: blueprint.audioCue,
        emotion: blueprint.emotion,
      };
    });

    return {
      title: "Moonlit Vow of the Phoenix Pavilion",
      logline: "In the shadow of the Imperial court, an exiled general and a disguised noblewoman trade their destinies in a single cup of wine.",
      synopsis: "Princess Zhao disguised as a musician encounters General Xiao Yan at the moonlit imperial pavilion. When an assassin's poison is discovered, loyalty and forbidden passion collide.",
      characters: [
        {
          name: "General Xiao Yan",
          tag: "@XiaoYan",
          gender: "male",
          roleDescription: "Brooding Imperial General, formidable and fiercely loyal, hiding a vulnerable heart",
          visualDescription: "Tall, sharp jawline, high ponytail secured by silver hairpin, dark ink Hanfu armor with silver embroidery, piercing gaze",
        },
        {
          name: "Princess Zhao Wan'er",
          tag: "@ZhaoWaner",
          gender: "female",
          roleDescription: "Disguised noble princess posing as a court guqin musician, proud and razor-sharp intellect",
          visualDescription: "Ethereal fair skin, delicate almond eyes, flowing moon-white silk Hanfu with pearlescent gold cuffs, jade hairpin in soft updo",
        },
      ],
      locations: [
        {
          name: "Imperial Phoenix Pavilion",
          tag: "@PhoenixPavilion",
          settingDescription: "Ancient imperial pavilion with carved stone balustrades, weeping willows, and lotus pond reflecting midnight moonlight",
          timeOfDay: "Midnight",
          lighting: "Cool lunar mist offset by warm amber lantern glow",
        },
      ],
      props: [
        {
          name: "Celadon Wine Goblet",
          tag: "@CeladonGoblet",
          roleDescription: "Ancient jade goblet laced with poison, trembling between their fingers",
        },
      ],
      shots: finalShots,
    };
  }

  // Modern Urban CEO / Romance
  const modernShotBlueprints = [
    {
      framing: "Medium Shot",
      cameraMovement: "Slow push-in from behind the marble desk",
      characterTags: ["@LuChen"],
      propTags: [],
      visualDescription: "Foreground blurred rim of a crystal tumbler; midground Lu Chen stands tall against floor-to-ceiling glass in a charcoal suit, cold smirk playing on his lips; background rain-slicked Shanghai neon towers.",
      actionPrompt: "He takes a slow sip, turning with a ruthless smirk of absolute dominance.",
      dialogue: "Three years, Lin Wan. You really thought you could make me love you?",
      audioCue: "Muffled thunder, rain drumming against glass, heavy cello note",
      emotion: "Cold superiority",
    },
    {
      framing: "Close-up",
      cameraMovement: "Subtle handheld breathing, focusing on her eyes",
      characterTags: ["@LinWan"],
      propTags: ["@DivorceContract"],
      visualDescription: "Foreground black leather contract folder open; midground Lin Wan sits motionless in a sleek cream blazer, unreadable calm in her eyes, gold fountain pen poised over the signature line; background city lights reflect on glass.",
      actionPrompt: "She does not flinch. With flawless elegance, she signs her name without looking up.",
      dialogue: "Love was never in our contract, Mr. Lu.",
      audioCue: "Crisp scratch of fountain pen on heavyweight paper",
      emotion: "Untouchable composure",
    },
    {
      framing: "Over-the-Shoulder Two-Shot",
      cameraMovement: "Steadicam lateral glide",
      characterTags: ["@LinWan", "@LuChen"],
      propTags: ["@DivorceContract"],
      visualDescription: "Shooting past Lu Chen's tailored shoulder in soft foreground focus; sharp midground focus on Lin Wan sliding the folder across the black marble desk, looking straight into his eyes.",
      actionPrompt: "She stands up gracefully, buttoning her cream blazer.",
      dialogue: "Take a closer look at clause twenty-four before you celebrate.",
      audioCue: "Slide of leather on marble, tense rising violin tremolo",
      emotion: "Electrifying tension",
    },
    {
      framing: "Extreme Close-up",
      cameraMovement: "Rapid micro-push into his widening pupils",
      characterTags: ["@LuChen"],
      propTags: ["@DivorceContract"],
      visualDescription: "Macro focus on Lu Chen's eyes widening in horror, reflected in the embossed gold seal: 'Sole Beneficiary & Global Chairwoman'; fingers gripping the paper edges so tightly the paper creases.",
      actionPrompt: "His glass freezes mid-air, the smirk draining instantly from his face.",
      dialogue: "This seal... Impossible! That's the founder of Shengshi Group!",
      audioCue: "Low sub-bass drop, sound of rain suddenly muffled as shock hits",
      emotion: "Overwhelming shock and dread",
    },
    {
      framing: "Medium Close-up",
      cameraMovement: "Slow tilt up from her stilettos to her radiant, icy gaze",
      characterTags: ["@LinWan"],
      propTags: [],
      visualDescription: "Foreground heavy double mahogany door handle; midground Lin Wan pauses by the exit, half-turned back toward him with a breathtaking cold smile; background two elite security directors flank the doorway.",
      actionPrompt: "A subtle, breathtaking smile curves her lips as her private security team flanks the door.",
      dialogue: "From tomorrow at 9 AM, you work for me.",
      audioCue: "Double door heavy latch click, sharp dramatic crescendo",
      emotion: "Triumphant majesty",
    },
    {
      framing: "Low Angle Close-up",
      cameraMovement: "Slow pull-back revealing his solitary figure engulfed in shadows",
      characterTags: ["@LuChen"],
      propTags: [],
      visualDescription: "Low angle looking up at Lu Chen collapsed against the marble desk, phone vibrating frantically with board emergency calls; shadows engulfing the office as lightning illuminates his pale face.",
      actionPrompt: "He clutches the desk edge, breathing heavily, realizing he threw away the queen of the world.",
      dialogue: "What have I done...",
      audioCue: "Continuous phone vibration, dramatic cliffhanger chord fade out",
      emotion: "Despair and regret",
    },
    {
      framing: "Medium Shot",
      cameraMovement: "Tracking shot down the executive corridor",
      characterTags: ["@LinWan"],
      propTags: [],
      visualDescription: "Lin Wan walks down the glossy marble corridor flanked by four senior executives in dark suits bowing respectfully as she passes; floor-to-ceiling windows showcase the rainy metropolis.",
      actionPrompt: "She accepts a black encrypted tablet from her chief of staff without breaking stride.",
      dialogue: "Freeze his personal corporate accounts immediately.",
      audioCue: "Rhythmic stiletto clicks echoing on marble, urgent string cadence",
      emotion: "Unstoppable authority",
    },
    {
      framing: "Extreme Wide Establishing Shot",
      cameraMovement: "Crane down the skyscraper facade into the neon night",
      characterTags: [],
      propTags: [],
      visualDescription: "Extreme wide exterior shot of the glowing corporate skyscraper towering into the stormy night sky; the top floor executive suite remains illuminated under flashing lightning.",
      actionPrompt: "A black motorcade pulls up smoothly outside the entrance, waiting for the real chairman.",
      dialogue: undefined,
      audioCue: "Distant siren, torrential downpour, dramatic ending sting",
      emotion: "Epic climactic revelation",
    },
  ];

  const finalModernShots = Array.from({ length: shotCount }).map((_, i) => {
    const blueprint = modernShotBlueprints[i % modernShotBlueprints.length];
    return {
      shotNumber: i + 1,
      duration: 5,
      characterTags: blueprint.characterTags,
      settingTag: "@SkylinePenthouse",
      propTags: blueprint.propTags,
      framing: blueprint.framing,
      cameraMovement: blueprint.cameraMovement,
      visualDescription: blueprint.visualDescription,
      actionPrompt: blueprint.actionPrompt,
      dialogue: blueprint.dialogue,
      audioCue: blueprint.audioCue,
      emotion: blueprint.emotion,
    };
  });

  return {
    title: "Contract of the Midnight Reversal",
    logline: "After three years of concealed identity, the quiet heiress signs the divorce papers—right before the CEO discovers who actually saved his empire.",
    synopsis: "In a high-rise luxury penthouse overlooking the neon rain of Shanghai, Lin Wan signs the final release papers. As Lu Chen arrogantly smirks, his lead assistant rushes in with the shocking truth.",
    characters: [
      {
        name: "Lu Chen",
        tag: "@LuChen",
        gender: "male",
        roleDescription: "Billionaire Tech Titan, ruthlessly arrogant and sharply dressed, accustomed to controlling everything",
        visualDescription: "Striking high cheekbones, tailored charcoal Italian three-piece suit, crisp white collar, platinum watch, piercing cold dark eyes",
      },
      {
        name: "Lin Wan",
        tag: "@LinWan",
        gender: "female",
        roleDescription: "Secret majority shareholder and master strategist who endured three years under false modesty",
        visualDescription: "Stunning porcelain skin, calm resolute amber eyes, sleek minimalist cream cashmere blazer, diamond drop earrings, quiet regal posture",
      },
    ],
    locations: [
      {
        name: "Skyline CEO Penthouse Office",
        tag: "@SkylinePenthouse",
        settingDescription: "Floor-to-ceiling glass walls overlooking rain-slicked neon skyscrapers, polished black marble floor, minimalist mahogany executive desk",
        timeOfDay: "Rainy Night",
        lighting: "Moody nocturnal palette: deep cyan shadows and warm tungsten desk lamp reflections",
      },
    ],
    props: [
      {
        name: "Black Leather Contract Folder",
        tag: "@DivorceContract",
        roleDescription: "The signed agreement with a hidden gold seal that reverses ownership of the entire corporation",
      },
    ],
    shots: finalModernShots,
  };
}
