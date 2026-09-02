# Site reorganization: top nav, microsites, mind blog, feed rework

Date: 2026-09-02
Status: approved in conversation; pending final spec review

## Goal

Make room on laceyguthrie.com for a digital portfolio and a physical-art
section, reorganize the main (music) site around that, and clean up the
/images feed nav. The main site keeps its current look and voice. The two
new sections are microsites with their own look.

## Decisions already made

- Top-right nav labels: `music`, `digital`, `objects`. One word each.
- New sections live at `/digital/` and `/objects/`. Minimal placeholder
  shells for now; real design is a later project.
- Directory: `home` becomes `mind` (links to `/`); `music` becomes
  `albums` (links to `/albums/`). `src/music/` moves to `src/albums/`.
- Old `/music/` URL gets a 301 redirect via `.htaccess` (Apache shared
  host, FTP deploy).
- The homepage becomes the `mind` blog: entries newest first, full text
  on the page, shows list stays in the sidebar, the "What are you looking
  for?" title goes away. Blog source files live in `src/mind/`.
- Blog entries have `title`, `date`, and optional `place` front matter.
  Two placeholder entries: Yoko Ono's *Grapefruit*; Daphne Oram's *An
  Individual Note of Music, Sound and Electronics*. Exact wording gets
  Lacey's approval before it ships.
- No mobile accordion for the directory (considered, rejected: list is
  short enough).
- Muppet button label: `summon muppets`.
- Deep links use query params: `?project=` on albums and lyrics tabs,
  `?filter=` on the images feed. Mechanism must be uniform and scalable.
- Feed nav: `unknown` button keeps its slot but takes the dirt.jpg image
  and now filters the `unknown` tag (posts retagged from `collages`).
  `unknown (very)`, `mirror neurons`, and the wikipedia Dream link are
  removed. The muppet button takes sheeba.jpg, the spin animation, and
  the middle slot.

## 1. Top-right site nav

New shared include `src/_includes/site-nav.html`:

- Three links: `music` -> `/`, `digital` -> `/digital/`, `objects` ->
  `/objects/`.
- Rendered inside `.lg-header`, absolutely positioned top right. The
  header already has `position: relative`. There is whitespace top right
  on both mobile and desktop.
- Active item comes from a front matter variable (`activeSite`). All
  pages using `layouts/base.html` set `music`. Microsite layouts set
  their own.
- Active indicator reuses the site's small dashed "you are here"
  treatment so the convention stays consistent.
- Styling for the main site lives in `style.css`. Microsites may
  restyle the same markup in their own CSS.

## 2. Microsites

- `src/digital/index.html` with `layouts/digital.html` and
  `css/digital.css`.
- `src/objects/index.html` with `layouts/objects.html` and
  `css/objects.css`.
- Neither layout loads `style.css` or the main fonts. Blank canvas.
- Each page: the site nav (for the way back), a title, one placeholder
  line. Placeholder copy needs approval before implementation.
- Both pages appear in the sitemap automatically (Eleventy collections
  drive `sitemap.liquid`; verify during implementation).

## 3. Directory changes and /albums move

- In `base.html`: `home` -> `mind` (href `/`), `music` -> `albums`
  (href `/albums/`). `activePage` keys update to match (`mind`,
  `albums`).
- Move `src/music/index.html` -> `src/albums/index.html`. Update its
  title/description front matter only where the URL is embedded; the
  page copy does not change.
- Grep for `/music` across `src/` (jsonld, sitemap, internal links,
  README) and update.
- Add `src/.htaccess` with `Redirect 301 /music/ /albums/` and a
  passthrough copy rule in `eleventy.config.js`. Confirm the FTP deploy
  action does not exclude dotfiles; adjust `exclude`/`dangerous-clean-slate`
  settings only if needed.

## 4. Mind blog on the homepage

- Entries: `src/mind/*.md`, one file per entry. Front matter: `title`
  (string), `date` (ISO date), `place` (string, optional).
- A directory data file (`src/mind/mind.json`) sets `permalink: false`
  and `tags: mind` so entries join a `mind` collection and generate no
  standalone pages.
