import { sql } from '@vercel/postgres';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';
import { getConfig } from '@/app/lib/config';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const config = getConfig();
  
  const { rows: funds } = await sql`
    SELECT * FROM funds
    ORDER BY elo_score DESC
  `;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-700" />;
    return null;
  };

  // Get stage label from config
  const getStageLabel = (stageValue: string) => {
    const stageConfig = config.stages.find(s => s.value === stageValue);
    return stageConfig?.label || stageValue;
  };

  // Get stage colors (matching FundCard)
  const getStageColor = (stageValue: string) => {
    const rankerType = process.env.NEXT_PUBLIC_RANKER_TYPE || 'vc';
    if (rankerType === 'ib') {
      if (stageValue === 'bulge bracket') return 'bg-blue-100 text-blue-800 border-blue-200';
      if (stageValue === 'elite boutique') return 'bg-purple-100 text-purple-800 border-purple-200';
      if (stageValue === 'middle market') return 'bg-green-100 text-green-800 border-green-200';
    } else {
      if (stageValue === 'early') return 'bg-green-100 text-green-800 border-green-200';
      if (stageValue === 'multi') return 'bg-blue-100 text-blue-800 border-blue-200';
      if (stageValue === 'late') return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold text-slate-900">
            Leaderboard
          </h1>
          <p className="text-lg text-slate-600">
            Rankings based on community votes
          </p>
          
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Voting
            </Link>
          </Button>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              {funds.map((fund, index) => (
                <div
                  key={fund.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white"
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex-shrink-0">
                    {getRankIcon(index) || (
                      <span className="font-semibold text-slate-700">{index + 1}</span>
                    )}
                  </div>

                  {/* Logo - simplified without onError */}
                  {fund.logo_url ? (
                    <img
                      src={fund.logo_url}
                      alt={`${fund.name} logo`}
                      className="w-10 h-10 object-contain border border-slate-200 flex-shrink-0 rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
                      <span className="font-semibold text-slate-700 text-sm">
                        {fund.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Fund Info */}
                    <div className="flex-1 min-w-0">
                    <a 
                        href={fund.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-slate-900 hover:text-blue-600 truncate block transition-colors"
                    >
                        {fund.name}
                    </a>
                    <div className="flex flex-wrap gap-2 mt-1 items-center">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs">
                        {fund.stage.charAt(0).toUpperCase() + fund.stage.slice(1)}
                        </Badge>
                        <span className="text-xs text-slate-500">
                        {fund.match_count} {fund.match_count === 1 ? 'match' : 'matches'}
                        </span>
                    </div>
                    </div>

                  {/* ELO Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-slate-900">
                      {fund.elo_score}
                    </div>
                    <div className="text-xs text-slate-500">ELO</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Footer */}
        <div className="mt-8 text-center text-slate-600 space-y-1">
          <p className="font-medium">Total Funds: {funds.length}</p>
          <p className="text-sm text-slate-500">
            Keep voting to refine the rankings
          </p>
        </div>
      </div>
    </div>
  );
}