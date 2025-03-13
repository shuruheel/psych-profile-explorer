import { 
  getVoiceIdFromCache, 
  saveVoiceIdToCache, 
  removeVoiceIdFromCache,
  readVoiceCache
} from '@/lib/voice-cache';

/**
 * Voice cache implementation with both in-memory and file-based persistence
 * Uses the file-based cache for persistence between server restarts
 */

// In-memory cache for faster access during runtime
// This will be initialized from the file-based cache
const inMemoryCache: Record<string, string> = {};

// Load initial data from file cache
try {
  const fileCache = readVoiceCache();
  Object.entries(fileCache).forEach(([profileName, entry]) => {
    inMemoryCache[profileName] = entry.voiceId;
  });
  console.log(`[VoiceCache] Loaded ${Object.keys(inMemoryCache).length} voice IDs from file cache`);
} catch (error) {
  console.error('[VoiceCache] Error loading from file cache:', error);
}

// Export a proxy object that handles both in-memory and file persistence
export const voiceCache = new Proxy(inMemoryCache, {
  // Get will check the in-memory cache first (for performance)
  get: (target, prop) => {
    if (typeof prop === 'string') {
      // For direct property access (like voiceCache['Albert Einstein'])
      const cachedValue = target[prop];
      
      // If not in memory, try to get from file
      if (cachedValue === undefined) {
        const fileValue = getVoiceIdFromCache(prop);
        if (fileValue) {
          // Update in-memory cache
          target[prop] = fileValue;
          return fileValue;
        }
      }
      
      return cachedValue;
    }
    return Reflect.get(target, prop);
  },
  
  // Set will update both in-memory and file cache
  set: (target, prop, value) => {
    if (typeof prop === 'string' && typeof value === 'string') {
      // Update in-memory cache
      target[prop] = value;
      
      // Update file cache
      saveVoiceIdToCache(prop, value);
      
      return true;
    }
    return Reflect.set(target, prop, value);
  },
  
  // Delete will remove from both in-memory and file cache
  deleteProperty: (target, prop) => {
    if (typeof prop === 'string') {
      // Remove from in-memory cache
      delete target[prop];
      
      // Remove from file cache
      removeVoiceIdFromCache(prop);
      
      return true;
    }
    return Reflect.deleteProperty(target, prop);
  },
  
  // Has will check both in-memory and file cache
  has: (target, prop) => {
    if (typeof prop === 'string') {
      // Check in-memory first
      if (prop in target) {
        return true;
      }
      
      // Then check file cache
      return getVoiceIdFromCache(prop) !== null;
    }
    return Reflect.has(target, prop);
  }
}); 