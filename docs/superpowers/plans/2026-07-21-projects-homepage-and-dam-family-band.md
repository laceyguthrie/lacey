# Projects Homepage + The Dam Family Band Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a draft homepage at `/draft/` (Releases → Projects, a post-punk "unwell" intro, a "current work" section, and a trimmed by-band discography) plus a new JSON-driven constellation page at `/dam-family-band/`, without altering the live site.

**Architecture:** Static Eleventy site. New pages reuse the existing `layouts/base.html` and its `extraCSS`/`extraScripts` front-matter hooks. The nav in `base.html` gains draft-aware branches that render byte-identically for every existing page. The constellation reads one Eleventy global-data file (`src/_data/damFamily.json`) two ways: Liquid renders a build-time accessible fallback list, and the same data is inlined into a `<script type="application/json">` block that vanilla JS parses to draw a seeded, frozen force-directed SVG.

**Tech Stack:** Eleventy 3.1.5, LiquidJS templating, vanilla JS (no libraries), plain CSS following the existing `lg-` naming. Tests via Node's built-in `node:test` runner (zero new dependencies).

## Global Constraints

- **Live site untouched:** every existing page (`home`, `images`, `videos`, `lyrics`, `press`) must render byte-identical HTML until promotion. Verify with a build diff.
- **Strictly black & white.** No color is introduced on the new pages. (The existing global accents `#00ffee` focus / `#f9ff5a` selection are inherited, not added to.)
- **Design north star:** simple and classic, but a little unwell — bauhaus/brutalist/post-punk editorial, controlled wrongness over ornament, holding beauty and fragility at once. Not Memphis, not decorated, not promotional. See `docs/superpowers/specs/2026-07-20-projects-homepage-and-dam-family-band-design.md`.
- **No embedded players** on the draft discography — external links only.
- **Naming:** new CSS classes follow the existing `lg-` BEM-ish convention.
- **Fonts:** reuse the loaded families only — `Jacquard 12`, `Jacquard 24` (display), `Arimo` (body).
- **Dev server** already runs at `http://localhost:8080` (`npm run start`). Production build is `npm run build`.
- **No unit-test framework exists** in this repo. HTML/CSS tasks are verified by build + grep + browser; only the constellation's pure JS functions get `node:test` unit tests.

---

## Deviations from the spec (confirm at plan review)

1. **Constellation model is bipartite.** The spec described band nodes with members listed beside them; this plan renders both **people and bands as star nodes**, with each band drawing an edge to each of its members. This matches the original brief ("start with me and then draw lines out to all members of my band") and the lone-Lacey starting state. Same JSON shape.
2. **Data lives in `src/_data/damFamily.json`** (Eleventy global data), not `src/js/…`. This gives a build-time accessible fallback and a single source of truth, and avoids a runtime `fetch`. The JS reads the data from an inlined JSON `<script>` block, not the network.

---

## File Structure

**Create:**
- `src/draft/index.html` — the draft homepage (Projects heading, intro, current work, discography). Includes `shows.html`.
- `src/css/draft.css` — all draft-page styling. Loaded only by the draft page.
- `src/dam-family-band/index.html` — constellation page (no visible heading; inlined JSON + fallback list + SVG mount).
- `src/css/dam-family-band.css` — constellation styling.
- `src/js/dam-family-band.js` — seeded PRNG, bipartite graph build, force layout, SVG render.
- `src/_data/damFamily.json` — the constellation data (seeded with Lacey only).
- `test/dam-family-band.test.js` — `node:test` unit tests for the pure JS functions.

**Modify:**
- `src/_includes/layouts/base.html` — nav gains draft/dam-family-band branches (additive; live pages unchanged).
- `eleventy.config.js` — add a `json` filter (for inlining data) and confirm passthrough.

**Responsibilities:** each new file has one job. `dam-family-band.js` splits cleanly into pure functions (PRNG, `buildGraph`, `layout`) that are unit-tested, and DOM functions (`readData`, `render`) that are browser-verified.

---

## Task 1: Nav scaffolding (draft-aware, live pages unchanged)

**Files:**
- Modify: `src/_includes/layouts/base.html:44-54`
- Verify: full-site build diff

**Interfaces:**
- Produces: pages with `activePage: draft` render a first nav item `projects` (anchor to `#projects`); pages with `activePage: dam-family-band` render `projects` (link to `/draft/`); both render a `the dam family band` nav item. All other `activePage` values render exactly as before.

- [ ] **Step 1: Capture the current built nav as a baseline**

Run:
```bash
cd /Users/laceyguthrie/Sites/lacey && npm run build >/dev/null 2>&1 && cp -r _site /tmp/_site_baseline
```
Expected: build succeeds, baseline copied.

- [ ] **Step 2: Edit the first nav item block**

In `src/_includes/layouts/base.html`, replace this block (currently lines 44-48):
```liquid
                {%- if activePage == "home" %}
                <li><a class="js-anchor-link" href="#releases">releases</a></li>
                {%- else %}
                <li><a href="/">releases</a></li>
                {%- endif %}
```
with:
```liquid
                {%- if activePage == "home" %}
                <li><a class="js-anchor-link" href="#releases">releases</a></li>
                {%- elsif activePage == "draft" %}
                <li><a class="js-anchor-link" href="#projects">projects</a></li>
                {%- elsif activePage == "dam-family-band" %}
                <li><a href="/draft/">projects</a></li>
                {%- else %}
                <li><a href="/">releases</a></li>
                {%- endif %}
```

