# markuswaas.com

Personal site / resume of Markus Waas — hand-written HTML, CSS, and a little
vanilla JavaScript. No frameworks, no build step, no dependencies, no trackers.

## Structure

```
public/          the entire deployed site
  index.html     one page — content and metadata
  styles.css     design system (light + dark themes, print styles)
  main.js        theme toggle, scrollspy, scroll-reveal, mobile nav
  assets/        self-hosted fonts, images, icons
assets-src/      undeployed sources (original photo, crop master, favicon SVG,
                 OG-image template) for regenerating public/ assets
netlify.toml     deploy config: publish public/, no build command, headers
```

## Local development

No tooling needed — serve `public/` with any static server:

```bash
python3 -m http.server 8080 -d public
```

## Deployment

Netlify deploys pushes automatically. `netlify.toml` pins the publish
directory (`public/`) and an empty build command, overriding any UI settings.

## Regenerating assets

Profile photo (from `assets-src/profile-2026.png`, cropped center to 4:5 first):

```bash
sips -c 1400 1120 assets-src/profile-2026.png --out /tmp/profile-45.png
sips -z 800 640 -s format jpeg -s formatOptions 80 /tmp/profile-45.png --out public/assets/img/profile-640.jpg
sips -z 400 320 -s format jpeg -s formatOptions 82 /tmp/profile-45.png --out public/assets/img/profile-320.jpg
cwebp -q 82 -resize 640 800 /tmp/profile-45.png -o public/assets/img/profile-640.webp
cwebp -q 84 -resize 320 400 /tmp/profile-45.png -o public/assets/img/profile-320.webp
```

Favicon PNGs (from `assets-src/favicon.svg`):

```bash
qlmanage -t -s 1024 -o assets-src assets-src/favicon.svg
sips -z 512 512 assets-src/favicon.svg.png --out public/assets/icons/icon-512.png
sips -z 192 192 assets-src/favicon.svg.png --out public/assets/icons/icon-192.png
sips -z 180 180 assets-src/favicon.svg.png --out public/assets/icons/apple-touch-icon.png
sips -z 96 96 assets-src/favicon.svg.png --out public/assets/icons/favicon-96.png
rm assets-src/favicon.svg.png
```

OG image (from `assets-src/og-template.html`):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --disable-gpu --hide-scrollbars --window-size=1200,630 \
  --screenshot="$PWD/public/assets/img/og.png" "file://$PWD/assets-src/og-template.html"
```

## Fonts

Self-hosted woff2 files: [Clash Display](https://www.fontshare.com/fonts/clash-display)
(ITF Free Font License, display), [Inter](https://rsms.me/inter/) (SIL OFL, body),
and [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (SIL OFL, data/labels).

## Credits

The repository started life as the Start Bootstrap
[Resume](https://startbootstrap.com/theme/resume) template (MIT); the site has
since been fully rewritten and no template code remains.
