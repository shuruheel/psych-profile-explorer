import { NextResponse } from 'next/server';

// Import the voice cache from the shared file
import { voiceCache } from '../shared/voice-cache';

// Mark this route as dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log(`[Voice Status API] Checking voice status...`);
    
    // Extract the profile name from the URL query parameters
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name) {
      console.log(`[Voice Status API] Missing name parameter`);
      return NextResponse.json(
        { error: 'Missing name parameter' },
        { status: 400 }
      );
    }
    
    console.log(`[Voice Status API] Checking status for: ${name}`);
    
    // Check if the voice exists in cache
    const voiceId = voiceCache[name];
    
    if (voiceId) {
      console.log(`[Voice Status API] Voice found for ${name}: ${voiceId}`);
      return NextResponse.json({
        status: 'ready',
        voiceId
      });
    } else {
      console.log(`[Voice Status API] Voice not found for ${name}`);
      return NextResponse.json({
        status: 'pending'
      });
    }
    
  } catch (error) {
    console.error(`[Voice Status API] Error:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to check voice status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 