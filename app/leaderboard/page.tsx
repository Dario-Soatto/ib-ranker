import { sql } from '@vercel/postgres';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';
import { getConfig } from '@/app/lib/config';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { stage?: string };
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const config = getConfig();
  const params = await searchParams;
  const selectedStage = params.stage;

  // Build SQL query with optional stage filter
  const { rows: funds } = selectedStage
    ? await sql`
        SELECT * FROM funds
        WHERE stage = ${selectedStage}
        ORDER BY elo_score DESC
      `
    : await sql`
        SELECT * FROM funds
        ORDER BY elo_score DESC
      `;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-700" />;
    return null;
  };

  const getStageLabel = (stageValue: string) => {
    const stageConfig = config.stages.find(s => s.value === stageValue);
    return stageConfig?.label || stageValue;
  };

  const getStageColor = (stageValue: string) => {
    const rankerType = process.env.NEXT_PUBLIC_RANKER_TYPE || 'vc';
    if (rankerType === 'ib') {
      if (stageValue === 'bulge bracket') return 'bg-blue-100 text-blue-800 border-blue-200';
      if (stageValue === 'elite boutique') return 'bg-purple-100 text-purple-800 border-purple-200';
      if (stageValue === 'middle market') return 'bg-green-100 text-green-800 border-green-200';
    } else if (rankerType === 'hf') {
      if (stageValue === 'multi-strategy') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      if (stageValue === 'long-short equity') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      if (stageValue === 'quantitative') return 'bg-cyan-100 text-cyan-800 border-cyan-200';
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
            {selectedStage 
              ? `${getStageLabel(selectedStage)} Rankings` 
              : 'Rankings based on community votes'}
          </p>
          
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Voting
            </Link>
          </Button>
        </div>

        {/* Stage Filter */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          <Button 
            asChild
            variant={!selectedStage ? "default" : "outline"}
            size="sm"
          >
            <Link href="/leaderboard">All</Link>
          </Button>
          {config.stages.map((stage) => (
            <Button
              key={stage.value}
              asChild
              variant={selectedStage === stage.value ? "default" : "outline"}
              size="sm"
            >
              <Link href={`/leaderboard?stage=${stage.value}`}>
                {stage.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Leaderboard */}
        <Card>
          <CardContent className="p-6">
            {funds.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No {selectedStage ? getStageLabel(selectedStage) : ''} funds found
              </div>
            ) : (
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

                    {/* Logo */}
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
                        <Badge variant="outline" className={`${getStageColor(fund.stage)} text-xs`}>
                          {getStageLabel(fund.stage)}
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
            )}
          </CardContent>
        </Card>

        {/* Stats Footer */}
        <div className="mt-8 text-center text-slate-600 space-y-1">
          <p className="font-medium">
            {selectedStage 
              ? `${getStageLabel(selectedStage)}: ${funds.length} ${funds.length === 1 ? 'fund' : 'funds'}`
              : `Total Funds: ${funds.length}`}
          </p>
          <p className="text-sm text-slate-500">
            Keep voting to refine the rankings
          </p>
        </div>
      </div>
    </div>
  );
}