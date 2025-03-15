import { NextResponse } from 'next/server';
import { Profile } from '@/types/profile';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize API clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Mark this route as dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { profile, provider = 'openai' } = await request.json();
    
    if (!profile || !profile.name) {
      return NextResponse.json(
        { error: 'Missing required profile data' },
        { status: 400 }
      );
    }
    
    // Log initial profile info for debugging
    const bioInfo = {
      name: profile.name,
      biography: profile.biography || '',
      gender: profile.gender || '',
      age: profile.age || '',
      birthYear: profile.birthYear || '',
      deathYear: profile.deathYear || '',
      nationality: profile.nationality || '',
      nativeLanguage: profile.nativeLanguage || '',
      accent: profile.accent || '',
      era: profile.era || ''
    };
    
    console.log(`[Profile Enrichment] Enriching profile for ${profile.name} using ${provider}`);
    console.log(`[Profile Enrichment] Current bio info:`, JSON.stringify(bioInfo));
    
    // Prepare the prompt for the AI
    const prompt = `Given this historical figure's name and any available biographical information, please provide additional details about their voice and speech characteristics. Return ONLY a JSON object with the following fields (no other text):

{
  "gender": "male or female",
  "age": "approximate age during their most prominent period (young/middle-aged/elderly)",
  "birthYear": "birth year if known, or null",
  "deathYear": "death year if known, or null",
  "nationality": "their nationality",
  "nativeLanguage": "their native language",
  "accent": "description of their accent",
  "era": "the time period they lived in (e.g., '19th century')",
  "voiceCharacteristics": "description of their voice (e.g., deep, resonant, soft)",
  "speechPatterns": "description of how they spoke (pace, formality, etc.)"
}

Historical Figure: ${profile.name}
Known Information: ${profile.biography || 'No biography available'}
Birth Year: ${profile.birthYear || 'Unknown'}
Death Year: ${profile.deathYear || 'Unknown'}
Nationality: ${profile.nationality || 'Unknown'}

Please infer any missing details based on historical records and the time period. If certain information is not known with confidence, make educated guesses based on their era and social position.`;

    let enhancedProfileData = {};
    
    try {
      if (provider === 'anthropic') {
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error("Missing ANTHROPIC_API_KEY environment variable");
        }
        
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        });
        
        // Fix for accessing text content from Anthropic response
        const contentBlock = response.content[0];
        const content = contentBlock.type === 'text' ? contentBlock.text : '';
        
        const jsonStartIndex = content.indexOf('{');
        const jsonEndIndex = content.lastIndexOf('}') + 1;
        
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          const jsonString = content.substring(jsonStartIndex, jsonEndIndex);
          try {
            enhancedProfileData = JSON.parse(jsonString);
          } catch (jsonError) {
            console.error(`[Profile Enrichment] Failed to parse Anthropic JSON:`, jsonError);
            throw new Error("Failed to parse Anthropic JSON response");
          }
        } else {
          console.error(`[Profile Enrichment] No JSON found in Anthropic response`);
          throw new Error("Could not find JSON in Anthropic response");
        }
      } else {
        // Default to OpenAI
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("Missing OPENAI_API_KEY environment variable");
        }
        
        const response = await openai.chat.completions.create({
          model: 'o3-mini-2025-01-31',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });
        
        const content = response.choices[0].message.content;
        if (content) {
          try {
            enhancedProfileData = JSON.parse(content);
          } catch (jsonError) {
            console.error(`[Profile Enrichment] Failed to parse OpenAI JSON:`, jsonError);
            throw new Error("Failed to parse OpenAI JSON response");
          }
        } else {
          throw new Error("Empty response from OpenAI");
        }
      }
    } catch (aiError) {
      console.error(`[Profile Enrichment] AI provider error:`, aiError);
      // Return partial data if available, otherwise re-throw
      if (Object.keys(enhancedProfileData).length === 0) {
        throw aiError;
      }
    }
    
    // Create enriched profile by merging original with enhanced data
    const enrichedProfile = {
      ...profile,
      ...enhancedProfileData
    };
    
    console.log(`[Profile Enrichment] Successfully enriched profile for ${profile.name}`);
    
    return NextResponse.json({
      enrichedProfile,
      enhancedData: enhancedProfileData
    });
    
  } catch (error) {
    console.error(`[Profile Enrichment] Error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enrich profile' },
      { status: 500 }
    );
  }
} 