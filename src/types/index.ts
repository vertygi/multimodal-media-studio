export type AspectRatio = "9:16" | "16:9";

export type GenreStyle = 
  | "modern_urban"
  | "ancient_palace"
  | "suspense_thriller"
  | "Urban_workplace_drama"
  | "Xianxia_fantasy"
  | "Historical_epic"
  | "Mystery_thriller"
  | "Psychological_drama"
  | "Sweet_romance_novel"
  | "Hot_blooded_action"
  | "Horror_supernatural"
  | "Scifi_post_apocalypse"
  | "Comedy_humor"
  | "Coming_of_age"
  | "Family_warmth"
  | string;

export type { StoryGenreItem, ArtStyleItem } from "@/lib/skills/toonflow-skills-data";

export type AssetType = "character" | "location" | "prop";

export interface Asset {
  id: string;
  projectId: string;
  name: string;
  tag: string; // e.g. "@LuChen", "@Penthouse"
  type: AssetType;
  gender?: "male" | "female";
  roleDescription: string;
  visualDescription: string;
  prompt: string;
  imageUrl?: string;
  localPath?: string;
  status: "idle" | "generating" | "ready" | "error";
  error?: string;
  createdAt: number;
}

export interface StoryboardShot {
  id: string;
  projectId: string;
  shotNumber: number;
  duration: number; // typically 5s
  characterTags: string[]; // e.g. ["@LuChen", "@LinWan"]
  settingTag: string; // e.g. "@Penthouse"
  propTags?: string[];
  framing: string; // "Close-up", "Medium Shot", "Wide Establishing Shot", etc.
  cameraMovement: string; // "Slow push-in", "Subtle handheld float", "Steadicam glide", etc.
  visualDescription: string; // Rich first-frame visual composition
  motionPrompt: string; // Micro-motion prompt for MiniMax I2V
  dialogue?: string; // Spoken lines / subtitles
  audioCue?: string; // Ambience / sound effects / mood
  keyframePrompt: string; // Prompt for GPT Image 2.5 Sunburst
  keyframeUrl?: string;
  keyframeLocalPath?: string;
  videoUrl?: string;
  videoLocalPath?: string;
  status: "draft" | "generating_keyframe" | "keyframe_ready" | "generating_video" | "video_ready" | "error";
  error?: string;
  usePreviousShotReference?: boolean;
  createdAt: number;
}

export interface SavedKeyframe {
  id: string;
  projectId: string;
  imageUrl: string;
  localPath?: string;
  prompt: string;
  referenceTags?: string[];
  referenceUrls?: string[];
  assignedShotNumber?: number;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  aspectRatio: AspectRatio;
  genre: GenreStyle;
  artStyle?: string;
  rawStory: string;
  scriptTitle?: string;
  scriptLogline?: string;
  scriptSynopsis?: string;
  characters: Asset[];
  locations: Asset[];
  props: Asset[];
  shots: StoryboardShot[];
  savedKeyframes?: SavedKeyframe[];
  createdAt: number;
  updatedAt: number;
}

export interface OmnirouteConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface FalaiConfig {
  apiKey: string;
  gptImageQuality: "auto" | "low" | "medium" | "high" | "xhigh" | "max";
  gptImageBackground: "auto" | "transparent" | "opaque";
  gptImageOutputFormat: "png" | "jpeg" | "webp";
  defaultImageModel: string;
  defaultVideoModel: string;
}

export interface CustomModelConfig {
  id: string;
  name: string;
  type: "text" | "image" | "video";
  endpoint: string;
  requestFormat: "fal_queue" | "openai_chat" | "custom_post";
  headers?: Record<string, string>;
  defaultBodyParams?: Record<string, any>;
}

export interface CustomVendor {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  codeTsPath?: string; // file path to .ts vendor plugin if applicable
  models: CustomModelConfig[];
}

export interface AppSettings {
  omniroute: OmnirouteConfig;
  falai: FalaiConfig;
  customVendors: CustomVendor[];
}
