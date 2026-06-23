# Portfolio company logos

Each portfolio card shows the company's logo in the top-right corner. Drop the files here named:

- `cachai.png` — Cachai
- `curiedx.png` — CurieDx
- `alchemity.png` — Alchemity

How it behaves:
- The logo sits top-right of the card (the company name is top-left).
- If a file is missing, the slot just stays empty, so nothing breaks.
- Cards sit on white, so dark or full-color logos on a transparent background look best. Capped at 26px tall, ~96px wide.

If a logo is a `.svg` or `.jpg`, either convert to `.png` or change the `src` extension for that company in `index.html`.
