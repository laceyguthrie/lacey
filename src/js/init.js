// LACEY GUTHRIE WEBSITE JAVASCRIPT

// Global Variables
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

/**
 * Traps focus within a popup modal for accessibility
 * @param {string} id - The ID of the popup element
 */
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

/**
 * Removes focus trap from a popup modal
 * @param {string} id - The ID of the popup element
 */
function removeTrap(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const handler = trapHandlers[id];
  if (handler) {
    target.removeEventListener('keydown', handler);
    delete trapHandlers[id];
  }
}

/**
 * Gets the current scroll position
 * @returns {number} Current scroll position
 */
function getScrollPosition() {
  return window.pageYOffset || document.documentElement.scrollTop || 0;
}

/**
 * Prevents body scrolling when popup is open
 */
function preventBodyScroll() {
  scrollPosition = getScrollPosition();
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
  document.documentElement.style.overflow = 'hidden';
}

/**
 * Restores body scrolling when popup is closed
 */
function restoreBodyScroll() {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.documentElement.style.overflow = '';
  window.scrollTo(0, scrollPosition);
}

/**
 * Shows a popup modal and traps focus
 * @param {string} id - The ID of the popup element
 */
function showcontactPopup(id) {
  const popup = document.getElementById(id);
  if (!popup) return;
  
  popupOverlay.classList.add('is-active');
  popup.classList.add('is-active');
  preventBodyScroll();
  trapFocus(id);
}

/**
 * Closes a popup modal and removes focus trap
 * @param {string} id - The ID of the popup element
 */
function closecontactPopup(id) {
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
    showcontactPopup(id);
  });
});

closePopups.forEach(button => {
  button.addEventListener('click', function() {
    const id = this.getAttribute('data-popup-id');
    if (!id) return;
    closecontactPopup(id);
  });
});

function closeActivePopup() {
  const activePopup = Array.from(popups).find(popup => popup.classList.contains('is-active'));
  if (activePopup) {
    closecontactPopup(activePopup.id);
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

// Image Optimization & Lazy Loading

function optimizeLazyLoadingImages() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.addEventListener('load', function() {
            img.classList.add('loaded');
            const container = img.closest('.lg-feed__post-image');
            if (container) {
              container.style.animation = 'none';
              container.style.background = 'transparent';
            }
          });
          observer.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
  } else {
    lazyImages.forEach(img => {
      img.addEventListener('load', function() {
        img.classList.add('loaded');
        const container = img.closest('.lg-feed__post-image');
        if (container) {
          container.style.animation = 'none';
          container.style.background = 'transparent';
        }
      });
    });
  }
  
  if ('IntersectionObserver' in window) {
    const criticalImages = document.querySelectorAll('img:not([loading="lazy"])');
    criticalImages.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function() {
          img.classList.add('loaded');
        });
      }
    });
  }
}


// Tab System

function setupTabs() {
  const tabs = document.querySelectorAll('.js-tab');
  if (tabs.length === 0) return;
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();

      const activeTab = document.querySelector('.js-tab.is-active');
      const activeTabContent = document.querySelector('.js-tab-content.is-active');
      
      if (activeTab) activeTab.classList.remove('is-active');
      if (activeTabContent) activeTabContent.classList.remove('is-active');

      const targetId = this.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      
      if (targetContent) {
        targetContent.classList.add('is-active');
        this.classList.add('is-active');
      }
    });
    
    tab.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
}

// Feed Filter System

function setupFeedFilter() {
  const filterNav = document.querySelector('.js-feed-filters');
  const feedItems = document.querySelectorAll('.js-feed-item');
  const filterButtons = filterNav?.querySelectorAll('[data-filter]');

  if (!filterNav || !filterButtons || filterButtons.length === 0 || feedItems.length === 0) {
    return;
  }

  function filterItems(filterTag) {
    feedItems.forEach(item => {
      let shouldShow = false;

      if (filterTag === 'all') {
        shouldShow = true;
      } else {
        const tags = item.getAttribute('data-tags');
        shouldShow = tags && tags.includes(filterTag);
      }

      if (shouldShow) {
        item.style.display = '';
        item.setAttribute('aria-hidden', 'false');
      } else {
        item.style.display = 'none';
        item.setAttribute('aria-hidden', 'true');
      }
    });

    updateActiveStates(filterTag);
  }

  function updateActiveStates(filterTag) {
    filterButtons.forEach(button => {
      const buttonFilter = button.getAttribute('data-filter');
      
      if (buttonFilter === filterTag) {
        button.classList.add('is-active');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.classList.remove('is-active');
        button.setAttribute('aria-pressed', 'false');
      }
    });
  }

  filterButtons.forEach((button) => {
    const filterTag = button.getAttribute('data-filter');
    
    if (!filterTag) return;
    
    if (filterTag === 'all') {
      button.setAttribute('aria-pressed', 'true');
      button.classList.add('is-active');
    } else {
      button.setAttribute('aria-pressed', 'false');
    }
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const filterValue = this.getAttribute('data-filter');
      filterItems(filterValue);
    });
  });

  updateActiveStates('all');
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
        
        const link = document.createElement('a');
        link.setAttribute('href', originalImage);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.className = 'lg-devotion-profile__avatar-link';
        link.setAttribute('aria-label', `View larger image of ${page.title}`);
        avatarDiv.appendChild(link);
        
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
              if (link.parentNode) {
                link.remove();
              }
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
      showcontactPopup(devotionPopupId);
    });
  });
}

// Password Popup

function setupPasswordPopup() {
  const passwordForm = document.querySelector('#passwordPopup form');
  if (!passwordForm) return;

  passwordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const passwordInput = this.querySelector('input[type="password"]');
    const password = passwordInput?.value;

    if (password === 'mallard') {
      window.location.href = '/archive';
    } else {
      passwordInput.value = '';
      passwordInput.setAttribute('aria-invalid', 'true');
      passwordInput.focus();
    }
  });
}

// Lazy-load iframes via IntersectionObserver

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

// Initialization

document.addEventListener('DOMContentLoaded', function() {
  optimizeLazyLoadingImages();
  setupTabs();
  setupFeedFilter();
  setupDevotionButton();
  setupPasswordPopup();
  setupLazyIframes();
});