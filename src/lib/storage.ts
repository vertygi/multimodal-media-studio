import fs from "fs";
import path from "path";
import { Project, AppSettings } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_INDEX_PATH = path.join(DATA_DIR, "projects.json");
const PROJECTS_DIR = path.join(DATA_DIR, "projects");
const CONFIG_DIR = path.join(DATA_DIR, "config");
const SETTINGS_PATH = path.join(CONFIG_DIR, "settings.json");
const MEDIA_DIR = path.join(DATA_DIR, "media");

export function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

  if (!fs.existsSync(PROJECTS_INDEX_PATH)) {
    fs.writeFileSync(PROJECTS_INDEX_PATH, JSON.stringify([], null, 2), "utf-8");
  }

  if (!fs.existsSync(SETTINGS_PATH)) {
    const defaultSettings: AppSettings = {
      omniroute: {
        baseUrl: process.env.OMNIROUTE_BASE_URL || "https://api.omniroute.ai/v1",
        apiKey: process.env.OMNIROUTE_API_KEY || "",
        model: process.env.OMNIROUTE_MODEL || "gpt-4o",
      },
      falai: {
        apiKey: process.env.FAL_KEY || "",
        gptImageQuality: "high",
        gptImageBackground: "auto",
        gptImageOutputFormat: "png",
        defaultImageModel: "openai/gpt-image-2.5/sunburst/edit",
        defaultVideoModel: "minimax/h3-max-turbo/image-to-video",
      },
      customVendors: [
        {
          id: "falai-custom",
          name: "fal.ai Extended",
          description: "Full fal.ai models integration matching falai_vendor (3).ts",
          enabled: true,
          models: [
            {
              id: "gpt-sunburst-edit",
              name: "GPT Image 2.5 Sunburst Edit",
              type: "image",
              endpoint: "https://queue.fal.run/openai/gpt-image-2.5/sunburst/edit",
              requestFormat: "fal_queue",
            },
            {
              id: "gpt-sunburst-t2i",
              name: "GPT Image 2.5 Sunburst Text-to-Image",
              type: "image",
              endpoint: "https://queue.fal.run/openai/gpt-image-2.5/sunburst/text-to-image",
              requestFormat: "fal_queue",
            },
            {
              id: "minimax-h3-turbo",
              name: "MiniMax H3 Max Turbo (I2V)",
              type: "video",
              endpoint: "https://queue.fal.run/minimax/h3-max-turbo/image-to-video",
              requestFormat: "fal_queue",
            },
            {
              id: "minimax-h3-max",
              name: "MiniMax H3 Max (I2V)",
              type: "video",
              endpoint: "https://queue.fal.run/minimax/h3-max/image-to-video",
              requestFormat: "fal_queue",
            },
            {
              id: "minimax-h3-ref",
              name: "MiniMax H3 Max Reference-to-Video",
              type: "video",
              endpoint: "https://queue.fal.run/minimax/h3-max/reference-to-video",
              requestFormat: "fal_queue",
            },
          ],
        },
      ],
    };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2), "utf-8");
  }
}

export function getSettings(): AppSettings {
  ensureDirectories();
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      omniroute: { baseUrl: "https://api.omniroute.ai/v1", apiKey: "", model: "gpt-4o" },
      falai: {
        apiKey: "",
        gptImageQuality: "high",
        gptImageBackground: "auto",
        gptImageOutputFormat: "png",
        defaultImageModel: "openai/gpt-image-2.5/sunburst/edit",
        defaultVideoModel: "minimax/h3-max-turbo/image-to-video",
      },
      customVendors: [],
    };
  }
}

export function saveSettings(settings: AppSettings) {
  ensureDirectories();
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

const CUSTOM_SKILLS_PATH = path.join(CONFIG_DIR, "custom_skills.json");

export function getCustomSkills(): { customGenres: any[]; customArtStyles: any[] } {
  ensureDirectories();
  try {
    if (!fs.existsSync(CUSTOM_SKILLS_PATH)) {
      return { customGenres: [], customArtStyles: [] };
    }
    const raw = fs.readFileSync(CUSTOM_SKILLS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { customGenres: [], customArtStyles: [] };
  }
}

export function saveCustomSkills(data: { customGenres: any[]; customArtStyles: any[] }) {
  ensureDirectories();
  fs.writeFileSync(CUSTOM_SKILLS_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function listProjects(): Array<{ id: string; name: string; description: string; aspectRatio: string; genre: string; updatedAt: number }> {
  ensureDirectories();
  try {
    const raw = fs.readFileSync(PROJECTS_INDEX_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getProject(id: string): Project | null {
  ensureDirectories();
  const filePath = path.join(PROJECTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveProject(project: Project) {
  ensureDirectories();
  project.updatedAt = Date.now();
  const filePath = path.join(PROJECTS_DIR, `${project.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(project, null, 2), "utf-8");

  // Update index
  const list = listProjects().filter((p) => p.id !== project.id);
  list.unshift({
    id: project.id,
    name: project.name,
    description: project.description,
    aspectRatio: project.aspectRatio,
    genre: project.genre,
    updatedAt: project.updatedAt,
  });
  fs.writeFileSync(PROJECTS_INDEX_PATH, JSON.stringify(list, null, 2), "utf-8");
}

const projectLocks = new Map<string, Promise<void>>();

/**
 * Thread-safe / Promise-safe atomic updater for project data.
 * Guarantees that parallel/batch generation requests never overwrite each other's writes.
 */
export async function updateProjectAtomic(
  id: string,
  updater: (project: Project) => void | Promise<void>
): Promise<Project | null> {
  const prevLock = projectLocks.get(id) || Promise.resolve();
  let release: () => void = () => {};
  const currentLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  projectLocks.set(id, prevLock.then(() => currentLock));

  try {
    await prevLock;
    ensureDirectories();
    const filePath = path.join(PROJECTS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    const project: Project = JSON.parse(raw);
    await updater(project);
    saveProject(project);
    return project;
  } finally {
    release();
  }
}

export function updateProject(
  id: string,
  updater: (project: Project) => void
): Project | null {
  ensureDirectories();
  const filePath = path.join(PROJECTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const project: Project = JSON.parse(raw);
  updater(project);
  saveProject(project);
  return project;
}

export function deleteProject(id: string) {
  ensureDirectories();
  const filePath = path.join(PROJECTS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  const list = listProjects().filter((p) => p.id !== id);
  fs.writeFileSync(PROJECTS_INDEX_PATH, JSON.stringify(list, null, 2), "utf-8");
}

export function saveMediaFile(filename: string, buffer: Buffer): string {
  ensureDirectories();
  const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const targetPath = path.join(MEDIA_DIR, safeFilename);
  fs.writeFileSync(targetPath, buffer);
  return `/api/media/${safeFilename}`;
}

export function getMediaFilePath(filename: string): string | null {
  ensureDirectories();
  const safeFilename = path.basename(filename);
  const targetPath = path.join(MEDIA_DIR, safeFilename);
  if (fs.existsSync(targetPath)) return targetPath;
  return null;
}
