"use server";
import { log } from "console";
import { generateImage } from "./openai";
import path from "path";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { formatDate } from "date-fns";

const CACHE_DIR = path.join(process.cwd(), '.image-cache');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms - If you feel rich, you can generate images more often by decreasing this.

async function ensureCacheDir() {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
  } catch {
    // ignore if already exists
  }
}

// Helper: Read cache file
async function readCache(key: string) {
  try {
    const filePath = await getCacheFilePath(key);
    const data = JSON.parse(await readFile(filePath, 'utf8'));
    if (data.expires > Date.now()) {
      return data;
    } else {
      // Expired — clean up
      await unlink(filePath).catch(() => { });
      return null;
    }
  } catch {
    return null;
  }
}

// Helper: Write cache file
async function writeCache(key: string, base64Data: string) {
  const filePath = await getCacheFilePath(key);
  const payload = {
    data: base64Data,
    expires: Date.now() + CACHE_DURATION,
  }
  await writeFile(filePath, JSON.stringify(payload), 'utf8');
  return payload;
}

async function getCacheFilePath(key: string) {
  await ensureCacheDir();
  return path.join(CACHE_DIR, `${encodeURIComponent(key)}.json`);
}

export const fetchImage = async () => {
  console.log("fetchImage");

  // This will slowly fill the disk with the created images, but due
  // to the twelve hour cache duration, only one per day will be saved,
  // even if more are generated
  const key = formatDate(new Date(), 'yyyy-MM-dd');
  const cached = await readCache(key);
  if (cached) {
    log("Image loaded from cache");
    return cached.data;
  }

  // Store in cache
  const newData = await generateImage() || '';
  await writeCache(key, newData);

  return newData;
};
