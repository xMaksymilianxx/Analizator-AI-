import { NextRequest, NextResponse } from 'next/server';
import { apiFootballClient } from '@/lib/api-clients/api-football';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const status = searchParams.get('status') || undefined;
    const live = searchParams.get('live') === 'true';

    const matches = await apiFootballClient.fetchMatches({ date, status, live });

    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        try {
          const odds = await apiFootballClient.fetchOdds(match.id);
          return { ...match, odds };
        } catch (oddsError) {
          console.error(`Could not fetch odds for match ${match.id}`, oddsError);
          return { ...match, odds: {} };
        }
      })
    );

    return NextResponse.json({
      success: true,
      count: enrichedMatches.length,
      matches: enrichedMatches,
    });

  } catch (error: any) {
    console.error('[API /matches] CRITICAL ERROR:', error.message);
    return NextResponse.json({ success: false, error: error.message, matches: [] }, { status: 500 });
  }
}
