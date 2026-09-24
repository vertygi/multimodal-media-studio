import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/storage";
import { AppSettings } from "@/types";

export async function GET() {
  try {
    const settings = getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: AppSettings = await req.json();
    saveSettings(body);
    return NextResponse.json({ success: true, settings: body });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
