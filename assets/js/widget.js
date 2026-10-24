// widget.js: інтерактивний симулятор накопичень (ЛР №11).
// Обчислення й перевірка вводу лежать у savings-calc.js, тут лише робота зі сторінкою:
// події, повідомлення про помилки, виведення результату, графік, збереження плану.
// Захисне програмування: усі елементи перевіряються до використання, дані користувача
// виводяться тільки через textContent (ніколи через innerHTML).

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const Calc = window.SavingsCalc;
  const $ = (id) => document.getElementById(id);

  // ---------- Пошук елементів: якщо чогось немає, віджет тихо не запускається ----------
  const NUMERIC = ['income', 'expenses', 'term'];
  const ids = [
    'savingsForm', 'rate', 'rateError', 'compound', 'saveStatus', 'expensesWarning', 'expensesWarningText',
    'resultTotal', 'resultTerm', 'resultMonthly', 'resultDeposits', 'resultInterest', 'resultNote',
    'savingsChart', 'chartLine'
  ];
  NUMERIC.forEach((f) => ids.push(f, f + 'Range', f + 'Out', f + 'Error', f + 'Note'));
  const el = {};
  const missing = ids.filter((id) => !(el[id] = $(id)));
  if (!Calc || missing.length) {
    console.warn('Симулятор не запущено. Немає:', Calc ? missing.join(', ') : 'savings-calc.js');
    return;
  }

  const STORAGE_KEY = 'potik-monet:plan:v1';
  const ERROR_CLASSES = ['border-red-500'];
  const OK_CLASSES = ['border-line'];

  // ---------- Допоміжні функції інтерфейсу ----------
  function showError(field, message) {
    const input = el[field];
    const box = el[field + 'Error'];
    box.textContent = message;                       // textContent: безпечно для будь-якого вводу
    box.classList.remove('hidden');
    input.setAttribute('aria-invalid', 'true');
    input.classList.remove(...OK_CLASSES);
    input.classList.add(...ERROR_CLASSES);
  }

  function clearError(field) {
    const input = el[field];
    el[field + 'Error'].classList.add('hidden');
    el[field + 'Error'].textContent = '';
    input.setAttribute('aria-invalid', 'false');
    input.classList.remove(...ERROR_CLASSES);
    input.classList.add(...OK_CLASSES);
  }

  function showNote(field, text) {
    el[field + 'Note'].textContent = text;
    el[field + 'Note'].classList.toggle('hidden', !text);
  }

  // Повзунок лише дзеркалить число: значення поза його діапазоном обрізається візуально
  function syncRange(field, value) {
    const range = el[field + 'Range'];
    const min = Number(range.min);
    const max = Number(range.max);
    range.value = String(Math.min(Math.max(value, min), max));
  }

  function resetResult(message) {
    el.resultTotal.textContent = '—';
    el.resultTerm.textContent = '';
    el.resultMonthly.textContent = '—';
    el.resultDeposits.textContent = '—';
    el.resultInterest.textContent = '—';
    el.resultNote.textContent = message;
    el.resultNote.classList.toggle('hidden', !message);
    el.chartLine.setAttribute('points', '');
    el.savingsChart.setAttribute('aria-label', 'Графік недоступний: виправте помилки у полях');
  }

  function drawChart(schedule, total, term) {
    const W = 432, H = 170, PAD = 10;
    const max = total > 0 ? total : 1;
    const steps = Math.max(term, 1);
    const pts = schedule.map((v, k) => {
      const x = PAD + (k / steps) * (W - 2 * PAD);
      const y = H - PAD - (v / max) * (H - 2 * PAD);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    el.chartLine.setAttribute('points', pts.join(' '));
    el.savingsChart.setAttribute('aria-label',
      'Графік зростання накопичень від 0 до ' + Calc.formatMoney(total) + ' за ' + term + ' міс.');
  }

  function termLabel(term) {
    const years = Math.floor(term / 12);
    const months = term % 12;
    const parts = [];
    if (years) parts.push(years + ' р.');
    if (months) parts.push(months + ' міс.');
    return 'Термін: ' + term + ' міс.' + (years ? ' (' + parts.join(' ') + ')' : '');
  }

  // ---------- Основне оновлення: читає поля, перевіряє, рахує, показує ----------
  function update() {
    const values = {};
    let allValid = true;

    NUMERIC.forEach((field) => {
      // Якщо браузер не зміг розпізнати введене (наприклад, "1e" чи "e5e"), value порожнє, але є badInput:
      // тоді показуємо «некоректне число», а не «введіть число»
      const raw = el[field].validity && el[field].validity.badInput ? 'NaN' : el[field].value;
      const result = Calc.validate(field, raw);
      if (result.ok) {
        clearError(field);
        showNote(field, result.note);
        values[field] = result.value;
        el[field + 'Out'].textContent = field === 'term' ? result.value + ' міс.' : Calc.formatMoney(result.value);
        syncRange(field, result.value);
      } else {
        allValid = false;
        showError(field, result.message);
        showNote(field, '');
        el[field + 'Out'].textContent = '—';
      }
    });

    // Ставка: значення з <select> теж перевіряється, бо його можна підмінити в DevTools
    const rateCheck = Calc.validateRate(el.rate.value);
    if (rateCheck.ok) {
      clearError('rate');
      values.rate = rateCheck.value;
    } else {
      allValid = false;
      showError('rate', rateCheck.message);
    }
    // Капіталізація має сенс лише при ненульовій ставці
    const rateOn = rateCheck.ok && rateCheck.value > 0;
    el.compound.disabled = !rateOn;
    values.compound = rateOn && el.compound.checked;

    // Попередження про високі витрати
    el.expensesWarning.classList.add('hidden');
    el.expensesWarning.classList.remove('flex');
    if (allValid) {
      const share = values.expenses / values.income;
      if (share >= 0.8 && share < 1) {
        el.expensesWarningText.textContent = 'Витрати становлять ' + Math.round(share * 100) + ' % доходу: відкласти вдасться небагато.';
        el.expensesWarning.classList.remove('hidden');
        el.expensesWarning.classList.add('flex');
      }
    }

    if (!allValid) {
      resetResult('Виправте помилки у полях, і розрахунок з’явиться знову.');
      return null;
    }

    const r = Calc.calculate(values);
    if (r.noSavings) {
      resetResult('Витрати не менші за дохід, тож накопичень немає. Зменште витрати або збільште дохід.');
      el.resultTotal.textContent = Calc.formatMoney(0);
      el.resultTerm.textContent = termLabel(values.term);
      el.resultMonthly.textContent = Calc.formatMoney(0);
      el.resultDeposits.textContent = Calc.formatMoney(0);
      el.resultInterest.textContent = Calc.formatMoney(0);
      return null;
    }

    el.resultNote.classList.add('hidden');
    el.resultNote.textContent = '';
    el.resultTotal.textContent = Calc.formatMoney(r.total);
    el.resultTerm.textContent = termLabel(values.term);
    el.resultMonthly.textContent = Calc.formatMoney(r.monthly);
    el.resultDeposits.textContent = Calc.formatMoney(r.deposits);
    el.resultInterest.textContent = Calc.formatMoney(r.interest);
    drawChart(r.schedule, r.total, values.term);
    return values;
  }

  // ---------- Збереження плану в браузері ----------
  function savePlan(values) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      return true;
    } catch (e) {
      return false;                                  // приватний режим або заблоковане сховище
    }
  }

  function loadPlan() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!data || typeof data !== 'object') return;
      // Збережені дані теж не довіряємо: проходять ту саму перевірку
      const inc = Calc.validate('income', data.income);
      const exp = Calc.validate('expenses', data.expenses);
      const trm = Calc.validate('term', data.term);
      const rt = Calc.validateRate(String(data.rate));
      if (!(inc.ok && exp.ok && trm.ok && rt.ok)) return;
      el.income.value = String(inc.value);
      el.expenses.value = String(exp.value);
      el.term.value = String(trm.value);
      el.rate.value = String(rt.value);
      el.compound.checked = Boolean(data.compound);
    } catch (e) {
      /* пошкоджений JSON ігноруємо: працюємо зі значеннями за замовчуванням */
    }
  }

  // ---------- Події ----------
  // input: миттєвий перерахунок під час введення; change: select і checkbox
  NUMERIC.forEach((field) => {
    el[field].addEventListener('input', update);
    el[field + 'Range'].addEventListener('input', () => {
      el[field].value = el[field + 'Range'].value;
      update();
    });
  });
  el.rate.addEventListener('change', update);
  el.compound.addEventListener('change', update);

  el.savingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = update();
    if (!values) {
      el.saveStatus.textContent = 'План не збережено: перевірте поля.';
      return;
    }
    el.saveStatus.textContent = savePlan(values)
      ? 'План збережено в цьому браузері.'
      : 'Не вдалося зберегти план: сховище браузера недоступне.';
  });

  loadPlan();
  update();
});
