import { NextResponse } from "next/server";
import { getCustomSkills, saveCustomSkills } from "@/storage";
import { 
  TOONFLOW_STORY_GENRES, 
  TOONFLOW_ART_STYLES,
  StoryGenreItem,
  ArtStyleItem 
} from "@/lib/skills/toonflow-skills-data";

export async function GET() {
  try {
    const custom = getCustomSkills();
    return NextResponse.json({
      success: true,
      storyGenres: [...TOONFLOW_STORY_GENRES, ...(custom.customGenres || [])],
      artStyles: [...TOONFLOW_ART_STYLES, ...(custom.customArtStyles || [])],
      customGenres: custom.customGenres || [],
      customArtStyles: custom.customArtStyles || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, item } = body; // type: "genre" | "artStyle"

    if (!type || !item || !item.name) {
      return NextResponse.json({ success: false, error: "Тип и данные обязательны" }, { status: 400 });
    }

    const current = getCustomSkills();
    const id = item.id || `custom_${Date.now()}`;

    if (type === "genre") {
      const newGenre: StoryGenreItem = {
        id,
        name: item.name,
        nameEn: item.nameEn || item.name,
        tagline: item.tagline || "Пользовательский сюжетный жанр",
        description: item.description || "",
        narrativePhilosophy: item.narrativePhilosophy || [item.description || "Индивидуальный авторский стиль."],
        isCustom: true,
      };

      const updated = current.customGenres.filter((g: any) => g.id !== id);
      updated.push(newGenre);
      current.customGenres = updated;
      saveCustomSkills(current);

      return NextResponse.json({ success: true, item: newGenre });
    } else if (type === "artStyle") {
      const newStyle: ArtStyleItem = {
        id,
        name: item.name,
        nameEn: item.nameEn || item.name,
        category: item.category || "stylized",
        categoryLabel: item.categoryLabel || "Свой стиль",
        primaryStyle: item.primaryStyle || `${item.name} visual style`,
        textureAnchors: item.textureAnchors || "High detail, cinematic lighting, artistic composition",
        emotionalKeynote: item.emotionalKeynote || "Atmospheric",
        prohibitedTerms: item.prohibitedTerms || "low quality, blur, watermark, distorted",
        isCustom: true,
      };

      const updated = current.customArtStyles.filter((s: any) => s.id !== id);
      updated.push(newStyle);
      current.customArtStyles = updated;
      saveCustomSkills(current);

      return NextResponse.json({ success: true, item: newStyle });
    }

    return NextResponse.json({ success: false, error: "Неверный тип навыка" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ success: false, error: "type и id обязательны" }, { status: 400 });
    }

    const current = getCustomSkills();
    if (type === "genre") {
      current.customGenres = current.customGenres.filter((g: any) => g.id !== id);
      saveCustomSkills(current);
    } else if (type === "artStyle") {
      current.customArtStyles = current.customArtStyles.filter((s: any) => s.id !== id);
      saveCustomSkills(current);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
