import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getConfig } from '@/app/lib/config';

export async function GET() {
  try {
    const config = getConfig();
    const validStages = config.stages.map(s => s.value);
    
    // Create the funds table with dynamic stage constraint
    const stageConstraint = validStages.map(s => `'${s}'`).join(', ');
    
    await sql.query(`
      CREATE TABLE IF NOT EXISTS funds (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT NOT NULL,
        stage TEXT NOT NULL CHECK (stage IN (${stageConstraint})),
        logo_url TEXT,
        elo_score INTEGER DEFAULT 1000,
        match_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return NextResponse.json({ 
      message: 'Database setup complete',
      stages: validStages 
    }, { status: 200 });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
}