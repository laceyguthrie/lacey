const openPopups = document.querySelectorAll('.js-open-popup');
const closePopups = document.querySelectorAll('.js-close-popup');
const popups = document.querySelectorAll('.js-popup');
const trapHandlers = {};
let scrollPosition = 0;

const fandomApiBase = 'https://muppet.fandom.com/api.php';
const devotionPopupId = 'devotionPopup';
const devotionProfilesCount = 8;

let popupOverlay = document.getElementById('lg-popup-overlay');
if (!popupOverlay) {
  popupOverlay = document.createElement('div');
  popupOverlay.id = 'lg-popup-overlay';
  popupOverlay.className = 'lg-popup-overlay';
  document.body.appendChild(popupOverlay);
}

// Popup Modal System

function trapFocus(id) {
  const target = document.getElementById(id);
  if (!target) return;

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];
  const focusableEls = target.querySelectorAll(focusableSelectors.join(','));
  const firstFocusableEl = focusableEls[0];
  const lastFocusableEl = focusableEls[focusableEls.length - 1];

  if (firstFocusableEl) {
    firstFocusableEl.setAttribute('data-programmatic-focus', 'true');
    firstFocusableEl.focus();
    setTimeout(() => {
      firstFocusableEl.removeAttribute('data-programmatic-focus');
    }, 100);
  }

  function handler(e) {
    if (e.key === 'Tab') {
      if (focusableEls.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableEl) {
          lastFocusableEl.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableEl) {
          firstFocusableEl.focus();
          e.preventDefault();
        }
      }
    }
  }

  target.addEventListener('keydown', handler);
  trapHandlers[id] = handler;
}

function removeTrap(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const handler = trapHandlers[id];
  if (handler) {
    target.removeEventListener('keydown', handler);
    delete trapHandlers[id];
  }
}

function getScrollPosition() {
  return window.pageYOffset || document.documentElement.scrollTop || 0;
}

function preventBodyScroll() {
  scrollPosition = getScrollPosition();
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
  document.documentElement.style.overflow = 'hidden';
}

function restoreBodyScroll() {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.documentElement.style.overflow = '';
  window.scrollTo(0, scrollPosition);
}

function openPopup(id) {
  const popup = document.getElementById(id);
  if (!popup) return;

  popupOverlay.classList.add('is-active');
  popup.classList.add('is-active');
  preventBodyScroll();
  trapFocus(id);
}

function closePopup(id) {
  const popup = document.getElementById(id);
  if (!popup) return;

  if (id === devotionPopupId) {
    const profilesContainer = document.getElementById('devotionProfiles');
    if (profilesContainer) {
      profilesContainer.innerHTML = '<li class="lg-devotion-loading">loading...</li>';
    }
  }

  popup.classList.remove('is-active');
  popupOverlay.classList.remove('is-active');
  restoreBodyScroll();
  removeTrap(id);
}

openPopups.forEach(button => {
  button.addEventListener('click', function() {
    const id = this.getAttribute('data-popup-id');
    if (!id) return;
    openPopup(id);
  });
});

closePopups.forEach(button => {
  button.addEventListener('click', function() {
    const id = this.getAttribute('data-popup-id');
    if (!id) return;
    closePopup(id);
  });
});

function closeActivePopup() {
  const activePopup = Array.from(popups).find(popup => popup.classList.contains('is-active'));
  if (activePopup) {
    closePopup(activePopup.id);
  }
}

popupOverlay.addEventListener('click', closeActivePopup);

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeActivePopup();
  }
});

function shouldPreventScroll(e) {
  const activePopup = document.querySelector('.lg-popup.is-active');
  if (!activePopup) return false;

  const isInsidePopup = activePopup.contains(e.target);
  const isScrollable = e.target.closest('.lg-devotion-profiles, .lg-popup__content');
  return !isInsidePopup || (!isScrollable && activePopup === e.target.closest('.lg-popup'));
}

