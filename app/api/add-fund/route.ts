import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { generateLogoUrl } from '@/app/lib/brandfetch';

export async function POST(request: Request) {
  try {
    const { name, website, stage, secret } = await request.json();

    // Check authentication
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!name || !website || !stage) {
      return NextResponse.json(
        { error: 'name, website, and stage are required' },
        { status: 400 }
      );
    }

    // Validate stage
    if (!['bulge bracket', 'elite boutique', 'middle market'].includes(stage)) {
      return NextResponse.json(
        { error: 'stage must be "bulge bracket", "elite boutique", or "middle market"' },
        { status: 400 }
      );
    }

    // Check if fund already exists
    const existing = await sql`
      SELECT id FROM funds WHERE name = ${name}
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Fund with this name already exists' },
        { status: 409 }
      );
    }

    // Generate logo URL
    const logoUrl = generateLogoUrl(website);

    // Insert new fund
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
    return NextResponse.json(
      { error: 'Failed to add fund' },
      { status: 500 }
    );
  }
}