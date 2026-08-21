import { calculateChildSupport, AlimonyInput } from '../src/utils/alimonyCalculator';
import * as assert from 'assert';

function runTests() {
  console.log('Running Alimony Calculator tests...');

  // 1. One child, no other obligations, 0 days care
  let input: AlimonyInput = {
    netIncome: 30000,
    children: [{ id: '1', ageGroup: '0-5', careDays: 0 }],
    otherObligations: 0
  };
  let result = calculateChildSupport(input);
  assert.strictEqual(result.totalObligations, 1);
  assert.strictEqual(result.childrenResults[0].basePercentage, 0.14);
  assert.strictEqual(result.childrenResults[0].baseAmount, 4200); // 14% of 30000
  assert.strictEqual(result.childrenResults[0].finalAmount, 4200);
  assert.strictEqual(result.controlAmountWarning, false);

  // 2. Two children, 1 other obligation -> total 3 obligations
  input = {
    netIncome: 40000,
    children: [
      { id: '1', ageGroup: '6-9', careDays: 4 },
      { id: '2', ageGroup: '15+', careDays: 8 }
    ],
    otherObligations: 1
  };
  result = calculateChildSupport(input);
  assert.strictEqual(result.totalObligations, 3);
  assert.strictEqual(result.childrenResults[0].basePercentage, 0.12); // Matrix for 3 obs, 6-9
  assert.strictEqual(result.childrenResults[1].basePercentage, 0.16); // Matrix for 3 obs, 15+
  assert.strictEqual(result.childrenResults[0].baseAmount, 4800);
  assert.strictEqual(result.childrenResults[1].baseAmount, 6400);
  assert.strictEqual(result.childrenResults[0].finalAmount, Math.round(4800 - (4800 * (4 / 30.4))));
  assert.strictEqual(result.childrenResults[1].finalAmount, Math.round(6400 - (6400 * (8 / 30.4))));

  // 3. Střídavá péče (Alternating care - 15.2 days)
  input = {
    netIncome: 30000,
    children: [{ id: '1', ageGroup: '10-14', careDays: 15.2 }],
    otherObligations: 0
  };
  result = calculateChildSupport(input);
  assert.strictEqual(result.childrenResults[0].finalAmount, Math.round(30000 * 0.18 * 0.5)); // 50% discount

  // 4. Invalid income
  assert.throws(() => {
    calculateChildSupport({ netIncome: -100, children: [{ id: '1', ageGroup: '0-5', careDays: 0 }], otherObligations: 0 });
  }, /Příjem nemůže být záporný/);

  // 5. Invalid days
  assert.throws(() => {
    calculateChildSupport({ netIncome: 10000, children: [{ id: '1', ageGroup: '0-5', careDays: 31 }], otherObligations: 0 });
  }, /Počet dní péče musí být/);

  // 6. Max 5+ obligations test
  input = {
    netIncome: 50000,
    children: [{ id: '1', ageGroup: '0-5', careDays: 0 }],
    otherObligations: 6
  };
  result = calculateChildSupport(input);
  assert.strictEqual(result.childrenResults[0].basePercentage, 0.06); // 5+ obligations row

  console.log('All tests passed!');
}

runTests();
