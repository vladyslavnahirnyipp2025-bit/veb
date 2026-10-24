// Автотести логіки калькулятора: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../assets/js/savings-calc.js');

const base = { income: 30000, expenses: 18000, term: 24, rate: 0, compound: false };

test('Happy Path: 30000 - 18000 за 24 міс. без відсотків = 288000', () => {
  const r = C.calculate(base);
  assert.equal(r.total, 288000);
  assert.equal(r.interest, 0);
  assert.equal(r.deposits, 288000);
});

test('складні відсотки 12% річних: 12000 на місяць, 24 міс.', () => {
  const r = C.calculate({ ...base, rate: 12, compound: true });
  assert.equal(r.total, 323681.58);        // 12000 * ((1,01^24 - 1) / 0,01), перевірено через Decimal
  assert.equal(r.interest, 35681.58);
});

test('прості відсотки 12% річних: 12000 на місяць, 24 міс.', () => {
  const r = C.calculate({ ...base, rate: 12, compound: false });
  assert.equal(r.total, 321120);
});

test('витрати не менші за дохід: накопичень немає, сума 0 (не від’ємна)', () => {
  const r = C.calculate({ ...base, expenses: 40000 });
  assert.equal(r.noSavings, true);
  assert.equal(r.total, 0);
  assert.equal(C.calculate({ ...base, expenses: 30000 }).total, 0);
});

test('порожнє поле: повідомлення, а не NaN', () => {
  for (const f of ['income', 'expenses', 'term']) {
    assert.deepEqual(C.validate(f, ''), { ok: false, message: 'Введіть число' });
    assert.equal(C.validate(f, '   ').ok, false);
    assert.equal(C.validate(f, null).ok, false);
  }
});

test('нуль: дохід і термін відхиляються, витрати 0 допустимі', () => {
  assert.equal(C.validate('income', '0').ok, false);
  assert.equal(C.validate('term', '0').ok, false);
  assert.equal(C.validate('expenses', '0').ok, true);
});

test('від’ємні значення відхиляються', () => {
  for (const f of ['income', 'expenses', 'term']) {
    for (const v of ['-5', '-500', '-0.01']) {
      const r = C.validate(f, v);
      assert.equal(r.ok, false, f + ' ' + v);
      assert.match(r.message, /від’ємним/);
    }
  }
});

test('надто великі числа та Infinity відхиляються', () => {
  assert.match(C.validate('income', '1000001').message, /Максимальне/);
  assert.match(C.validate('income', '99999999999999999999').message, /Максимальне/);
  assert.match(C.validate('term', '121').message, /Максимальне/);
  assert.equal(C.validate('income', '1e999').message, 'Введіть коректне число');   // Infinity
  assert.equal(C.validate('income', 'Infinity').ok, false);
});

test('не число: текст, NaN, подвійна крапка', () => {
  for (const v of ['abc', 'NaN', '1..5', '12abc', '<b>1</b>']) {
    assert.equal(C.validate('income', v).message, 'Введіть коректне число', v);
  }
});

test('дробові значення нормалізуються: термін до цілого, сума до копійок', () => {
  const t = C.validate('term', '12.6');
  assert.equal(t.ok, true);
  assert.equal(t.value, 13);
  assert.match(t.note, /округлено/);
  const m = C.validate('income', '1000.456');
  assert.equal(m.ok, true);
  assert.equal(m.value, 1000.46);
  assert.match(m.note, /копійок/);
  assert.equal(C.validate('income', '1000,5').value, 1000.5);       // десяткова кома
});

test('межі приймаються: мінімум і максимум', () => {
  assert.equal(C.validate('income', '1').ok, true);
  assert.equal(C.validate('income', '1000000').ok, true);
  assert.equal(C.validate('term', '1').ok, true);
  assert.equal(C.validate('term', '120').ok, true);
});

test('ставка: лише зі списку', () => {
  for (const v of ['0', '8', '12', '15']) assert.equal(C.validateRate(v).ok, true);
  for (const v of ['', 'abc', '50', '-1', null, undefined]) assert.equal(C.validateRate(v).ok, false, String(v));
});

test('на найбільших допустимих даних результат скінченний', () => {
  const r = C.calculate({ income: 1000000, expenses: 0, term: 120, rate: 15, compound: true });
  assert.equal(Number.isFinite(r.total), true);
  assert.ok(r.total > 0);
  assert.equal(r.schedule.length, 121);
});

test('графік не спадає, а перший елемент 0', () => {
  const r = C.calculate({ ...base, rate: 8, compound: true });
  assert.equal(r.schedule[0], 0);
  for (let k = 1; k < r.schedule.length; k++) assert.ok(r.schedule[k] >= r.schedule[k - 1]);
});
