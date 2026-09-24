import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/storage";
import { adaptStoryToScriptAndAssets } from "@/lib/vendors/omniroute-client";
import { CHINESE_DRAMA_PROMPT_ENGINE } from "@/lib/skills/chinese-drama-prompts";
import { Asset, StoryboardShot } from "@/types";

export async function POST(req: Request) {
  try {
    const { projectId, rawStory, targetShotCount, genre, artStyle } = await req.json();

    if (!projectId) {
      return NextResponse.json({ success: false, error: "projectId обязателен" }, { status: 400 });
    }

    const cleanStory = (rawStory || "").trim();
    if (!cleanStory) {
      return NextResponse.json(
        { success: false, error: "Пожалуйста, введите текст вашего сюжета для адаптации." },
        { status: 400 }
      );
    }

    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: "Проект не найден" }, { status: 404 });
    }

    const activeGenre = genre || project.genre || "Urban_workplace_drama";
    const activeArtStyle = artStyle || project.artStyle || "realpeople_modern_city";
    const shotCount = targetShotCount || 8;

    // Call adaptation engine with artStyle and genre
    const adapted = await adaptStoryToScriptAndAssets(
      cleanStory,
      activeGenre,
      shotCount,
      project.aspectRatio,
      activeArtStyle
    );

    // Build characters with Toonflow prompt rules
    const characters: Asset[] = adapted.characters.map((c: any, idx: number) => {
      const prompt = CHINESE_DRAMA_PROMPT_ENGINE.generateCharacterPrompt({
        name: c.name,
        gender: c.gender || (idx % 2 === 0 ? "male" : "female"),
        roleDescription: c.roleDescription,
        visualDescription: c.visualDescription,
        genre: activeGenre,
        artStyle: activeArtStyle,
      });

      return {
        id: `char_${Date.now()}_${idx}`,
        projectId: project.id,
        name: c.name,
        tag: c.tag.startsWith("@") ? c.tag : `@${c.tag}`,
        type: "character",
        gender: c.gender,
        roleDescription: c.roleDescription,
        visualDescription: c.visualDescription,
        prompt,
        status: "idle",
        createdAt: Date.now(),
      };
    });

    // Build locations with Toonflow prompt rules
    const locations: Asset[] = adapted.locations.map((l: any, idx: number) => {
      const prompt = CHINESE_DRAMA_PROMPT_ENGINE.generateLocationPrompt({
        name: l.name,
        settingDescription: l.settingDescription,
        timeOfDay: l.timeOfDay,
        lighting: l.lighting,
        genre: activeGenre,
        artStyle: activeArtStyle,
      });

      return {
        id: `loc_${Date.now()}_${idx}`,
        projectId: project.id,
        name: l.name,
        tag: l.tag.startsWith("@") ? l.tag : `@${l.tag}`,
        type: "location",
        roleDescription: l.settingDescription,
        visualDescription: `${l.timeOfDay}, ${l.lighting}`,
        prompt,
        status: "idle",
        createdAt: Date.now(),
      };
    });

    // Build props
    const props: Asset[] = adapted.props.map((p: any, idx: number) => ({
      id: `prop_${Date.now()}_${idx}`,
      projectId: project.id,
      name: p.name,
      tag: p.tag.startsWith("@") ? p.tag : `@${p.tag}`,
      type: "prop",
      roleDescription: p.roleDescription,
      visualDescription: p.roleDescription,
      prompt: `Cinematic close-up of ${p.name}: ${p.roleDescription}, theatrical lighting, shallow depth of field`,
      status: "idle",
      createdAt: Date.now(),
    }));

    // Build shots with First-Frame & Motion prompts
    const shots: StoryboardShot[] = adapted.shots.map((s: any, idx: number) => {
      const matchedSetting = locations.find((l) => l.tag === s.settingTag) || locations[0];
      const matchedCharacters = characters.filter((c) => s.characterTags.includes(c.tag));

      const settingDesc = matchedSetting ? `${matchedSetting.name} (${matchedSetting.roleDescription})` : s.settingTag;
      const charactersDesc = matchedCharacters.length > 0
        ? matchedCharacters.map((c) => `${c.name} (${c.roleDescription})`).join(", ")
        : s.characterTags.join(", ");

      const keyframePrompt = CHINESE_DRAMA_PROMPT_ENGINE.generateKeyframePrompt({
        genre: activeGenre,
        artStyle: activeArtStyle,
        framing: s.framing,
        settingDesc,
        charactersDesc,
        actionFrozenState: s.visualDescription || s.actionPrompt,
        lightingAmbiance: matchedSetting?.visualDescription || "cinematic contrast lighting",
        emotion: s.emotion || "intense dramatic confrontation",
        aspectRatio: project.aspectRatio,
      });

      const motionPrompt = CHINESE_DRAMA_PROMPT_ENGINE.generateVideoMotionPrompt({
        genre: activeGenre,
        artStyle: activeArtStyle,
        cameraMovement: s.cameraMovement,
        characterAction: s.actionPrompt,
        dialogue: s.dialogue,
        emotion: s.emotion,
      });

      return {
        id: `shot_${Date.now()}_${idx}`,
        projectId: project.id,
        shotNumber: s.shotNumber || idx + 1,
        duration: s.duration || 5,
        characterTags: s.characterTags,
        settingTag: s.settingTag,
        propTags: s.propTags || [],
        framing: s.framing,
        cameraMovement: s.cameraMovement,
        visualDescription: s.visualDescription,
        motionPrompt,
        dialogue: s.dialogue,
        audioCue: s.audioCue,
        keyframePrompt,
        status: "draft",
        createdAt: Date.now(),
      };
    });

    // Update and persist project
    project.rawStory = cleanStory;
    project.genre = activeGenre;
    project.artStyle = activeArtStyle;
    project.scriptTitle = adapted.title;
    project.scriptLogline = adapted.logline;
    project.scriptSynopsis = adapted.synopsis;
    project.characters = characters;
    project.locations = locations;
    project.props = props;
    project.shots = shots;

    saveProject(project);

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    console.error("Script generation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
