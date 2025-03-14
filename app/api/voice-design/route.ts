import { NextResponse } from 'next/server';
import { Profile } from '@/types/profile';
import { voiceCache } from '../shared/voice-cache';

// Mark this route as dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';

// Create a description for voice generation based on profile
function createVoiceDescription(profile: Profile): string {
  // Extract key traits that would affect voice characteristics
  const gender = profile.gender?.toLowerCase() || 'neutral';
  
  // Get emotional disposition with check for "insufficient data"
  const emotionalDisposition = profile.emotionalProfile?.emotionalDisposition || 
    profile.emotionalDisposition;
  
  const hasEmotionalData = emotionalDisposition && 
    emotionalDisposition.toLowerCase() !== "insufficient data";
  
  const emotionalTone = hasEmotionalData ? emotionalDisposition.toLowerCase() : null;
  
  // Age mapped to voice maturity
  let voiceMaturity = 'mature';
  if (profile.age) {
    const ageNum = Number(profile.age);
    if (ageNum < 30) voiceMaturity = 'youthful';
    else if (ageNum > 60) voiceMaturity = 'seasoned';
  }

  // Add nationality and accent if available
  const nationality = profile.nationality ? `${profile.nationality} ` : '';
  const accent = profile.accent ? ` with a ${profile.accent} (accent)` : '';
  
  // Extract native language if available
  const nativeLanguage = profile.nativeLanguage ? ` native ${profile.nativeLanguage} speaker` : '';
  
  // Add time period/era context if available
  const era = profile.era ? ` from the ${profile.era} era` : '';
  
  // Add specific voice characteristics if available
  const voiceQualities = profile.voiceCharacteristics ? 
    `The voice is ${profile.voiceCharacteristics}. ` : '';

  const speechPatterns = profile.speechPatterns ? 
    `The voice has the following speech patterns: ${profile.speechPatterns}. ` : '';
  
  // Check if interpersonal style has valid data
  const interpersonalStyle = profile.relationalDynamics?.interpersonalStyle;
  const hasInterpersonalData = interpersonalStyle && 
    interpersonalStyle.toLowerCase() !== "insufficient data";
  
  // Build voice description focusing on qualities rather than identity
  let description = `A ${voiceMaturity} ${gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'gender-neutral'} ${nationality}voice${accent}${nativeLanguage}${era}. `;
  
  // Add voice characteristics if available
  if (profile.voiceCharacteristics) {
    description += voiceQualities;
  }
  
  // Add emotional tone only if data is available
  if (hasEmotionalData) {
    description += `The voice has a ${emotionalTone} emotional tone. `;
  }
  
  // Add interpersonal style only if data is available
  if (hasInterpersonalData) {
    description += `The speaker speaks in a ${interpersonalStyle} manner. `;
  }
  
  // Add personality traits if available
  if (profile.personalityTraits?.length) {
    description += `The speaker has the following personality traits: ${profile.personalityTraits.map(trait => trait.trait).join(', ')}.`;
  }
  
  return description;
}

// Generate example text using quotes from profile evidence
function generateExampleText(profile: Profile): string {
  const quotes: string[] = [];
  
  // Collect quotes from personality traits evidence
  profile.personalityTraits?.forEach(trait => {
    trait.evidence?.forEach(evidence => {
      // If evidence starts with a quote mark, it's likely a direct quote
      if (evidence.startsWith('"') || evidence.startsWith('"')) {
        quotes.push(evidence.replace(/[""]/g, '"'));
      }
    });
  });
  
  // Collect quotes from emotional triggers evidence
  profile.emotionalProfile?.emotionalTriggers?.forEach(trigger => {
    trigger.evidence?.forEach(evidence => {
      if (evidence.startsWith('"') || evidence.startsWith('"')) {
        quotes.push(evidence.replace(/[""]/g, '"'));
      }
    });
  });
  
  // Collect quotes from loyalties evidence
  profile.relationalDynamics?.loyalties?.forEach(loyalty => {
    loyalty.evidence?.forEach(evidence => {
      if (evidence.startsWith('"') || evidence.startsWith('"')) {
        quotes.push(evidence.replace(/[""]/g, '"'));
      }
    });
  });
  
  // If we found any quotes, use them
  if (quotes.length > 0) {
    // Join quotes with proper spacing and punctuation
    let text = quotes.join(' ');
    
    // Ensure text length meets API requirements (100-1000 characters)
    if (text.length < 100) {
      // If quotes are too short, add some context
      text = `In their own words: ${text}`;
      // If still too short, pad with a generic statement
      if (text.length < 100) {
        text = text.padEnd(100, ' These words reflect their authentic voice and perspective.');
      }
    } else if (text.length > 1000) {
      // If too long, truncate while keeping complete sentences
      text = text.substring(0, 997) + '...';
    }
    
    return text;
  }
  
  // Fallback to a generic philosophical text if no quotes are available
  return `The nature of understanding requires careful consideration. 
  When we examine the world around us, we find patterns and meanings that shape our perspective. 
  Through careful observation and thoughtful analysis, we can better comprehend the complexity 
  of our shared experiences.`;
}

