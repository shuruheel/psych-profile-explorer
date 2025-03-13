/**
 * Simple in-memory cache to store voice IDs by profile name
 * In a production environment, this would be replaced with a database
 */
export const voiceCache: Record<string, string> = {}; 