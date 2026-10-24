// savings-calc.js: чиста логіка калькулятора накопичень (ЛР №11).
// Тут немає звернень до DOM, тому модуль можна тестувати окремо (node --test tests/).
// Захисне програмування: жодна функція не повертає NaN, Infinity або від'ємну суму.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();          // Node.js (тести)
  } else {
    root.SavingsCalc = factory();        // браузер
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Межі значень: ті самі числа стоять в атрибутах min/max у HTML
  const LIMITS = {
    income:   { min: 1, max: 1000000, label: 'дохід',   integer: false },
    expenses: { min: 0, max: 1000000, label: 'витрати', integer: false },
    term:     { min: 1, max: 120,     label: 'термін',  integer: true  }
  };

  // Дозволені умовні річні ставки, %. Будь-яке інше значення (наприклад, підмінене через DevTools) відхиляється
  const RATES = [0, 8, 12, 15];

  const nf = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });
  const formatMoney = (n) => nf.format(n) + ' грн';

  // Перетворює рядок із поля вводу на число. Повертає статус замість NaN
  function parseInput(raw) {
    if (raw === null || raw === undefined) return { status: 'empty' };
    const text = String(raw).trim().replace(',', '.');   // десяткова кома теж допустима
    if (text === '') return { status: 'empty' };
    const value = Number(text);
    if (Number.isNaN(value) || !Number.isFinite(value)) return { status: 'invalid' };
    return { status: 'ok', value };
  }

  // Перевіряє одне поле. Повертає { ok, value, message, note }
  function validate(field, raw) {
    const rule = LIMITS[field];
    if (!rule) return { ok: false, message: 'Невідоме поле' };

    const parsed = parseInput(raw);
    if (parsed.status === 'empty')   return { ok: false, message: 'Введіть число' };
    if (parsed.status === 'invalid') return { ok: false, message: 'Введіть коректне число' };

    let value = parsed.value;
    if (value < 0) return { ok: false, message: 'Значення не може бути від’ємним' };
    if (value < rule.min) {
      return { ok: false, message: 'Мінімальне значення: ' + nf.format(rule.min) };
    }
    if (value > rule.max) {
      return { ok: false, message: 'Максимальне значення: ' + nf.format(rule.max) };
    }

    let note = '';
    if (rule.integer) {
      const rounded = Math.round(value);
      if (rounded !== value) note = 'Термін округлено до ' + rounded + ' міс.';
      value = rounded;
    } else {
      const cents = Math.round(value * 100) / 100;      // сума з точністю до копійок
      if (cents !== value) note = 'Суму округлено до копійок';
      value = cents;
    }
    return { ok: true, value, note };
  }

  function validateRate(raw) {
    const value = Number(raw);
    if (raw === '' || raw === null || raw === undefined || !RATES.includes(value)) {
      return { ok: false, message: 'Оберіть ставку зі списку' };
    }
    return { ok: true, value };
  }

  // Основний розрахунок. Вхід уже має бути перевірений validate()
  // schedule[k] = сума накопичень після k-го місяця (внесок наприкінці місяця)
  function calculate(params) {
    const income = params.income;
    const expenses = params.expenses;
    const term = params.term;
    const rate = params.rate || 0;
    const compound = Boolean(params.compound);

    const monthly = Math.round((income - expenses) * 100) / 100;
    if (monthly <= 0) {
      return { monthly, noSavings: true, deposits: 0, interest: 0, total: 0, schedule: [0] };
    }

    const i = rate / 1200;                               // місячна ставка
    const schedule = [0];
    for (let k = 1; k <= term; k++) {
      let balance;
      if (i === 0) {
        balance = monthly * k;
      } else if (compound) {
        balance = monthly * ((Math.pow(1 + i, k) - 1) / i);          // складні відсотки щомісяця
      } else {
        balance = monthly * k + monthly * i * (k * (k - 1)) / 2;     // прості відсотки на кожен внесок
      }
      schedule.push(Math.round(balance * 100) / 100);
    }

    const total = schedule[term];
    const deposits = Math.round(monthly * term * 100) / 100;
    const interest = Math.round((total - deposits) * 100) / 100;
    return { monthly, noSavings: false, deposits, interest, total, schedule };
  }

  return { LIMITS, RATES, parseInput, validate, validateRate, calculate, formatMoney };
});
