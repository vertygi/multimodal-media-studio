import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  try {
    const interfaces = os.networkInterfaces();
    const candidates: Array<{ name: string; ip: string; isWifi: boolean; isVirtual: boolean }> = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        if (addr.family === "IPv4" && !addr.internal) {
          const lowerName = name.toLowerCase();
          const isVirtual =
            lowerName.includes("virtual") ||
            lowerName.includes("radmin") ||
            lowerName.includes("vethernet") ||
            lowerName.includes("wsl") ||
            lowerName.includes("tap") ||
            addr.address.startsWith("169.254");

          const isWifi =
            lowerName.includes("wi-fi") ||
            lowerName.includes("wireless") ||
            lowerName.includes("беспроводн") ||
            lowerName.includes("wlan");

          candidates.push({
            name,
            ip: addr.address,
            isWifi,
            isVirtual,
          });
        }
      }
    }

    // Sort: non-virtual first, then wifi, then 192.168.x.x
    candidates.sort((a, b) => {
      if (a.isVirtual !== b.isVirtual) return a.isVirtual ? 1 : -1;
      if (a.isWifi !== b.isWifi) return a.isWifi ? -1 : 1;
      if (a.ip.startsWith("192.168.") && !b.ip.startsWith("192.168.")) return -1;
      if (!a.ip.startsWith("192.168.") && b.ip.startsWith("192.168.")) return 1;
      return 0;
    });

    const bestIp = candidates[0]?.ip || "192.168.1.16";
    const port = process.env.PORT || 3000;
    const localUrl = `http://${bestIp}:${port}`;

    let tunnelUrl = "";
    try {
      const fs = await import("fs");
      const path = await import("path");
      const tunnelFile = path.join(process.cwd(), "data", "tunnel_url.txt");
      if (fs.existsSync(tunnelFile)) {
        tunnelUrl = fs.readFileSync(tunnelFile, "utf-8").trim();
      }
    } catch (e) {
      console.warn("Could not read tunnel file:", e);
    }

    const primaryUrl = tunnelUrl || localUrl;

    return NextResponse.json({
      success: true,
      ip: bestIp,
      port,
      url: primaryUrl,
      localUrl,
      tunnelUrl,
      interfaces: candidates,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      ip: "192.168.1.16",
      url: "http://192.168.1.16:3000",
    });
  }
}
