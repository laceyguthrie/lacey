# Projects Homepage Redesign + The Dam Family Band — Design Spec

**Date:** 2026-07-20
**Status:** Approved for planning

## North Star

This site is not a portfolio built to sell anything. It exists to understand
oneself and existence while giving something to people at the same time. The
work comes from a place of grief and a sense of unreality — an appreciation
for beauty held simultaneously with an aching awareness of how fragile all of
this is.

The design target: **simple and classic, but a little unwell.** Bauhaus-ish /
brutalist / post-punk editorial — clean, confident, restrained — with a quiet
sense that something is off. An unease that isn't dark: expressive horror,
not horror-movie horror. Not Memphis Group, not ornament, not decoration.

Every design and copy decision gets measured against: *does this hold beauty
and fragility at once?* — not *does this look cool?*

## Overview

Three pieces of work:

1. A **draft homepage** at `/draft/` that renames Releases → Projects, adds a
   new intro and "current work" section, and condenses the discography.
2. A new page, **the dam family band**, at `/dam-family-band/` — a
   JSON-driven constellation of Louisville bands connected by shared members.
3. A **promotion path** for moving the draft to the live homepage when ready.

The live site stays untouched while the draft is iterated on.

## 1. Draft homepage — `/draft/`

New file `src/draft/index.html`, using the existing `layouts/base.html`.
Not linked from the live nav. Structure, top to bottom:

### Heading

`Projects` replaces `Releases` as the main `h2` (`lg-section__title`).

### Intro section

Strictly black & white. The foundation is classic: large confident type,
generous whitespace, hairline rules — using the existing Jacquard display
fonts and Arimo. The "unwell" quality comes from controlled wrongness rather
than ornament:

- type set slightly off-baseline or overlapping the rule above it
- a word repeated where it shouldn't be
- one line letter-spaced too wide
- a heading that breaks mid-word
- elements rotated a fraction of a degree

Off enough to feel, subtle enough that you can't immediately say why. This is
the same instinct as the existing scattered "solo albums" labels and wavy
text, matured. Intro copy is written collaboratively during implementation —
placeholder copy is acceptable in the first build.

### "current work" subheading

Text-forward highlights, two entries:

**Lacey Guthrie (solo)** — the albums she is making just for herself.
Ordered:

1. **MA AM** (in progress, 2026) — produced and recorded with Kevin
   Ratterman; keeps the existing "loading..." energy.
2. **The King of Holding Onto Things** — released on tape by Auralgami
   Sounds, self-released on vinyl. Recorded by Nick Roeder, mixed by Kevin
   Ratterman.
3. **Flower-Eating Monster** — recorded and mixed by Kevin Ratterman,
   released on vinyl by Evan Patterson's (Young Widows, Jaye Jayle) record
   label.

Followed by how this work lives on stage: playing it solo on tour with Young
Widows, and in Louisville with a band that has included Amy Lee Montgomery,
Regan Heckscher, Scott Boice, Brian Schrek, Alex Rickel, and Mat Pennington —
with Lacey, Amy, and Regan forming a trio that is blossoming into its own
thing.

**duchess** — the currently active band: a collaboration between Lacey
Guthrie, Victoria Fisher, Katie Peabody, and Todd Cook.

### "Full Discography" section

The existing homepage discography, condensed:

- Grouped **by band**, each with **dates active**. Pleasure Boys shown as
  2016–current (Lacey is on the new album).
- Bands: Lacey Guthrie (solo), duchess (if/when releases exist), Twin Limb,
  Pleasure Boys, Ouzelum, Reading Group, Bunny Day & The Mercy Buckets.
- Each record: title + year + external link (Bandcamp/Tidal/Apple Music as
  currently linked). **No embedded players.**
- Existing flavor notes may be kept where they fit (e.g. the Haplo rights
  note), but credits blocks and iframes go.

### Shows

The `shows.html` include stays, unchanged.

### Navigation on the draft page

The draft page's nav previews the future state:

- `projects` (anchor to `#projects`) replaces `releases`
- new item: `the dam family band` → `/dam-family-band/`
- everything else unchanged

The live nav in `base.html` is not modified until promotion. Implementation
may use a conditional in `base.html` keyed off the page (e.g.
`activePage == "draft"`) or a draft-specific include — whichever is smaller.

### CSS

All new styling in `src/css/draft.css`, loaded via the layout's existing
`extraCSS` front-matter hook. `style.css` is not modified. New class names
follow the existing `lg-` BEM-ish convention.

## 2. The dam family band — `/dam-family-band/`

New file `src/dam-family-band/index.html`. No page heading — the
constellation is the page. (The document `<title>` is still set.)

### Purpose

Show how intertwined the Louisville music scene is: bands connected by the
people they share.

### Data

A single JSON file (e.g. `src/js/dam-family-band-data.json`, passed through
to the built site) with this shape:

```json
{
  "people": ["Lacey Guthrie"],
  "bands": [
    { "name": "example band", "members": ["Person A", "Person B"] }
  ]
}
```

- **Starts with only Lacey — no seeded bands.** Content is added from
  scratch, collaboratively, after the page works.
- Growing the data never requires touching the rendering code.
- A person's name string is their identity — the same spelling in two bands
  is what draws a connection.

### Rendering

- Vanilla JS drawing SVG. **No libraries.**
- A small custom force simulation runs invisibly at page load — bands repel
  each other; bands sharing members attract — using a **seeded PRNG** so the
  layout is identical on every visit. After settling (a fixed iteration
  count, not real-time animation), the layout **freezes**.
- **Zero interactivity**: no dragging, no hover physics, no motion after
  settle.
- Each band node renders its name with its members listed beside it. Lines
  connect the same person across different bands.
- With only one person and no bands, the page renders a lone star. It should
  look intentional, not broken.
- Visual language follows the north star: hairline lines, restrained type,
  quiet wrongness welcome.

### Fallback / accessibility

The same data also renders as a plain HTML list (visually hidden when the
SVG renders) so screen readers and no-JS visitors get the family tree. If
the JSON fails to load or parse, the HTML list remains visible.

## 3. Promotion path (future, not part of this build)

When the draft is approved:

1. Draft content replaces `src/index.html`.
2. `draft.css` merges into `style.css`.
3. Nav updates site-wide: `projects` + `the dam family band`.
4. `/draft/` is removed.

## 4. Build & verification

- Eleventy config unchanged except, if needed, a passthrough copy for the
  JSON data file.
- Preview with `npx @11ty/eleventy --serve` throughout.
- Verify: draft page renders with new structure; live homepage and nav
  byte-identical to before (except any shared-layout conditional, which must
  be a no-op for existing pages); family band page renders the lone star,
  the fallback list, and survives malformed JSON.

## Out of scope

- Populating the family band data (done together, after)
- Final intro copy (written together, on the draft)
- Promoting the draft to live
- Any changes to lyrics, images, videos, bardo, or press pages
