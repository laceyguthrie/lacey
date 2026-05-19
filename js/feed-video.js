// VIDEO FACADE & FEED VIDEO UTILITIES
// Only loaded on self-portrait page

(function () {
  'use strict';

  /**
   * Sets up click-to-play facades for YouTube video thumbnails.
   * Clicking replaces the thumbnail + play button with an autoplay iframe.
   */
  function setupVideoFacades() {
    const facades = document.querySelectorAll('.js-video-facade');
    if (facades.length === 0) return;

    facades.forEach(function (facade) {
      facade.addEventListener('click', function () {
        const videoId = this.getAttribute('data-video-id');
        if (!videoId) return;

        const iframe = document.createElement('iframe');
        iframe.setAttribute('src',
          'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0'
        );
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('title', this.querySelector('img')?.alt || 'YouTube video');

        this.textContent = '';
        this.style.cursor = 'default';
        this.appendChild(iframe);
      });
    });
  }

  /**
   * Preconnects to YouTube's image CDN so thumbnails load faster
   */
  function preconnectYouTube() {
    if (document.querySelector('link[href*="img.youtube.com"]')) return;
    var link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://img.youtube.com';
    link.crossOrigin = '';
    document.head.appendChild(link);
  }

  document.addEventListener('DOMContentLoaded', function () {
    preconnectYouTube();
    setupVideoFacades();
  });
})();
