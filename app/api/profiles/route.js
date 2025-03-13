import { NextResponse } from 'next/server';
import { getProfiles } from '@/lib/db';

export async function GET() {
  try {
    const profiles = await getProfiles();
    
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ 
        profiles: [], 
        message: 'No profiles found in the database' 
      }, { status: 200 });
    }
    
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error in profiles API route:', error);
    
    // Determine if this is a database connection error
    const errorMessage = error.message || 'Failed to fetch profiles';
    const statusCode = errorMessage.includes('Neo4j credentials') || 
                        errorMessage.includes('connect to Neo4j') ? 
                        500 : 404;
    
    return NextResponse.json({ 
      error: errorMessage,
      status: 'error'
    }, { status: statusCode });
  }
} 