# Build-a-Footballer

A browser game where you build a footballer one attribute at a time, taking each stat from a different real player, then simulate their career.

## How to play
1. Pick a position (Striker, Winger, Attacking Mid, Central Mid, Full Back, Centre Back) and a mode (Random or Daily challenge).
2. You're dealt one player at a time. Take **one** of their 8 attributes (Pace, Shooting, Passing, Dribbling, Defending, Physical, Mentality, Height). Each slot can only be filled once. You get 2 skips.
3. Every stat, your overall, each season and your whole career get a grade from **S** down to **F** (S, A, B, C, D, E, F).
4. Your overall rating is weighted by position. Your career is then simulated from age 18 to retirement: form, injuries, club level, goals, assists, league titles, Champions Leagues, World Cups and Ballon d'Ors, ending in a legacy score, a career grade, a rating-by-age chart and a season-by-season table with clubs, transfer fees and honours.

Player photos are loaded in the browser from Wikipedia (Wikimedia Commons). If a photo can't be found, an initials badge is shown instead.

## Run it
No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

It also works as-is on GitHub Pages.

## Files
- `players.js` – the player pool (rough peak ratings; edit or add players here)
- `game.js` – draft logic, rating formula, career simulation
- `style.css`, `index.html` – UI
