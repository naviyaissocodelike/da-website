# Site assets

## Deal room image

The investors section shows a small landscape image for the monthly deal room. Drop a photo here named `deal-room.jpg` (roughly 3:2, landscape) and it appears automatically. Until then, the slot shows a clean dark gradient with the "The Deal Room · monthly" caption.

## Nav logo

The nav bar looks for `assets/da-logo.png`. Drop the District Angels logo file here with that exact name and it appears automatically. Until it's present, the nav falls back to the dome icon + "District Angels" wordmark, so nothing looks broken.

Tips:
- A **horizontal** lockup (dome beside the words) fits the nav best. The stacked version you have will work but renders small at the 44px nav height.
- Transparent PNG or SVG is ideal. For SVG, save it as `da-logo.svg` and change the `src` in `index.html` (the `<img class="brand-logo">` tag) to match.
- The logo is capped at 44px tall in the layout; width scales automatically.
