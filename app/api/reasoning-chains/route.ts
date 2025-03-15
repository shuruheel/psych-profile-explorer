import { NextResponse } from 'next/server';
import { getReasoningChainsByProfileName } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Missing name parameter' },
        { status: 400 }
      );
    }

    const chains = await getReasoningChainsByProfileName(name);
    
    return NextResponse.json(chains);
  } catch (error) {
    console.error('[API] Error fetching reasoning chains:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 