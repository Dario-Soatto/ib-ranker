import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// In-memory store for active voting sessions
// For production, consider Redis or database storage
const activeSessions = new Map<string, {
  fund1Id: number;
  fund2Id: number;
  createdAt: number;
  stage?: string | null;
}>();

// Clean up expired sessions (older than 10 minutes)
function cleanupExpiredSessions() {
  const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
  for (const [token, session] of activeSessions.entries()) {
    if (session.createdAt < tenMinutesAgo) {
      activeSessions.delete(token);
    }
  }
}

export async function POST(request: Request) {
  try {
    const { stage } = await request.json();
    
    // Clean up old sessions periodically
    if (Math.random() < 0.1) { // 10% chance on each request
      cleanupExpiredSessions();
    }

    // Build query based on stage filter
    let query;
    if (stage) {
      query = sql`SELECT * FROM funds WHERE stage = ${stage} ORDER BY RANDOM() LIMIT 2`;
    } else {
      query = sql`SELECT * FROM funds ORDER BY RANDOM() LIMIT 2`;
    }

    const result = await query;

    if (result.rows.length < 2) {
      return NextResponse.json(
        { error: 'Not enough funds available' },
        { status: 400 }
      );
    }

    const [fund1, fund2] = result.rows;

    // Generate secure random token
    const token = randomBytes(32).toString('hex');

    // Store session
    activeSessions.set(token, {
      fund1Id: fund1.id,
      fund2Id: fund2.id,
      createdAt: Date.now(),
      stage,
    });

    // Return funds WITHOUT their IDs (remove id field)
    const sanitizedFund1 = {
      name: fund1.name,
      website: fund1.website,
      stage: fund1.stage,
      logo_url: fund1.logo_url,
      elo_score: fund1.elo_score,
      match_count: fund1.match_count,
    };

    const sanitizedFund2 = {
      name: fund2.name,
      website: fund2.website,
      stage: fund2.stage,
      logo_url: fund2.logo_url,
      elo_score: fund2.elo_score,
      match_count: fund2.match_count,
    };

    return NextResponse.json({
      token,
      pair: [sanitizedFund1, sanitizedFund2],
    });
  } catch (error) {
    console.error('Error generating pair:', error);
    return NextResponse.json(
      { error: 'Failed to generate pair' },
      { status: 500 }
    );
  }
}

// Export the session map so vote route can access it
export { activeSessions };