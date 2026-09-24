import { CustomModelConfig, CustomVendor, AspectRatio } from "@/types";
import { getSettings } from "@/storage";

export class CustomVendorRunner {
  public static async executeImageGeneration(
    modelId: string,
    prompt: string,
    aspectRatio: AspectRatio,
    referenceImageUrls?: string[]
  ): Promise<{ imageUrl: string }> {
    const settings = getSettings();
    let targetModel: CustomModelConfig | undefined;

    for (const vendor of settings.customVendors) {
      const found = vendor.models.find((m) => m.id === modelId);
      if (found) {
        targetModel = found;
        break;
      }
    }

    if (!targetModel) {
      throw new Error(`Custom model ${modelId} not found in configured vendors.`);
    }

    if (targetModel.requestFormat === "fal_queue") {
      // Extract model name from endpoint or full URL
      const modelName = targetModel.endpoint.replace("https://queue.fal.run/", "");
      const { FalaiClient } = await import("./falai-client");
      return FalaiClient.generateImage({
        prompt,
        model: modelName,
        referenceImageUrls,
        aspectRatio,
      });
    }

    // Generic REST POST
    const headers = {
      "Content-Type": "application/json",
      ...(targetModel.headers || {}),
    };

    const body = {
      prompt,
      aspect_ratio: aspectRatio,
      reference_images: referenceImageUrls || [],
      ...(targetModel.defaultBodyParams || {}),
    };

    const res = await fetch(targetModel.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Custom endpoint error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    const imageUrl = data.image_url || data.imageUrl || data.url || data.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error(`Could not find image URL in response: ${JSON.stringify(data)}`);
    }

    return { imageUrl };
  }
}
