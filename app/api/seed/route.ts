import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { getSeedData } from '@/app/lib/seedData';

export async function GET(request: Request) {
  try {
    // Check secret from query parameter
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing secret' },
        { status: 401 }
      );
    }

    // Get seed data based on ranker type
    const initialFunds = getSeedData();

    // STEP 1: Save existing logo URLs
    const existingLogos = await sql`
      SELECT name, logo_url FROM funds WHERE logo_url IS NOT NULL
    `;
    
    const logoMap = new Map(
      existingLogos.rows.map(row => [row.name, row.logo_url])
    );

    console.log(`Preserving ${logoMap.size} existing logos`);

    // STEP 2: Delete all existing data and reset
    await sql`DELETE FROM funds`;
    await sql`ALTER SEQUENCE funds_id_seq RESTART WITH 1`;

    // STEP 3: Insert funds with preserved logos
    for (const fund of initialFunds) {
      const logoUrl = logoMap.get(fund.name) || null;
      
      await sql`
        INSERT INTO funds (name, website, stage, logo_url, elo_score)
        VALUES (${fund.name}, ${fund.website}, ${fund.stage}, ${logoUrl}, 1000)
      `;
      
      if (logoUrl) {
        console.log(`✓ ${fund.name}: Restored logo`);
      }
    }

    return NextResponse.json({ 
      message: 'Database seeded successfully with preserved logos',
      count: initialFunds.length,
      logosPreserved: logoMap.size
    }, { status: 200 });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}