- [ ] **Step 3: Add the dam-family-band nav item**

Immediately after the `{%- endif %}` from Step 2 and before the `shows` line (`<li><a class="js-anchor-link" href="#shows">shows</a></li>`), insert:
```liquid
                {%- if activePage == "draft" or activePage == "dam-family-band" %}
                <li><a {% if activePage == "dam-family-band" %}class="is-active" {% endif %}href="/dam-family-band/">the dam family band</a></li>
                {%- endif %}
```

- [ ] **Step 4: Rebuild and diff against baseline (live pages must be identical)**

Run:
```bash
npm run build >/dev/null 2>&1 && diff -r /tmp/_site_baseline _site
```
Expected: **no differences** (no draft/dam pages exist yet, so every existing page must be byte-identical). If `diff` prints anything, the nav logic leaked into a live page — fix before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/_includes/layouts/base.html
git commit -m "Add draft-aware nav branches to base layout"
```

---

## Task 2: Draft page skeleton + intro section

**Files:**
- Create: `src/draft/index.html`
- Create: `src/css/draft.css`
- Verify: build + `http://localhost:8080/draft/`

**Interfaces:**
- Consumes: nav branches from Task 1 (`activePage: draft`).
- Produces: a page at `/draft/` with `<h2 id="projects" class="lg-section__title">` and an intro section, loading `css/draft.css`.

- [ ] **Step 1: Create the draft page with front matter, Projects heading, and intro**

Create `src/draft/index.html`:
```liquid
---
layout: layouts/base.html
title: laceyguthrie.com — projects (draft)
description: Draft in progress.
fontsHref: https://fonts.googleapis.com/css2?family=Jacquard+12&family=Jacquard+24&family=Arimo:ital,wght@0,400..700;1,400..700&display=swap
activePage: draft
extraCSS:
  - css/draft.css
extraScripts:
  - js/solo-outline.js
---
<main class="lg-main lg-flex--tablet container">
    <div class="lg-main__content">
        <section class="lg-section" id="projects-section">
            <h2 class="lg-section__title" id="projects">Projects</h2>

            <div class="lg-intro">
                <p class="lg-intro__lead">
                    A running record of the work — the records made just for me,
                    the <span class="lg-intro__break">band</span> I'm in now, and
                    everything that came before.
                </p>
                <p class="lg-intro__aside" aria-hidden="true">still here still here</p>
            </div>

            <!-- current work + discography added in later tasks -->
        </section>
    </div>
    {% include "shows.html" %}
</main>
```
(Placeholder intro copy — finalized collaboratively later. The doubled "still here" and the `lg-intro__break` hook exist so the CSS can express controlled wrongness.)

- [ ] **Step 2: Create draft.css with the "unwell" intro styling**

Create `src/css/draft.css`:
```css
/* ==========================================================================
   DRAFT PAGE — PROJECTS
   Simple, classic, a little unwell. Black & white only.
   ========================================================================== */

.lg-intro {
    position: relative;
    max-width: 34rem;
    padding: 1.5rem 0 2rem;
    border-bottom: 1px solid #000;
}

.lg-intro__lead {
    margin: 0;
    font-family: "Arimo", sans-serif;
    font-size: 1.5rem;
    line-height: 1.15;
    /* nudged a hair off baseline — felt, not named */
    transform: translateY(-2px);
}

/* a heading-ish word that breaks where it shouldn't */
.lg-intro__break {
    display: inline-block;
    word-break: break-all;
    letter-spacing: 0.02em;
}

/* one line spaced too wide, whispering under the lead */
.lg-intro__aside {
    margin: 0.75rem 0 0;
    font-family: "Jacquard 24", cursive;
    font-size: 0.75rem;
    letter-spacing: 0.9em;
    text-indent: 0.9em; /* balance the trailing letter-spacing */
    opacity: 0.55;
    transform: rotate(-0.4deg);
    transform-origin: left center;
}

@media screen and (min-width: 768px) {
    .lg-intro__lead {
        font-size: 2rem;
    }
}
```

- [ ] **Step 3: Build and verify the page renders**

Run:
```bash
npm run build >/dev/null 2>&1 && test -f _site/draft/index.html && grep -c 'id="projects"' _site/draft/index.html && grep -c 'draft.css' _site/draft/index.html
```
Expected: file exists; both greps print `1`.

- [ ] **Step 4: Verify live pages still unchanged**

Run:
```bash
diff -r /tmp/_site_baseline _site --exclude=draft
```
Expected: no differences outside `draft/`.

- [ ] **Step 5: Browser check**

