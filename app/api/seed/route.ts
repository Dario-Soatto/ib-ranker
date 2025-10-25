import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

const initialFunds = [
  // Bulge Bracket Banks
  { name: 'Goldman Sachs', website: 'https://www.goldmansachs.com', stage: 'bulge bracket' },
  { name: 'Morgan Stanley', website: 'https://www.morganstanley.com', stage: 'bulge bracket' },
  { name: 'J.P. Morgan', website: 'https://www.jpmorgan.com', stage: 'bulge bracket' },
  { name: 'Bank of America', website: 'https://www.bankofamerica.com', stage: 'bulge bracket' },
  { name: 'Citigroup', website: 'https://www.citigroup.com', stage: 'bulge bracket' },
  { name: 'Barclays', website: 'https://www.barclays.com', stage: 'bulge bracket' },
  { name: 'Credit Suisse', website: 'https://www.credit-suisse.com', stage: 'bulge bracket' },
  { name: 'Deutsche Bank', website: 'https://www.db.com', stage: 'bulge bracket' },
  { name: 'UBS', website: 'https://www.ubs.com', stage: 'bulge bracket' },
  { name: 'HSBC', website: 'https://www.hsbc.com', stage: 'bulge bracket' },
  
  // Elite Boutique Banks
  { name: 'Lazard', website: 'https://www.lazard.com', stage: 'elite boutique' },
  { name: 'Evercore', website: 'https://www.evercore.com', stage: 'elite boutique' },
  { name: 'Centerview Partners', website: 'https://www.centerviewpartners.com', stage: 'elite boutique' },
  { name: 'Moelis & Company', website: 'https://www.moelis.com', stage: 'elite boutique' },
  { name: 'Rothschild & Co', website: 'https://www.rothschildandco.com', stage: 'elite boutique' },
  { name: 'PJT Partners', website: 'https://www.pjtpartners.com', stage: 'elite boutique' },
  { name: 'Perella Weinberg Partners', website: 'https://www.pwpartners.com', stage: 'elite boutique' },
  { name: 'Greenhill & Co', website: 'https://www.greenhill.com', stage: 'elite boutique' },
  { name: 'Guggenheim Partners', website: 'https://www.guggenheimpartners.com', stage: 'elite boutique' },
  { name: 'Houlihan Lokey', website: 'https://www.hl.com', stage: 'elite boutique' },
  { name: 'Jefferies', website: 'https://www.jefferies.com', stage: 'elite boutique' },
  { name: 'Qatalyst Partners', website: 'https://www.qatalyst.com', stage: 'elite boutique' },
  { name: 'LionTree Advisors', website: 'https://www.liontree.com', stage: 'elite boutique' },
{ name: 'Allen & Company', website: 'https://www.allenco.com', stage: 'elite boutique' },
{ name: 'Raine Group', website: 'https://www.raine.com', stage: 'elite boutique' },
{ name: 'Ardea Partners', website: 'https://www.ardeapartners.com', stage: 'elite boutique' },
  
  // Middle Market Banks
  { name: 'William Blair', website: 'https://www.williamblair.com', stage: 'middle market' },
  { name: 'Piper Sandler', website: 'https://www.pipersandler.com', stage: 'middle market' },
  { name: 'Raymond James', website: 'https://www.raymondjames.com', stage: 'middle market' },
  { name: 'Stifel', website: 'https://www.stifel.com', stage: 'middle market' },
  { name: 'Robert W. Baird', website: 'https://www.rwbaird.com', stage: 'middle market' },
  { name: 'Lincoln International', website: 'https://www.lincolninternational.com', stage: 'middle market' },
  { name: 'Harris Williams', website: 'https://www.harriswilliams.com', stage: 'middle market' },
  { name: 'KeyBanc Capital Markets', website: 'https://www.key.com', stage: 'middle market' },
  { name: 'BMO Capital Markets', website: 'https://www.bmo.com', stage: 'middle market' },
  { name: 'Wells Fargo Securities', website: 'https://www.wellsfargo.com', stage: 'middle market' },
  { name: 'RBC Capital Markets', website: 'https://www.rbccm.com', stage: 'middle market' },
  { name: 'Cowen', website: 'https://www.cowen.com', stage: 'middle market' },
  { name: 'Stephens', website: 'https://www.stephens.com', stage: 'middle market' },
  { name: 'Truist Securities', website: 'https://www.truist.com', stage: 'middle market' },
  { name: 'Oppenheimer & Co', website: 'https://www.opco.com', stage: 'middle market' },
  { name: 'Canaccord Genuity', website: 'https://www.canaccordgenuity.com', stage: 'middle market' },
  { name: 'Needham & Company', website: 'https://www.needhamco.com', stage: 'middle market' },
  { name: 'D.A. Davidson', website: 'https://www.dadavidson.com', stage: 'middle market' },
  { name: 'Macquarie Capital', website: 'https://www.macquarie.com', stage: 'middle market' },
  { name: 'Imperial Capital', website: 'https://www.imperialcapital.com', stage: 'middle market' },
  { name: 'Nomura', website: 'https://www.nomura.com', stage: 'middle market' },
  { name: 'Mizuho Financial Group', website: 'https://www.mizuhogroup.com', stage: 'middle market' },
  { name: 'BNP Paribas', website: 'https://group.bnpparibas', stage: 'middle market' },
  { name: 'SMBC Nikko Securities', website: 'https://www.smbcnikko.co.jp/en', stage: 'middle market' },
  { name: 'FT Partners', website: 'https://www.ftpartners.com', stage: 'middle market' },
  { name: 'DC Advisory', website: 'https://www.dcadvisory.com', stage: 'middle market' },

];

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

    // STEP 1: Save existing logo URLs
    const existingLogos = await sql`
      SELECT name, logo_url FROM funds WHERE logo_url IS NOT NULL
    `;
    
    // Create a map of name -> logo_url
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