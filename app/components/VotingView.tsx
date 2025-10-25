'use client';

import { useState, useEffect } from 'react';
import { Fund } from '@/app/lib/types';
import FundCard from './FundCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy, ArrowRight, Loader2, SkipForward } from 'lucide-react';

export default function VotingView() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [currentPair, setCurrentPair] = useState<[Fund, Fund] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);

  useEffect(() => {
    fetchFunds();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if we're voting or no pair is loaded
      if (isVoting || !currentPair) return;

      switch (e.key) {
        case 'ArrowLeft':
          // Vote for left card (only if not already voted)
          if (!hasVoted) {
            e.preventDefault();
            handleVote(currentPair[0].id, currentPair[1].id);
          }
          break;
        
        case 'ArrowRight':
          // Vote for right card (only if not already voted)
          if (!hasVoted) {
            e.preventDefault();
            handleVote(currentPair[1].id, currentPair[0].id);
          }
          break;
        
        case ' ':
        case 'Enter':
        case 'Tab':
          // Skip or Next
          e.preventDefault();
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isVoting, hasVoted, currentPair]); // Re-run when these change

  const fetchFunds = async () => {
    try {
      const response = await fetch('/api/funds');
      const data = await response.json();
      setFunds(data);
      
      if (!currentPair) {
        setCurrentPair(getRandomPair(data));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    }
  };

  const getRandomPair = (fundsList: Fund[]): [Fund, Fund] | null => {
    if (fundsList.length < 2) return null;
    
    const shuffled = [...fundsList].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  };

  const updateCurrentPairScores = (fundsList: Fund[]) => {
    if (!currentPair) return;
    
    const updatedFund1 = fundsList.find(f => f.id === currentPair[0].id);
    const updatedFund2 = fundsList.find(f => f.id === currentPair[1].id);
    
    if (updatedFund1 && updatedFund2) {
      setCurrentPair([updatedFund1, updatedFund2]);
    }
  };

  const handleVote = async (winnerId: number, loserId: number) => {
    setIsVoting(true);
    setSelectedWinnerId(winnerId);
  
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, loserId }),
      });
  
      if (response.ok) {
        const data = await response.json();
        
        // Optimistically update just the two funds in our state
        if (currentPair) {
          const updatedPair: [Fund, Fund] = [
            {
              ...currentPair[0],
              elo_score: currentPair[0].id === winnerId 
                ? data.newRatings.winner 
                : data.newRatings.loser,
              match_count: currentPair[0].match_count + 1,
            },
            {
              ...currentPair[1],
              elo_score: currentPair[1].id === winnerId 
                ? data.newRatings.winner 
                : data.newRatings.loser,
              match_count: currentPair[1].match_count + 1,
            },
          ];
          
          setCurrentPair(updatedPair);
          
          // Also update the funds array for when we get the next pair
          setFunds(prevFunds => 
            prevFunds.map(fund => {
              if (fund.id === winnerId) {
                return { ...fund, elo_score: data.newRatings.winner, match_count: fund.match_count + 1 };
              }
              if (fund.id === loserId) {
                return { ...fund, elo_score: data.newRatings.loser, match_count: fund.match_count + 1 };
              }
              return fund;
            })
          );
        }
        
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleNext = () => {
    const newPair = getRandomPair(funds);
    setCurrentPair(newPair);
    setHasVoted(false);
    setSelectedWinnerId(null);
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
        <p className="text-xl text-muted-foreground">Not enough funds to compare</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold text-slate-900">
            VC Fund Ranker
          </h1>
          <p className="text-lg text-slate-600">
            {hasVoted 
              ? 'Rankings updated! Click Next for another matchup.' 
              : 'Which VC fund is better? Click to vote.'}
          </p>
          
          {/* Keyboard shortcut hints */}
          <div className="text-sm text-slate-500">
            Use ← → arrow keys to vote, Space/Enter to {hasVoted ? 'continue' : 'skip'}
          </div>
          
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/leaderboard">
              <Trophy className="w-4 h-4" />
              View Leaderboard
            </Link>
          </Button>
        </div>

        {/* Two Cards Side by Side */}
        <div className="flex flex-col lg:flex-row gap-8 justify-center items-center mb-8">
          {/* Card 1 */}
          <div className={`
            w-full max-w-md
            transition-all duration-300
            ${hasVoted && selectedWinnerId === currentPair[0].id ? 'scale-105' : ''}
          `}>
            <FundCard
              fund={currentPair[0]}
              onClick={() => handleVote(currentPair[0].id, currentPair[1].id)}
              isClickable={!isVoting && !hasVoted}
              showGlow={hasVoted && selectedWinnerId === currentPair[0].id}
              showElo={hasVoted}
            />
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center lg:mx-4">
            <div className="bg-white px-6 py-3 rounded-full font-semibold text-slate-400 border border-gray-200">
              VS
            </div>
          </div>

          {/* Card 2 */}
          <div className={`
            w-full max-w-md
            transition-all duration-300
            ${hasVoted && selectedWinnerId === currentPair[1].id ? 'scale-105' : ''}
          `}>
            <FundCard
              fund={currentPair[1]}
              onClick={() => handleVote(currentPair[1].id, currentPair[0].id)}
              isClickable={!isVoting && !hasVoted}
              showGlow={hasVoted && selectedWinnerId === currentPair[1].id}
              showElo={hasVoted}
            />
          </div>
        </div>

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