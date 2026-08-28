import { test } from 'vitest';
import assert from 'assert';
import { ELegislativaConnector } from '../src/services/stateAdmin/ELegislativaConnector';

test('P4 e-Legislativa Data Integrity - Zero Synthetic Data', () => {
  const rawData = [
    {
      iri: '/sb/2023/123',
      nazev: 'Test Bill with cisloTisku',
      cisloTisku: '450/0',
      kod: 'CODE_XYZ',
      navrhovatel: 'Poslanec XY',
      datumPrijeti: '2023-01-01',
    },
    {
      iri: '/sb/2023/456',
      nazev: 'Test Bill fallback to kod',
      kod: 'CODE_123',
      // no navrhovatel
      // no datumPrijeti
    },
    {
      iri: '/sb/2023/789',
      nazev: 'Test Bill fallback to iri',
      // no cisloTisku or kod
      datumVyhlaseni: 'invalid-date-format',
    },
    {
      nazev: 'Missing Everything',
    }
  ];

  const actCode = '89/2012';
  const result = ELegislativaConnector.normalizeLegislativeBills(rawData, actCode);

  assert.strictEqual(result.length, 4, 'Should parse 4 items');

  // Test 1: Prioritize cisloTisku over kod and iri
  assert.strictEqual(result[0].billNumber, '450/0');
  assert.strictEqual(result[0].proposedBy, 'Poslanec XY');
  assert.strictEqual(result[0].submittedAt, '2023-01-01');

  // Test 2: Fallback to kod, missing proposedBy and submittedAt => 'Neuvedeno'
  assert.strictEqual(result[1].billNumber, 'CODE_123');
  assert.strictEqual(result[1].proposedBy, 'Neuvedeno');
  assert.strictEqual(result[1].submittedAt, 'Neuvedeno');

  // Test 3: Fallback to iri, invalid date protection
  assert.strictEqual(result[2].billNumber, '789');
  assert.strictEqual(result[2].proposedBy, 'Neuvedeno');
  assert.strictEqual(result[2].submittedAt, 'Neuvedeno'); // invalid-date-format parsed as NaN Date

  // Test 4: Complete fallback to Neuvedeno
  assert.strictEqual(result[3].billNumber, 'Neuvedeno');
  assert.strictEqual(result[3].proposedBy, 'Neuvedeno');
  assert.strictEqual(result[3].submittedAt, 'Neuvedeno');
});
