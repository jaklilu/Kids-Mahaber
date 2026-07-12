import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultKids, defaultTracker } from "./seed";
import type { KidsData, TrackerData } from "./types";

const TRACKER_KEY = "tracker";
const KIDS_KEY = "kids";

const localDir = path.join(process.cwd(), "data");

function useLocalFallback(): boolean {
  return (
    process.env.USE_LOCAL_STORE === "1" ||
    (!process.env.NETLIFY && !process.env.NETLIFY_DEV && !process.env.CONTEXT)
  );
}

async function ensureLocalDir() {
  await mkdir(localDir, { recursive: true });
}

async function localGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await readFile(path.join(localDir, `${key}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function localSet(key: string, value: unknown) {
  await ensureLocalDir();
  await writeFile(
    path.join(localDir, `${key}.json`),
    JSON.stringify(value, null, 2),
    "utf8",
  );
}

async function blobGet<T>(key: string): Promise<T | null> {
  try {
    const store = getStore({ name: "kids-mahaber", consistency: "strong" });
    return (await store.get(key, { type: "json" })) as T | null;
  } catch {
    return null;
  }
}

async function blobSet(key: string, value: unknown) {
  const store = getStore({ name: "kids-mahaber", consistency: "strong" });
  await store.setJSON(key, value);
}

async function getJson<T>(key: string): Promise<T | null> {
  if (useLocalFallback()) {
    return localGet<T>(key);
  }
  try {
    return await blobGet<T>(key);
  } catch {
    return localGet<T>(key);
  }
}

async function setJson(key: string, value: unknown) {
  if (useLocalFallback()) {
    await localSet(key, value);
    return;
  }
  try {
    await blobSet(key, value);
  } catch {
    await localSet(key, value);
  }
}

export async function getTracker(): Promise<TrackerData> {
  const data = await getJson<TrackerData>(TRACKER_KEY);
  if (!data) {
    await setJson(TRACKER_KEY, defaultTracker);
    return structuredClone(defaultTracker);
  }
  return data;
}

export async function saveTracker(data: TrackerData): Promise<void> {
  data.hostConfirmed = data.members.some((m) => m.status === "Hosting");
  await setJson(TRACKER_KEY, data);
}

export async function getKids(): Promise<KidsData> {
  const data = await getJson<KidsData>(KIDS_KEY);
  if (!data) {
    await setJson(KIDS_KEY, defaultKids);
    return structuredClone(defaultKids);
  }
  // Migrate old "adults" key shape if ever present
  if ("adults" in (data as object) && !("kids" in (data as object))) {
    const migrated: KidsData = {
      kids: (data as unknown as { adults: KidsData["kids"] }).adults,
    };
    await setJson(KIDS_KEY, migrated);
    return migrated;
  }
  return data;
}

export async function saveKids(data: KidsData): Promise<void> {
  await setJson(KIDS_KEY, data);
}
