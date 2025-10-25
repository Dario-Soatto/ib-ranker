import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { generateLogoUrl } from '@/app/lib/brandfetch';

export async function GET() {
  try {
    // Check if client ID is set
    const clientId = process.env.BRANDFETCH_CLIENT_ID;
    console.log('Client ID present:', !!clientId);
    console.log('Client ID length:', clientId?.length);
    
    if (!clientId) {
      return NextResponse.json({ 
        error: 'BRANDFETCH_CLIENT_ID environment variable not set',
        hint: 'Add it to your .env.local file'
      }, { status: 500 });
    }
    
    // Get all funds that need logo URLs
    const { rows: funds } = await sql`
      SELECT id, name, website, logo_url 
      FROM funds 
      WHERE logo_url IS NULL OR logo_url = ''
    `;

    console.log(`Generating logo URLs for ${funds.length} funds...`);

    let succeeded = 0;
    let failed = 0;

    // Generate and store logo URLs for each fund
    for (const fund of funds) {
      try {
        const logoUrl = generateLogoUrl(fund.website);
        
        await sql`
          UPDATE funds 
          SET logo_url = ${logoUrl}
          WHERE id = ${fund.id}
        `;
        
        console.log(`✓ ${fund.name}: ${logoUrl}`);
        succeeded++;
      } catch (error) {
        console.log(`✗ ${fund.name}: ${error}`);
        failed++;
      }
    }

    return NextResponse.json({ 
      message: 'Logo URLs generated and stored',
      succeeded,
      failed,
      total: funds.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating logo URLs:', error);
    return NextResponse.json({ 
      error: 'Failed to generate logo URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}