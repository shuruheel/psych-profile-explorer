import { NextResponse } from 'next/server';
// Import the shared voice cache
import { voiceCache } from '../shared/voice-cache';

// Mark this route as dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { text, name, profile } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Missing required text parameter' },
        { status: 400 }
      );
    }
    
    // Get the voice ID - either from shared cache, through voice-design API, or use default
    let voiceId: string;
    
    // Check if we have the voice in the shared cache first
    if (name && voiceCache[name]) {
      console.log(`[Text-to-Speech] Using cached voice ID for ${name}: ${voiceCache[name]}`);
      voiceId = voiceCache[name];
    }
    // If profile has voiceId, use it
    else if (profile && profile.voiceId) {
      console.log(`[Text-to-Speech] Using profile voiceId: ${profile.voiceId}`);
      voiceId = profile.voiceId;
      
      // Store in the shared cache for future use
      if (name) {
        voiceCache[name] = voiceId;
      }
    }
    // If profile is provided but no voiceId, try to generate through voice-design API
    else if (profile && profile.name) {
      console.log(`[Text-to-Speech] No cached voice found for ${profile.name}, calling voice-design API...`);
      
      try {
        const voiceResponse = await fetch('http://localhost:3000/api/voice-design', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profile }),
        });
        
        if (voiceResponse.ok) {
          const voiceData = await voiceResponse.json();
          voiceId = voiceData.voiceId;
          console.log(`[Text-to-Speech] Voice designed successfully with ID: ${voiceId}`);
          
          // The voice-design API will have already added this to the shared cache
        } else {
          console.error(`[Text-to-Speech] Voice design API error: ${voiceResponse.status}`);
          voiceId = process.env.DEFAULT_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
        }
      } catch (error) {
        console.error('[Text-to-Speech] Error calling voice-design API:', error);
        voiceId = process.env.DEFAULT_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
      }
    }
    // Otherwise use default voice
    else {
      console.log(`[Text-to-Speech] Using default voice ID`);
      voiceId = process.env.DEFAULT_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
    }
    
    // Call Eleven Labs Text-to-Speech API
    console.log(`[Text-to-Speech] Generating speech with voice ID: ${voiceId}`);
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
      console.error('[Text-to-Speech] Eleven Labs TTS API error:', errorData);
      
      // Check for voice_not_found error specifically
      if (errorData.detail?.status === 'voice_not_found' && name) {
        console.log(`[Text-to-Speech] Voice ID ${voiceId} not found. Removing from cache.`);
        
        // Remove the invalid voice ID from cache
        delete voiceCache[name];
        
        // If we have a profile, attempt to regenerate the voice
        if (profile && profile.name) {
          console.log(`[Text-to-Speech] Attempting to regenerate voice for ${profile.name}`);
          
          try {
            const regenerateResponse = await fetch('http://localhost:3000/api/voice-design', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ profile }),
            });
            
            if (regenerateResponse.ok) {
              const regeneratedData = await regenerateResponse.json();
              const regeneratedVoiceId = regeneratedData.voiceId;
              console.log(`[Text-to-Speech] Successfully regenerated voice with ID: ${regeneratedVoiceId}`);
              
              // Try again with the new voice ID
              const retryResponse = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${regeneratedVoiceId}`,
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
              
              if (retryResponse.ok) {
                // Get the audio as arrayBuffer and convert to base64
                const audioArrayBuffer = await retryResponse.arrayBuffer();
                const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');
                
                console.log(`[Text-to-Speech] Successfully generated speech with regenerated voice for ${name}`);
                
                // Return the base64-encoded audio
                return NextResponse.json({
                  audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
                  voiceId: regeneratedVoiceId,
                  regenerated: true
                });
              } else {
                console.error('[Text-to-Speech] Retry with regenerated voice failed');
              }
            }
          } catch (regenerateError) {
            console.error('[Text-to-Speech] Error regenerating voice:', regenerateError);
          }
        }
        
        // If regeneration failed or was not attempted, fall back to default voice
        console.log('[Text-to-Speech] Falling back to default voice');
        const defaultVoiceId = process.env.DEFAULT_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
        
        const fallbackResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`,
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
        
        if (fallbackResponse.ok) {
          // Get the audio as arrayBuffer and convert to base64
          const audioArrayBuffer = await fallbackResponse.arrayBuffer();
          const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');
          
          console.log(`[Text-to-Speech] Successfully generated speech with default voice`);
          
          // Return the base64-encoded audio
          return NextResponse.json({
            audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
            voiceId: defaultVoiceId,
            fallback: true
          });
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: 500 }
      );
    }
    
    // Get the audio as arrayBuffer and convert to base64
    const audioArrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');
    
    console.log(`[Text-to-Speech] Successfully generated speech for ${name || 'unknown'}`);
    
    // Return the base64-encoded audio
    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
      voiceId: voiceId, // Return the voice ID used
    });
    
  } catch (error) {
    console.error('[Text-to-Speech] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 