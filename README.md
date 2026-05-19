# laceyguthrie.com

Personal site — static HTML/CSS/JS. No build step, no framework.

## Structure

```
index.html              # home page
lyrics/index.html       # lyrics page
self-portrait/index.html
css/                    # style.css, lyrics.css, feed.css
js/                     # init.js, feed-video.js
images/                 # site images (.jpg + .webp pairs)
_drop/                  # drop folder for the image converter (see below)
archive/                # older versions
convert-images.sh       # image conversion script
```

## Running locally

It's plain static files — open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Image converter

Use [convert-images.sh](convert-images.sh) to add new images to the site. It takes HEIC or JPG files dropped into [_drop/](_drop/) and produces optimized `.jpg` + `.webp` pairs in [images/](images/).

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
3. Optimized `.jpg` + `.webp` pairs land in `images/`
4. Originals are moved to `_drop/processed/` as a safety copy

Nothing runs in the background — the script processes whatever's in `_drop/` each time you invoke it, then exits.

**What it does:**

- **HEIC** → optimized `.jpg` (via `sips`) + `.webp` (via `cwebp`, encoded from the new JPG since `cwebp` can't read HEIC directly)
- **JPG/JPEG** → optimized `.jpg` + `.webp`, both at quality 82

Filename case doesn't matter (`.HEIC` from iPhone works fine).

## Referencing images in HTML

Pair pattern with WebP first, JPG fallback:

```html
<picture>
  <source srcset="images/your-image.webp" type="image/webp">
  <img src="images/your-image.jpg" alt="...">
</picture>
```