Open `http://localhost:8080/draft/`. Confirm: nav shows `projects` and `the dam family band`; the "Projects" heading; the intro reads as intentional-but-slightly-off. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/draft/index.html src/css/draft.css
git commit -m "Add draft Projects page skeleton and intro section"
```

---

## Task 3: Current work section

**Files:**
- Modify: `src/draft/index.html` (replace the `<!-- current work … -->` comment)
- Modify: `src/css/draft.css` (append)
- Verify: build + browser

**Interfaces:**
- Consumes: `.lg-section` layout from Task 2.
- Produces: a `current work` subheading, a `Lacey Guthrie (solo)` block (MA AM → King → Flower-Eating Monster → stage/touring note), and a `duchess` block.

- [ ] **Step 1: Insert the current-work markup**

In `src/draft/index.html`, replace `<!-- current work + discography added in later tasks -->` with:
```liquid
            <div class="lg-work">
                <h3 class="lg-work__heading">current work</h3>

                <article class="lg-work__project">
                    <h4 class="lg-work__project-title">Lacey Guthrie <span class="lg-work__project-kind">(solo)</span></h4>
                    <p class="lg-work__note">The records I'm making just for me.</p>

                    <div class="lg-work__record">
                        <h5 class="lg-work__record-title">MA AM <span class="lg-work__record-year">2026</span></h5>
                        <span class="lg-section__loading">loading...</span>
                        <p class="lg-work__credits">Produced and recorded with Kevin Ratterman at Invisible Island in LA. In progress.</p>
                    </div>

                    <div class="lg-work__record">
                        <h5 class="lg-work__record-title">The King of Holding Onto Things <span class="lg-work__record-year">2021</span></h5>
                        <p class="lg-work__credits">
                            Released on tape by Auralgami Sounds; self-released on vinyl.<br>
                            Recorded by Nick Roeder. Mixed by Kevin Ratterman.
                        </p>
                        <ul class="lg-section__chunk-links">
                            <li><a class="lg-pill" href="https://laceyguthrie.bandcamp.com/album/the-king-of-holding-onto-things" target="_blank" rel="noopener noreferrer">listen on bandcamp</a></li>
                        </ul>
                    </div>

                    <div class="lg-work__record">
                        <h5 class="lg-work__record-title">Flower-Eating Monster <span class="lg-work__record-year">2024</span></h5>
                        <p class="lg-work__credits">
                            Recorded and mixed by Kevin Ratterman.<br>
                            Released on vinyl by Evan Patterson's (Young Widows, Jaye Jayle) record label.
                        </p>
                        <ul class="lg-section__chunk-links">
                            <li><a class="lg-pill" href="https://laceyguthrie.bandcamp.com/album/flower-eating-monster" target="_blank" rel="noopener noreferrer">listen on bandcamp</a></li>
                            <li><a class="lg-pill" href="https://shirtkiller.com/products/lacey-guthrie-flower-eating-monster-lp" target="_blank" rel="noopener noreferrer">order vinyl</a></li>
                        </ul>
                    </div>

                    <p class="lg-work__stage">
                        I've been playing this work solo on tour with Young Widows, and in
                        Louisville with a band that has included Amy Lee Montgomery, Regan
                        Heckscher, Scott Boice, Brian Schrek, Alex Rickel, and Mat Pennington.
                        Amy, Regan, and I have become a trio that's blossoming into its own thing.
                    </p>
                </article>

                <article class="lg-work__project">
                    <h4 class="lg-work__project-title">duchess</h4>
                    <p class="lg-work__note">The band I'm in now — a collaboration between Lacey Guthrie, Victoria Fisher, Katie Peabody, and Todd Cook.</p>
                </article>
            </div>

            <!-- discography added in Task 4 -->
```

- [ ] **Step 2: Append current-work styles to draft.css**

Append to `src/css/draft.css`:
```css
/* ==========================================================================
   CURRENT WORK
   ========================================================================== */

.lg-work {
    display: grid;
    gap: 2.5rem;
    padding-top: 2rem;
}

.lg-work__heading {
    margin: 0;
    font-family: "Jacquard 24", cursive;
    font-size: 1.25rem;
    font-weight: 400;
    line-height: 1;
}

.lg-work__project {
    display: grid;
    gap: 0.75rem;
    max-width: 34rem;
}

.lg-work__project-title {
    margin: 0;
    font-family: "Arimo", sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.1;
}

.lg-work__project-kind {
    font-weight: 400;
    font-style: italic;
}

.lg-work__note {
    margin: 0;
    font-style: italic;
}

.lg-work__record {
    display: grid;
    gap: 0.375rem;
    padding: 0.75rem 0 0 0.75rem;
    border-left: 1px solid #000;
}

.lg-work__record-title {
    margin: 0;
    font-family: "Arimo", sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.1;
}

.lg-work__record-year {
    font-weight: 400;
    font-size: 0.7rem;
    vertical-align: super;
}

.lg-work__credits,
.lg-work__stage {
    margin: 0;
    max-width: 34rem;
}

