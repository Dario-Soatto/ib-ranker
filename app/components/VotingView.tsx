'use client';

import { useState, useEffect } from 'react';
import { SanitizedFund } from '@/app/lib/types';
import FundCard from './FundCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy, ArrowRight, Loader2, SkipForward, LayoutGrid } from 'lucide-react';
import { getConfig } from '@/app/lib/config';

const config = getConfig();

export default function VotingView() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [currentPair, setCurrentPair] = useState<[SanitizedFund, SanitizedFund] | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedWinnerIndex, setSelectedWinnerIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voteResults, setVoteResults] = useState<{
    winner: {
      oldElo: number;
      newElo: number;
      oldRank: number;
      newRank: number;
    };
    loser: {
      oldElo: number;
      newElo: number;
      oldRank: number;
      newRank: number;
    };
    total: number;
  } | null>(null);

  // Initial load
  useEffect(() => {
    fetchNewPair();
  }, []);

  // Fetch new pair when stage filter changes
  useEffect(() => {
    if (!isLoading) {
      fetchNewPair();
    }
  }, [selectedStage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isVoting || !currentPair) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (!hasVoted) {
            e.preventDefault();
            handleVote(0);
          }
          break;
        
        case 'ArrowRight':
          if (!hasVoted) {
            e.preventDefault();
            handleVote(1);
          }
          break;
        
        case ' ':
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isVoting, hasVoted, currentPair]);

  const fetchNewPair = async () => {
    try {
      const response = await fetch('/api/get-pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: selectedStage }),
      });
      const data = await response.json();
      setCurrentPair(data.pair);
      setCurrentToken(data.token);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch pair:', error);
      setIsLoading(false);
    }
  };

  const handleVote = async (winnerIndex: number) => {
    if (!currentToken) return;
    
    setIsVoting(true);
    setSelectedWinnerIndex(winnerIndex);
    setErrorMessage(null);
    
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, winnerIndex }),
      });
  
      if (response.ok) {
        const data = await response.json();
        setVoteResults(data);
        
        if (currentPair) {
          const updatedPair: [SanitizedFund, SanitizedFund] = [
            {
              ...currentPair[0],
              elo_score: winnerIndex === 0 ? data.winner.newElo : data.loser.newElo,
              match_count: currentPair[0].match_count + 1,
            },
            {
              ...currentPair[1],
              elo_score: winnerIndex === 1 ? data.winner.newElo : data.loser.newElo,
              match_count: currentPair[1].match_count + 1,
            },
          ];
          
          setCurrentPair(updatedPair);
          setHasVoted(true);
        }
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to submit vote. Please try again.');
      }
    } catch (error) {
      console.error('Voting error:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleNext = () => {
    setHasVoted(false);
    setSelectedWinnerIndex(null);
    setVoteResults(null);
    setErrorMessage(null);
    fetchNewPair();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!currentPair) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl text-muted-foreground">Loading matchup...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* More Rankers Button - Top Left */}
        <div className="absolute top-4 left-4">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href="https://www.corporateranker.com" target="_blank" rel="noopener noreferrer">
              <LayoutGrid className="w-4 h-4" />
              More Rankers
            </a>
          </Button>
        </div>

        {/* Leaderboard Button - Top Right */}
        <div className="absolute top-4 right-4">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/leaderboard">
              <Trophy className="w-4 h-4" />
              View Leaderboard
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold text-slate-900">
            {config.title}
          </h1>
          <p className="text-lg text-slate-600">
            {hasVoted 
              ? 'Rankings updated! Click Next for another matchup.' 
              : `Which ${config.entityName} is better? Click to vote.`}
          </p>
          
          {/* Keyboard shortcut hints */}
          <div className="text-sm text-slate-500">
            Use ← → arrow keys to vote, Space/Enter to {hasVoted ? 'continue' : 'skip'}
          </div>

          {/* Stage Filter */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            <Button 
              onClick={() => setSelectedStage(null)}
              variant={!selectedStage ? "default" : "outline"}
              size="sm"
            >
              All
            </Button>
            {config.stages.map((stage) => (
              <Button
                key={stage.value}
                onClick={() => setSelectedStage(stage.value)}
                variant={selectedStage === stage.value ? "default" : "outline"}
                size="sm"
              >
                {stage.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Two Cards Side by Side */}
        <div className="flex flex-col lg:flex-row gap-8 justify-center items-center mb-8">
          {/* Card 1 */}
          <div className={`
            w-full max-w-md
            transition-all duration-300
            ${hasVoted && selectedWinnerIndex === 0 ? 'scale-105' : ''}
          `}>
            <FundCard
              fund={currentPair[0]}
              onClick={() => handleVote(0)}
              isWinner={hasVoted && selectedWinnerIndex === 0}
              isLoser={hasVoted && selectedWinnerIndex === 1}
              disabled={isVoting || hasVoted}
              voteData={hasVoted && voteResults ? {
                ...(selectedWinnerIndex === 0 ? voteResults.winner : voteResults.loser),
                total: voteResults.total
              } : null}
            />
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center lg:mx-4">
            <div className="text-2xl font-bold text-slate-400">
              VS
            </div>
          </div>

          {/* Card 2 */}
          <div className={`
            w-full max-w-md
            transition-all duration-300
            ${hasVoted && selectedWinnerIndex === 1 ? 'scale-105' : ''}
          `}>
            <FundCard
              fund={currentPair[1]}
              onClick={() => handleVote(1)}
              isWinner={hasVoted && selectedWinnerIndex === 1}
              isLoser={hasVoted && selectedWinnerIndex === 0}
              disabled={isVoting || hasVoted}
              voteData={hasVoted && voteResults ? {
                ...(selectedWinnerIndex === 1 ? voteResults.winner : voteResults.loser),
                total: voteResults.total
              } : null}
            />
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800 font-medium">{errorMessage}</p>
              <p className="text-red-600 text-sm mt-1">
                Please wait a moment before voting again.
              </p>
            </div>
          </div>
        )}

        {/* Status and Skip/Next Button */}
        <div className="text-center mt-8">
          {isVoting ? (
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Updating rankings...</span>
            </div>
          ) : (
            <Button 
              onClick={handleNext}
              size="lg"
              variant={hasVoted ? "default" : "outline"}
              className="gap-2"
            >
              {hasVoted ? (
                <>
                  Next Matchup <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Skip <SkipForward className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}