import { NextResponse } from 'next/server';
import { Profile } from '@/types/profile';

// Cache for storing generated voice IDs to avoid regeneration
const voiceCache: Record<string, string> = {};

// Create a description for voice generation based on profile
function createVoiceDescription(profile: Profile): string {
  // Extract key traits that would affect voice characteristics
  const gender = profile.gender || (profile.subType === 'Person' ? 'unknown' : 'neutral');
  
  const emotionalDisposition = profile.emotionalProfile?.emotionalDisposition || 
    profile.emotionalDisposition || 'neutral';
  
  const personalityTraits = profile.personalityTraits && profile.personalityTraits.length > 0
    ? profile.personalityTraits.map(trait => trait.trait).join(', ')
    : 'balanced, neutral';
  
  // Age determination from profile
  let age = profile.age || 'adult';
  // If birthYear and deathYear are available, calculate approximate age at death or current age
  if (profile.birthYear && profile.deathYear) {
    const ageAtDeath = profile.deathYear - profile.birthYear;
    if (ageAtDeath < 30) age = 'young';
    else if (ageAtDeath > 60) age = 'elderly';
    else age = 'middle-aged';
  }
  
  // Extract nationality or default to a neutral value
  const nationality = profile.nationality || '';
  
  // Create a rich description for the voice design API using the new template format
  return `A ${age} ${nationality} ${gender} with a ${emotionalDisposition.toLowerCase()} voice. 
  Speaks with a ${profile.relationalDynamics?.interpersonalStyle || 'neutral'} style that is 
  ${profile.cognitiveStyle?.decisionMaking || 'balanced'} and ${personalityTraits.toLowerCase()}. 
  ${profile.biography ? `Known for: ${profile.biography.substring(0, 100)}` : ''}`;
}

// Generate example text based on the profile for the voice preview
function generateExampleText(profile: Profile): string {
  // Use biography or create a generic statement
  let text = "";
  
  if (profile.biography && profile.biography.length >= 100) {
    // Use part of biography if it's long enough
    text = profile.biography.substring(0, 900);
  } else {
    // Create a generic but historically plausible statement based on the person's traits
    const traits = profile.personalityTraits.map(t => t.trait.toLowerCase());
    const disposition = profile.emotionalProfile?.emotionalDisposition.toLowerCase() || 'contemplative';
    
    text = `As I reflect on my life's work and the principles that have guided me, I find that ${traits[0] || 'curiosity'} 
    and ${traits[1] || 'determination'} have been central to my approach. When facing challenges, I tend to be ${disposition} 
    and methodical. Throughout my experiences, I've developed a perspective that values ${profile.valueSystem?.coreValues[0]?.value || 'truth'} 
    above all else. The questions we ask about our world define us as much as the answers we discover.
    
    I believe that ${profile.cognitiveStyle?.worldview || 'the natural world operates according to consistent principles'}, 
    and my work has been dedicated to understanding these patterns. When I interact with others, I approach them with 
    ${profile.relationalDynamics?.interpersonalStyle || 'respect'} and attempt to ${profile.relationalDynamics?.powerDynamics?.negotiationTactics[0] || 'find common ground'}.
    
    The most profound insights often come when we ${profile.cognitiveStyle?.problemSolving || 'carefully analyze the evidence before us'}, 
    rather than accepting conventional wisdom without question.`;
  }
  
  // Ensure text is between 100-1000 characters as required by the API
  if (text.length < 100) {
    text = text.padEnd(100, ' The pursuit of knowledge requires both patience and persistence.');
  } else if (text.length > 1000) {
    text = text.substring(0, 1000);
  }
  
  return text;
}

export async function POST(request: Request) {
  try {
    const { profile } = await request.json();
    
    if (!profile || !profile.name) {
      return NextResponse.json(
        { error: 'Missing profile data' },
        { status: 400 }
      );
    }
    
    // Check if we already have a generated voice ID for this profile
    if (voiceCache[profile.name]) {
      return NextResponse.json({
        voiceId: voiceCache[profile.name],
        cached: true
      });
    }
    
    // Create voice description from profile
    const voiceDescription = createVoiceDescription(profile);
    
    // Generate example text for the voice preview
    const exampleText = generateExampleText(profile);
    
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
      const errorData = await response.json();
      console.error('Eleven Labs Voice Design API error:', errorData);
      
      // If voice design fails, fall back to default voice
      return NextResponse.json({
        voiceId: process.env.DEFAULT_VOICE_ID,
        fallback: true
      });
    }
    
    const voiceData = await response.json();
    
    // Choose the first preview (we could add logic to let the user select from options in a real app)
    if (!voiceData.previews || voiceData.previews.length === 0) {
      return NextResponse.json({
        voiceId: process.env.DEFAULT_VOICE_ID,
        fallback: true,
        error: 'No voice previews generated'
      });
    }
    
    const generatedVoiceId = voiceData.previews[0].generated_voice_id;
    
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
      console.error('Failed to save voice:', await saveResponse.json());
      // We still return the generated_voice_id even if saving fails
      // as it can be used temporarily
      voiceCache[profile.name] = generatedVoiceId;
      
      return NextResponse.json({
        voiceId: generatedVoiceId,
        generated: true,
        warning: 'Voice generated but not saved permanently'
      });
    }
    
    const savedVoiceData = await saveResponse.json();
    const permanentVoiceId = savedVoiceData.voice_id;
    
    // Store in cache
    voiceCache[profile.name] = permanentVoiceId;
    
    return NextResponse.json({
      voiceId: permanentVoiceId,
      generated: true,
      saved: true
    });
    
  } catch (error) {
    console.error('Error in voice design endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        voiceId: process.env.DEFAULT_VOICE_ID,
        fallback: true
      },
      { status: 500 }
    );
  }
} 