"use client";
import { useEffect, useState } from "react";

const BG = "#0a0c10"; const CARD = "#1a1d27"; const BORD = "#2a2d3e"; const PRP = "#6c63ff";
const TEAL = "#00d4aa"; const RED = "#ff6b6b"; const TEXT = "#e2e8f0"; const MUTED = "#8892a4";
const YELL = "#ffd166";

interface ConnectionState {
  status: "disconnected" | "qr" | "connecting" | "connected" | "pairing";
  qr_string: string | null;
  phone: string | null;
}

interface QRScreenProps {
  onConnected: (phone: string) => void;
}

export function QRScreen({ onConnected }: QRScreenProps) {
  const [state, setState] = useState<ConnectionState>({ status: "disconnected", qr_string: null, phone: null });
  const [elapsed, setElapsed] = useState(0);
  const [phoneInput, setPhoneInput] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/connection/status");
        const data: ConnectionState = await res.json();
        setState(data);
        setElapsed((e) => e + 2);
        if (data.status === "connected" && data.phone) onConnected(data.phone);
        if (data.status === "pairing" && data.qr_string) setPairingCode(data.qr_string);
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [onConnected]);

  async function handleRequestPairing() {
    const cleaned = phoneInput.replace(/[^0-9]/g, "");
    if (!cleaned) { setPairingError("Ingresa un número válido"); return; }
    setRequesting(true);
    setPairingError(null);
    try {
      const res = await fetch("/api/connection/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) { setPairingError(data.error ?? "Error desconocido"); }
      else { setPairingCode(data.code); }
    } catch (e) {
      setPairingError("Error de red");
    } finally {
      setRequesting(false);
    }
  }

  const dotColor = state.status === "qr" || state.status === "pairing" ? TEAL
    : state.status === "connecting" ? PRP : MUTED;

  const showPairing = pairingCode || state.status === "pairing";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: BG, padding: "0 20px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 16, padding: "36px 32px", maxWidth: 420, width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Conectar WhatsApp</h1>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>CRM DTAR · Sistema Interno</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
          <span style={{ fontSize: 12, color: MUTED, textTransform: "capitalize" }}>{state.status}</span>
        </div>

        {/* Pairing code mode */}
        {showPairing ? (
          <div>
            <div style={{ background: "rgba(108,99,255,.08)", border: `1px solid ${PRP}`, borderRadius: 12, padding: "24px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: MUTED, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Código de vinculación</p>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "monospace", color: TEAL, letterSpacing: "0.2em" }}>
                {pairingCode ?? state.qr_string}
              </div>
            </div>
            <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.7 }}>
              1. Abre WhatsApp en tu móvil<br />
              2. Dispositivos vinculados → Vincular un dispositivo<br />
              3. Toca <strong style={{ color: TEXT }}>"Vincular con número de teléfono"</strong><br />
              4. Ingresa el código de arriba
            </p>
          </div>
        ) : state.qr_string ? (
          /* QR mode — show QR + phone input option */
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <img src={state.qr_string} alt="QR WhatsApp" style={{ width: 220, height: 220, borderRadius: 12, border: `1px solid ${BORD}` }} />
            </div>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 20, lineHeight: 1.6 }}>
              Abre WhatsApp → Dispositivos vinculados → Vincular un dispositivo
            </p>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: BORD }} />
              <span style={{ fontSize: 11, color: MUTED }}>o usa código de teléfono</span>
              <div style={{ flex: 1, height: 1, background: BORD }} />
            </div>

            {/* Phone pairing option */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="tel"
                placeholder="+53 5X XXX XXXX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRequestPairing()}
                style={{
                  flex: 1, background: "#0f1117", border: `1px solid ${BORD}`, borderRadius: 8,
                  color: TEXT, fontSize: 13, padding: "8px 12px", outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleRequestPairing}
                disabled={requesting}
                style={{
                  background: PRP, color: "#fff", border: "none", borderRadius: 8,
                  padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: requesting ? "default" : "pointer",
                  opacity: requesting ? 0.7 : 1,
                }}
              >
                {requesting ? "..." : "Obtener código"}
              </button>
            </div>
            {pairingError && (
              <p style={{ fontSize: 11, color: RED, marginTop: 8 }}>{pairingError}</p>
            )}
          </div>
        ) : elapsed > 10 && state.status !== "connecting" ? (
          <div style={{ padding: "32px 0", fontSize: 12, color: RED }}>
            No se recibe el código. Comprueba que el bot está corriendo con{" "}
            <code style={{ fontFamily: "monospace", background: "rgba(255,107,107,.1)", padding: "1px 6px", borderRadius: 4 }}>npm run start:bot</code>
          </div>
        ) : (
          <div style={{ padding: "32px 0" }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${PRP}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <p style={{ fontSize: 11, color: MUTED, marginTop: 12 }}>Esperando código...</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
