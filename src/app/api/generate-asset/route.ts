import { NextResponse } from "next/server";
import { getProject, updateProjectAtomic } from "@/storage";
import { FalaiClient } from "@/lib/vendors/falai-client";

export async function POST(req: Request) {
  try {
    const { projectId, assetId, customPrompt } = await req.json();

    if (!projectId || !assetId) {
      return NextResponse.json({ success: false, error: "projectId and assetId are required" }, { status: 400 });
    }

    const initialProject = getProject(projectId);
    if (!initialProject) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Locate asset in characters, locations, or props
    const allInitial = [...initialProject.characters, ...initialProject.locations, ...initialProject.props];
    const initialAsset = allInitial.find((a) => a.id === assetId);

    if (!initialAsset) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }

    // Mark as generating atomically
    await updateProjectAtomic(projectId, (p) => {
      const all = [...p.characters, ...p.locations, ...p.props];
      const target = all.find((a) => a.id === assetId);
      if (target) target.status = "generating";
    });

    const promptToUse = customPrompt || initialAsset.prompt;

    let imageUrl = "";
    let localPath: string | undefined;

    try {
      const result = await FalaiClient.generateImage({
        prompt: promptToUse,
        aspectRatio: initialProject.aspectRatio,
        model: "openai/gpt-image-2.5/sunburst/text-to-image",
      });
      imageUrl = result.imageUrl;
      localPath = result.localPath;
    } catch (genErr: any) {
      const errProject = await updateProjectAtomic(projectId, (p) => {
        const all = [...p.characters, ...p.locations, ...p.props];
        const target = all.find((a) => a.id === assetId);
        if (target) {
          target.status = "error";
          target.error = genErr.message;
        }
      });
      return NextResponse.json({ success: false, error: genErr.message, project: errProject }, { status: 500 });
    }

    // Save success result atomically
    let finalAsset: any = null;
    const finalProject = await updateProjectAtomic(projectId, (p) => {
      const all = [...p.characters, ...p.locations, ...p.props];
      const target = all.find((a) => a.id === assetId);
      if (target) {
        target.imageUrl = imageUrl;
        target.localPath = localPath;
        target.status = "ready";
        target.error = undefined;
        finalAsset = { ...target };
      }
    });

    return NextResponse.json({ success: true, asset: finalAsset, project: finalProject });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