.lg-work__stage {
    padding-top: 0.5rem;
}
```

- [ ] **Step 3: Build and verify content is present**

Run:
```bash
npm run build >/dev/null 2>&1 && grep -c "MA AM" _site/draft/index.html && grep -c "Victoria Fisher" _site/draft/index.html && grep -c "Young Widows" _site/draft/index.html
```
Expected: each grep prints at least `1`.

- [ ] **Step 4: Browser check**

Reload `http://localhost:8080/draft/`. Confirm the current-work section reads top-to-bottom: MA AM (with the "loading..." shimmer), King, Flower-Eating Monster, the stage/touring paragraph, then duchess. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/draft/index.html src/css/draft.css
git commit -m "Add current work section to draft Projects page"
```

---

## Task 4: Full discography (by band, links only, no embeds)

**Files:**
- Modify: `src/draft/index.html` (replace `<!-- discography added in Task 4 -->`)
- Modify: `src/css/draft.css` (append)
- Verify: build + browser

**Interfaces:**
- Consumes: `.lg-section` layout.
- Produces: a `Full Discography` block grouped by band with active dates and external links only.

- [ ] **Step 1: Insert the discography markup**

Replace `<!-- discography added in Task 4 -->` with:
```liquid
            <div class="lg-disco">
                <h3 class="lg-disco__heading">Full Discography</h3>

                <section class="lg-disco__band">
                    <h4 class="lg-disco__band-name">Lacey Guthrie <span class="lg-disco__band-years">2021–current</span></h4>
                    <ul class="lg-disco__list">
                        <li>MA AM <span class="lg-disco__year">2026</span> <span class="lg-disco__meta">in progress</span></li>
                        <li>Flower-Eating Monster <span class="lg-disco__year">2024</span> <a class="lg-pill" href="https://laceyguthrie.bandcamp.com/album/flower-eating-monster" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                        <li>The King of Holding Onto Things <span class="lg-disco__year">2021</span> <a class="lg-pill" href="https://laceyguthrie.bandcamp.com/album/the-king-of-holding-onto-things" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                    </ul>
                </section>

                <section class="lg-disco__band">
                    <h4 class="lg-disco__band-name">duchess <span class="lg-disco__band-years">current</span></h4>
                    <p class="lg-disco__note">With Victoria Fisher, Katie Peabody, and Todd Cook.</p>
                </section>

                <section class="lg-disco__band">
                    <h4 class="lg-disco__band-name">Twin Limb <span class="lg-disco__band-years">2015–2020</span></h4>
                    <ul class="lg-disco__list">
                        <li>Priestess <span class="lg-disco__year">2020</span> <a class="lg-pill" href="https://twinlimb.bandcamp.com/track/priestess" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                        <li>In The Warm Light, As A Ghost <span class="lg-disco__year">2019</span> <a class="lg-pill" href="https://twinlimb.bandcamp.com/album/in-the-warm-light-as-a-ghost" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                        <li>Haplo <span class="lg-disco__year">2016</span> <a class="lg-pill" href="https://music.apple.com/us/album/haplo/1158243246" target="_blank" rel="noopener noreferrer">apple music</a> <a class="lg-pill" href="https://tidal.com/browse/album/65993736?u" target="_blank" rel="noopener noreferrer">tidal</a></li>
                        <li>Anything Is Possible And Nothing Makes Sense <span class="lg-disco__year">2015</span> <a class="lg-pill" href="https://twinlimb.bandcamp.com/album/anything-is-possible-and-nothing-makes-sense" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                    </ul>
                </section>

                <section class="lg-disco__band">
                    <h4 class="lg-disco__band-name">Ouzelum <span class="lg-disco__band-years">2020</span></h4>
                    <ul class="lg-disco__list">
                        <li>Ouzelum <span class="lg-disco__year">2020</span> <a class="lg-pill" href="https://ouzelum.bandcamp.com/album/ouzelum" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                    </ul>
                </section>

                <section class="lg-disco__band">
                    <h4 class="lg-disco__band-name">Pleasure Boys <span class="lg-disco__band-years">2016–current</span></h4>
                    <ul class="lg-disco__list">
                        <li>A One Night Show <span class="lg-disco__year">2019</span> <a class="lg-pill" href="https://pleasureboys.bandcamp.com/album/a-one-night-show" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                        <li>Shadows <span class="lg-disco__year">2018</span> <a class="lg-pill" href="https://pleasureboys.bandcamp.com/album/shadows" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                        <li>Waking Up <span class="lg-disco__year">2017</span> <a class="lg-pill" href="https://pleasureboys.bandcamp.com/album/waking-up" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                        <li>Mowed Down <span class="lg-disco__year">2016</span> <a class="lg-pill" href="https://pleasureboys.bandcamp.com/album/mowed-down" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                    </ul>
                </section>

                <section class="lg-disco__band">
                    <h4 class="lg-disco__band-name">Reading Group <span class="lg-disco__band-years">2010–2011</span></h4>
                    <ul class="lg-disco__list">
                        <li>Emergency Action Plan <span class="lg-disco__year">2011</span> <a class="lg-pill" href="https://readinggroup.bandcamp.com/album/emergency-action-plan" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                        <li>Hugging Is Mandatory! <span class="lg-disco__year">2010</span> <a class="lg-pill" href="https://readinggroup.bandcamp.com/album/hugging-is-mandatory" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                    </ul>
                </section>

                <section class="lg-disco__band">
                    <h4 class="lg-disco__band-name">Bunny Day &amp; The Mercy Buckets <span class="lg-disco__band-years">2010</span></h4>
                    <ul class="lg-disco__list">
                        <li>This Is Manifesto <span class="lg-disco__year">2010</span> <a class="lg-pill" href="https://bunnydayandthemercybuckets.bandcamp.com/album/this-is-manifesto" target="_blank" rel="noopener noreferrer">bandcamp</a></li>
                    </ul>
                </section>
            </div>
```

- [ ] **Step 2: Append discography styles to draft.css**

Append to `src/css/draft.css`:
```css
/* ==========================================================================
   FULL DISCOGRAPHY
   ========================================================================== */

.lg-disco {
    display: grid;
    gap: 2rem;
    padding-top: 2.5rem;
    margin-top: 2rem;
    border-top: 1px solid #000;
}

.lg-disco__heading {
    margin: 0;
    font-family: "Jacquard 24", cursive;
    font-size: 1.25rem;
    font-weight: 400;
    line-height: 1;
}

