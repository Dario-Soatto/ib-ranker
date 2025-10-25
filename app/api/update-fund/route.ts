import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { generateLogoUrl } from '@/app/lib/brandfetch';

export async function POST(request: Request) {
  try {
    const { fundName, newWebsite, secret } = await request.json();

    // Check authentication
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!fundName || !newWebsite) {
      return NextResponse.json(
        { error: 'fundName and newWebsite are required' },
        { status: 400 }
      );
    }

    const newLogoUrl = generateLogoUrl(newWebsite);

    const result = await sql`
      UPDATE funds 
      SET website = ${newWebsite}, logo_url = ${newLogoUrl}
      WHERE name = ${fundName}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Fund not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Fund updated successfully',
      fund: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating fund:', error);
    return NextResponse.json(
      { error: 'Failed to update fund' },
      { status: 500 }
    );
  }
}