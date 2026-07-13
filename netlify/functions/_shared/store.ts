import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureScheduleProposal } from "./schedule";
import { defaultKids, defaultTracker } from "./seed";
import type { KidsData, TrackerData } from "./types";

const TRACKER_KEY = "tracker";
const KIDS_KEY = "kids";

/** True on Netlify production / deploy previews / `netlify dev` with Blobs. */
function isNetlifyRuntime(): boolean {
  return Boolean(
    process.env.NETLIFY ||
      process.env.CONTEXT ||
      process.env.NETLIFY_BLOBS_CONTEXT ||
      process.env.NETLIFY_DEV,
  );
}

function useFileStore(): boolean {
  // Force file store only for explicit local-dev flag, and never on Netlify.
  if (isNetlifyRuntime() && process.env.USE_LOCAL_STORE !== "1") {
    return false;
  }
  return (
    process.env.USE_LOCAL_STORE === "1" ||
    !isNetlifyRuntime()
  );
}

function localDir(): string {
  // Lambda / Netlify functions cannot write under /var/task — use /tmp there.
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.cwd().startsWith("/var/task")) {
    return path.join(os.tmpdir(), "kids-mahaber-data");
  }
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
    const seed = structuredClone(defaultTracker);
    await setJson(TRACKER_KEY, seed);
    return seed;
  }
  const withSchedule = ensureScheduleProposal(data);
  if (withSchedule !== data) {
    await setJson(TRACKER_KEY, withSchedule);
  }
  return withSchedule;
}

export async function saveTracker(data: TrackerData): Promise<void> {
  data.hostConfirmed = data.members.some((m) => m.status === "Hosting");
  await setJson(TRACKER_KEY, data);
}

export async function getKids(): Promise<KidsData> {
  const data = await getJson<KidsData>(KIDS_KEY);
  if (!data) {
    const seed = structuredClone(defaultKids);
    await setJson(KIDS_KEY, seed);
    return seed;
  }
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
