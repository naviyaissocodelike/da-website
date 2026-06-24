# District Angels — Website

Single-page marketing site for District Angels, a DCTAV-affiliated angel investing community rooted in the capital region. Built as a single self-contained `index.html` (no build step, no dependencies). This is the repo root, so the site deploys straight from `main`.

## Hosting on GitHub Pages

1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Update site"
   git push origin main
   ```
2. In the repo (`naviyaissocodelike/da-website`), go to **Settings → Pages**.
3. Under **Build and deployment → Source**, pick **Deploy from a branch**.
4. Set branch to `main` and folder to `/ (root)`, then **Save**.
5. The site is live at `https://battleoftheregions.com` (custom domain).

## Custom domain (battleoftheregions.com)

DNS is configured at Namecheap: four apex `A` records to GitHub's IPs (`185.199.108–111.153`) and a `www` `CNAME` to `naviyaissocodelike.github.io`. The `CNAME` file at the repo root holds `battleoftheregions.com`, which is what tells GitHub Pages to serve the site there. After pushing, set the same domain under Settings → Pages → Custom domain and enable **Enforce HTTPS** once the certificate provisions.

## Files

- `index.html` — the entire site (HTML, CSS, JS inline)
- `logos/` — partner logo images; drop files in here (see `logos/README.md`)
- `.nojekyll` — tells GitHub Pages to serve files as-is without Jekyll processing
- `README.md` — this file

## Editing

Open `index.html` in any browser to preview locally. All content lives in the markup; colors and fonts are CSS variables in the `:root` block at the top of the `<style>` tag.
