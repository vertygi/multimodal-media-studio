import { AspectRatio, GenreStyle } from "@/types";
import { getArtStyle, getStoryGenre } from "@/lib/skills/toonflow-skills-data";

export interface CharacterPromptInput {
  name: string;
  gender: "male" | "female";
  roleDescription: string;
  visualDescription?: string;
  genre: GenreStyle;
  artStyle?: string;
}

export interface LocationPromptInput {
  name: string;
  settingDescription: string;
  timeOfDay?: string;
  lighting?: string;
  genre: GenreStyle;
  artStyle?: string;
}

export interface KeyframePromptInput {
  genre: GenreStyle;
  artStyle?: string;
  framing: string;
  settingDesc: string;
  charactersDesc: string;
  actionFrozenState: string;
  lightingAmbiance: string;
  emotion: string;
  aspectRatio: AspectRatio;
}

export interface VideoMotionPromptInput {
  genre: GenreStyle;
  artStyle?: string;
  cameraMovement: string;
  characterAction: string;
  dialogue?: string;
  emotion: string;
}

export const CHINESE_DRAMA_PROMPT_ENGINE = {
  /**
   * Generates reference photo prompt for a character matching chosen visual art style
   */
  generateCharacterPrompt(input: CharacterPromptInput): string {
    const isFemale = input.gender === "female";
    const genderTag = isFemale 
      ? "stunning young East Asian woman, 22-26 years old" 
      : "handsome charismatic East Asian man, 24-28 years old";
    
    const artItem = getArtStyle(input.artStyle || "realpeople_modern_city");
    const isPeriodGenre = 
      input.genre === "ancient_palace" || 
      input.genre === "Xianxia_fantasy" || 
      input.genre === "Historical_epic" ||
      artItem.id === "realpeople_ancient_chinese";

    if (artItem.category === "2d_anime") {
      const costumeDesc = isPeriodGenre 
        ? "traditional flowing Hanfu robe with ornate embroidered hems" 
        : (input.visualDescription || "stylish modern wardrobe");

      return (
        `${genderTag}, 2D anime animation character design casting sheet, ` +
        `Primary style: ${artItem.primaryStyle}, ${artItem.textureAnchors}. ` +
        `Role: ${input.roleDescription}. Visuals: ${input.visualDescription || ""}. ` +
        `Attire: ${costumeDesc}. ` +
        `Clean neutral backdrop, expressive luminous anime eyes with crisp catchlight, elegant silhouette, ` +
        `high production value key animation art, rich aesthetic charm. ` +
        `Strictly PROHIBITED: ${artItem.prohibitedTerms}, low quality, blurry, deformed anatomy.`
      );
    }

    if (artItem.category === "3d_render") {
      const costumeDesc = isPeriodGenre 
        ? "exquisite period Hanfu robes with simulated cloth physics and metallic embroidery" 
        : (input.visualDescription || "contemporary designer urban clothing with high-end fabric textures");

      return (
        `${genderTag}, 3D character hero render portrait, ` +
        `Primary style: ${artItem.primaryStyle}, ${artItem.textureAnchors}. ` +
        `Role: ${input.roleDescription}. Visuals: ${input.visualDescription || ""}. ` +
        `Attire: ${costumeDesc}. ` +
        `High-poly 3D model, raytraced volumetric studio lighting, subsurface scattering, ambient occlusion, ` +
        `neutral studio background, 8K CG cinematic presentation. ` +
        `Strictly PROHIBITED: ${artItem.prohibitedTerms}, low-poly, pixelated, amateur.`
      );
    }

    if (artItem.category === "stylized") {
      return (
        `${genderTag}, stylized character art portrait, ` +
        `Primary style: ${artItem.primaryStyle}, ${artItem.textureAnchors}. ` +
        `Role: ${input.roleDescription}. Visuals: ${input.visualDescription || ""}. ` +
        `Distinctive artistic texture, master crafted design, clean background. ` +
        `Strictly PROHIBITED: ${artItem.prohibitedTerms}.`
      );
    }

    // Default: Live-Action Photorealistic Cinematography
    if (isPeriodGenre) {
      return (
        `${genderTag}, photorealistic ancient Chinese costume drama lead actor casting portrait, ` +
        `real live-action cinematography, authentic Chinese film shoot, 35mm film texture, ` +
        `exquisite delicate facial features, natural skin tone (#F5EDE8 fair skin), visible real skin pores and micro-texture, non-silicone skin, ` +
        `expressive captivating eyes with sharp pupil catchlight, subtle emotional gaze, ` +
        `${input.roleDescription}. ${input.visualDescription || ""}, ` +
        `traditional elegant silk Hanfu attire, subtle pearlescent gold embroidery details, natural fabric draping and gentle folds, ` +
        `authentic period hairstyle with discreet ornate hairpin, soft atmospheric backlight, ` +
        `cinematic warm amber and moon white lighting balance, neutral studio grey backdrop, ` +
        `cinematic documentary realism, ultra high definition, ARRI Alexa cinema color science, non-CGI, not 3D render, not anime, not cartoon`
      );
    }

    return (
      `${genderTag}, contemporary urban drama lead actor casting portrait, ` +
      `real film photography, theatrical live-action feature film quality, 35mm full-frame film texture, ` +
      `exceptionally handsome/beautiful facial archetype, refined jawline, natural skin sheen, visible authentic human skin pores and grain, non-airbrushed, ` +
      `captivating gaze, unadorned barefaced or clean minimalist no-makeup grooming, ` +
      `${input.roleDescription}. ${input.visualDescription || ""}, ` +
      `authentic character costume reflecting role: ${input.visualDescription || "contemporary modern wardrobe"}, ` +
      `authentic textile weave and subtle fabric creases, ` +
      `studio softbox lighting with dual bilateral bounce fill, soft highlight roll-off, ` +
      `seamless neutral studio grey paper backdrop #B0B0B0, ` +
      `ARRI Alexa cinema color science, natural skin tone reproduction, crisp focus on eyes, shallow depth of field, ` +
      `live-action photography, not 3D, not CGI, not rendered, not anime, not traditional costume`
    );
  },

  /**
   * Generates reference photo prompt for a scene / location matching art style
   */
  generateLocationPrompt(input: LocationPromptInput): string {
    const artItem = getArtStyle(input.artStyle || "realpeople_modern_city");
    const isPeriodGenre = 
      input.genre === "ancient_palace" || 
      input.genre === "Xianxia_fantasy" || 
      input.genre === "Historical_epic" ||
      artItem.id === "realpeople_ancient_chinese";

    if (artItem.category === "2d_anime") {
      return (
        `Master background art concept, 2D animation layout, ${artItem.primaryStyle}. ` +
        `Setting: ${input.name}. ${input.settingDescription}. ` +
        `Atmosphere: ${input.timeOfDay || "night"}, ${input.lighting || "atmospheric anime lighting"}. ` +
        `Visual textures: ${artItem.textureAnchors}. ` +
        `Composition: 3-layer spatial perspective with crisp foreground architecture, midground focal area, atmospheric background haze. ` +
        `Painterly animation background, rich color palette, completely empty scene, zero people, no characters, zero human figures. ` +
        `Strictly PROHIBITED: ${artItem.prohibitedTerms}.`
      );
    }

    if (artItem.category === "3d_render") {
      return (
        `Master hero environment 3D concept shot, ${artItem.primaryStyle}. ` +
        `Setting: ${input.name}. ${input.settingDescription}. ` +
        `Atmosphere: ${input.timeOfDay || "night"}, ${input.lighting || "volumetric raytraced illumination"}. ` +
        `Textures & Materials: ${artItem.textureAnchors}. PBR physical material properties. ` +
        `Composition: 3-layer depth with architectural framing, depth of field blur, ambient occlusion. ` +
        `Uncluttered environment, completely empty scene, zero people, zero characters, no human figures. ` +
        `Strictly PROHIBITED: ${artItem.prohibitedTerms}.`
      );
    }

    if (artItem.category === "stylized") {
      return (
        `Master environment concept shot, stylized illustration, ${artItem.primaryStyle}. ` +
        `Setting: ${input.name}. ${input.settingDescription}. ` +
        `Textures: ${artItem.textureAnchors}. Empty scene, no people. ` +
        `Strictly PROHIBITED: ${artItem.prohibitedTerms}.`
      );
    }

    // Live-action photography
    if (isPeriodGenre) {
      return (
        `Master hero environment concept shot, real photography, live-action historical Chinese drama cinematography. ` +
        `Setting: ${input.name}. ${input.settingDescription}. ` +
        `Atmosphere: ${input.timeOfDay || "midnight"}, ${input.lighting || "cool moonlight balanced by soft amber lantern glow"}. ` +
        `Composition: Clean spacious elegance, balanced three-layer depth perspective (crisp foreground architecture, midground courtyard pavilion, atmospheric background haze). ` +
        `Tactile materials: authentic aged timber structure, weathered stone balustrade, blue-grey roof tiles with subtle antique patina. ` +
        `Natural diffuse lighting, volumetric fog, ARRI Alexa cinema color science, subtle cinematic texture, shallow depth of field. ` +
        `Uncluttered minimalist period architecture, completely empty scene, zero people, zero characters, no human figures, non-CGI, not 3D render.`
      );
    }

    return (
      `Master hero environment concept shot, real photography, contemporary cinematic feature film quality. ` +
      `Setting: ${input.name}. ${input.settingDescription}. ` +
      `Atmosphere: ${input.timeOfDay || "night"}, ${input.lighting || "atmospheric practical lighting"}. ` +
      `Composition: Balanced three-layer depth, clean architectural geometry with spacious breathing room. ` +
      `Tactile materials: authentic textures (polished dark marble, reflective glass, architectural concrete), natural wear. ` +
      `ARRI Alexa cinema color science, subtle depth of field, motivated practical lighting, subtle cinematic texture. ` +
      `Uncluttered scene, completely empty, zero people, zero characters, no human figures, non-CGI, not 3D render.`
    );
  },

  /**
   * Generates First-Frame Keyframe prompt for GPT Image 2.5 Sunburst
   * Follows ToonFlow three-part framework 【Visual】 + 【Lighting】 + 【Style】
   */
  generateKeyframePrompt(input: KeyframePromptInput): string {
    const artItem = getArtStyle(input.artStyle || "realpeople_modern_city");
    const isPeriodGenre = 
      input.genre === "ancient_palace" || 
      input.genre === "Xianxia_fantasy" || 
      input.genre === "Historical_epic" ||
      artItem.id === "realpeople_ancient_chinese";

    const costumeConstraint = isPeriodGenre
      ? "Characters wear authentic historical Hanfu robes."
      : "Characters wear modern contemporary urban clothes as defined in character description. Strictly NO ancient Hanfu, NO period costume.";

    return (
      `Cinematic shot, ${input.framing}.\n` +
      `【Visual】 Core physical blocking: ${input.actionFrozenState}.\n` +
      `Camera staging & 3-layer spatial depth: dynamic three-quarters (3/4) angle or over-the-shoulder (OTS) composition, ` +
      `foreground depth element in soft focus, sharp subject in midground, atmospheric background with bokeh. ` +
      `Characters' eyelines are locked intensely on each other or focused candidly off-axis on props/environment; strictly NEVER staring into the camera lens. Raw unposed narrative realism.\n` +
      `Characters present: ${input.charactersDesc}. ${costumeConstraint}\n` +
      `Setting: ${input.settingDesc}.\n` +
      `Emotion: ${input.emotion}.\n` +
      `【Lighting】 Motivated lighting, ${input.lightingAmbiance}, natural shadow roll-off.\n` +
      `【Style】 ${artItem.primaryStyle}. ${artItem.textureAnchors}. ${artItem.emotionalKeynote}. ` +
      `Strictly NO: ${artItem.prohibitedTerms}, no front-facing passport portraits, no looking at camera, no subtitles, no watermark, no UI text.`
    );
  },

  /**
   * Generates Motion prompt for MiniMax H3 Max / H3 Max Turbo (I2V)
   */
  generateVideoMotionPrompt(input: VideoMotionPromptInput): string {
    const artItem = getArtStyle(input.artStyle || "realpeople_modern_city");
    const dialogueSnippet = input.dialogue ? ` Subtle mouth movement, speaking with emotion: "${input.dialogue}".` : "";

    let mediumTexture = "Live-action cinema, 24fps film look, natural organic micro-movement, handheld camera breathing.";
    if (artItem.category === "2d_anime") {
      mediumTexture = "Fluid 2D keyframe animation motion, dynamic anime camera pan, subtle hair and cloth sway.";
    } else if (artItem.category === "3d_render") {
      mediumTexture = "High-end 3D cinematic camera glide, smooth physics simulation, volumetric lighting rays.";
    } else if (artItem.category === "stylized") {
      mediumTexture = "Stylized animation cadence, distinctive aesthetic motion.";
    }

    return (
      `Camera movement: ${input.cameraMovement}. ` +
      `Subject motion: ${input.characterAction}.${dialogueSnippet} ` +
      `Emotional state: ${input.emotion}. ` +
      `Micro-movements: natural eye blinks, gentle breathing, subtle fabric movement in soft air currents. ` +
      `${mediumTexture} ` +
      `Maintains visual style continuity with opening frame.`
    );
  }
};
