# Site Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize laceyguthrie.com around a three-section top nav (music / digital / objects), move /music to /albums with a 301, turn the homepage into the "mind" blog, and rework the /images feed nav with uniform deep links.

**Architecture:** Static Eleventy site (Liquid templates, plain CSS/JS, no test framework). Verification is `npx @11ty/eleventy` builds plus grep assertions on `_site/` output plus manual browser checks with `npm run start`. Each task ends in a commit. Nothing is pushed (push triggers the FTP deploy); pushing happens only when Lacey says so.

**Tech Stack:** Eleventy 3.x, Liquid, vanilla JS, plain CSS. Node 22.

**Spec:** docs/superpowers/specs/2026-09-02-site-reorg-design.md

## Global Constraints

- Site voice is playful and strange on purpose. Copy is never corporate.
- No em-dashes in any user-facing copy.
- All placeholder copy (blog entries, microsite lines) was drafted in this plan and approved by Lacey with the plan. Implement it verbatim.
- Labels are one word, and folder names match labels: `mind`, `albums`, `digital`, `objects`.
- Do not push to `main`. Commits stay local.
- Existing pages keep their current look except where a task says otherwise.
- Run builds with `npx @11ty/eleventy` (fast, skips minify). `npm run build` only in the final task.

---

### Task 1: Move /music to /albums, rename directory items, add 301

**Files:**
- Rename: `src/music/` -> `src/albums/` (git mv)
- Modify: `src/albums/index.html` (front matter only)
- Modify: `src/_includes/layouts/base.html:58-59`
- Modify: `src/index.html:6` (activePage)
- Modify: `src/sitemap.liquid`
- Create: `src/.htaccess`
- Modify: `eleventy.config.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `/albums/` URL and `activePage` values `mind` and `albums` that later tasks reference. `src/.htaccess` exists for any future redirects.

- [ ] **Step 1: Move the folder**

```bash
cd /Users/laceyguthrie/Sites/lacey && git mv src/music src/albums
```

- [ ] **Step 2: Update the albums page front matter**

In `src/albums/index.html`, change these two front matter lines (leave the rest of the file alone):

```yaml
title: Albums | Lacey Guthrie
activePage: albums
```

(They currently read `title: Music | Lacey Guthrie` and `activePage: music`.)

- [ ] **Step 3: Update the directory nav in base.html**

In `src/_includes/layouts/base.html`, replace:

```html
<li><a {% if activePage == "home" %}class="is-active" {% endif %}href="/">home</a></li>
<li><a {% if activePage == "music" %}class="is-active" {% endif %}href="/music/">music</a></li>
```

with:

```html
<li><a {% if activePage == "mind" %}class="is-active" {% endif %}href="/">mind</a></li>
<li><a {% if activePage == "albums" %}class="is-active" {% endif %}href="/albums/">albums</a></li>
```

- [ ] **Step 4: Update the homepage activePage**

In `src/index.html` front matter, change `activePage: home` to `activePage: mind`.

- [ ] **Step 5: Update the sitemap**

In `src/sitemap.liquid`, change:

```xml
<loc>https://laceyguthrie.com/music/</loc>
```

to:

```xml
<loc>https://laceyguthrie.com/albums/</loc>
```

- [ ] **Step 6: Create src/.htaccess**

```apache
Redirect 301 /music/ /albums/
```

- [ ] **Step 7: Copy .htaccess into the build**

In `eleventy.config.js`, after the existing passthrough lines, add:

```js
eleventyConfig.addPassthroughCopy("src/.htaccess");
```

- [ ] **Step 8: Check the FTP deploy excludes**

Read `.github/workflows/deploy.yml` and confirm the `exclude:` list does not match `.htaccess` (patterns like `**/.*` would). If it does, remove or adjust that pattern.

- [ ] **Step 9: Build and verify**

```bash
npx @11ty/eleventy
test -f _site/.htaccess && echo HTACCESS-OK
test -f _site/albums/index.html && echo ALBUMS-OK
test ! -d _site/music && echo NO-MUSIC-OK
grep -c "/albums/" _site/index.html
grep -c "laceyguthrie.com/albums/" _site/sitemap.xml
```

Expected: HTACCESS-OK, ALBUMS-OK, NO-MUSIC-OK, at least 1 for both greps.

- [ ] **Step 10: Verify the directory renders**

Run `npm run start`, open `http://localhost:8080/`. The directory reads: mind, albums, shows, images, videos, lyrics, press, order a record, bandcamp, contact. "mind" has the "you are here" marker. Open `/albums/`, "albums" has the marker.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Move /music to /albums, rename home to mind, add 301 redirect"
```

---

### Task 2: Top-right site nav (music / digital / objects)

**Files:**
- Create: `src/_includes/site-nav.html`
- Modify: `src/_includes/layouts/base.html` (inside `.lg-header`, after the h1)
- Modify: `src/css/style.css` (HEADER & NAVIGATION section)

**Interfaces:**
- Consumes: nothing.
- Produces: `site-nav.html` include that expects a Liquid variable `activeSite` (values: `music`, `digital`, `objects`). Task 3's microsite layouts include this same file.

- [ ] **Step 1: Create the include**

`src/_includes/site-nav.html`:

```html
<nav class="lg-site-nav" aria-label="Site sections">
    <ul class="lg-site-nav__list">
        <li><a {% if activeSite == "music" %}class="is-active" aria-current="true" {% endif %}href="/">music</a></li>
        <li><a {% if activeSite == "digital" %}class="is-active" aria-current="true" {% endif %}href="/digital/">digital</a></li>
        <li><a {% if activeSite == "objects" %}class="is-active" aria-current="true" {% endif %}href="/objects/">objects</a></li>
    </ul>
