import { NextResponse } from 'next/server';
import { getProfileByName, getReasoningChainsByProfileName } from '@/lib/db';

export async function GET(request, context) {
  // Properly await params before destructuring
  const params = await context.params;
  const { name } = params;
  
  try {
    console.log(`API route: Fetching profile for ${name}`);
    const decodedName = decodeURIComponent(name);
    const profile = await getProfileByName(decodedName);
    
    if (!profile) {
      console.log(`API route: Profile not found for ${decodedName}`);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    console.log(`API route: Profile found for ${decodedName}, fetching reasoning chains`);
    
    try {
      // Fetch related reasoning chains
      const reasoningChains = await getReasoningChainsByProfileName(decodedName);
      console.log(`API route: Found ${reasoningChains.length} reasoning chains for ${decodedName}`);
      
      // Return both the profile and its related reasoning chains
      return NextResponse.json({ 
        profile,
        reasoningChains
      });
    } catch (chainsError) {
      console.error(`Error fetching reasoning chains for ${decodedName}:`, chainsError);
      // Still return the profile even if there's an error with reasoning chains
      return NextResponse.json({ 
        profile,
        reasoningChains: [],
        error: `Error fetching reasoning chains: ${chainsError.message}`
      });
    }
  } catch (error) {
    console.error(`API route: Error fetching profile ${name}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch profile', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 