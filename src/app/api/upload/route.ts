import { NextResponse } from "next/server";
import { saveMediaFile } from "@/storage";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const localUrl = saveMediaFile(file.name || "upload.png", buffer);

    return NextResponse.json({ success: true, url: localUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
