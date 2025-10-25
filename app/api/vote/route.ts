import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { calculateElo } from '@/app/lib/elo';

export async function POST(request: Request) {
  try {
    const { winnerId, loserId } = await request.json();

    if (!winnerId || !loserId) {
      return NextResponse.json(
        { error: 'Winner and loser IDs are required' },
        { status: 400 }
      );
    }

    // Get current ratings
    const winner = await sql`SELECT elo_score, match_count FROM funds WHERE id = ${winnerId}`;
    const loser = await sql`SELECT elo_score, match_count FROM funds WHERE id = ${loserId}`;

    if (winner.rows.length === 0 || loser.rows.length === 0) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 });
    }

    // Calculate new ELO scores
    const { newWinnerRating, newLoserRating } = calculateElo(
      winner.rows[0].elo_score,
      loser.rows[0].elo_score
    );

    // Update both funds
    await sql`
      UPDATE funds 
      SET elo_score = ${newWinnerRating}, match_count = match_count + 1
      WHERE id = ${winnerId}
    `;

    await sql`
      UPDATE funds 
      SET elo_score = ${newLoserRating}, match_count = match_count + 1
      WHERE id = ${loserId}
    `;

    return NextResponse.json({
      success: true,
      newRatings: {
        winner: newWinnerRating,
        loser: newLoserRating,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ratings' }, { status: 500 });
  }
}