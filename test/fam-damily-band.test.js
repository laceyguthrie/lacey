const { test } = require('node:test');
const assert = require('node:assert');
const data = require('../src/_data/famFamily.json');

test('seed data has the expected shape', () => {
  assert.ok(Array.isArray(data.people), 'people is an array');
  assert.ok(Array.isArray(data.bands), 'bands is an array');
  assert.ok(data.people.includes('Lacey Guthrie'), 'seeded with Lacey');
});