.lg-disco__band {
    display: grid;
    gap: 0.5rem;
}

.lg-disco__band-name {
    margin: 0;
    font-family: "Arimo", sans-serif;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.1;
}

.lg-disco__band-years {
    font-weight: 400;
    font-size: 0.7rem;
    font-style: italic;
    letter-spacing: 0.03em;
}

.lg-disco__note {
    margin: 0;
    font-style: italic;
}

.lg-disco__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
}

.lg-disco__list li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem;
}

.lg-disco__year {
    font-size: 0.7rem;
    opacity: 0.7;
}

.lg-disco__meta {
    font-size: 0.7rem;
    font-style: italic;
    opacity: 0.7;
}
```

- [ ] **Step 3: Build and verify no iframes leaked in and bands are present**

Run:
```bash
npm run build >/dev/null 2>&1 && echo "iframes:" && grep -c "iframe" _site/draft/index.html; echo "bands:" && grep -c "lg-disco__band-name" _site/draft/index.html
```
Expected: `iframes:` prints `0`; `bands:` prints `7`.

- [ ] **Step 4: Browser check**

Reload `http://localhost:8080/draft/`. Confirm seven band groups, links only (no embedded players), Pleasure Boys reads `2016–current`. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/draft/index.html src/css/draft.css
git commit -m "Add trimmed by-band discography to draft Projects page"
```

---

## Task 5: Eleventy `json` filter + constellation seed data

**Files:**
- Modify: `eleventy.config.js`
- Create: `src/_data/damFamily.json`
- Create: `test/dam-family-band.test.js` (data-shape assertion only in this task)

**Interfaces:**
- Produces: a global `damFamily` data object `{ people: string[], bands: { name: string, members: string[] }[] }`, and a `json` Liquid filter that serializes a value to a JSON string.

- [ ] **Step 1: Add the `json` filter to Eleventy config**

Edit `eleventy.config.js` to add the filter before the `return`:
```javascript
module.exports = function(eleventyConfig) {
  // Copy static assets straight through to _site/ without processing.
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/*.ico");

  // Serialize a value to a JSON string (used to inline data into pages).
  eleventyConfig.addFilter("json", function (value) {
    return JSON.stringify(value);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
```

- [ ] **Step 2: Create the seed data (Lacey only)**

Create `src/_data/damFamily.json`:
```json
{
  "people": ["Lacey Guthrie"],
  "bands": []
}
```

- [ ] **Step 3: Write a data-shape test**

Create `test/dam-family-band.test.js`:
```javascript
const { test } = require('node:test');
const assert = require('node:assert');
const data = require('../src/_data/damFamily.json');

test('seed data has the expected shape', () => {
  assert.ok(Array.isArray(data.people), 'people is an array');
  assert.ok(Array.isArray(data.bands), 'bands is an array');
  assert.ok(data.people.includes('Lacey Guthrie'), 'seeded with Lacey');
});
```

- [ ] **Step 4: Run the test**

Run:
```bash
node --test
```
Expected: 1 test passes.

- [ ] **Step 5: Build to confirm config still valid**

Run:
```bash
npm run build >/dev/null 2>&1 && echo "build ok"
```
Expected: `build ok`.

- [ ] **Step 6: Commit**

```bash
git add eleventy.config.js src/_data/damFamily.json test/dam-family-band.test.js
git commit -m "Add json filter and seed dam family constellation data"
```

---

## Task 6: Dam family band page (skeleton, inlined data, accessible fallback)

**Files:**
- Create: `src/dam-family-band/index.html`
- Verify: build + browser

**Interfaces:**
- Consumes: `damFamily` global data + `json` filter (Task 5); nav branch `activePage: dam-family-band` (Task 1).
- Produces: a page at `/dam-family-band/` containing a JSON `<script id="dam-data">`, a visually-hidden fallback `<ul>`, and an empty `<div id="dam-stage">` mount, loading `dam-family-band.css` + `dam-family-band.js`.

- [ ] **Step 1: Create the page**

Create `src/dam-family-band/index.html`:
```liquid
---
layout: layouts/base.html
title: the dam family band
description: How the Louisville music scene is intertwined.
fontsHref: https://fonts.googleapis.com/css2?family=Jacquard+12&family=Jacquard+24&family=Arimo:ital,wght@0,400..700;1,400..700&display=swap
activePage: dam-family-band
extraCSS:
  - css/dam-family-band.css
extraScripts:
  - js/dam-family-band.js
---
<main class="lg-dam container--wide">
    <script type="application/json" id="dam-data">{{ damFamily | json }}</script>

    <div class="lg-dam__stage" id="dam-stage" aria-hidden="true"></div>

    <div class="lg-dam__fallback">
        <h2 class="sr-only">The dam family band — people and the bands they share</h2>
        <ul>
            {%- for band in damFamily.bands %}
            <li><strong>{{ band.name }}</strong>: {{ band.members | join: ", " }}</li>
            {%- endfor %}
            {%- for person in damFamily.people %}
            <li>{{ person }}</li>
            {%- endfor %}
        </ul>
    </div>
</main>
```
Note: the fallback lists bands (with members) and any people. It is visible by default; `dam-family-band.js` hides it only after a successful render.

- [ ] **Step 2: Build and verify the data inlined and fallback rendered**

Run:
```bash
npm run build >/dev/null 2>&1 && grep -c 'id="dam-data"' _site/dam-family-band/index.html && grep -c "Lacey Guthrie" _site/dam-family-band/index.html && grep -c 'id="dam-stage"' _site/dam-family-band/index.html
```
Expected: each prints at least `1`.

- [ ] **Step 3: Verify the inlined JSON is valid**

Run:
```bash
node -e "const h=require('fs').readFileSync('_site/dam-family-band/index.html','utf8');const m=h.match(/id=\"dam-data\">([\s\S]*?)<\/script>/);JSON.parse(m[1]);console.log('valid json inlined')"
```
Expected: `valid json inlined`.

- [ ] **Step 4: Verify live pages still unchanged**

Run:
```bash
diff -r /tmp/_site_baseline _site --exclude=draft --exclude=dam-family-band
```
Expected: no differences.

- [ ] **Step 5: Commit**

```bash
git add src/dam-family-band/index.html
git commit -m "Add dam family band page skeleton with inlined data and fallback"
```

---

## Task 7: Constellation JavaScript (PRNG, graph, layout, render)

**Files:**
- Create: `src/js/dam-family-band.js`
- Modify: `test/dam-family-band.test.js` (add unit tests)
- Verify: `node --test` + browser

**Interfaces:**
- Consumes: `#dam-data` JSON and `#dam-stage` mount in the page (Task 6).
- Produces: pure functions `mulberry32(seed) → () → number`, `buildGraph(data) → {nodes, edges}`, `layout(graph, opts) → graph` (mutates node `.x/.y`); DOM functions `readData()` and `render(graph)`. Node objects: `{ id, label, type: 'person'|'band', x, y }`. Edge objects: `{ a: nodeIndex, b: nodeIndex }`.

- [ ] **Step 1: Write failing unit tests for the pure functions**

Append to `test/dam-family-band.test.js`:
```javascript
const dam = require('../src/js/dam-family-band.js');

test('mulberry32 is deterministic for a fixed seed', () => {
  const a = dam.mulberry32(42);
  const b = dam.mulberry32(42);
  assert.strictEqual(a(), b(), 'same seed → same first value');
  assert.ok(a() >= 0 && a() < 1, 'values in [0,1)');
});

test('buildGraph makes a person node per unique member and a node per band', () => {
  const g = dam.buildGraph({
    people: ['Lacey Guthrie'],
    bands: [{ name: 'duchess', members: ['Lacey Guthrie', 'Todd Cook'] }]
  });
  const people = g.nodes.filter(n => n.type === 'person');
  const bands = g.nodes.filter(n => n.type === 'band');
  assert.strictEqual(people.length, 2, 'Lacey + Todd');
  assert.strictEqual(bands.length, 1, 'duchess');
  assert.strictEqual(g.edges.length, 2, 'duchess→Lacey, duchess→Todd');
});

test('buildGraph handles the lone-person seed (no bands)', () => {
  const g = dam.buildGraph({ people: ['Lacey Guthrie'], bands: [] });
  assert.strictEqual(g.nodes.length, 1);
  assert.strictEqual(g.edges.length, 0);
});

test('buildGraph tolerates malformed input', () => {
  assert.deepStrictEqual(dam.buildGraph({}), { nodes: [], edges: [] });
  assert.deepStrictEqual(dam.buildGraph(null), { nodes: [], edges: [] });
});

test('layout is deterministic and assigns finite coordinates', () => {
  const input = { people: ['A', 'B'], bands: [{ name: 'X', members: ['A', 'B'] }] };
  const g1 = dam.layout(dam.buildGraph(input));
  const g2 = dam.layout(dam.buildGraph(input));
  assert.ok(Number.isFinite(g1.nodes[0].x) && Number.isFinite(g1.nodes[0].y));
  assert.strictEqual(g1.nodes[0].x, g2.nodes[0].x, 'same input → same layout');
  assert.strictEqual(g1.nodes[0].y, g2.nodes[0].y);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run:
```bash
node --test
```
Expected: FAIL — cannot find module `../src/js/dam-family-band.js`.

- [ ] **Step 3: Implement the constellation script**

Create `src/js/dam-family-band.js`:
```javascript
/**
 * The dam family band — a seeded, frozen force-directed constellation.
 * People and bands are stars; each band links to each of its members.
 * No libraries, no interactivity: the sim runs to a fixed iteration count
 * with a fixed seed, then freezes. Identical on every visit.
 */
(function (root) {
  'use strict';

  // Deterministic PRNG so the layout is identical on every load.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Build a bipartite graph: person nodes + band nodes, edges band→member.
  function buildGraph(data) {
    var out = { nodes: [], edges: [] };
    if (!data || typeof data !== 'object') return out;
    var people = Array.isArray(data.people) ? data.people : [];
    var bands = Array.isArray(data.bands) ? data.bands : [];
    var indexByPerson = {};

    function ensurePerson(name) {
      if (typeof name !== 'string' || !name) return -1;
      if (indexByPerson[name] == null) {
        indexByPerson[name] = out.nodes.length;
        out.nodes.push({ id: 'p:' + name, label: name, type: 'person', x: 0, y: 0 });
      }
      return indexByPerson[name];
    }

    people.forEach(ensurePerson);

    bands.forEach(function (band, i) {
      if (!band || typeof band.name !== 'string' || !band.name) return;
      var bandIdx = out.nodes.length;
      out.nodes.push({ id: 'b:' + i + ':' + band.name, label: band.name, type: 'band', x: 0, y: 0 });
      var members = Array.isArray(band.members) ? band.members : [];
      members.forEach(function (m) {
        var pIdx = ensurePerson(m);
        if (pIdx >= 0) out.edges.push({ a: bandIdx, b: pIdx });
      });
    });

    return out;
  }

  // Run a small force simulation to a fixed iteration count, then stop.
  function layout(graph, opts) {
    opts = opts || {};
    var n = graph.nodes.length;
    if (n === 0) return graph;

    var W = opts.width || 1000;
    var H = opts.height || 700;
    var ITERS = opts.iterations || 300;
    var SEED = opts.seed || 20260721;
    var K_REPEL = opts.repel || 42000;
    var K_SPRING = opts.spring || 0.02;
    var SPRING_LEN = opts.springLength || 120;
    var GRAVITY = opts.gravity || 0.008;
    var DAMPING = 0.85;

    var rand = mulberry32(SEED);
    var cx = W / 2, cy = H / 2;

    // Deterministic starting ring.
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 + rand() * 0.5;
      var rad = 60 + rand() * 120;
      graph.nodes[i].x = cx + Math.cos(ang) * rad;
      graph.nodes[i].y = cy + Math.sin(ang) * rad;
      graph.nodes[i].vx = 0;
      graph.nodes[i].vy = 0;
    }

    for (var it = 0; it < ITERS; it++) {
      // Pairwise repulsion.
      for (var p = 0; p < n; p++) {
        for (var q = p + 1; q < n; q++) {
          var np = graph.nodes[p], nq = graph.nodes[q];
          var dx = np.x - nq.x, dy = np.y - nq.y;
          var d2 = dx * dx + dy * dy || 0.01;
          var f = K_REPEL / d2;
          var d = Math.sqrt(d2);
          var ux = dx / d, uy = dy / d;
          np.vx += ux * f; np.vy += uy * f;
          nq.vx -= ux * f; nq.vy -= uy * f;
        }
      }
      // Springs along edges.
      for (var e = 0; e < graph.edges.length; e++) {
        var na = graph.nodes[graph.edges[e].a];
        var nb = graph.nodes[graph.edges[e].b];
        var ex = nb.x - na.x, ey = nb.y - na.y;
        var el = Math.sqrt(ex * ex + ey * ey) || 0.01;
        var force = K_SPRING * (el - SPRING_LEN);
        var fx = (ex / el) * force, fy = (ey / el) * force;
        na.vx += fx; na.vy += fy;
        nb.vx -= fx; nb.vy -= fy;
      }
      // Gravity toward center + integrate.
      for (var g = 0; g < n; g++) {
        var node = graph.nodes[g];
        node.vx += (cx - node.x) * GRAVITY;
        node.vy += (cy - node.y) * GRAVITY;
        node.vx *= DAMPING; node.vy *= DAMPING;
        node.x += node.vx; node.y += node.vy;
      }
    }

    for (var k = 0; k < n; k++) { delete graph.nodes[k].vx; delete graph.nodes[k].vy; }
    return graph;
  }

  // ---- DOM (browser only) ----

  function readData() {
    var el = document.getElementById('dam-data');
    if (!el) return null;
    try { return JSON.parse(el.textContent); }
    catch (e) { return null; }
  }

  function render(graph) {
    var stage = document.getElementById('dam-stage');
    if (!stage) return;

    var pad = 60;
    var xs = graph.nodes.map(function (nd) { return nd.x; });
    var ys = graph.nodes.map(function (nd) { return nd.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    if (minX === maxX) { minX -= 100; maxX += 100; }
    if (minY === maxY) { minY -= 100; maxY += 100; }
    var vbW = (maxX - minX) + pad * 2;
    var vbH = (maxY - minY) + pad * 2;

    var SVG = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'lg-dam__svg');
    svg.setAttribute('viewBox', (minX - pad) + ' ' + (minY - pad) + ' ' + vbW + ' ' + vbH);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'A constellation of people and the bands they share.');

    graph.edges.forEach(function (edge) {
      var na = graph.nodes[edge.a], nb = graph.nodes[edge.b];
      var line = document.createElementNS(SVG, 'line');
      line.setAttribute('x1', na.x); line.setAttribute('y1', na.y);
      line.setAttribute('x2', nb.x); line.setAttribute('y2', nb.y);
      line.setAttribute('class', 'lg-dam__line');
      svg.appendChild(line);
    });

    graph.nodes.forEach(function (nd) {
      var g = document.createElementNS(SVG, 'g');
      g.setAttribute('class', 'lg-dam__node lg-dam__node--' + nd.type);
      g.setAttribute('transform', 'translate(' + nd.x + ',' + nd.y + ')');

      var dot = document.createElementNS(SVG, 'circle');
      dot.setAttribute('r', nd.type === 'band' ? 5 : 3);
      dot.setAttribute('class', 'lg-dam__dot');
      g.appendChild(dot);

      var text = document.createElementNS(SVG, 'text');
      text.setAttribute('x', 8);
      text.setAttribute('y', 3);
      text.setAttribute('class', 'lg-dam__label');
      text.textContent = nd.label;
      g.appendChild(text);

      svg.appendChild(g);
    });

    stage.appendChild(svg);
    stage.removeAttribute('aria-hidden');
    var main = document.querySelector('.lg-dam');
    if (main) main.classList.add('lg-dam--js');
  }

  function init() {
    var data = readData();
    if (!data) return;                 // fallback list stays visible
    var graph = buildGraph(data);
    if (!graph.nodes.length) return;   // nothing to draw; fallback stays
    layout(graph);
    render(graph);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mulberry32: mulberry32, buildGraph: buildGraph, layout: layout };
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})(typeof window !== 'undefined' ? window : this);
```

- [ ] **Step 4: Run unit tests to confirm they pass**

Run:
```bash
node --test
```
Expected: all tests pass (data-shape + PRNG + graph + layout).

- [ ] **Step 5: Commit**

```bash
git add src/js/dam-family-band.js test/dam-family-band.test.js
git commit -m "Add seeded force-directed constellation script with unit tests"
```

---

## Task 8: Constellation styling + verification

**Files:**
- Create: `src/css/dam-family-band.css`
- Verify: build + browser (with data variations)

**Interfaces:**
- Consumes: SVG markup and the `lg-dam--js` class added by `render()`.
- Produces: black & white constellation styling; fallback hidden only when `.lg-dam--js` is present.

- [ ] **Step 1: Create the stylesheet**

Create `src/css/dam-family-band.css`:
```css
/* ==========================================================================
   THE DAM FAMILY BAND — constellation
   Black & white. Hairlines. Quiet.
   ========================================================================== */