</nav>
```

- [ ] **Step 2: Include it in base.html**

In `src/_includes/layouts/base.html`, directly after the `<h1 class="lg-header__title">...</h1>` line, add:

```html
{% assign activeSite = activeSite | default: "music" %}
{% include "site-nav.html" %}
```

Every base-layout page defaults to `music` active. Pages do not need to set `activeSite`.

- [ ] **Step 3: Add the CSS**

In `src/css/style.css`, at the end of the HEADER & NAVIGATION section (after the `.lg-header__nav-list .is-active::after` rule around line 343), add:

```css
.lg-site-nav {
    position: absolute;
    top: 3rem;
    right: 1.5rem;
    z-index: 2;
}

.lg-site-nav__list {
    list-style: none;
    display: flex;
    align-items: flex-start;
    margin: 0;
    padding: 0;
}

.lg-site-nav__list a {
    display: inline-block;
    position: relative;
    text-decoration: none;
    font-family: "Arimo", sans-serif;
    font-size: 0.675rem;
    font-weight: 600;
    line-height: 1;
    padding: 0.5rem;
}

.lg-site-nav__list .is-active {
    pointer-events: none;
}

.lg-site-nav__list .is-active::after {
    content: "you are here";
    position: absolute;
    bottom: 0.25rem;
    left: 50%;
    transform: translate(-50%, 100%);
    font-family: "Arimo", sans-serif;
    font-size: 0.4rem;
    text-transform: uppercase;
    font-weight: 700;
    padding-top: 0.25rem;
    letter-spacing: 0.025rem;
    white-space: nowrap;
    border-top: 1px dashed #000;
}
```

Also add the hover treatment inside the existing `@media (hover: hover)` block at the bottom of the file, extending its selector list:

```css
    .lg-site-nav__list a:hover,
```

(added as the first selector line of that rule, so hovering inverts to black/white like the directory links).

- [ ] **Step 4: Verify in the browser**

`npm run start`. On `/`, `/albums/`, `/images/`, `/lyrics/`, `/videos/`, `/press/`: the top right shows music / digital / objects with "you are here" under music. Check at 375px width and desktop: the nav must not collide with the h1 title or the directory. On /images (headerModifier `lg-header--feed`) confirm no overlap either. digital and objects links 404 for now; Task 3 fixes that.

- [ ] **Step 5: Commit**

```bash
git add src/_includes/site-nav.html src/_includes/layouts/base.html src/css/style.css
git commit -m "Add top-right site nav: music / digital / objects"
```

---

### Task 3: /digital and /objects microsite shells

**Files:**
- Create: `src/_includes/layouts/digital.html`
- Create: `src/_includes/layouts/objects.html`
- Create: `src/digital/index.html`
- Create: `src/objects/index.html`
- Create: `src/css/digital.css`
- Create: `src/css/objects.css`
- Modify: `src/sitemap.liquid`

**Interfaces:**
- Consumes: `site-nav.html` from Task 2 (sets `activeSite` before including).
- Produces: live `/digital/` and `/objects/` URLs. Own layouts; do not load `style.css` or the main site fonts.

- [ ] **Step 1: Create the digital layout**

`src/_includes/layouts/digital.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>{{ title }}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="referrer" content="origin">
    <meta name="description" content="{{ description }}">
    <link rel="canonical" href="https://laceyguthrie.com{{ page.url }}">
    <link rel="stylesheet" type="text/css" href="/css/digital.css">
    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
