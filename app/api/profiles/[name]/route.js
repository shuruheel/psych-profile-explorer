import { NextResponse } from 'next/server';
import { getProfileByName } from '@/lib/db';

export async function GET(request, context) {
  // Properly await params before destructuring
  const params = await context.params;
  const { name } = params;
  
  try {
    const profile = await getProfileByName(decodeURIComponent(name));
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error(`Error fetching profile ${name}:`, error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
} 