document.addEventListener('wheel', function(e) {
  if (shouldPreventScroll(e)) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('touchmove', function(e) {
  if (shouldPreventScroll(e)) {
    e.preventDefault();
  }
}, { passive: false });

// Smooth Scrolling & Anchor Links

document.querySelectorAll('.js-anchor-link').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setTimeout(() => {
        targetElement.classList.add('here-i-am');
        setTimeout(() => {
          targetElement.classList.remove('here-i-am');
        }, 1000);
      }, 10);
    }
  });
});

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

function setupTabs() {
  const tabs = Array.from(document.querySelectorAll('.js-tab'));
  if (tabs.length === 0) return;

  const nav = tabs[0].closest('[data-deep-link]');
  const param = nav ? nav.getAttribute('data-deep-link') : null;
  const defaultTab = document.querySelector('.js-tab.is-active');

  // Roving tabindex: the strip is one Tab stop, and the arrow keys move
  // between the tabs inside it. Without this, Tab walks every tab in turn.
  function setRovingTabindex(selected) {
    tabs.forEach(tab => tab.setAttribute('tabindex', tab === selected ? '0' : '-1'));
  }

  function activateTab(tab) {
    const targetContent = document.getElementById(tab.getAttribute('data-tab'));
    if (!targetContent) return;

    const activeTab = document.querySelector('.js-tab.is-active');
    const activeTabContent = document.querySelector('.js-tab-content.is-active');

    if (activeTab) {
      activeTab.classList.remove('is-active');
      activeTab.setAttribute('aria-selected', 'false');
    }
    if (activeTabContent) activeTabContent.classList.remove('is-active');

    targetContent.classList.add('is-active');
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    setRovingTabindex(tab);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      activateTab(this);
      setUrlParam(param, this === defaultTab ? null : this.getAttribute('data-slug'));
    });

    // Enter and Space need no handler — these are real buttons, so the
    // browser already turns both into a click.
    tab.addEventListener('keydown', function(e) {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      let target;

      if (step !== undefined) {
        const i = tabs.indexOf(this);
        target = tabs[(i + step + tabs.length) % tabs.length];
      } else if (e.key === 'Home') {
        target = tabs[0];
      } else if (e.key === 'End') {
        target = tabs[tabs.length - 1];
      }

      if (!target) return;
      e.preventDefault();
      target.click();
      target.focus();
    });
  });

  setRovingTabindex(defaultTab);

  if (param) {
    const slug = new URLSearchParams(window.location.search).get(param);
    if (slug) {
      const target = tabs.find(tab => tab.getAttribute('data-slug') === slug);
      if (target) activateTab(target);
    }
  }
}

// Devotion Popup - Muppet Characters as User Profiles

let muppetCharactersCache = null;

