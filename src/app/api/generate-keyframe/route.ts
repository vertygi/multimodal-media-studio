import { NextResponse } from "next/server";
import { getProject, updateProjectAtomic } from "@/storage";
import { FalaiClient } from "@/lib/vendors/falai-client";

export async function POST(req: Request) {
  try {
    const { 
      projectId, 
      shotId, 
      customPrompt, 
      referenceUrls: incomingReferenceUrls,
      aspectRatio: incomingAspectRatio,
      model: incomingModel,
      usePreviousShotReference,
    } = await req.json();

    if (!projectId) {
      return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
    }

    const initialProject = getProject(projectId);
    if (!initialProject) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const shot = initialProject.shots.find((s) => s.id === shotId);

    // Resolve reference images: either explicitly passed from Workbench or from shot tags
    const referenceUrls: string[] = [];
    const referenceDirectives: string[] = [];

    if (incomingReferenceUrls && Array.isArray(incomingReferenceUrls) && incomingReferenceUrls.length > 0) {
      incomingReferenceUrls.forEach((url: string, idx: number) => {
        referenceUrls.push(url);
        const imageNum = idx + 1;

        // Check if this reference is another shot's keyframe in the project (проходной референс)
        const matchedShot = initialProject.shots.find((s) => s.keyframeUrl === url);
        const matchedChar = initialProject.characters.find((c) => c.imageUrl === url);
        const matchedLoc = initialProject.locations.find((l) => l.imageUrl === url);
        const matchedProp = initialProject.props.find((p) => p.imageUrl === url);

        if (matchedShot) {
          referenceDirectives.push(
            `[Reference Image ${imageNum} is established scene keyframe (Scene #${matchedShot.shotNumber} - ${matchedShot.framing})]: ` +
            `Strictly preserve characters' established facial likeness, hair styling, costume details, and ambient lighting continuity from Reference Image ${imageNum}. ` +
            `Dynamically shift camera angle and framing to: ${shot?.framing || "new camera perspective"} as defined in the visual blocking.`
          );
        } else if (matchedChar) {
          referenceDirectives.push(
            `[Reference Image ${imageNum} is character ${matchedChar.name} (${matchedChar.tag})]: ` +
            `Strictly maintain this character's exact facial likeness, eye shape, hairstyle, skin details (${matchedChar.visualDescription || ""}), ` +
            `and clothing from Reference Image ${imageNum}. Keep character identity 100% faithful to Image ${imageNum}.`
          );
        } else if (matchedLoc) {
          referenceDirectives.push(
            `[Reference Image ${imageNum} is the location setting (${matchedLoc.name})]: ` +
            `The shot takes place strictly inside the setting from Reference Image ${imageNum} (${matchedLoc.roleDescription}). ` +
            `Replicate the exact architecture, wall materials, lighting ambiance, and atmosphere shown in Image ${imageNum}.`
          );
        } else if (matchedProp) {
          referenceDirectives.push(
            `[Reference Image ${imageNum} is key prop (${matchedProp.name})]: ` +
            `Include the exact prop object shown in Reference Image ${imageNum}.`
          );
        } else {
          referenceDirectives.push(
            `[Reference Image ${imageNum}]: Strictly preserve facial features, likeness, setting geometry, and attire from Reference Image ${imageNum}.`
          );
        }
      });
    } else if (shot) {
      // Optional continuity chaining: use previous shot's keyframe as reference if requested or available
      if (usePreviousShotReference && shot.shotNumber > 1) {
        const prevShot = initialProject.shots.find((s) => s.shotNumber === shot.shotNumber - 1);
        if (prevShot?.keyframeUrl) {
          referenceUrls.push(prevShot.keyframeUrl);
          const idx = referenceUrls.length;
          referenceDirectives.push(
            `[Reference Image ${idx} is previous shot keyframe (Scene #${prevShot.shotNumber} - ${prevShot.framing})]: ` +
            `Strictly preserve characters' established faces, clothing, hairstyle, physical continuity, and environmental lighting from Reference Image ${idx}. ` +
            `Dynamically shift camera perspective and framing to: ${shot.framing} as described in the physical blocking.`
          );
        }
      }

      // Add character reference images
      shot.characterTags.forEach((tag) => {
        const char = initialProject.characters.find((c) => c.tag.toLowerCase() === tag.toLowerCase());
        if (char?.imageUrl && !referenceUrls.includes(char.imageUrl)) {
          referenceUrls.push(char.imageUrl);
          const idx = referenceUrls.length;
          referenceDirectives.push(
            `[Reference Image ${idx} is character ${char.name} (${char.tag})]: ` +
            `Strictly maintain this character's exact facial likeness, eye shape, hairstyle, skin details (${char.visualDescription || ""}), ` +
            `and clothing from Reference Image ${idx}. Keep character identity 100% faithful to Image ${idx}.`
          );
        }
      });

      // Add setting reference image
      if (shot.settingTag) {
        const loc = initialProject.locations.find((l) => l.tag.toLowerCase() === shot.settingTag.toLowerCase());
        if (loc?.imageUrl && !referenceUrls.includes(loc.imageUrl)) {
          referenceUrls.push(loc.imageUrl);
          const idx = referenceUrls.length;
          referenceDirectives.push(
            `[Reference Image ${idx} is the location setting (${loc.name})]: ` +
            `The shot takes place strictly inside the setting from Reference Image ${idx} (${loc.roleDescription}). ` +
            `Replicate the exact architecture, materials, lighting ambiance, and atmosphere shown in Image ${idx}.`
          );
        }
      }

      // Add prop reference image if any
      (shot.propTags || []).forEach((tag) => {
        const prop = initialProject.props.find((p) => p.tag.toLowerCase() === tag.toLowerCase());
        if (prop?.imageUrl && !referenceUrls.includes(prop.imageUrl)) {
          referenceUrls.push(prop.imageUrl);
          const idx = referenceUrls.length;
          referenceDirectives.push(
            `[Reference Image ${idx} is key prop (${prop.name})]: ` +
            `Include the exact prop object shown in Reference Image ${idx}.`
          );
        }
      });
    }

    if (shot) {
      await updateProjectAtomic(projectId, (p) => {
        const target = p.shots.find((s) => s.id === shotId);
        if (target) target.status = "generating_keyframe";
      });
    }

    let basePrompt = customPrompt || shot?.keyframePrompt || "Cinematic Chinese Drama dramatic frame";
    basePrompt = FalaiClient.sanitizePrompt(basePrompt);

    const cameraBlockingAnchor = (
      `Cinematic Staging & Depth: Dynamic three-quarters (3/4) angle or over-the-shoulder (OTS) composition, ` +
      `multi-layered spatial depth with subtle out-of-focus foreground elements. ` +
      `Characters locked in raw narrative interaction, eyelines focused on each other or candidly off-axis; ` +
      `strictly NEVER staring directly into the camera lens. Unposed feature film realism. ` +
      `Strictly NO front-facing passport portraits, NO looking at camera, NO amateur photoshoot posing, NO flat 2D cardboard staging.`
    );

    let finalPrompt = `${basePrompt}\n\n${cameraBlockingAnchor}`;
    if (referenceDirectives.length > 0) {
      const isAncient = initialProject.genre === "ancient_palace";
      const negativeWardrobe = isAncient
        ? "Strictly NO modern clothing."
        : "Strictly NO ancient Hanfu, NO period robes, NO traditional Chinese silk gowns, NO lanterns or tea house setting if in modern/slum.";

      finalPrompt = (
        `Cinematic Shot Composition & Physical Blocking:\n${basePrompt}\n\n` +
        `${cameraBlockingAnchor}\n\n` +
        `Character & Setting Continuity Directives:\n${referenceDirectives.join("\n")}\n\n` +
        `Style Anchors: Real live-action cinematography, ARRI Alexa color science. ` +
        `Characters preserve their exact facial features and wardrobe from their reference images. ` +
        `${negativeWardrobe}`
      );
    }

    const targetAspectRatio = incomingAspectRatio || initialProject.aspectRatio || "9:16";
    const selectedModel = incomingModel || (referenceUrls.length > 0
      ? "openai/gpt-image-2.5/sunburst/edit"
      : "openai/gpt-image-2.5/sunburst/text-to-image");

    let generatedImageUrl = "";
    let generatedLocalPath: string | undefined;

    try {
      const { imageUrl, localPath } = await FalaiClient.generateImage({
        prompt: finalPrompt,
        aspectRatio: targetAspectRatio,
        referenceImageUrls: referenceUrls,
        model: selectedModel,
      });

      generatedImageUrl = imageUrl;
      generatedLocalPath = localPath;
    } catch (genErr: any) {
      console.error(`[generate-keyframe] Generation error:`, genErr);
      const errProject = await updateProjectAtomic(projectId, (p) => {
        if (shotId) {
          const s = p.shots.find((target) => target.id === shotId);
          if (s) {
            s.status = "error";
            s.error = genErr.message;
          }
        }
      });
      return NextResponse.json({ 
        success: false, 
        error: genErr.message, 
        project: errProject 
      }, { status: 500 });
    }

    // Atomically save keyframe to shot and savedKeyframes library
    let finalShot: any = null;
    const finalProject = await updateProjectAtomic(projectId, (p) => {
      if (shotId) {
        const s = p.shots.find((target) => target.id === shotId);
        if (s) {
          s.keyframeUrl = generatedImageUrl;
          s.keyframeLocalPath = generatedLocalPath;
          s.status = "keyframe_ready";
          s.error = undefined;
          finalShot = { ...s };
        }
      }

      if (!p.savedKeyframes) {
        p.savedKeyframes = [];
      }
      p.savedKeyframes.unshift({
        id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        projectId: p.id,
        imageUrl: generatedImageUrl,
        localPath: generatedLocalPath,
        prompt: basePrompt,
        referenceUrls,
        assignedShotNumber: shot?.shotNumber,
        createdAt: Date.now(),
      });
    });

    return NextResponse.json({ 
      success: true, 
      shot: finalShot || shot, 
      keyframeUrl: generatedImageUrl, 
      localPath: generatedLocalPath,
      project: finalProject 
    });
  } catch (err: any) {
    console.error("[generate-keyframe] Global route error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
