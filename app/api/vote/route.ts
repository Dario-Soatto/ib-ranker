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

    const oldWinnerRating = winner.rows[0].elo_score;
    const oldLoserRating = loser.rows[0].elo_score;

    // Calculate OLD rankings (before update)
    const oldWinnerRankResult = await sql`
      SELECT COUNT(*) + 1 as rank
      FROM funds
      WHERE elo_score > ${oldWinnerRating}
    `;
    
    const oldLoserRankResult = await sql`
      SELECT COUNT(*) + 1 as rank
      FROM funds
      WHERE elo_score > ${oldLoserRating}
    `;

    // Calculate new ELO scores
    const { newWinnerRating, newLoserRating } = calculateElo(
      oldWinnerRating,
      oldLoserRating
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

    // Calculate NEW rankings (after update)
    const newWinnerRankResult = await sql`
      SELECT COUNT(*) + 1 as rank
      FROM funds
      WHERE elo_score > ${newWinnerRating}
    `;
    
    const newLoserRankResult = await sql`
      SELECT COUNT(*) + 1 as rank
      FROM funds
      WHERE elo_score > ${newLoserRating}
    `;

    const totalFunds = await sql`SELECT COUNT(*) as total FROM funds`;

    return NextResponse.json({
      success: true,
      winner: {
        oldElo: oldWinnerRating,
        newElo: newWinnerRating,
        oldRank: parseInt(oldWinnerRankResult.rows[0].rank),
        newRank: parseInt(newWinnerRankResult.rows[0].rank),
      },
      loser: {
        oldElo: oldLoserRating,
        newElo: newLoserRating,
        oldRank: parseInt(oldLoserRankResult.rows[0].rank),
        newRank: parseInt(newLoserRankResult.rows[0].rank),
      },
      total: parseInt(totalFunds.rows[0].total),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ratings' }, { status: 500 });
  }
}