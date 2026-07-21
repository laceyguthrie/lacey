/**
 * The fam damily band — a seeded, frozen force-directed constellation.
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
