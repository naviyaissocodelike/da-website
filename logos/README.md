# Partner logos

Each partner slot in the site loads an image from this folder and falls back to the partner's name as text if the file is missing, so nothing breaks.

## In place

- `dmv-angels.jpeg` — DMV Angel Group (shown on a dark card; logo is white-on-black)
- `american-university.png` — American University
- `university-of-virginia.png` — UVA Batten
- `arlington-economic-development.jpeg` — Arlington Economic Development
- `maryland-momentum-fund.png` — Maryland Momentum Fund
- `maryland-innovation-center.png` — Maryland Innovation Center
- `md-energy-innovation-accelerator.png` — Maryland Energy Innovation Accelerator
- `resilient-earth-capital.png` — Resilient Earth Capital
- `abell-foundation.png` — Abell Foundation
- `inspire-access.png` — Inspire Access (shown on a dark card; logo is white)

## Still showing as text (drop a file in to replace)

- `oath-capital.png` — Oath Capital
- `new-dominion-angels.png` — New Dominion Angels
- `neds-club.png` — Ned's Club
- `dedico.png` — Dedico

Tips:
- Transparent PNG looks best. If a logo is white/light, it needs a dark card — add the `on-dark` class to its `<div class="logo ...">` in `index.html` (see DMV and Inspire Access for the pattern).
- Logos are capped at 46px tall; width scales automatically.
