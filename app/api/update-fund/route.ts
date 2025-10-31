import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { generateLogoUrl } from '@/app/lib/brandfetch';

export async function POST(request: Request) {
  try {
    const { fundName, newWebsite, logo_url, secret } = await request.json();

    // Check authentication
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!fundName) {
      return NextResponse.json(
        { error: 'fundName is required' },
        { status: 400 }
      );
    }

    // Build update query dynamically based on what's provided
    let updateQuery;
    
    if (newWebsite !== undefined && logo_url !== undefined) {
      // Both website and logo_url provided
      const logoUrl = logo_url === null ? null : logo_url;
      updateQuery = sql`
        UPDATE funds 
        SET website = ${newWebsite}, logo_url = ${logoUrl}
        WHERE name = ${fundName}
        RETURNING *
      `;
    } else if (newWebsite !== undefined) {
      // Only website provided - generate new logo
      const newLogoUrl = generateLogoUrl(newWebsite);
      updateQuery = sql`
        UPDATE funds 
        SET website = ${newWebsite}, logo_url = ${newLogoUrl}
        WHERE name = ${fundName}
        RETURNING *
      `;
    } else if (logo_url !== undefined) {
      // Only logo_url provided (can be null)
      updateQuery = sql`
        UPDATE funds 
        SET logo_url = ${logo_url}
        WHERE name = ${fundName}
        RETURNING *
      `;
    } else {
      return NextResponse.json(
        { error: 'Either newWebsite or logo_url must be provided' },
        { status: 400 }
      );
    }

    const result = await updateQuery;

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