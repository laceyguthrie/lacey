const { test } = require('node:test');
const assert = require('node:assert');
const data = require('../src/_data/famFamily.json');

test('seed data has the expected shape', () => {
  assert.ok(Array.isArray(data.people), 'people is an array');
  assert.ok(Array.isArray(data.bands), 'bands is an array');
  assert.ok(data.people.includes('Lacey Guthrie'), 'seeded with Lacey');
});

const dam = require('../src/js/fam-damily-band.js');

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
