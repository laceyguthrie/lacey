# Remove fam-damily band, split music onto its own page, homepage becomes news

**Date:** 2026-07-29
**Status:** Approved

## Goal

Remove the fam-damily band feature entirely, move the music content from the
homepage to a new `/music/` page, leave the homepage as a nearly-empty shell
for future news content, and clean up everything left unused by these changes.

## Context

The site is an Eleventy static site (`src/` → `_site/`). The fam-damily band
page (`/fam-damily-band/`) was an experimental constellation visualization
with its own JS, CSS, data file, and unit test. The homepage currently holds
the music discography plus the shows sidebar. The user has already
hand-reverted the nav and homepage partway; this work finishes the removal
and restructure.

## Changes

### 1. Remove fam-damily band entirely

Delete:

- `src/fam-damily-band/index.html`
- `src/js/fam-damily-band.js`
- `src/css/fam-damily-band.css`
- `src/_data/famFamily.json`
- `test/fam-damily-band.test.js` (and the then-empty `test/` directory)
- `docs/superpowers/plans/2026-07-21-projects-homepage-and-dam-family-band.md`
  (plan for the removed feature)

Also remove the `json` filter from `eleventy.config.js` — the fam-damily page
was its only consumer.

### 2. New `/music/` page

Create `src/music/index.html` containing everything currently in the
homepage's music section:

- The `lg-solo` wobbling "solo albums" labels
- All album chunks (MA AM through Anything Is Possible…), including the
  commented-out old releases block
- The `shows.html` include
- Front matter: `activePage: music`, `extraScripts: js/solo-outline.js`,
  same fonts as the homepage, appropriate title/description

### 3. Homepage becomes a nearly-empty news shell

`src/index.html` keeps its front matter (title, fonts, `activePage: home`)
but drops `solo-outline.js`. Body is just the main container with the
`shows.html` include and an otherwise empty content area for the user to
fill in later.

### 4. Nav (`src/_includes/layouts/base.html`)

- `home` → `/` as the first item, `is-active` on the homepage
- `music` → `/music/`, `is-active` on the music page
- `shows` → anchor link `#shows` on pages that include the shows section
  (home and music); `/#shows` elsewhere so it always resolves
- Remaining items unchanged

### 5. Cleanup of unused code

- Delete `src/css/draft.css` (the draft page is already deleted)
- Remove both duplicated, unused `.lg-disco` CSS blocks from
  `src/css/style.css`
- Sweep `style.css` for other selectors with no remaining markup and remove
  them
- Delete `.DS_Store` files under `src/` and gitignore them if not already

## Out of scope

No content changes to shows, images, videos, lyrics, or press pages.

## Verification

- `npm run build` succeeds
- `grep -ri "fam-damily\|famFamily" _site src` returns nothing
- Built pages: `/` (empty shell + shows), `/music/` (full discography +
  shows), nav correct on every page
