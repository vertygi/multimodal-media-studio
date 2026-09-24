import { NextResponse } from "next/server";
import { getSettings } from "@/storage";
import { FalaiClient } from "@/lib/vendors/falai-client";

export async function POST(req: Request) {
  try {
    const { userPrompt, referenceNames, genre, framing } = await req.json();

    if (!userPrompt || !userPrompt.trim()) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const settings = getSettings();
    const apiKey = settings.omniroute?.apiKey || process.env.OMNIROUTE_API_KEY;
    const baseUrl = (settings.omniroute?.baseUrl || "https://api.omniroute.ai/v1").replace(/\/$/, "");
    const model = settings.omniroute?.model || "gpt-4o";

    const isAncient = genre === "ancient_palace";
    const genreInstruction = isAncient
      ? "Genre is Ancient Costume Chinese Drama (Hanfu, palace, ancient pavilion, historical elegance)."
      : "Genre is Modern Urban Drama / Melodrama. STRICTLY FORBID ancient Hanfu robes, ancient hairdos, period costumes, or traditional tea house settings. Characters must wear contemporary clothes (jackets, blazers, modern clothes).";

    const referencesContext = (referenceNames && referenceNames.length > 0)
      ? `The scene features these visual references: ${referenceNames.join(", ")}. Ensure they appear with their exact visual features.`
      : "";

    if (apiKey) {
      const systemPrompt = `You are a world-class cinematic prompt director for AI filmmaking.
The user provides a scene idea in Russian or English.
Your task: turn it into an ultra-high-fidelity cinematic prompt for diffusion image generation.

Rules:
1. ${genreInstruction}
2. ${referencesContext}
3. Framing: ${framing || "Cinematic Medium or Close-up shot"}.
4. STRICT SAFETY RULE: NEVER use words like "severed", "severing", "cleaver", "chopping", "cut off", "blood", "bloody", "butcher", "mutilation", "gore", "brutal", "chains". OpenAI content filter bans them immediately! Instead, translate violent physical actions into powerful cinematic dramatic tension: "an antique heavy steel blade placed firmly on the scarred table", "slender hand magically crystallizing into solid 24k gold with brilliant golden luminescence", "intense emotional shock and fierce defiance", "dim artisan cellar workshop".
5. CINEMATIC CAMERA BLOCKING & DEPTH (PREVENT FLAT AMATEUR LOOK):
   - Never stage flat frontal 2D poses. Use professional film blocking: dynamic 3/4 profile, over-the-shoulder (OTS) framing, or low-angle dramatic view.
   - Multi-layered depth: incorporate subtle out-of-focus foreground elements (dirty foreground, blurred shoulder, doorway frame, wet glass, table clutter), sharp subject in midground, deep background with bokeh.
   - EYELINES: Characters MUST NEVER look into the camera lens! Their gaze is locked onto each other with intense emotional tension, or candidly directed off-axis toward props/hands. Unposed live-action narrative realism.
   - NEGATIVE ANCHORS: Include: "candid feature film still, strictly no front-facing passport portrait, no looking into camera, no posing for camera, no flat 2D cardboard staging".
6. CRITICAL WORD ORDER RULE: Start the prompt IMMEDIATELY with the camera setup, foreground element, and physical body blocking/interaction (in the first 25 words), then describe emotional expression and background. Never bury camera blocking at the end!
7. Include camera optics: 35mm / 50mm lens, ARRI Alexa cinema color science, authentic skin texture and pores (non-airbrushed, non-CGI), practical atmospheric lighting.
8. Output ONLY the final English prompt text without explanations or quotation marks.`;

      try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const enhanced = data.choices?.[0]?.message?.content?.trim();
          if (enhanced) {
            const clean = FalaiClient.sanitizePrompt(enhanced);
            return NextResponse.json({ success: true, enhancedPrompt: clean });
          }
        }
      } catch (llmErr) {
        console.warn("LLM prompt enhancement failed, using local enhancer:", llmErr);
      }
    }

    // Local smart enhancer fallback
    const sanitizedInput = FalaiClient.sanitizePrompt(userPrompt);
    const stylePrefix = isAncient
      ? "Live-action ancient Chinese costume drama 35mm feature film still"
      : "Contemporary Chinese urban drama 35mm live-action feature film still, strictly modern urban setting";

    const negativeAnchor = isAncient
      ? "authentic historical period costume"
      : "strictly modern contemporary clothing, no ancient Hanfu robes, no period dress, no traditional lanterns";

    const enhancedPrompt = (
      `Cinematic ${framing || "feature film"} 35mm live-action still, ${stylePrefix}. ` +
      `Visual blocking: ${sanitizedInput}. ` +
      `Camera staging & 3-layer depth: dynamic three-quarters (3/4) angle or over-the-shoulder (OTS) composition, ` +
      `layered foreground depth (blurred elements in close foreground, sharp focused subject in midground, deep atmospheric background bokeh). ` +
      `Characters' eyelines locked intensely on each other or off-axis, strictly NEVER looking into the camera lens. Raw unposed narrative realism. ` +
      `Atmosphere: intense dramatic tension, motivated practical lighting with deep chiaroscuro shadows, ` +
      `ARRI Alexa cinema color science, real skin texture with visible pores, shallow depth of field, 35mm film grain, ` +
      `theatrical feature film cinematography, non-CGI, not 3D render, not cartoon. ` +
      `Strictly no front-facing passport portrait, no looking at camera, no posing for camera, no flat 2D cardboard staging. ${negativeAnchor}`
    );

    return NextResponse.json({ success: true, enhancedPrompt });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
