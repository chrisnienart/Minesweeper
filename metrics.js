export function calculateMetrics(score) {
    let metrics = {};
    const results = calculatePerformance(score.time, score['boardSize'], score['numMines'], score['revealedCells']);
    metrics.performance = results.performance;
    metrics.pace = results.pace;
    metrics.percentMines = score['numMines'] / (score['boardSize'] ** 2);
    metrics.percentCleared = score['revealedCells'] / (score['boardSize'] ** 2 - score['numMines']);
    return metrics;
}

export function calculatePerformance(time, boardSize, numMines, revealedCells) {
    const percentMines = numMines / (boardSize ** 2);
    const percentCleared = revealedCells / (boardSize ** 2 - numMines);
    const difficultyRatio = percentMines / (1 - percentMines);
    const adjustedNumMines = Math.round(boardSize ** 2 * difficultyRatio);
    const adjustedTime = Math.sqrt(time / difficultyRatio);
    
    let pace = 0;
    let performance = 0;
    
    if (time > 0) {
        pace = adjustedNumMines / adjustedTime;
        performance = percentCleared ** 2 * pace;
    }
    
    return {performance, pace};
}
