# laceyguthrie.com

Personal site — static HTML/CSS/JS, built with [Eleventy](https://www.11ty.dev/).

## Structure

The main site (`/`, `/media/`, `/lyrics/`, `/press/`) shares one layout and one
stylesheet. `/digital/`, `/physical/` and `/mind/` are microsites: each has its
own layout, its own look, and its own stylesheet on top of a shared one.

```
src/                       # source files (Eleventy input)
  index.html               # home page (music project tabs)
  media/index.html         # videos + photos
  lyrics/index.html        # lyrics, by project
  press/index.html         # credits + press feed
  digital/index.html       # microsite placeholder
  physical/index.html      # microsite placeholder
  mind/                    # the blog
    index.html             # renders the posts
    *.md                   # one file per post
    mind.json              # stops the posts being built as their own pages
  bardo/index.html         # unlisted page behind the /digital/ password box
  _includes/
    layouts/               # base.html (main site) + one per microsite
    shows.html             # shared shows list, included by several pages
    site-nav.html          # music / digital / physical / mind switcher
    contact-popup.html     # contact modal, in base.html
    jsonld.html            # structured data, in base.html
  css/                     # style.css (main site), lyrics.css,
                           # microsites.css + digital/physical/mind.css
  js/init.js               # all of the site's JavaScript
  img/                     # site images (.jpg + .webp pairs)
  robots.liquid            # builds robots.txt
  sitemap.liquid           # builds sitemap.xml
  .htaccess                # redirects from the site's older URLs
notes/                     # working notes, not published
_site/                     # built output (gitignored, made by `npm run build`)
_drop/                     # drop folder for the image converter (see below)
convert-images.sh          # image conversion script
eleventy.config.js         # Eleventy config
```

## Running locally

One-time setup:

```
npm install
```

Then to start a dev server with live reload at `http://localhost:8080`:

```
npm run start
```

To produce a production build (with CSS/JS minified) in `_site/`:

```
npm run build
```

Deploys happen automatically via GitHub Actions on push to `main` — see [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Adding a shared block to a page

Anything in `src/_includes/` can be pulled into a page with Liquid syntax:

```liquid
{% include "shows.html" %}
```

Edit the file in `_includes/` once and every page that includes it picks up the change on the next build.

## Image converter

Use [convert-images.sh](convert-images.sh) to add new images to the site. It takes HEIC or JPG files dropped into `_drop/` and produces optimized `.jpg` + `.webp` pairs in [src/img/](src/img/).

**One-time setup:**

```
brew install webp
```

**Each time you have new images:**

1. Drop `.heic`, `.jpg`, or `.jpeg` files into `_drop/`
2. From the project root, run:
   ```
   ./convert-images.sh
   ```
3. Optimized `.jpg` + `.webp` pairs land in `src/img/`
4. Originals are moved to `_drop/processed/` as a safety copy

Nothing runs in the background — the script processes whatever's in `_drop/` each time you invoke it, then exits.

## Video

Video files never go in this repo. `.gitignore` blocks `.mov`, `.mp4` and `.webm`
so they cannot be committed by accident.

The web encodes are served from a Cloudflare R2 bucket, and [src/media/index.html](src/media/index.html)
points `<source>` tags straight at those URLs. Each video needs an `.mp4` and a
`.webm` on the bucket, plus a poster frame in `src/img/` that *is* committed.

To add a video: encode an `.mp4` and a `.webm` from the master, upload both to the
bucket, pull a poster frame into `src/img/`, then add a `<figure class="lg-video">`
block to the media page alongside the others.

**What it does:**

- Resizes so the longest edge is at most 2000px (never upscales), then converts to `.jpg` (via `sips`) + `.webp` (via `cwebp`, encoded from the resized JPG so both pairs share the same dimensions), both at quality 82

Filename case doesn't matter (`.HEIC` from iPhone works fine).

## Referencing images in HTML

Pair pattern with WebP first, JPG fallback:

```html
<picture>
  <source srcset="img/your-image.webp" type="image/webp">
  <img src="img/your-image.jpg" alt="...">
</picture>
```
