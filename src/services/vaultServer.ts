/**
 * Vault server proxy logic for GB STUDY
 * Secure handshake with SpidyVault backend
 */
import fs from 'fs';
import path from 'path';

const VAULT_SECRET = "SPIDY_LALIT_VAULT_2026_#99X_ULTRA_SECRET_KEY";

function buildKey(ts: string, nonce: string): Uint8Array {
  const str = `${VAULT_SECRET}:${ts}:${nonce}:LALIT_KASHYAP`;
  const enc = new TextEncoder().encode(str);
  const key = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    key[i] = (enc[i % enc.length] ^ (73 * i + 41 & 255)) & 255;
  }
  return key;
}

function encryptPayload(payload: any, ts: string, nonce: string): string {
  const str = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(str);
  const key = buildKey(ts, nonce);
  const d = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    const k1 = key[255 & i];
    const k2 = key[13 * i + 7 & 255];
    d[i] = (bytes[i] ^ k1 ^ ((255 & i) + k2)) & 255;
  }
  return Buffer.from(d).toString("base64");
}

function calcSig(endpoint: string, ts: string, nonce: string, prefix = ""): string {
  const l = `${VAULT_SECRET}|${endpoint}|${ts}|${nonce}|${prefix}|${VAULT_SECRET}`;
  let n = 3735928559 ^ l.length;
  let d = 1103547991 ^ l.length;
  for (let i = 0; i < l.length; i++) {
    const code = l.charCodeAt(i);
    n = Math.imul(n ^ code, 2654435761);
    d = Math.imul(d ^ code, 1597334677);
  }
  n = Math.imul(n ^ n >>> 16, 2246822507) ^ Math.imul(d ^ d >>> 13, 3266489909);
  d = Math.imul(d ^ d >>> 16, 2246822507) ^ Math.imul(n ^ n >>> 13, 3266489909);
  return (n >>> 0).toString(16).padStart(8, "0") + (d >>> 0).toString(16).padStart(8, "0");
}

function decryptResponse(data: string, ts: string, nonce: string): any {
  const buf = Buffer.from(data, "base64");
  const key = buildKey(ts, nonce);
  const out = new Uint8Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    const k1 = key[255 & i];
    const k2 = key[13 * i + 7 & 255];
    out[i] = (buf[i] ^ k1 ^ ((255 & i) + k2)) & 255;
  }
  const text = new TextDecoder().decode(out);
  // Replace any Lalit references with SARVOTTAM
  const sanitized = text
    .replace(/Lalit Kashyap/gi, "SARVOTTAM")
    .replace(/Spidy Lalit/gi, "SARVOTTAM")
    .replace(/Lalit/gi, "SARVOTTAM");
  return JSON.parse(sanitized);
}

// In-memory cache
let cachedTests: any[] | null = null;
let lastTestsFetchTime = 0;
const testDetailsCache = new Map<string, any>();

export async function getVaultAllTests() {
  const now = Date.now();
  if (cachedTests && (now - lastTestsFetchTime < 10 * 60 * 1000)) {
    return { tests: cachedTests };
  }

  const endpoint = "/api/getAllTests";
  const fullUrl = "https://test.spidyuniverse.in" + endpoint;
  const payload = { action: "LIST_VAULT" };
  const ts = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
  const enc = encryptPayload(payload, ts, nonce);
  const sig = calcSig(endpoint, ts, nonce, enc.slice(0, 64));

  try {
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-spidy-ts": ts,
        "x-spidy-nonce": nonce,
        "x-spidy-sig": sig,
        "x-spidy-client": "SpidyUniverse-Web-v10"
      },
      body: JSON.stringify({ _p: enc })
    });

    if (res.ok) {
      const json = await res.json();
      if (json._d && json._t && json._n) {
        const decrypted = decryptResponse(json._d, json._t, json._n);
        if (decrypted.tests && Array.isArray(decrypted.tests)) {
          cachedTests = decrypted.tests;
          lastTestsFetchTime = now;
          return { tests: decrypted.tests };
        }
      }
    }
  } catch (err) {
    console.warn("Vault live fetch failed, trying local fallback:", err);
  }

  // Fallback to pre-cached tests
  try {
    const localCachePath = path.resolve(process.cwd(), 'src/tests_cache.json');
    if (fs.existsSync(localCachePath)) {
      const data = JSON.parse(fs.readFileSync(localCachePath, 'utf-8'));
      cachedTests = data;
      lastTestsFetchTime = now;
      return { tests: data };
    }
  } catch (e) {
    console.error("Local cache load error:", e);
  }

  return { tests: [] };
}

export async function getVaultTestById(id: string | number) {
  const idStr = String(id);
  if (testDetailsCache.has(idStr)) {
    return testDetailsCache.get(idStr);
  }

  const endpoint = "/api/getTest";
  const fullUrl = "https://test.spidyuniverse.in" + endpoint;
  const payload = { id: idStr };
  const ts = Date.now().toString();
  const nonce = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
  const enc = encryptPayload(payload, ts, nonce);
  const sig = calcSig(endpoint, ts, nonce, enc.slice(0, 64));

  const res = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-spidy-ts": ts,
      "x-spidy-nonce": nonce,
      "x-spidy-sig": sig,
      "x-spidy-client": "SpidyUniverse-Web-v10"
    },
    body: JSON.stringify({ _p: enc })
  });

  if (!res.ok) {
    throw new Error(`Failed to load test ${idStr}: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json._d || !json._t || !json._n) {
    throw new Error("Invalid encrypted test response from vault");
  }

  const decrypted = decryptResponse(json._d, json._t, json._n);
  testDetailsCache.set(idStr, decrypted);
  return decrypted;
}
