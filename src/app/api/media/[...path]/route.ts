import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getMediaFilePath } from "@/storage";

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  try {
    const filename = params.path.join("/");
    const fullPath = getMediaFilePath(filename);

    if (!fullPath || !fs.existsSync(fullPath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "1" || url.searchParams.has("download");
    const customName = url.searchParams.get("filename") || url.searchParams.get("name");
    let downloadFilename = customName || path.basename(fullPath);
    if (!downloadFilename.toLowerCase().endsWith(ext)) {
      downloadFilename += ext;
    }

    const disposition = isDownload
      ? `attachment; filename="${encodeURIComponent(downloadFilename)}"; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`
      : `inline; filename="${encodeURIComponent(downloadFilename)}"`;

    const rangeHeader = req.headers.get("range");

    // Support HTTP Range requests for video players
    if (rangeHeader && !isDownload) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(fullPath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": contentType,
          "Content-Disposition": disposition,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const fileBuffer = fs.readFileSync(fullPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileSize.toString(),
        "Content-Disposition": disposition,
        "Accept-Ranges": "bytes",
        "Cache-Control": isDownload ? "no-cache" : "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    return new NextResponse("Error reading media file", { status: 500 });
  }
}

