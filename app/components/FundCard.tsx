import { Fund } from '@/app/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { getConfig } from '@/app/lib/config';


interface FundCardProps {
  fund: Fund;
  onClick: () => void;
  isClickable?: boolean;
  showGlow?: boolean;
  showElo?: boolean;
  voteData?: {
    oldElo: number;
    newElo: number;
    oldRank: number;
    newRank: number;
    total: number;
  } | null;
}

export default function FundCard({ 
  fund, 
  onClick, 
  isClickable = true,
  showGlow = false,
  showElo = true,
  voteData = null
}: FundCardProps) {
  const config = getConfig();
  const [imageError, setImageError] = useState(false);
  
  // Get stage config for this fund's stage
  const stageConfig = config.stages.find(s => s.value === fund.stage);
  
  // Default colors by type
  const getStageColor = () => {
    const rankerType = process.env.NEXT_PUBLIC_RANKER_TYPE || 'vc';
    if (rankerType === 'ib') {
      if (fund.stage === 'bulge bracket') return 'bg-blue-100 text-blue-800 border-blue-200';
      if (fund.stage === 'elite boutique') return 'bg-purple-100 text-purple-800 border-purple-200';
      if (fund.stage === 'middle market') return 'bg-green-100 text-green-800 border-green-200';
    } else {
      if (fund.stage === 'early') return 'bg-green-100 text-green-800 border-green-200';
      if (fund.stage === 'multi') return 'bg-blue-100 text-blue-800 border-blue-200';
      if (fund.stage === 'late') return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <Card
      onClick={isClickable ? onClick : undefined}
      className={`
        w-full max-w-md
        transition-all duration-200
        ${isClickable ? 'hover:shadow-lg hover:border-slate-300 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
        ${showGlow ? 'ring-2 ring-slate-900 shadow-xl border-slate-900' : 'border-gray-200'}
      `}
    >
      <CardHeader className="text-center pb-4 space-y-4">
        {/* Logo */}
        {fund.logo_url && !imageError ? (
          <img
            src={fund.logo_url}
            alt={`${fund.name} logo`}
            className="w-20 h-20 mx-auto object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
            <span className="text-3xl font-semibold text-slate-700">
              {fund.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold text-slate-900">
            {fund.name}
          </CardTitle>
          
          {/* Stage Badge */}
          <div className="flex justify-center">
            <Badge variant="outline" className={getStageColor()}>
              {stageConfig?.label || fund.stage}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="text-center space-y-3">
        {/* ELO Score and Ranking */}
        {showElo ? (
          voteData ? (
            // After voting - show old and new
            <div className="py-2 space-y-3">
              {/* Ranking */}
              <div className="border-b border-slate-200 pb-3">
                <p className="text-xs text-slate-500 mb-2">Ranking</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-slate-400 line-through">
                    #{voteData.oldRank}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={`text-3xl font-bold ${
                    voteData.newRank < voteData.oldRank 
                      ? 'text-green-600' 
                      : voteData.newRank > voteData.oldRank
                      ? 'text-red-600'
                      : 'text-slate-900'
                  }`}>
                    #{voteData.newRank}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  out of {voteData.total}
                </p>
              </div>
              
              {/* ELO Score */}
              <div>
                <p className="text-xs text-slate-500 mb-2">ELO Rating</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl font-semibold text-slate-400 line-through">
                    {voteData.oldElo}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className={`text-2xl font-bold ${
                    voteData.newElo > voteData.oldElo 
                      ? 'text-green-600' 
                      : voteData.newElo < voteData.oldElo
                      ? 'text-red-600'
                      : 'text-slate-900'
                  }`}>
                    {voteData.newElo}
                  </span>
                </div>
                <p className={`text-xs font-medium mt-1 ${
                  voteData.newElo > voteData.oldElo 
                    ? 'text-green-600' 
                    : voteData.newElo < voteData.oldElo
                    ? 'text-red-600'
                    : 'text-slate-500'
                }`}>
                  {voteData.newElo > voteData.oldElo 
                    ? `+${voteData.newElo - voteData.oldElo}` 
                    : voteData.newElo < voteData.oldElo
                    ? `${voteData.newElo - voteData.oldElo}`
                    : 'No change'}
                </p>
              </div>
            </div>
          ) : (
            // Before voting - show current
            <div className="py-2">
              <p className="text-sm text-slate-500 mb-1">ELO Rating</p>
              <p className="text-4xl font-bold text-slate-900">
                {fund.elo_score}
              </p>
            </div>
          )
        ) : (
          <div className="h-20 flex items-center justify-center">
            <p className="text-sm text-slate-400">Vote to reveal rating</p>
          </div>
        )}

        {/* Match Count */}
        <p className="text-sm text-slate-500">
          {fund.match_count} {fund.match_count === 1 ? 'match' : 'matches'}
        </p>

        {/* Website Link */}
        <a
          href={fund.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          Visit Website <ExternalLink className="w-3 h-3" />
        </a>
      </CardContent>
    </Card>
  );
}