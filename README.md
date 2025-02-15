# Minesweeper
A project to practice using AI coding assistants. 

Play minesweeper with game play options, top score tracking, and more.
To begin play, (1) run `node server.js` and (2) open the game in your browser at http://localhost:3000/index.html.

## Game Play Options
In *Simple mode*, choose between predefined easy, medium, hard game settings.

In *Random mode*, choose a range for the board size, and a range for mine percentage. The game will randomly generate a board size and mine percentage within the specified ranges.

In *Custom mode*, choose the exact board size and the percentage of mines in the game.

## Scoring
Choose whether to track scores for wins, losses, or not at all. Games are ranked by *performance*, a metric based on completion percentage, board size, percentage of mines, and the time taken to complete the game.

The *pace* represents performance if the game is completed at the current speed of play. The pace metric is displayed on the game screen while the performance is displayed when the game is over. The metrics can be toggled on and off in the *options* page.

## Game Review
Games can be replayed on a game board in a separate window. Review games by picking positions from the move list or cycle through positions with the *next* and *previous* buttons. 

Open game review by clicking the gameID on the *scores* page or by opening http://localhost:3000/review.html.
