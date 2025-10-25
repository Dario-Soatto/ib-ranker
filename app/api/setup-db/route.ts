import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create the funds table
    await sql`
      CREATE TABLE IF NOT EXISTS funds (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT NOT NULL,
        stage TEXT NOT NULL CHECK (stage IN ('bulge bracket', 'elite boutique', 'middle market')),        logo_url TEXT,
        elo_score INTEGER DEFAULT 1000,
        match_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return NextResponse.json({ message: 'Database setup complete' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}