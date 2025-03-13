import { NextResponse } from 'next/server';

// Local cache for storing voice IDs to avoid regeneration
const voiceIdCache: Record<string, string> = {};

export async function POST(request: Request) {
  try {
    const { text, name, profile } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Missing required text parameter' },
        { status: 400 }
      );
    }
    
    // Get the voice ID - either from cache, through generation, or use default
    let voiceId: string;
    
    // Check if we have a cached voice ID for this name
    if (voiceIdCache[name]) {
      voiceId = voiceIdCache[name];
    } 
    // If profile is provided, try to generate a voice or get from profile.voiceId
    else if (profile) {
      if (profile.voiceId) {
        voiceId = profile.voiceId;
        voiceIdCache[name] = voiceId; // Cache it
      } else {
        // Call voice design API to generate a voice
        try {
          const voiceResponse = await fetch('/api/voice-design', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profile }),
          });
          
          if (voiceResponse.ok) {
            const voiceData = await voiceResponse.json();
            voiceId = voiceData.voiceId;
            voiceIdCache[name] = voiceId; // Cache it
          } else {
            // Fallback to default
            voiceId = process.env.DEFAULT_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
          }
        } catch (error) {
          console.error('Error getting designed voice:', error);
          voiceId = process.env.DEFAULT_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
        }
      }
    } 
    // Otherwise use default voice
    else {
      voiceId = process.env.DEFAULT_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
    }
    
    // Call Eleven Labs Text-to-Speech API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Eleven Labs TTS API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: 500 }
      );
    }
    
    // Get the audio as arrayBuffer and convert to base64
    const audioArrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');
    
    // Return the base64-encoded audio
    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
      voiceId: voiceId, // Return the voice ID used
    });
    
  } catch (error) {
    console.error('Error in text-to-speech endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 