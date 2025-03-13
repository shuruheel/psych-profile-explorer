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
    console.log(`[Profile Enrichment API] Starting enrichment process...`);
    const { profile, provider = 'openai' } = await request.json();
    
    if (!profile || !profile.name) {
      console.log(`[Profile Enrichment API] Error: Missing profile data`);
      return NextResponse.json(
        { error: 'Missing profile data or profile name' },
        { status: 400 }
      );
    }
    
    console.log(`[Profile Enrichment API] Enriching profile for: ${profile.name} using ${provider}`);
    
    // Extract existing biographical information from the profile
    const existingBio = {
      name: profile.name,
      biography: profile.biography || '',
      gender: profile.gender || '',
      age: profile.age || '',
      birthYear: profile.birthYear || '',
      deathYear: profile.deathYear || '',
      nationality: profile.nationality || '',
      nativeLanguage: profile.nativeLanguage || '',
      accent: profile.accent || '',
      era: profile.era || '',
    };
    
    console.log(`[Profile Enrichment API] Existing bio info: ${JSON.stringify(existingBio)}`);
    
    // Build the prompt for the language model
    const prompt = `
You are an expert historian tasked with providing accurate biographical information about historical figures.
I need factual information about ${profile.name} for voice synthesis purposes.

Current information I have:
${JSON.stringify(existingBio, null, 2)}

Please provide only the following biographical details (even if you have to make an educated guess based on historical facts):
1. Gender (male/female/neutral)
2. Approximate age during their notable period (young/middle-aged/elderly)
3. Birth year (if known)
4. Death year (if applicable)
5. Nationality
6. Native language
7. Notable accent or dialect characteristics
8. Historical era they belonged to
9. Voice characteristics (deep, high-pitched, raspy, etc.)

Format your response as a JSON object with the following structure:
{
  "gender": "",
  "age": "",
  "birthYear": null,
  "deathYear": null,
  "nationality": "",
  "nativeLanguage": "",
  "accent": "",
  "era": "",
  "voiceCharacteristics": ""
}
`;

    console.log(`[Profile Enrichment API] Calling ${provider} API...`);
    let enhancedProfileData: Record<string, any> = {};
    
    try {
      if (provider === 'anthropic') {
        if (!process.env.ANTHROPIC_API_KEY) {
          console.error(`[Profile Enrichment API] Missing ANTHROPIC_API_KEY environment variable`);
          throw new Error("Missing ANTHROPIC_API_KEY environment variable");
        }
        
        const response = await anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        });
        
        // Fix for accessing text content from Anthropic response
        const contentBlock = response.content[0];
        const content = contentBlock.type === 'text' ? contentBlock.text : '';
        
        console.log(`[Profile Enrichment API] Received raw Anthropic response`);
        
        const jsonStartIndex = content.indexOf('{');
        const jsonEndIndex = content.lastIndexOf('}') + 1;
        
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          const jsonString = content.substring(jsonStartIndex, jsonEndIndex);
          try {
            enhancedProfileData = JSON.parse(jsonString);
            console.log(`[Profile Enrichment API] Successfully parsed JSON response from Anthropic`);
          } catch (jsonError) {
            console.error(`[Profile Enrichment API] Failed to parse JSON from Anthropic:`, jsonError);
            console.log(`[Profile Enrichment API] Raw JSON string: ${jsonString}`);
            throw new Error("Failed to parse Anthropic JSON response");
          }
        } else {
          console.error(`[Profile Enrichment API] Could not find JSON in Anthropic response`);
          console.log(`[Profile Enrichment API] Raw content: ${content.substring(0, 200)}...`);
          throw new Error("Could not find JSON in Anthropic response");
        }
      } else {
        // Default to OpenAI
        if (!process.env.OPENAI_API_KEY) {
          console.error(`[Profile Enrichment API] Missing OPENAI_API_KEY environment variable`);
          throw new Error("Missing OPENAI_API_KEY environment variable");
        }
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });
        
        const content = response.choices[0].message.content;
        if (content) {
          try {
            enhancedProfileData = JSON.parse(content);
            console.log(`[Profile Enrichment API] Successfully parsed JSON response from OpenAI`);
          } catch (jsonError) {
            console.error(`[Profile Enrichment API] Failed to parse OpenAI JSON:`, jsonError);
            console.log(`[Profile Enrichment API] Raw content from OpenAI: ${content.substring(0, 200)}...`);
            throw new Error("Failed to parse OpenAI JSON response");
          }
        } else {
          console.error(`[Profile Enrichment API] Empty response from OpenAI`);
          throw new Error("Empty response from OpenAI");
        }
      }
    } catch (aiError) {
      console.error(`[Profile Enrichment API] AI provider error:`, aiError);
      // Return partial data if available, otherwise re-throw
      if (Object.keys(enhancedProfileData).length === 0) {
        throw aiError;
      } else {
        console.log(`[Profile Enrichment API] Proceeding with partial data despite AI error`);
      }
    }
    
    console.log(`[Profile Enrichment API] Enhanced data: ${JSON.stringify(enhancedProfileData)}`);
    
    // Merge the enhanced data with the original profile
    const enrichedProfile = {
      ...profile,
      gender: enhancedProfileData.gender || profile.gender || null,
      age: enhancedProfileData.age || profile.age || null,
      birthYear: enhancedProfileData.birthYear || profile.birthYear || null,
      deathYear: enhancedProfileData.deathYear || profile.deathYear || null,
      nationality: enhancedProfileData.nationality || profile.nationality || null,
      nativeLanguage: enhancedProfileData.nativeLanguage || profile.nativeLanguage || null,
      accent: enhancedProfileData.accent || profile.accent || null,
      era: enhancedProfileData.era || profile.era || null,
      voiceCharacteristics: enhancedProfileData.voiceCharacteristics || null,
    };
    
    console.log(`[Profile Enrichment API] Successfully enriched profile for ${profile.name}`);
    return NextResponse.json({
      originalProfile: profile,
      enrichedProfile: enrichedProfile,
      enhancedData: enhancedProfileData
    });
    
  } catch (error) {
    console.error(`[Profile Enrichment API] Error:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to enrich profile data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 