async function fetchMuppetCharacters() {
  if (muppetCharactersCache) {
    return muppetCharactersCache;
  }

  try {
    const categoryUrl = new URL(fandomApiBase);
    categoryUrl.searchParams.set('action', 'query');
    categoryUrl.searchParams.set('format', 'json');
    categoryUrl.searchParams.set('origin', '*');
    categoryUrl.searchParams.set('list', 'categorymembers');
    categoryUrl.searchParams.set('cmtitle', 'Category:The_Muppets_Characters');
    categoryUrl.searchParams.set('cmlimit', '500');
    categoryUrl.searchParams.set('cmnamespace', '0');

    const categoryResponse = await fetch(categoryUrl.toString());
    if (!categoryResponse.ok) throw new Error('Failed to fetch Muppet list');
    const categoryData = await categoryResponse.json();

    let allMembers = categoryData.query?.categorymembers || [];
    let continueToken = categoryData.continue?.cmcontinue;

    while (continueToken && allMembers.length < 500) {
      const nextUrl = new URL(fandomApiBase);
      nextUrl.searchParams.set('action', 'query');
      nextUrl.searchParams.set('format', 'json');
      nextUrl.searchParams.set('origin', '*');
      nextUrl.searchParams.set('list', 'categorymembers');
      nextUrl.searchParams.set('cmtitle', 'Category:The_Muppets_Characters');
      nextUrl.searchParams.set('cmlimit', '500');
      nextUrl.searchParams.set('cmnamespace', '0');
      nextUrl.searchParams.set('cmcontinue', continueToken);

      const nextResponse = await fetch(nextUrl.toString());
      if (!nextResponse.ok) break;
      const nextData = await nextResponse.json();
      allMembers = allMembers.concat(nextData.query?.categorymembers || []);
      continueToken = nextData.continue?.cmcontinue;
    }

    const characters = allMembers
      .filter(member => {
        const lowerTitle = member.title.toLowerCase();
        return !lowerTitle.includes('category:') &&
               !lowerTitle.includes('(disambiguation)') &&
               member.title !== 'The Muppets Characters';
      })
      .map(member => ({
        title: member.title,
        pageid: member.pageid
      }));

    muppetCharactersCache = characters;
    return characters;
  } catch (error) {
    console.error('Error fetching Muppet characters:', error);
    return [];
  }
}

