const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("========================================================");
console.log("  🎬 AIDRAMA STUDIO + ТУННЕЛЬ ДЛЯ ТЕЛЕФОНА");
console.log("========================================================\n");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Start Next.js
console.log("⏳ [1/2] Запуск Next.js сервера...");
const nextCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const nextProcess = spawn(nextCmd, ["run", "dev:server"], {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
  shell: true,
});

// 2. Start Cloudflare Tunnel
console.log("⏳ [2/2] Подключение Cloudflare туннеля для смартфона...");
const cloudflaredBin = path.join(__dirname, "..", "cloudflared.exe");

if (fs.existsSync(cloudflaredBin)) {
  const cf = spawn(cloudflaredBin, ["tunnel", "--url", "http://127.0.0.1:3000"]);

  let foundUrl = false;

  const handleOutput = (chunk) => {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !foundUrl) {
      foundUrl = true;
      const tunnelUrl = match[0];
      fs.writeFileSync(path.join(dataDir, "tunnel_url.txt"), tunnelUrl, "utf-8");

      console.log("\n========================================================");
      console.log("  📱 ССЫЛКА ДЛЯ ТЕЛЕФОНА ГОТОВА:");
      console.log(`  👉 ${tunnelUrl}`);
      console.log("========================================================\n");
    }
  };

  cf.stderr.on("data", handleOutput);
  cf.stdout.on("data", handleOutput);

  cf.on("error", (err) => {
    console.error("Cloudflare tunnel error:", err.message);
  });

  cf.on("close", (code) => {
    console.log(`Cloudflare туннель завершился с кодом ${code}`);
  });

  const cleanup = () => {
    try { nextProcess.kill(); } catch (e) {}
    try { cf.kill(); } catch (e) {}
    process.exit();
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);
} else {
  console.warn("⚠️ cloudflared.exe не найден, туннель пропущен.");
  
  const cleanup = () => {
    try { nextProcess.kill(); } catch (e) {}
    process.exit();
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);
}

nextProcess.on("error", (err) => {
  console.error("Next.js process error:", err.message);
});
