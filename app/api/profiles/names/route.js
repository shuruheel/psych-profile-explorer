import { NextResponse } from 'next/server';
import { getProfileNames } from '@/lib/db';

export async function GET() {
  try {
    const profileNames = await getProfileNames();
    
    if (!profileNames || profileNames.length === 0) {
      return NextResponse.json({ 
        names: [], 
        message: 'No profiles found in the database' 
      }, { status: 200 });
    }
    
    return NextResponse.json(profileNames);
  } catch (error) {
    console.error('Error in profile names API route:', error);
    
    // Determine if this is a database connection error
    const errorMessage = error.message || 'Failed to fetch profile names';
    const statusCode = errorMessage.includes('Neo4j credentials') || 
                      errorMessage.includes('connect to Neo4j') ? 
                      500 : 404;
    
    return NextResponse.json({ 
      error: errorMessage,
      status: 'error'
    }, { status: statusCode });
  }
} 