/**
 * Calculate new ELO ratings after a match
 * @param winnerRating - Current rating of the winner
 * @param loserRating - Current rating of the loser
 * @param kFactor - K-factor (determines how much ratings change, typically 32)
 * @returns Object with new ratings for winner and loser
 */
export function calculateElo(
    winnerRating: number,
    loserRating: number,
    kFactor: number = 32
  ): { newWinnerRating: number; newLoserRating: number } {
    // Calculate expected scores
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  
    // Calculate new ratings
    // Winner gets actual score of 1, loser gets 0
    const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinner));
    const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoser));
  
    return {
      newWinnerRating,
      newLoserRating,
    };
  }