async function fetchRandomMuppetCharacters(count = 8) {
  const profilesContainer = document.getElementById('devotionProfiles');
  if (!profilesContainer) return;

  try {
    const muppetCharacters = await fetchMuppetCharacters();

    if (muppetCharacters.length === 0) {
      profilesContainer.innerHTML = '<p>Unable to load Muppet characters. Please try again.</p>';
      return;
    }

    const shuffled = [...muppetCharacters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selectedCharacters = shuffled.slice(0, Math.min(count, muppetCharacters.length));

    const pageIds = selectedCharacters.map(char => char.pageid).join('|');

    const infoUrl = new URL(fandomApiBase);
    infoUrl.searchParams.set('action', 'query');
    infoUrl.searchParams.set('format', 'json');
    infoUrl.searchParams.set('origin', '*');
    infoUrl.searchParams.set('pageids', pageIds);
    infoUrl.searchParams.set('prop', 'pageimages|info');
    infoUrl.searchParams.set('piprop', 'thumbnail|original');
    infoUrl.searchParams.set('pithumbsize', '200');
    infoUrl.searchParams.set('inprop', 'url');

    const infoResponse = await fetch(infoUrl.toString());
    if (!infoResponse.ok) throw new Error('Failed to fetch character info');
    const infoData = await infoResponse.json();
    const pages = infoData.query?.pages || {};

    profilesContainer.innerHTML = '';

    const pageArray = Object.values(pages).filter(page => page.title && !page.missing);

    if (pageArray.length === 0) {
      profilesContainer.innerHTML = '<p>Unable to load profiles. Please try again.</p>';
      return;
    }

    const descriptionPromises = pageArray.map(async (page) => {
      if (!page || !page.title) return { page, description: 'No description available.' };

      try {
        const parseUrl = new URL(fandomApiBase);
        parseUrl.searchParams.set('action', 'parse');
        parseUrl.searchParams.set('format', 'json');
        parseUrl.searchParams.set('origin', '*');
        parseUrl.searchParams.set('pageid', page.pageid);
        parseUrl.searchParams.set('prop', 'text');
        parseUrl.searchParams.set('section', '0');

        const parseResponse = await fetch(parseUrl.toString());
        if (parseResponse.ok) {
          const parseData = await parseResponse.json();
          const html = parseData.parse?.text?.['*'] || '';
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const firstParagraph = tempDiv.querySelector('p');
          if (firstParagraph) {
            const text = firstParagraph.textContent.trim();
            return { page, description: text };
          }
        }
      } catch (e) {
        console.warn('Failed to fetch description for', page.title, e);
      }

      return { page, description: 'No description available.' };
    });

    const results = await Promise.all(descriptionPromises);

    for (const { page, description } of results) {
      if (!page || !page.title) continue;

      const profileCard = document.createElement('li');
      profileCard.className = 'lg-devotion-profile';

      const words = page.title.split(' ').filter(w => w.length > 0);
      const initials = words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : words[0].substring(0, 2).toUpperCase();

      const originalImage = page.original?.source || null;

      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'lg-devotion-profile__avatar';

      if (originalImage) {
        let thumbnailUrl;
        if (originalImage.includes('/revision/latest')) {
          thumbnailUrl = originalImage.replace(/\/revision\/latest(\?|$)/, '/revision/latest/scale-to-width-down/200$1');
        } else if (originalImage.includes('/revision/')) {
          thumbnailUrl = originalImage.replace(/\/revision\/\d+(\?|$)/, '/revision/latest/scale-to-width-down/200$1');
        } else {
          thumbnailUrl = originalImage;
        }

        let imageLoaded = false;
        let triedOriginal = false;
        let errorTimeout = null;

        const showImage = function(imageUrl) {
          if (!imageLoaded) {
            imageLoaded = true;
            if (errorTimeout) {
              clearTimeout(errorTimeout);
              errorTimeout = null;
            }
            avatarDiv.style.setProperty('background-image', `url("${imageUrl}")`);
            avatarDiv.style.setProperty('background-size', 'cover');
            avatarDiv.style.setProperty('background-position', 'center');
            avatarDiv.style.setProperty('color', 'transparent');
          }
        };

        const showError = function() {
          if (!imageLoaded) {
            if (!triedOriginal) {
              triedOriginal = true;
              tryImage(originalImage);
            } else {
              avatarDiv.style.removeProperty('background-image');
              avatarDiv.style.removeProperty('color');
              avatarDiv.textContent = initials;
            }
          }
        };

        const tryImage = function(imageUrl) {
          const img = new Image();
          img.referrerPolicy = 'no-referrer';

          img.onload = function() {
            showImage(imageUrl);
          };

          img.onerror = function() {
            if (!imageLoaded) {
              errorTimeout = setTimeout(function() {
                if (!imageLoaded && (img.naturalWidth === 0 || !img.complete)) {
                  showError();
                }
              }, 2000);
            }
          };

          img.setAttribute('src', imageUrl);

          if (img.complete && img.naturalWidth > 0) {
            showImage(imageUrl);
          } else {
            setTimeout(function() {
              if (!imageLoaded && img.complete && img.naturalWidth > 0) {
                showImage(imageUrl);
              } else if (!imageLoaded && img.naturalWidth === 0 && !triedOriginal && imageUrl === thumbnailUrl) {
                triedOriginal = true;
                tryImage(originalImage);
              }
            }, 3000);
          }
        };

        tryImage(thumbnailUrl);
      } else {
        avatarDiv.textContent = initials;
      }

      const infoDiv = document.createElement('div');
      infoDiv.className = 'lg-devotion-profile__info';

      const nameH3 = document.createElement('h3');
      nameH3.className = 'lg-devotion-profile__name';
      nameH3.textContent = page.title;

      const bioP = document.createElement('p');
      bioP.className = 'lg-devotion-profile__bio';
      bioP.textContent = description;

      infoDiv.appendChild(nameH3);
      infoDiv.appendChild(bioP);

      profileCard.appendChild(avatarDiv);
      profileCard.appendChild(infoDiv);

      profilesContainer.appendChild(profileCard);
    }
  } catch (error) {
    console.error('Error fetching Muppet characters:', error);
    profilesContainer.innerHTML = '<p>Unable to load profiles. Please try again.</p>';
  }
}

function setupDevotionButton() {
  const devotionButtons = document.querySelectorAll('.js-devotion-button');
  devotionButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      fetchRandomMuppetCharacters(devotionProfilesCount);
      openPopup(devotionPopupId);
    });
  });
}

