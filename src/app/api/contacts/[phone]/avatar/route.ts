import { NextRequest, NextResponse } from "next/server";
import { fetchProfilePicture } from "@/lib/baileys/client";
import fs from "node:fs";
import path from "node:path";

const AVATARS_DIR = path.resolve(process.cwd(), "data", "images", "avatars");
const TTL_MS = 24 * 60 * 60 * 1000;

function ensureDir() {
  if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

function cachePath(phone: string) {
  const safe = phone.replace(/[^0-9]/g, "");
  return path.join(AVATARS_DIR, `${safe}.jpg`);
}

function isFresh(file: string): boolean {
  try {
    const stat = fs.statSync(file);
    return Date.now() - stat.mtimeMs < TTL_MS;
  } catch {
    return false;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params;
  ensureDir();
  const file = cachePath(phone);

  // serve from cache if fresh
  if (isFresh(file)) {
    const buf = fs.readFileSync(file);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // fetch from WhatsApp
  const url = await fetchProfilePicture(phone);
  if (!url) return NextResponse.json({ error: "no picture" }, { status: 404 });

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "fetch failed" }, { status: 404 });
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(file, buf);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