// Function to enrich profile with LLM-generated biographical information
async function enrichProfileWithBiographicalDetails(profile: Profile): Promise<Profile> {
  try {
    console.log(`[Voice Design] Starting profile enrichment for ${profile.name}...`);
    
    // Skip enrichment if we already have gender information
    if (profile.gender) {
      console.log(`[Voice Design] Profile already has gender info, skipping enrichment`);
      return profile;
    }
    
    // Get base URL from environment or construct it
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    console.log(`[Voice Design] Calling profile-enrichment API...`);
    const response = await fetch(`${baseUrl}/api/profile-enrichment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile }),
    });
    
    if (!response.ok) {
      console.error(`[Voice Design] Failed to enrich profile: ${await response.text()}`);
      return profile; // Return original profile if enrichment fails
    }
    
    const data = await response.json();
    console.log(`[Voice Design] Successfully enriched profile with: ${JSON.stringify(data.enhancedData)}`);
    return data.enrichedProfile;
  } catch (error) {
    console.error(`[Voice Design] Error enriching profile:`, error);
    return profile; // Return original profile on error
  }
}

export async function POST(request: Request) {
  try {
    console.log(`[Voice Design API] Request received`);
    const { profile } = await request.json();
    
    if (!profile || !profile.name) {
      console.log(`[Voice Design API] Invalid profile data`);
      return NextResponse.json(
        { error: 'Missing profile data' },
        { status: 400 }
      );
    }
    
    console.log(`[Voice Design API] Processing request for ${profile.name}`);
    
    // Check if we already have a generated voice ID for this profile
    if (voiceCache[profile.name]) {
      console.log(`[Voice Design API] Using cached voice ID for ${profile.name}: ${voiceCache[profile.name]}`);
      return NextResponse.json({
        voiceId: voiceCache[profile.name],
        cached: true
      });
    }
    
    console.log(`[Voice Design API] No cached voice found, enriching profile...`);
    const enrichedProfile = await enrichProfileWithBiographicalDetails(profile);
    
    // Create voice description from enriched profile
    const voiceDescription = createVoiceDescription(enrichedProfile);
    console.log(`[Voice Design API] Created voice description: ${voiceDescription.substring(0, 100)}...`);
    
    // Generate example text for the voice preview
    const exampleText = generateExampleText(enrichedProfile);
    
    console.log(`[Voice Design API] Calling Eleven Labs Voice Design API...`);
    // Call Eleven Labs Voice Design API using the latest endpoint
    const response = await fetch(
      'https://api.elevenlabs.io/v1/text-to-voice/create-previews',
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_description: voiceDescription,
          text: exampleText
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Voice Design API] Eleven Labs API error (${response.status}):`, errorText);
      
      // If voice design fails, fall back to default voice
      return NextResponse.json({
        voiceId: process.env.DEFAULT_VOICE_ID,
        fallback: true,
        error: `API Error: ${response.status} - ${errorText.substring(0, 100)}`
      });
    }
    
    const voiceData = await response.json();
    console.log(`[Voice Design API] Received voice previews: ${voiceData.previews?.length || 0}`);
    
    // Choose the first preview (we could add logic to let the user select from options in a real app)
    if (!voiceData.previews || voiceData.previews.length === 0) {
      console.error(`[Voice Design API] No voice previews were generated`);
      return NextResponse.json({
        voiceId: process.env.DEFAULT_VOICE_ID,
        fallback: true,
        error: 'No voice previews generated'
      });
    }
    
    const generatedVoiceId = voiceData.previews[0].generated_voice_id;
    console.log(`[Voice Design API] Generated voice ID: ${generatedVoiceId}`);
    
    console.log(`[Voice Design API] Saving voice to make it permanent...`);
    // Save the voice to make it permanent
    const saveResponse = await fetch(
      'https://api.elevenlabs.io/v1/text-to-voice/create-voice-from-preview',
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_name: profile.name,
          voice_description: `AI-generated voice for ${profile.name} based on psychological profile`,
          generated_voice_id: generatedVoiceId
        }),
      }
    );
    
    if (!saveResponse.ok) {
      const saveErrorText = await saveResponse.text();
      console.error(`[Voice Design API] Failed to save voice (${saveResponse.status}):`, saveErrorText);
      // We still return the generated_voice_id even if saving fails
      // as it can be used temporarily
      
      // Store in our cache - even temp ID can be used until it expires
      voiceCache[profile.name] = generatedVoiceId;
      
      return NextResponse.json({
        voiceId: generatedVoiceId,
        temporary: true
      });
    }
    
    // Parse the response to get the permanent voice ID
    const saveData = await saveResponse.json();
    const permanentVoiceId = saveData.voice_id;
    
    // Store the permanent voice ID in our cache
    voiceCache[profile.name] = permanentVoiceId;
    console.log(`[Voice Design API] Voice successfully generated and saved for ${profile.name} with ID: ${permanentVoiceId}`);
    
    return NextResponse.json({
      voiceId: permanentVoiceId
    });
    
  } catch (error) {
    console.error(`[Voice Design API] Unexpected error:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        voiceId: process.env.DEFAULT_VOICE_ID,
        fallback: true
      },
      { status: 500 }
    );
  }
} 