function setupPasswordPopup() {
  const passwordForm = document.querySelector('#passwordPopup form');
  if (!passwordForm) return;

  passwordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const passwordInput = this.querySelector('input[type="password"]');
    const password = passwordInput?.value;

    if (password === 'mallard') {
      window.location.href = '/bardo';
    } else {
      passwordInput.value = '';
      passwordInput.setAttribute('aria-invalid', 'true');
      passwordInput.focus();
    }
  });
}

function setupLazyIframes() {
  const iframes = document.querySelectorAll('.js-lazy-iframe[data-src]');
  if (!iframes.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const iframe = entry.target;
          iframe.src = iframe.getAttribute('data-src');
          iframe.removeAttribute('data-src');
          obs.unobserve(iframe);
        }
      });
    }, { rootMargin: '200px' });

    iframes.forEach(iframe => observer.observe(iframe));
  } else {
    iframes.forEach(iframe => {
      iframe.src = iframe.getAttribute('data-src');
      iframe.removeAttribute('data-src');
    });
  }
}

// Addresses are assembled at runtime to keep them out of the HTML source.

function setupEmailLinks() {
  document.querySelectorAll('.js-email').forEach(link => {
    const address = link.dataset.user + '@' + link.dataset.domain;
    link.href = 'mailto:' + address;
    link.textContent = address;
  });
}

// Mind nav: close the dropdown once a post is picked, so it is not left
// hanging open when you scroll back up.

function setupMindNavDropdown() {
  document.querySelectorAll('.js-mind-nav-dropdown a').forEach(link => {
    link.addEventListener('click', () => {
      link.closest('details').removeAttribute('open');
    });
  });
}

// Reading Card Frame (text that flows around the card's edge as a border)

