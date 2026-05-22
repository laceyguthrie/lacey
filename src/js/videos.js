(function () {
  'use strict';

  function setupVideoButtons() {
    const buttons = document.querySelectorAll('.js-play-video-button');
    if (buttons.length === 0) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const videoId = this.dataset.videoId;
        if (!videoId) return;

        const container = this.closest('.lg-feed__post-video');
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src',
          'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0'
        );
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('title', container.querySelector('img')?.alt || 'YouTube video');

        container.textContent = '';
        container.appendChild(iframe);
      });
    });
  }

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
    setupVideoButtons();
  });
})();
