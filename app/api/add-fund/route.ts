import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { generateLogoUrl } from '@/app/lib/brandfetch';
import { getConfig } from '@/app/lib/config';

export async function POST(request: Request) {
  try {
    const config = getConfig();
    const { name, website, stage, secret } = await request.json();

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!name || !website || !stage) {
      return NextResponse.json({ error: 'name, website, and stage are required' }, { status: 400 });
    }

    // Validate stage dynamically
    const validStages = config.stages.map(s => s.value);
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: `stage must be one of: ${validStages.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await sql`SELECT id FROM funds WHERE name = ${name}`;
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Fund with this name already exists' }, { status: 409 });
    }

    const logoUrl = generateLogoUrl(website);
    const result = await sql`
      INSERT INTO funds (name, website, stage, logo_url, elo_score, match_count)
      VALUES (${name}, ${website}, ${stage}, ${logoUrl}, 1000, 0)
      RETURNING *
    `;

    return NextResponse.json({
      message: 'Fund added successfully',
      fund: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding fund:', error);
    return NextResponse.json({ error: 'Failed to add fund' }, { status: 500 });
  }
}