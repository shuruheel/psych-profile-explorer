import fs from 'fs';
import path from 'path';

// Define the cache file location
const CACHE_FILE = path.join(process.cwd(), 'data', 'voice-cache.json');

// Define the interface for cache entries
interface VoiceCacheEntry {
  voiceId: string;
  timestamp: string;
  // Additional metadata if needed
  profileName: string;
}

interface VoiceCache {
  [profileName: string]: VoiceCacheEntry;
}

/**
 * Ensures the cache directory exists
 */
const ensureCacheDirectory = (): void => {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Reads the voice cache from disk
 * @returns The voice cache object
 */
export const readVoiceCache = (): VoiceCache => {
  ensureCacheDirectory();
  
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[VoiceCache] Error reading cache file:', error);
  }
  
  // Return empty cache if file doesn't exist or there was an error
  return {};
};

/**
 * Saves the voice cache to disk
 * @param cache The voice cache object to save
 */
export const saveVoiceCache = (cache: VoiceCache): void => {
  ensureCacheDirectory();
  
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('[VoiceCache] Error writing cache file:', error);
  }
};

/**
 * Gets a voice ID for a profile from the cache
 * @param profileName The name of the profile
 * @returns The voice ID if found, null otherwise
 */
export const getVoiceIdFromCache = (profileName: string): string | null => {
  const cache = readVoiceCache();
  return cache[profileName]?.voiceId || null;
};

/**
 * Saves a voice ID to the cache
 * @param profileName The name of the profile
 * @param voiceId The voice ID to save
 */
export const saveVoiceIdToCache = (profileName: string, voiceId: string): void => {
  const cache = readVoiceCache();
  
  cache[profileName] = {
    voiceId,
    timestamp: new Date().toISOString(),
    profileName
  };
  
  saveVoiceCache(cache);
  console.log(`[VoiceCache] Saved voice ID ${voiceId} for profile ${profileName}`);
};

/**
 * Removes a voice ID from the cache
 * @param profileName The name of the profile
 */
export const removeVoiceIdFromCache = (profileName: string): void => {
  const cache = readVoiceCache();
  
  if (cache[profileName]) {
    delete cache[profileName];
    saveVoiceCache(cache);
    console.log(`[VoiceCache] Removed voice ID for profile ${profileName}`);
  }
}; 