</head>
<body class="dg-body">
    {% assign activeSite = "digital" %}
    {% include "site-nav.html" %}
    {{ content }}
</body>
</html>
```

- [ ] **Step 2: Create the objects layout**

`src/_includes/layouts/objects.html` is identical except: stylesheet href `/css/objects.css`, body class `ob-body`, and `{% assign activeSite = "objects" %}`.

- [ ] **Step 3: Create the pages**

`src/digital/index.html`:

```html
---
layout: layouts/digital.html
title: Digital | Lacey Guthrie
description: Development work and digital projects by Lacey Guthrie.
---
<main class="dg-main">
    <h1 class="dg-title">digital</h1>
    <p class="dg-placeholder">a portfolio is assembling itself. check back.</p>
</main>
```

`src/objects/index.html`:

```html
---
layout: layouts/objects.html
title: Objects | Lacey Guthrie
description: Fabric art, banners, sewn text, and other objects by Lacey Guthrie.
---
<main class="ob-main">
    <h1 class="ob-title">objects</h1>
    <p class="ob-placeholder">fabric, thread, and other physical arguments. photos soon.</p>
</main>
```

- [ ] **Step 4: Create the CSS shells**

`src/css/digital.css`:

```css
/* /digital microsite. Blank canvas: does not share style.css. */

body.dg-body {
    margin: 0;
    min-height: 100vh;
    background: #111;
    color: #eee;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.dg-title {
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin: 0 0 1rem 0;
}

.dg-placeholder {
    font-size: 0.75rem;
    margin: 0;
}

/* Site nav reuses the shared markup, restyled for this canvas. */
.lg-site-nav {
    position: absolute;
    top: 1.5rem;
    right: 1rem;
}

.lg-site-nav__list {
    list-style: none;
    display: flex;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    font-size: 0.675rem;
}

.lg-site-nav__list a {
    color: #eee;
    text-decoration: none;
    padding: 0.5rem;
}

.lg-site-nav__list a:hover {
    background: #eee;
    color: #111;
}

.lg-site-nav__list .is-active {
    pointer-events: none;
    border-bottom: 1px dashed #eee;
}
```

`src/css/objects.css`:

```css
/* /objects microsite. Blank canvas: does not share style.css. */