.lg-dam {
    padding-top: 2rem;
    padding-bottom: 4rem;
}

.lg-dam__stage {
    width: 100%;
    min-height: 70vh;
}

.lg-dam__svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
}

.lg-dam__line {
    stroke: #000;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
}

.lg-dam__dot {
    fill: #000;
}

.lg-dam__node--band .lg-dam__dot {
    fill: #fff;
    stroke: #000;
    stroke-width: 1.5;
}

.lg-dam__label {
    font-family: "Arimo", sans-serif;
    font-size: 11px;
    fill: #000;
    dominant-baseline: middle;
}

.lg-dam__node--band .lg-dam__label {
    font-family: "Jacquard 24", cursive;
    font-size: 15px;
}

/* Fallback list: visible by default; hidden once JS has drawn the SVG. */
.lg-dam__fallback {
    padding-top: 1.5rem;
}

.lg-dam__fallback ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
    max-width: 34rem;
}

.lg-dam--js .lg-dam__fallback {
    position: absolute;
    overflow: hidden;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    clip: rect(0 0 0 0);
}
```

- [ ] **Step 2: Build and verify**

Run:
```bash
npm run build >/dev/null 2>&1 && grep -c "dam-family-band.css" _site/dam-family-band/index.html
```
Expected: prints `1`.

- [ ] **Step 3: Browser check — lone star**

Open `http://localhost:8080/dam-family-band/`. With the seed data (Lacey only) confirm: a single labeled star renders (not broken/empty); the fallback list is visually hidden; no console errors; nav shows `the dam family band` as active.

