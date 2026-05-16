"use client";
import { useEffect, useState } from "react";

const BG = "#0a0c10"; const CARD = "#1a1d27"; const BORD = "#2a2d3e"; const PRP = "#6c63ff";
const TEAL = "#00d4aa"; const RED = "#ff6b6b"; const TEXT = "#e2e8f0"; const MUTED = "#8892a4";

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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/connection/status");
        const data: ConnectionState = await res.json();
        setState(data);
        setElapsed((e) => e + 2);
        if (data.status === "connected" && data.phone) onConnected(data.phone);
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [onConnected]);

  const dotColor = state.status === "qr" || state.status === "pairing" ? TEAL : state.status === "connecting" ? PRP : MUTED;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: BG, padding: "0 20px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 16, padding: "36px 32px", maxWidth: 380, width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Conectar WhatsApp</h1>
        <p style={{ fontSize: 12, color: MUTED, marginBottom: 24 }}>CRM DTAR · Sistema Interno</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
          <span style={{ fontSize: 12, color: MUTED, textTransform: "capitalize" }}>{state.status}</span>
        </div>

        {state.status === "pairing" && state.qr_string ? (
          <div>
            <div style={{ background: "rgba(108,99,255,.08)", border: `1px solid ${PRP}`, borderRadius: 12, padding: "24px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: MUTED, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>Código de vinculación</p>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "monospace", color: TEAL, letterSpacing: "0.2em" }}>
                {state.qr_string}
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
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img src={state.qr_string} alt="QR WhatsApp" style={{ width: 240, height: 240, borderRadius: 12, border: `1px solid ${BORD}` }} />
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

        {state.qr_string && state.status !== "pairing" && (
          <p style={{ fontSize: 11, color: MUTED, marginTop: 20, lineHeight: 1.6 }}>
            Abre WhatsApp en tu móvil → Dispositivos vinculados → Vincular un dispositivo
          </p>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
