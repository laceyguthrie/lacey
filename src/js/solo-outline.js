/**
 * Draws a wavy dotted outline around the solo-albums box.
 * Replaces the CSS dotted border (kept as a no-JS fallback) with an
 * SVG path: a rounded rectangle with a sine wave riding the perimeter.
 * Redraws only when the box actually changes size.
 */
(function () {
  var box = document.querySelector('.lg-solo');
  if (!box || !('ResizeObserver' in window)) return;

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var AMPLITUDE = 4;     // how far the wave swells in/out, px
  var WAVELENGTH = 56;   // target px per wave cycle (adjusted to close the loop)
  var STEP = 4;          // sampling resolution, px
  var RADII = { tl: 14, tr: 38, br: 12, bl: 18 }; // mismatched corners

  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'lg-solo__outline');
  svg.setAttribute('aria-hidden', 'true');
  var path = document.createElementNS(SVG_NS, 'path');
  svg.appendChild(path);
  box.insertBefore(svg, box.firstChild);
  box.classList.add('lg-solo--js');

  var lastW = 0;
  var lastH = 0;

  function segments(w, h, r) {
    var HALF_PI = Math.PI / 2;

    function line(x1, y1, x2, y2, nx, ny) {
      var len = Math.hypot(x2 - x1, y2 - y1);
      return {
        length: len,
        at: function (t) {
          return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, nx: nx, ny: ny };
        }
      };
    }

    function arc(cx, cy, radius, startAngle) {
      return {
        length: radius * HALF_PI,
        at: function (t) {
          var a = startAngle + HALF_PI * t;
          var nx = Math.cos(a);
          var ny = Math.sin(a);
          return { x: cx + radius * nx, y: cy + radius * ny, nx: nx, ny: ny };
        }
      };
    }

    return [
      line(r.tl, 0, w - r.tr, 0, 0, -1),
      arc(w - r.tr, r.tr, r.tr, -HALF_PI),
      line(w, r.tr, w, h - r.br, 1, 0),
      arc(w - r.br, h - r.br, r.br, 0),
      line(w - r.br, h, r.bl, h, 0, 1),
      arc(r.bl, h - r.bl, r.bl, HALF_PI),
      line(0, h - r.bl, 0, r.tl, -1, 0),
      arc(r.tl, r.tl, r.tl, Math.PI)
    ];
  }

  function draw() {
    var w = box.offsetWidth;
    var h = box.offsetHeight;
    if (Math.abs(w - lastW) < 1 && Math.abs(h - lastH) < 1) return;
    lastW = w;
    lastH = h;

    // shrink the corner radii on narrow screens so they never overlap
    var scale = Math.min(1, w / 320);
    var r = {
      tl: RADII.tl * scale,
      tr: RADII.tr * scale,
      br: RADII.br * scale,
      bl: RADII.bl * scale
    };

    var segs = segments(w, h, r);
    var perimeter = 0;
    var i;
    for (i = 0; i < segs.length; i++) perimeter += segs[i].length;

    // snap the wavelength so a whole number of waves fits — no seam at the start
    var waves = Math.max(4, Math.round(perimeter / WAVELENGTH));
    var freq = (Math.PI * 2 * waves) / perimeter;

    var d = '';
    var travelled = 0;
    for (i = 0; i < segs.length; i++) {
      var seg = segs[i];
      var steps = Math.max(2, Math.ceil(seg.length / STEP));
      for (var j = 0; j < steps; j++) {
        var t = j / steps;
        var s = travelled + seg.length * t;
        var p = seg.at(t);
        var offset = AMPLITUDE * Math.sin(s * freq);
        var x = (p.x + p.nx * offset).toFixed(1);
        var y = (p.y + p.ny * offset).toFixed(1);
        d += (d ? 'L' : 'M') + x + ' ' + y;
      }
      travelled += seg.length;
    }
    d += 'Z';

    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    path.setAttribute('d', d);
  }

  draw();
  new ResizeObserver(draw).observe(box);
})();