- [ ] **Step 4: Browser check — populated graph (temporary data)**

Temporarily edit `src/_data/damFamily.json` to:
```json
{
  "people": ["Lacey Guthrie"],
  "bands": [
    { "name": "duchess", "members": ["Lacey Guthrie", "Victoria Fisher", "Katie Peabody", "Todd Cook"] },
    { "name": "Twin Limb", "members": ["Lacey Guthrie", "Kevin Ratterman", "Maryliz Bender"] }
  ]
}
```
Reload. Confirm: two band stars and the people stars, lines from each band to its members, Lacey sitting between the two bands (shared member), no overlap-into-illegibility, identical layout on repeated reloads. Then **revert** the file:
```bash
git checkout src/_data/damFamily.json
```

- [ ] **Step 5: Browser check — malformed data does not blank the page**

Temporarily break the JSON (e.g. add a trailing comma) in `src/_data/damFamily.json`, but since that would fail the build, instead test the runtime guard: in DevTools console on the page, run `document.getElementById('dam-data').textContent = '{bad json'` then re-run the script logic by reloading is not applicable — instead confirm by code review that `readData()` catches `JSON.parse` errors and `init()` returns early, leaving the fallback visible. (Covered by the design; no file change.)

- [ ] **Step 6: Final live-pages diff**

Run:
```bash
npm run build >/dev/null 2>&1 && diff -r /tmp/_site_baseline _site --exclude=draft --exclude=dam-family-band
```
Expected: no differences.

- [ ] **Step 7: Commit**

```bash
git add src/css/dam-family-band.css
git commit -m "Style the dam family band constellation"
```

---

## Verification summary

- **Live site untouched:** Tasks 1, 2, 6, 8 each diff the build against `/tmp/_site_baseline` — every existing page stays byte-identical.
- **Draft page:** Projects heading, unwell intro, current work (MA AM → King → Flower-Eating Monster → stage note → duchess), 7-band links-only discography, no iframes.
- **Constellation:** seeded/frozen/no-interactivity bipartite graph; lone-Lacey renders; populated graph clusters on shared members; accessible fallback; malformed/empty data leaves the fallback visible.
- **Tests:** `node --test` covers PRNG determinism, graph construction (including lone-person and malformed input), and layout determinism.

## Out of scope (per spec)

- Populating the real constellation data (done together, after).
- Final intro copy (written together, on the draft).
- Promoting the draft to the live homepage.
- Changes to lyrics, images, videos, bardo, or press pages.
