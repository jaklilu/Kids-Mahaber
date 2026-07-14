import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureScheduleProposal } from "./schedule";
import { defaultKids, defaultTracker } from "./seed";
import type { KidsData, TrackerData } from "./types";

const TRACKER_KEY = "tracker";
const KIDS_KEY = "kids";

/** Running inside the Netlify/AWS Lambda package (read-only filesystem). */
function isLambdaPackage(): boolean {
  return (
    process.cwd().startsWith("/var/task") ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.NETLIFY_DEV !== "true")
  );
}

function isNetlifyDeployContext(): boolean {
  const context = process.env.CONTEXT || "";
  return (
    context === "production" ||
    context === "deploy-preview" ||
    context === "branch-deploy"
  );
}

/**
 * Local file store only for real local/dev machines.
 * Live Netlify MUST use Blobs — writing under /var/task causes ENOENT and lost votes.
 */
function useFileStore(): boolean {
  if (isLambdaPackage() || isNetlifyDeployContext()) {
    return false;
  }
  return process.env.USE_LOCAL_STORE === "1";
}

function localDir(): string {
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
  try {
    const value = await store().get(key, { type: "json" });
    return (value as T | null) ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Netlify Blobs read failed (${key}): ${message}. ` +
        `On the live site, remove USE_LOCAL_STORE from Netlify env vars if set.`,
    );
  }
}

async function blobSet(key: string, value: unknown) {
  try {
    await store().setJSON(key, value);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Netlify Blobs write failed (${key}): ${message}. ` +
        `On the live site, remove USE_LOCAL_STORE from Netlify env vars if set.`,
    );
  }
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
    seed.updatedAt = Date.now();
    await setJson(TRACKER_KEY, seed);
    return ensureScheduleProposal(seed);
  }
  // Do not persist ensureScheduleProposal from GET (avoids vote clobber races).
  return ensureScheduleProposal(data);
}

export async function saveTracker(data: TrackerData): Promise<void> {
  data.hostConfirmed = data.members.some((m) => m.status === "Hosting");
  data.updatedAt = Date.now();
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