function setupReadingCardFrame() {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PHRASES = [
    ['shadows', 'on', 'the', 'cave', 'wall', '??'],
    ['the', 'visual', 'trance', '??'],
    ['soft', 'fascination', '??'],
    ['the', 'original', 'crucible', 'of', 'human', 'culture', '??']
  ];
  const WORD_GAP = 6;
  const PHRASE_GAP = 6;
  const PATH_INSET = 5;
  const LOOP_REPEATS = 10;
  const FACET_LENGTH = 32;
  const FACET_AMPLITUDE = 4;
  const FACET_SPACING_JITTER = 1.6;
  const FACET_MAX_SLOPE = 0.26;

  function pseudoRandom(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  // Points from (x1,y1) to (x2,y2) that break into uneven facets instead of running straight.
  // Text laid on this path tilts with the local slope, so the wiggle needs no per-letter rotation.
  function facetPoints(x1, y1, x2, y2, seed) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const perpX = -dy / length;
    const perpY = dx / length;
    const steps = Math.max(2, Math.round(length / FACET_LENGTH));
    const minStep = (1 / steps) * 0.35;

    const facets = [];
    let sign = pseudoRandom(seed) < 0.5 ? -1 : 1;
    let prevT = 0;
    for (let i = 0; i <= steps; i++) {
      const onCorner = i === 0 || i === steps;
      let t = i / steps;
      let offset = 0;
      if (!onCorner) {
        // uneven spacing, but never doubling back on itself
        const jitter = (pseudoRandom(seed + i + 0.25) - 0.5) * (1 / steps) * FACET_SPACING_JITTER;
        t = Math.min(1 - minStep, Math.max(prevT + minStep, t + jitter));
        // usually flip direction, but sometimes carry on for a longer flat facet
        if (pseudoRandom(seed + i) > 0.28) sign = -sign;
        offset = sign * (0.35 + pseudoRandom(seed + i + 0.5) * 0.65) * FACET_AMPLITUDE;
      }
      prevT = t;
      facets.push({ t, offset });
    }

    // cap how steep each facet can get, so letters never crowd on the inside of a turn
    for (let i = 1; i < facets.length; i++) {
      const along = (facets[i].t - facets[i - 1].t) * length;
      const limit = along * FACET_MAX_SLOPE;
      const delta = facets[i].offset - facets[i - 1].offset;
      if (Math.abs(delta) > limit) {
        facets[i].offset = facets[i - 1].offset + Math.sign(delta) * limit;
      }
    }

    return facets.map(f => [
      x1 + dx * f.t + perpX * f.offset,
      y1 + dy * f.t + perpY * f.offset
    ]);
  }

  function facetPathD(corners) {
    let points = facetPoints(...corners[0], ...corners[1], 3);
    for (let i = 1; i < corners.length - 1; i++) {
      points = points.concat(facetPoints(...corners[i], ...corners[i + 1], i * 17 + 3).slice(1));
    }
    return 'M ' + points.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L ');
  }

  // Lays one repeating string of PHRASES along an SVG path, with a bigger gap between phrases than words.
  function addFlowingText(svg, pathId) {
    const textPath = document.createElementNS(SVG_NS, 'textPath');
    textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`);
    textPath.setAttribute('href', `#${pathId}`);

    let wordIndex = 0;
    for (let r = 0; r < LOOP_REPEATS; r++) {
      PHRASES.forEach(phrase => {
        phrase.forEach((word, i) => {
          const tspan = document.createElementNS(SVG_NS, 'tspan');
          tspan.textContent = word.toUpperCase();
          if (wordIndex > 0) {
            tspan.setAttribute('dx', i === 0 ? PHRASE_GAP : WORD_GAP);
          }
          textPath.appendChild(tspan);
          wordIndex++;
        });
      });
    }

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('class', 'lg-reading-card__frame-text');
    text.appendChild(textPath);
    svg.appendChild(text);
  }

  document.querySelectorAll('.js-reading-card-frame').forEach((svg, cardIndex) => {
    const card = svg.closest('.lg-reading-card');
    if (!card) return;

    function build() {
      const w = card.clientWidth;
      const h = card.clientHeight;
      if (!w || !h) return;

      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.innerHTML = '';

      const defs = document.createElementNS(SVG_NS, 'defs');

      // Left edge -> top edge -> right edge, one continuous path so the text bends around both top corners.
      const cornerClearance = PATH_INSET + 10;
      const sidesPathId = `lg-reading-card-frame-sides-${cardIndex}`;
      const sidesPath = document.createElementNS(SVG_NS, 'path');
      sidesPath.setAttribute('id', sidesPathId);
      sidesPath.setAttribute('fill', 'none');
      sidesPath.setAttribute('d', facetPathD([
        [PATH_INSET, h - cornerClearance],
        [PATH_INSET, PATH_INSET],
        [w - PATH_INSET, PATH_INSET],
        [w - PATH_INSET, h - cornerClearance]
      ]));
      defs.appendChild(sidesPath);

      // Bottom edge, kept as its own run so its text isn't upside-down
      // (a single closed loop always runs one edge backward).
      const bottomPathId = `lg-reading-card-frame-bottom-${cardIndex}`;
      const bottomPath = document.createElementNS(SVG_NS, 'path');
      bottomPath.setAttribute('id', bottomPathId);
      bottomPath.setAttribute('fill', 'none');
      bottomPath.setAttribute('d', facetPathD([
        [PATH_INSET, h - PATH_INSET],
        [w - PATH_INSET, h - PATH_INSET]
      ]));
      defs.appendChild(bottomPath);

      svg.appendChild(defs);
      addFlowingText(svg, sidesPathId);
      addFlowingText(svg, bottomPathId);
    }

    build();
    window.addEventListener('resize', build);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setupTabs();
  setupDevotionButton();
  setupPasswordPopup();
  setupLazyIframes();
  setupEmailLinks();
  setupReadingCardFrame();
  setupMindNavDropdown();
});