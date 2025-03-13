import { NextResponse } from 'next/server';

// Import the voice cache from the shared file
import { voiceCache } from '../shared/voice-cache';

// Mark this route as dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Extract name from query parameters
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    
    if (!name) {
      return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
    }
    
    console.log(`[Voice Status API] Checking status for ${name}`);
    
    // Check if we have this voice ID in the cache
    if (voiceCache[name]) {
      console.log(`[Voice Status API] Voice found for ${name}: ${voiceCache[name]}`);
      return NextResponse.json({
        status: 'ready',
        voiceId: voiceCache[name]
      });
    }
    
    // Check if voice generation is still in progress
    // In a real implementation, you would check with ElevenLabs API
    // For now, we'll simulate it by assuming it's still processing
    
    // If you have a more sophisticated way to check voice generation status,
    // you would implement it here. For example, you could check:
    // 1. A database that tracks voice generation jobs
    // 2. The Eleven Labs API directly with a voice_id that's being processed
    // 3. A queue system that's handling the voice creation
    
    // For simplicity in this example, we'll return 'processing'
    console.log(`[Voice Status API] Voice not found for ${name}, assuming still processing`);
    return NextResponse.json({ 
      status: 'processing',
      message: 'Voice is still being generated'
    });
    
  } catch (error) {
    console.error('[Voice Status API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check voice status' },
      { status: 500 }
    );
  }
} 