import { NextResponse } from "next/server";
import { getProject, updateProjectAtomic } from "@/storage";
import { FalaiClient } from "@/lib/vendors/falai-client";

export async function POST(req: Request) {
  try {
    const { projectId, shotId, customPrompt, model } = await req.json();

    if (!projectId || !shotId) {
      return NextResponse.json({ success: false, error: "projectId and shotId are required" }, { status: 400 });
    }

    const initialProject = getProject(projectId);
    if (!initialProject) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const initialShot = initialProject.shots.find((s) => s.id === shotId);
    if (!initialShot) {
      return NextResponse.json({ success: false, error: "Shot not found" }, { status: 404 });
    }

    if (!initialShot.keyframeUrl) {
      return NextResponse.json(
        { success: false, error: "Keyframe must be generated before rendering video." },
        { status: 400 }
      );
    }

    await updateProjectAtomic(projectId, (p) => {
      const s = p.shots.find((target) => target.id === shotId);
      if (s) s.status = "generating_video";
    });

    const promptToUse = customPrompt || initialShot.motionPrompt;

    let videoUrl = "";
    let localPath: string | undefined;

    try {
      const result = await FalaiClient.generateVideo({
        prompt: promptToUse,
        imageUrl: initialShot.keyframeUrl,
        duration: initialShot.duration || 5,
        aspectRatio: initialProject.aspectRatio,
        model: model || "minimax/h3-max-turbo/image-to-video",
      });
      videoUrl = result.videoUrl;
      localPath = result.localPath;
    } catch (genErr: any) {
      const errProject = await updateProjectAtomic(projectId, (p) => {
        const s = p.shots.find((target) => target.id === shotId);
        if (s) {
          s.status = "error";
          s.error = genErr.message;
        }
      });
      return NextResponse.json({ success: false, error: genErr.message, project: errProject }, { status: 500 });
    }

    let finalShot: any = null;
    const finalProject = await updateProjectAtomic(projectId, (p) => {
      const s = p.shots.find((target) => target.id === shotId);
      if (s) {
        s.videoUrl = videoUrl;
        s.videoLocalPath = localPath;
        s.status = "video_ready";
        s.error = undefined;
        finalShot = { ...s };
      }
    });

    return NextResponse.json({ success: true, shot: finalShot || initialShot, project: finalProject });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
