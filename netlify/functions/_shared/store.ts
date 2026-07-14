import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureScheduleProposal } from "./schedule";
import { defaultKids, defaultTracker } from "./seed";
import type { KidsData, TrackerData } from "./types";

const TRACKER_KEY = "tracker";
const KIDS_KEY = "kids";

/**
 * True only for real Netlify site deploys (not `netlify dev`).
 * Deployed functions must use Blobs — /tmp is per-instance and loses votes.
 */
function isNetlifyDeploy(): boolean {
  const context = process.env.CONTEXT || "";
  return (
    context === "production" ||
    context === "deploy-preview" ||
    context === "branch-deploy"
  );
}

function useFileStore(): boolean {
  // Production / preview deploys: always Blobs.
  if (isNetlifyDeploy()) return false;

  // Local machine + `netlify dev`: use the repo `data/` folder.
  // (Blobs is often unavailable locally without siteID/token.)
  if (process.env.USE_LOCAL_STORE === "1") return true;
  if (process.env.NETLIFY_DEV === "true") return true;

  // Plain node without Netlify: file store.
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT) return true;

  return false;
}

function localDir(): string {
  // Always project `data/` for local — never Lambda /tmp.
  return path.join(process.cwd(), "data");
}

function store() {
  return getStore({ name: "kids-mahaber", consistency: "strong" });
}

async function ensureLocalDir() {
  await mkdir(localDir(), { recursive: true });
}

async function localGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await readFile(path.join(localDir(), `${key}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function localSet(key: string, value: unknown) {
  await ensureLocalDir();
  await writeFile(
    path.join(localDir(), `${key}.json`),
    JSON.stringify(value, null, 2),
    "utf8",
  );
}

async function blobGet<T>(key: string): Promise<T | null> {
  const value = await store().get(key, { type: "json" });
  return (value as T | null) ?? null;
}

async function blobSet(key: string, value: unknown) {
  await store().setJSON(key, value);
}

async function getJson<T>(key: string): Promise<T | null> {
  if (useFileStore()) {
    return localGet<T>(key);
  }
  return blobGet<T>(key);
}

async function setJson(key: string, value: unknown) {
  if (useFileStore()) {
    await localSet(key, value);
    return;
  }
  await blobSet(key, value);
}

export async function getTracker(): Promise<TrackerData> {
  const data = await getJson<TrackerData>(TRACKER_KEY);
  if (!data) {
    // Only seed when the store is truly empty. Never treat a soft miss as
    // wipe-and-replace on subsequent reads — seeding is write-once here.
    const seed = structuredClone(defaultTracker);
    seed.updatedAt = Date.now();
    await setJson(TRACKER_KEY, seed);
    return ensureScheduleProposal(seed);
  }
  // IMPORTANT: do not persist ensureScheduleProposal from GET.
  // Writing on every GET caused lost updates that wiped concurrent votes.
  return ensureScheduleProposal(data);
}

export async function saveTracker(data: TrackerData): Promise<void> {
  data.hostConfirmed = data.members.some((m) => m.status === "Hosting");
  data.updatedAt = Date.now();
  // Persist normalized proposal copy whenever we intentionally write.
  const normalized = ensureScheduleProposal(data);
  normalized.updatedAt = data.updatedAt;
  await setJson(TRACKER_KEY, normalized);
}

export async function getKids(): Promise<KidsData> {
  const data = await getJson<KidsData>(KIDS_KEY);
  if (!data) {
    const seed = structuredClone(defaultKids);
    seed.updatedAt = Date.now();
    await setJson(KIDS_KEY, seed);
    return seed;
  }
  if ("adults" in (data as object) && !("kids" in (data as object))) {
    const migrated: KidsData = {
      kids: (data as unknown as { adults: KidsData["kids"] }).adults,
      updatedAt: Date.now(),
    };
    await setJson(KIDS_KEY, migrated);
    return migrated;
  }
  return data;
}

export async function saveKids(data: KidsData): Promise<void> {
  data.updatedAt = Date.now();
  await setJson(KIDS_KEY, data);
}

export function getStorageMode(): "blobs" | "local-file" {
  return useFileStore() ? "local-file" : "blobs";
}
