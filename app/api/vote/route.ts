import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { calculateElo } from '@/app/lib/elo';

// Track votes per IP with timestamps for each winner
const voteTracker = new Map<string, { 
  winnerVoteTimestamps: Map<number, number[]>; // winnerId -> array of timestamps
}>();

const MAX_WINNER_VOTES_PER_MINUTE = 4;  // Per specific fund
const MAX_WINNER_VOTES_PER_HOUR = 40;   // Per specific fund

function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}

function checkRateLimit(
  key: string, 
  winnerId: number
): { allowed: boolean; reason?: string } {
  const now = Date.now();
  let data = voteTracker.get(key);
  
  if (!data) {
    data = { 
      winnerVoteTimestamps: new Map() 
    };
    voteTracker.set(key, data);
  }
  
  // Get timestamps for this specific winner
  let timestamps = data.winnerVoteTimestamps.get(winnerId) || [];
  
  // Remove timestamps older than 1 hour (cleanup)
  const oneHourAgo = now - (60 * 60 * 1000);
  timestamps = timestamps.filter(ts => ts > oneHourAgo);
  
  // Update the cleaned timestamps
  data.winnerVoteTimestamps.set(winnerId, timestamps);
  
  // Check per-hour limit for this specific winner
  if (timestamps.length >= MAX_WINNER_VOTES_PER_HOUR) {
    return { 
      allowed: false, 
      reason: `You have voted for this firm too many times. Limit: ${MAX_WINNER_VOTES_PER_HOUR} votes per hour per firm.` 
    };
  }
  
  // Check per-minute limit for this specific winner
  const oneMinuteAgo = now - (60 * 1000);
  const recentVotes = timestamps.filter(ts => ts > oneMinuteAgo).length;
  
  if (recentVotes >= MAX_WINNER_VOTES_PER_MINUTE) {
    return { 
      allowed: false, 
      reason: `You are voting for this firm too quickly. Limit: ${MAX_WINNER_VOTES_PER_MINUTE} votes per minute per firm.` 
    };
  }
  
  return { allowed: true };
}

function recordVote(key: string, winnerId: number) {
  const data = voteTracker.get(key);
  if (!data) return;
  
  const now = Date.now();
  
  // Get existing timestamps for this winner
  const timestamps = data.winnerVoteTimestamps.get(winnerId) || [];
  
  // Add current timestamp
  timestamps.push(now);
  
  // Store back
  data.winnerVoteTimestamps.set(winnerId, timestamps);
}

export async function POST(request: Request) {
  try {
    const { winnerId, loserId } = await request.json();

    // Basic validation
    if (!winnerId || !loserId) {
      return NextResponse.json(
        { error: 'Winner and loser IDs are required' },
        { status: 400 }
      );
    }

    // Prevent voting for the same fund
    if (winnerId === loserId) {
      return NextResponse.json(
        { error: 'Cannot vote for the same fund twice' },
        { status: 400 }
      );
    }

    // Rate limiting (checks winner-specific limits)
    const rateLimitKey = getRateLimitKey(request);
    const { allowed, reason } = checkRateLimit(rateLimitKey, winnerId);
    
    if (!allowed) {
      return NextResponse.json(
        { error: reason },
        { status: 429 }
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

    // Calculate OLD rankings
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

    // Calculate NEW rankings
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

    // Record the vote AFTER successful database update
    recordVote(rateLimitKey, winnerId);

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