- `src/index.html` renders `collections.mind` newest first: title,
  date (human-readable, with `<time datetime>`), place when present,
  then the body. Styling follows the existing main-site type system.
- Shows include stays in the sidebar as today.
- Two placeholder entries as decided above. Body text clearly reads as
  placeholder until Lacey writes the real thoughts.

## 5. Music intro text wrap

- `.lg-music-intro` drops `display: flex`.
- `.lg-music-intro__img` gets `float: left` with right/bottom margin.
- Max-width: 200px below 880px, 320px at `min-width: 880px`.
- Container gets clearfix (`display: flow-root`) so floats clear.
- Applies to every tab's intro image, present and future.

## 6. Feed nav rework (/images)

Final button order (8 items):

1. all items
2. live
3. my fkn face
4. duchess
5. album art
6. summon muppets (sheeba.jpg, spin animation, opens the muppet popup)
7. unknown (dirt.jpg + its current alt text, `data-filter="unknown"`)
8. private

Changes:

- Remove `unknown (very)`, `mirror neurons`, and the wikipedia Dream
  link entirely.
- Retag posts: `data-tags` values change `collages` -> `unknown`
  (including combined values like `portraits,collages`).
- Remove the mirror special case in the `all` filter logic in `init.js`.
- Rename CSS `--mirror` modifier classes to `--muppet`; rename
  `mirror-spin` keyframes to `muppet-spin`; keep the reduced-motion
  guard. Apply the modifier class to the muppet button.
- The muppet button keeps `js-devotion-button` behavior (fetch random
  Muppets, open popup); it is not a filter, so it never gets the
  is-active filter state.

## 7. Deep links (uniform, scalable)

One mechanism in `init.js`:

- A tab/filter nav declares its param name:
  `data-deep-link="project"` on the albums and lyrics tablists,
  `data-deep-link="filter"` on the feed filter nav.
- Each button gets a short slug: albums use `solo`, `duchess`,
  `ouzelum`, `pleasure-boys`, `twin-limb`, `reading-group`, `bunny-day`;
  lyrics use `solo`, `twin-limb`, `duchess`, `ouzelum`; the feed uses
  its existing `data-filter` values as slugs.
- On load: if the URL has the declared param and it matches a slug,
  activate that tab/filter (no scroll jump). Unknown values fall back
  to the default silently.
- On click: update the URL with `history.replaceState` (no reload, no
  history spam). The default tab/filter clears the param to keep URLs
  clean.
- Examples: `/albums/?project=duchess`, `/lyrics/?project=twin-limb`,
  `/images/?filter=live`.

## 8. Feed nav mobile sizing

Goal: a partial button always peeks out so horizontal scroll is
discoverable; no breakpoint shows a clean edge until the list stops
scrolling.

- up to 480px: 4.5 buttons visible
- 481-540px: 5.5 buttons
- 541-620px: 6.5 buttons
- above 620px: current fixed 5.25rem buttons

Implementation: a `--feed-visible` custom property set per breakpoint;
`li` width `calc((100vw - <nav horizontal padding>) / var(--feed-visible))`;
`.lg-feed__nav-image-wrapper` switches to `width: 100%` +
`aspect-ratio: 1 / 1` (height auto) so circles scale with the button.

## Out of scope

- Real design/content for /digital and /objects.
- Giant Dunes tab, MA AM release updates (tracked separately).
- Per-entry blog permalinks (add later if entries get long).

## Testing

- `npm run start`; check every page desktop and at 375/480/540/620px.
- Verify `.htaccess` lands in `_site/` after `npm run build`.
- Deep links: load each example URL, confirm the right tab/filter is
  active; click tabs and confirm the URL updates without reload.
- Feed: each filter shows the right posts; `all` shows everything;
  muppet popup still works from its new slot.
- Text wrap: solo and duchess intros at mobile and desktop widths.
- Old URLs: `/music/` redirect (verify on production after deploy since
  htaccess needs Apache).
- Wording gate: blog placeholder copy and microsite placeholder lines
  approved by Lacey before merge.