body.ob-body {
    margin: 0;
    min-height: 100vh;
    background: #f4efe6;
    color: #1a1a1a;
    font-family: Georgia, "Times New Roman", serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.ob-title {
    font-size: 1.5rem;
    font-weight: 400;
    font-style: italic;
    margin: 0 0 1rem 0;
}

.ob-placeholder {
    font-size: 0.875rem;
    margin: 0;
}

.lg-site-nav {
    position: absolute;
    top: 1.5rem;
    right: 1rem;
}

.lg-site-nav__list {
    list-style: none;
    display: flex;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    font-size: 0.75rem;
}

.lg-site-nav__list a {
    color: #1a1a1a;
    text-decoration: none;
    padding: 0.5rem;
}

.lg-site-nav__list a:hover {
    background: #1a1a1a;
    color: #f4efe6;
}

.lg-site-nav__list .is-active {
    pointer-events: none;
    border-bottom: 1px dashed #1a1a1a;
}
```

- [ ] **Step 5: Add both pages to the sitemap**

In `src/sitemap.liquid`, after the `/albums/` url block, add:

```xml
    <url>
        <loc>https://laceyguthrie.com/digital/</loc>
    </url>
    <url>
        <loc>https://laceyguthrie.com/objects/</loc>
    </url>
```

- [ ] **Step 6: Build and verify**

```bash
npx @11ty/eleventy
grep -L "css/style.css" _site/digital/index.html _site/objects/index.html
grep -c "digital/" _site/sitemap.xml
```

Expected: both microsite files listed by `grep -L` (they do NOT reference style.css); sitemap contains the new URLs. In the browser: `/digital/` is dark monospace, `/objects/` is warm serif, both show the site nav with the right item active, and the "music" link returns home.

- [ ] **Step 7: Commit**

```bash
git add src/_includes/layouts/digital.html src/_includes/layouts/objects.html src/digital src/objects src/css/digital.css src/css/objects.css src/sitemap.liquid
git commit -m "Add /digital and /objects microsite shells"
```

---

### Task 4: Mind blog on the homepage

**Files:**
- Create: `src/mind/mind.json`
- Create: `src/mind/2026-09-02-grapefruit.md`
- Create: `src/mind/2026-08-30-an-individual-note.md`
- Modify: `src/index.html`
- Modify: `src/css/style.css` (MAIN CONTENT AREAS section)

**Interfaces:**
- Consumes: `activePage: mind` from Task 1.
- Produces: an Eleventy collection `mind` (markdown entries, `permalink: false`, front matter `title`, `date`, optional `place`). Future entries: drop a new `.md` in `src/mind/`.

- [ ] **Step 1: Create the directory data file**

`src/mind/mind.json`:

```json
{
    "tags": "mind",
    "permalink": false
}
```

- [ ] **Step 2: Create the two placeholder entries**

`src/mind/2026-09-02-grapefruit.md`:

```markdown
---
title: grapefruit
date: 2026-09-02
place: Louisville, KY
---
Placeholder. Thoughts about Yoko Ono's *Grapefruit* go here. Instruction
pieces, event scores, art you perform by reading it.
```

`src/mind/2026-08-30-an-individual-note.md`:

```markdown
---
title: an individual note
date: 2026-08-30
place: Louisville, KY
---
Placeholder. Thoughts about Daphne Oram's *An Individual Note of Music,
Sound and Electronics* go here. The studio as an instrument, sound drawn
by hand.
```

- [ ] **Step 3: Replace the homepage content**

`src/index.html` becomes (front matter unchanged except `activePage: mind` from Task 1):

```html
---
layout: layouts/base.html
title: Lacey Guthrie | who do I think I am?
description: Lacey Guthrie is a songwriter/musician based in Louisville, Kentucky. Founding member of Twin Limb, current member of duchess. A new solo album is on the way.
fontsHref: https://fonts.googleapis.com/css2?family=Jacquard+12&family=Jacquard+24&family=Arimo:ital,wght@0,400..700;1,400..700&display=swap
activePage: mind
---
<main class="lg-main lg-flex--tablet container">
    <div class="lg-main__content">
        <section class="lg-mind">
            <h2 class="sr-only">mind</h2>
            {% assign entries = collections.mind | reverse %}
            {% for entry in entries %}
            <article class="lg-mind__entry">
                <h3 class="lg-mind__entry-title">{{ entry.data.title }}</h3>
                <p class="lg-mind__entry-meta">
                    <time datetime="{{ entry.date | date: '%Y-%m-%d' }}">{{ entry.date | date: '%B %d, %Y' }}</time>
                    {%- if entry.data.place %} &middot; {{ entry.data.place }}{% endif %}
                </p>
                <div class="lg-mind__entry-body">{{ entry.templateContent }}</div>
            </article>
            {% endfor %}
        </section>
    </div>
    {% include "shows.html" %}
</main>
```

Note: the `<h2 class="lg-main__title">What are you looking for?</h2>` line is gone. The shows include stays.

- [ ] **Step 4: Add the blog CSS**

In `src/css/style.css`, in the MAIN CONTENT AREAS section (after `.lg-main__content`), add:

```css
.lg-mind {
    max-width: 698px;
    margin-top: 3rem;
}

.lg-mind__entry {
    margin-bottom: 3rem;
}

.lg-mind__entry-title {
    font-size: 1.25rem;
    font-style: italic;
    margin: 0 0 0.25rem 0;
    line-height: 1;
}

.lg-mind__entry-meta {
    font-family: "Arimo", sans-serif;
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.025rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
}

.lg-mind__entry-body {
    line-height: 1.6;
}
```

- [ ] **Step 5: Build and verify**

```bash
npx @11ty/eleventy
test ! -d _site/mind && echo NO-MIND-PAGES-OK
grep -c "lg-mind__entry" _site/index.html
grep -o "grapefruit\|an individual note" _site/index.html | sort -u
```

Expected: NO-MIND-PAGES-OK (permalink false generates no /mind/ pages); entry count 2; both titles present. In the browser: grapefruit appears above an individual note (newest first), each with date and place, shows list in the sidebar on desktop.

- [ ] **Step 6: Commit**

```bash
git add src/mind src/index.html src/css/style.css
git commit -m "Turn homepage into the mind blog with two placeholder entries"
```

---

### Task 5: Music intro text wrap

**Files:**
- Modify: `src/css/style.css:222-241` (`.lg-music-intro` rules)
- Modify: `src/albums/index.html:102-105` (fix stray `</h3>`)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks use.

- [ ] **Step 1: Replace the intro CSS**

In `src/css/style.css`, replace this block:

```css
.lg-music-intro {
    max-width: 698px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: 1rem;
    text-align: left;
}

.lg-music-intro__img {
    max-height: 320px;
    max-width: 320px;
    background-color: transparent;
}

.lg-music-intro > * {
    flex: 1;
}
```

with:

```css
.lg-music-intro {
    max-width: 698px;
    text-align: left;
    display: flow-root;
}

.lg-music-intro__img {
    float: left;
    max-width: 200px;
    height: auto;
    background-color: transparent;
    margin: 0 1rem 0.5rem 0;
}

@media screen and (min-width: 880px) {
    .lg-music-intro__img {
        max-width: 320px;
    }
}
```

- [ ] **Step 2: Fix the stray closing tag in the duchess intro**

In `src/albums/index.html`, the duchess intro has a stray `</h3>` after the img (originally line 105, right after the `lg-music-intro__img` img tag in the `duchess-music` section). Delete that lone `</h3>` line. The sr-only h3 above the img already closes itself.

- [ ] **Step 3: Verify in the browser**

`npm run start`, open `/albums/`. Solo tab: text flows around the PNG on its right and continues under it. Image is 200px wide at 375px viewport, 320px on desktop. Duchess tab: same. Other tabs (no image) unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/css/style.css src/albums/index.html
git commit -m "Flow intro text around music tab images"
```

---

### Task 6: Feed nav rework on /images

**Files:**
- Modify: `src/images/index.html:12-103` (nav list), plus `data-tags` retags across the file
- Modify: `src/js/init.js` (the `all` filter mirror exclusion, ~line 336)
- Modify: `src/css/feed.css:139-165` (mirror -> muppet rename)

**Interfaces:**
- Consumes: nothing.
- Produces: filter value `unknown` replaces `collages`; muppet modifier class `lg-feed__nav-button--muppet`. Task 7 relies on the final set of `data-filter` values: `all`, `live`, `portraits`, `duchess`, `album-art`, `unknown`.

- [ ] **Step 1: Rework the nav list**

In `src/images/index.html`, edit the `<ul class="lg-feed__nav js-feed-filters">` so the items are, in order (changes marked):

1. all items (unchanged)
2. live (unchanged)
3. my fkn face (unchanged)
4. duchess (unchanged)
5. album art (unchanged)
6. **summon muppets** (moved here; was last). Full replacement li:

```html
<li>
    <button class="lg-feed__nav-button lg-feed__nav-button--muppet js-devotion-button" type="button">
        <div class="lg-feed__nav-image-wrapper">
            <img src="../img/tiny/sheeba.jpg" alt="close-cropped image of a persian cat's face with eyes reflecting green light" width="52" height="52">
        </div>
        <span class="lg-feed__nav-button-text">summon muppets</span>
    </button>
</li>
```

7. **unknown** (was `data-filter="collages"` with the statue image). Full replacement li:

```html
<li>
    <button class="lg-feed__nav-button" type="button" data-filter="unknown">
        <div class="lg-feed__nav-image-wrapper">
            <img src="../img/tiny/dirt.jpg" alt="me, 20-something, sitting on a bed staring wide-eyed at the floor. In the foreground are a pair of naked legs; it looks like the subject in the foreground is standing on her head." width="52" height="52">
        </div>
        <span class="lg-feed__nav-button-text">unknown</span>
    </button>
</li>
```

8. private (unchanged)

Delete entirely: the `mirror neurons` li (`data-filter="mirror"`), the old `unknown (very)` li (`data-filter="unknown"` with dirt.jpg), and the wikipedia Dream `<a>` li (sheeba.jpg).

- [ ] **Step 2: Retag collages posts**

Still in `src/images/index.html`, replace `collages` with `unknown` inside every `data-tags` attribute:

```bash
cd /Users/laceyguthrie/Sites/lacey && sed -i '' 's/collages/unknown/g' src/images/index.html
```

Safe because after Step 1 the only remaining `collages` occurrences are inside `data-tags` values. Verify first:

```bash
grep -n "collages" src/images/index.html
```

Every hit must be a `data-tags` line before running sed.

- [ ] **Step 3: Remove the mirror exclusion in init.js**

In `src/js/init.js`, in `setupFeedFilter`'s `filterItems`, replace:

```js
if (filterTag === 'all') {
    shouldShow = !(tags && tags.includes('mirror'));
} else {
```

with:

```js
if (filterTag === 'all') {
    shouldShow = true;
} else {
```

- [ ] **Step 4: Rename mirror CSS to muppet**

In `src/css/feed.css`, replace the block from the comment above `.lg-feed__nav-button--mirror.is-active` through the reduced-motion guard with:

```css
/* The default is-active/focus-visible treatment (cyan background +
   mix-blend-mode: multiply) crushes a spinning photo toward black, so the
   muppet button keeps its thumbnail undimmed instead. */
.lg-feed__nav-button--muppet.is-active .lg-feed__nav-image-wrapper,
.lg-feed__nav-button--muppet:focus-visible .lg-feed__nav-image-wrapper {
    background-color: transparent;
}

.lg-feed__nav-button--muppet.is-active .lg-feed__nav-image-wrapper img,
.lg-feed__nav-button--muppet:focus-visible .lg-feed__nav-image-wrapper img {
    mix-blend-mode: normal;
}

.lg-feed__nav-button--muppet .lg-feed__nav-image-wrapper img {
    animation: muppet-spin 6s linear infinite;
}

@keyframes muppet-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
    .lg-feed__nav-button--muppet .lg-feed__nav-image-wrapper img {
        animation: none;
    }
}
```

- [ ] **Step 5: Verify**

```bash
npx @11ty/eleventy
grep -c "collages\|mirror" _site/images/index.html || echo CLEAN
grep -c "summon muppets" _site/images/index.html
```

Expected: CLEAN (zero hits) and 1. In the browser on `/images/`: eight nav buttons in the specified order; the cat spins; clicking "summon muppets" opens the muppet popup; "unknown" filters to the retagged posts (find-me, bigarettes, web-collage-bpb, lacey-guthrie-symmetrical, collage, lacey-guthrie-eye-paint); "all items" shows every post.

- [ ] **Step 6: Commit**

```bash
git add src/images/index.html src/js/init.js src/css/feed.css
git commit -m "Rework feed nav: summon muppets, unknown filter, remove retired items"
```

---

### Task 7: Uniform deep links for tabs and filters

**Files:**
- Modify: `src/js/init.js` (`setupTabs`, `setupFeedFilter`, new helper)
- Modify: `src/albums/index.html:11-33` (tablist attributes)
- Modify: `src/lyrics/index.html:11-26` (tablist attributes)
- Modify: `src/images/index.html:13` (filter nav attribute)

**Interfaces:**
- Consumes: `data-filter` values from Task 6.
- Produces: URL scheme `/albums/?project=<slug>`, `/lyrics/?project=<slug>`, `/images/?filter=<value>`. Any future tab nav opts in with `data-deep-link="<param>"` + per-button `data-slug`.

- [ ] **Step 1: Add attributes to the albums tablist**

In `src/albums/index.html`, change the nav open tag to:

```html
<nav class="lg-tabs" role="tablist" aria-label="Music tabs" data-deep-link="project">
```

and add `data-slug` to each button: `solo`, `duchess`, `ouzelum`, `pleasure-boys`, `twin-limb`, `reading-group`, `bunny-day` (matching their `data-tab` order: solo-music, duchess-music, ouzelum-music, p-boys-music, twin-limb-music, reading-group-music, bunny-day-music). Example:

```html
<button class="lg-pill js-tab is-active" type="button" data-tab="solo-music" data-slug="solo" role="tab" aria-selected="true" aria-controls="solo-music" id="tab-sw">
```

- [ ] **Step 2: Add attributes to the lyrics tablist**

In `src/lyrics/index.html`, same pattern: `data-deep-link="project"` on the nav; `data-slug` values `solo` (lacey-guthrie-lyrics), `twin-limb`, `duchess`, `ouzelum`.

- [ ] **Step 3: Add the attribute to the feed filter nav**

In `src/images/index.html`, change:

```html
<ul class="lg-feed__nav js-feed-filters">
```

to:

```html
<ul class="lg-feed__nav js-feed-filters" data-deep-link="filter">
```

- [ ] **Step 4: Add the URL helper and rewrite setupTabs in init.js**

Add above `setupTabs`:

```js
// Deep links: a tab or filter nav opts in with data-deep-link="<param>".
// The active button's slug lands in the URL (?param=slug) so views can be
// linked to directly. The default view keeps the URL clean (param removed).

function setUrlParam(param, value) {
  if (!param) return;
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
  }
  history.replaceState(null, '', url);
}
```

Replace `setupTabs` with:

```js
function setupTabs() {
  const tabs = document.querySelectorAll('.js-tab');
  if (tabs.length === 0) return;

  const nav = tabs[0].closest('[data-deep-link]');
  const param = nav ? nav.getAttribute('data-deep-link') : null;
  const defaultTab = document.querySelector('.js-tab.is-active');

  function activateTab(tab) {
    const activeTab = document.querySelector('.js-tab.is-active');
    const activeTabContent = document.querySelector('.js-tab-content.is-active');

    if (activeTab) {
      activeTab.classList.remove('is-active');
      activeTab.setAttribute('aria-selected', 'false');
    }
    if (activeTabContent) activeTabContent.classList.remove('is-active');

    const targetId = tab.getAttribute('data-tab');
    const targetContent = document.getElementById(targetId);

    if (targetContent) {
      targetContent.classList.add('is-active');
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      activateTab(this);
      setUrlParam(param, this === defaultTab ? null : this.getAttribute('data-slug'));
    });

    tab.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });

  if (param) {
    const slug = new URLSearchParams(window.location.search).get(param);
    if (slug) {
      const target = Array.from(tabs).find(tab => tab.getAttribute('data-slug') === slug);
      if (target) activateTab(target);
    }
  }
}
```

- [ ] **Step 5: Wire the feed filter to the URL**

In `setupFeedFilter`, after the existing `updateActiveStates('all');` line at the end, add:

```js
  const param = filterNav.getAttribute('data-deep-link');

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filterValue = this.getAttribute('data-filter');
      setUrlParam(param, filterValue === 'all' ? null : filterValue);
    });
  });

  if (param) {
    const requested = new URLSearchParams(window.location.search).get(param);
    if (requested) {
      const match = Array.from(filterButtons).find(
        button => button.getAttribute('data-filter') === requested
      );
      if (match) filterItems(requested);
    }
  }
```

(The extra click listener only updates the URL; the existing listener still does the filtering. Buttons without `data-filter`, like summon muppets and private, are not in `filterButtons` because the existing code selects `[data-filter]`.)

- [ ] **Step 6: Verify**

`npm run start`, then check each by hand:

- `http://localhost:8080/albums/?project=duchess` loads with the duchess tab active.
- `http://localhost:8080/albums/?project=nope` loads with solo active (silent fallback).
- Clicking twin limb on /albums changes the URL to `?project=twin-limb` with no reload; clicking solo removes the param.
- `http://localhost:8080/lyrics/?project=ouzelum` opens the ouzelum lyrics tab.
- `http://localhost:8080/images/?filter=live` loads with live filtered and the live button marked Selected.
- Clicking "all items" on /images removes the param.
- Tabs still work on pages with no `data-deep-link` (none currently, but no console errors anywhere).

- [ ] **Step 7: Commit**

```bash
git add src/js/init.js src/albums/index.html src/lyrics/index.html src/images/index.html
git commit -m "Add shareable deep links for tabs and feed filters"
```

---

### Task 8: Feed nav mobile sizing (always show a partial button)

**Files:**
- Modify: `src/css/feed.css` (after the `.lg-feed__nav li` rule)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing other tasks use.

- [ ] **Step 1: Add the fluid width rules**

In `src/css/feed.css`, after the `.lg-feed__nav li` rule (ends line 36), add:

```css
/* Below 620px the buttons take fluid widths tuned so a half button always
   peeks out at the right edge: the visible fraction is the scroll hint.
   Above 620px the fixed 5.25rem width takes over. */
@media (max-width: 620px) {
    .lg-feed__nav-container {
        max-width: none;
    }

    .lg-feed__nav {
        --feed-visible: 6.5;
        --feed-gaps: 6;
    }

    .lg-feed__nav li {
        width: calc((100vw - 2rem - var(--feed-gaps) * 0.5rem) / var(--feed-visible));
    }

    .lg-feed__nav-image-wrapper {
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
    }
}

@media (max-width: 540px) {
    .lg-feed__nav {
        --feed-visible: 5.5;
        --feed-gaps: 5;
    }
}

@media (max-width: 480px) {
    .lg-feed__nav {
        --feed-visible: 4.5;
        --feed-gaps: 4;
    }
}
```

(The `2rem` is the nav's own horizontal padding, `0.5rem` the flex gap.)

- [ ] **Step 2: Verify at each width**

`npm run start`, open `/images/`, use devtools responsive mode at 375, 480, 481, 540, 541, 620, and 700px. At every width up to 620px, a partial button is visible at the right edge (4.5 / 5.5 / 6.5 buttons). Above 620px, the current fixed layout returns. Circles stay round at all widths. The is-active "Selected" label still fits under a shrunken button.

- [ ] **Step 3: Commit**

```bash
git add src/css/feed.css
git commit -m "Fluid feed nav button widths so a partial button signals scroll"
```

---

### Task 9: Full verification pass

**Files:**
- Modify: `README.md` (structure listing only, if stale paths bother the diff; optional)

**Interfaces:**
- Consumes: everything above.
- Produces: a verified, committed working tree, not pushed.

- [ ] **Step 1: Production build**

```bash
npm run build
```

Expected: clean exit, minified CSS/JS in `_site/`.

- [ ] **Step 2: Output assertions**

```bash
test -f _site/.htaccess && echo A-OK
test -f _site/albums/index.html && test ! -d _site/music && echo B-OK
test -f _site/digital/index.html && test -f _site/objects/index.html && echo C-OK
test ! -d _site/mind && echo D-OK
grep -c "lg-site-nav" _site/index.html _site/digital/index.html _site/objects/index.html
grep -c "data-deep-link" _site/albums/index.html _site/lyrics/index.html _site/images/index.html
grep -c "collages\|mirror neurons\|wikipedia" _site/images/index.html || echo E-OK
```

Expected: A-OK through E-OK; every grep -c count at least 1.

- [ ] **Step 3: Manual browser sweep**

`npm run start`; on every page (/, /albums/, /images/, /videos/, /lyrics/, /press/, /digital/, /objects/, /bardo/): no console errors, site nav present and correct, directory correct, popups (contact, password, muppet) still open and close.

- [ ] **Step 4: Update README structure listing**

In `README.md`, the structure block references `src/archive/index.html` (does not exist) and predates the new folders. Update the listing to match reality: `index.html # home page (the mind blog)`, `albums/`, `mind/`, `digital/`, `objects/`, drop `archive/`. Keep the rest of the README unchanged.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "Update README structure for the reorganized site"
```

- [ ] **Step 6: Report**

Do not push. Report to Lacey: what was verified, and that pushing to main will deploy via FTP, including the new `.htaccess`. The `/music/` 301 can only be confirmed on production after she pushes.
