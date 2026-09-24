"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { 
  X, 
  Smartphone, 
  Wifi, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  RefreshCw 
} from "lucide-react";

interface MobileAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAccessModal: React.FC<MobileAccessModalProps> = ({ isOpen, onClose }) => {
  const [networkUrl, setNetworkUrl] = useState<string>("http://192.168.1.16:3000");
  const [localIp, setLocalIp] = useState<string>("192.168.1.16");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFirewallHelp, setShowFirewallHelp] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchNetworkInfo = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/network-info");
        const data = await res.json();
        const urlToUse = data.url || `http://${window.location.hostname}:3000`;
        setNetworkUrl(urlToUse);
        setLocalIp(data.ip || window.location.hostname);

        const qr = await QRCode.toDataURL(urlToUse, {
          width: 260,
          margin: 1.5,
          color: {
            dark: "#FFFFFF",
            light: "#09090B",
          },
        });
        setQrCodeDataUrl(qr);
      } catch (err) {
        console.error("Failed to fetch network info:", err);
        const fallback = `http://${window.location.hostname || "192.168.1.16"}:3000`;
        setNetworkUrl(fallback);
        const qr = await QRCode.toDataURL(fallback, {
          width: 260,
          margin: 1.5,
          color: { dark: "#FFFFFF", light: "#09090B" },
        });
        setQrCodeDataUrl(qr);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkInfo();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(networkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                Вход с телефона по Wi-Fi
              </h2>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Wifi className="h-3 w-3 text-emerald-400" /> Домашняя локальная сеть
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-inner">
            {isLoading ? (
              <div className="flex h-56 w-56 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR Code для телефона"
                className="h-56 w-56 rounded-xl border border-zinc-800 object-contain shadow-md"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-xs text-zinc-500">
                Не удалось сгенерировать QR-код
              </div>
            )}
          </div>

          <p className="text-center text-xs text-zinc-400 max-w-xs">
            Наведите камеру смартфона на QR-код для мгновенного перехода в интерфейс
          </p>
        </div>

        {/* Direct Link & Copy */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-400 block">
            Или введите адрес в браузере телефона:
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-1.5 pl-3">
            <span className="text-xs font-mono text-zinc-200 select-all truncate flex-1">
              {networkUrl}
            </span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                copied
                  ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Checklist */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2 text-xs text-zinc-400">
          <div className="flex items-start gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">
              1
            </span>
            <span>Телефон и компьютер должны быть подключены к <strong>одному Wi-Fi</strong>.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">
              2
            </span>
            <span>Интерфейс полностью адаптирован под вертикальный экран смартфона.</span>
          </div>
        </div>

        {/* Windows Firewall Hint Toggle */}
        <div className="border-t border-zinc-800/80 pt-2">
          <button
            onClick={() => setShowFirewallHelp(!showFirewallHelp)}
            className="flex items-center justify-between w-full text-[11px] text-zinc-400 hover:text-zinc-200 transition"
          >
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              Не открывается на телефоне? (Брандмауэр Windows)
            </span>
            <span className="text-[10px] underline">{showFirewallHelp ? "Скрыть" : "Инструкция"}</span>
          </button>

          {showFirewallHelp && (
            <div className="mt-2.5 rounded-lg border border-amber-900/40 bg-amber-950/20 p-2.5 text-[11px] text-zinc-300 space-y-1.5">
              <p className="text-amber-200 font-semibold">Если на телефоне бесконечно крутится загрузка:</p>
              <p>Windows по умолчанию может блокировать порт 3000. Чтобы разрешить:</p>
              <ol className="list-decimal pl-4 space-y-1 text-zinc-400">
                <li>Нажмите <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">Win + R</kbd>, введите <code className="text-zinc-200">control firewall.cpl</code></li>
                <li>Слева нажмите <em>«Разрешение взаимодействия с приложением...»</em></li>
                <li>Найдите в списке <strong>Node.js</strong> и включите галочку <strong>«Частная»</strong> (Private сеть).</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
