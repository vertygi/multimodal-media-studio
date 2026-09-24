import { NextResponse } from "next/server";
import { listProjects, saveProject, getProject } from "@/storage";
import { Project, AspectRatio, GenreStyle } from "@/types";

export async function GET() {
  try {
    const list = listProjects();
    return NextResponse.json({ success: true, projects: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, aspectRatio, genre } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Project name is required" }, { status: 400 });
    }

    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newProject: Project = {
      id,
      name,
      description: description || "",
      aspectRatio: (aspectRatio as AspectRatio) || "9:16",
      genre: (genre as GenreStyle) || "modern_urban",
      rawStory: "",
      characters: [],
      locations: [],
      props: [],
      shots: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveProject(newProject);
    return NextResponse.json({ success: true, project: newProject });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
