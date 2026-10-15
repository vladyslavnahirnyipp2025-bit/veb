// validation.js: клієнтська валідація форми зворотного зв'язку (Vanilla JS, без бібліотек).
// Клієнтська перевірка покращує UX, але не замінює серверну: реальної відправки даних тут немає.

// ---------- Правила (RegEx і межі довжини) ----------
// ^ початок рядка, $ кінець рядка: перевіряється весь рядок, а не його частина
const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// +380 і рівно 9 цифр: +380501234567
const REGEX_PHONE = /^\+380\d{9}$/;

// Ім'я: літери (будь-якої мови), пробіл, апостроф, крапка, дефіс; починається з літери.
// Цифри, емодзі й HTML-теги (< >) не проходять
const REGEX_NAME = /^[\p{L}\p{M}][\p{L}\p{M}'’ʼ .-]*$/u;

const NAME_MIN = 2;
const NAME_MAX = 50;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 1000;

// ---------- Елементи форми ----------
const form = document.getElementById('feedbackForm');
const nameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const messageInput = document.getElementById('message');
const agreementInput = document.getElementById('agreement');

// Поля, з якими користувач уже взаємодіяв: помилки показуємо лише для них (або після submit)
const touched = new Set();

// ---------- Керування станами інтерфейсу ----------
function getErrorElement(input) {
  return document.getElementById(input.id === 'username' ? 'nameError' : input.id + 'Error');
}

// Стан Error: червона рамка, текст помилки, aria-invalid="true"
function showError(input, message) {
  const errorElement = getErrorElement(input);
  input.classList.remove('border-line', 'border-green-500');
  input.classList.add('border-red-500');
  input.setAttribute('aria-invalid', 'true');
  errorElement.textContent = message; // textContent, а не innerHTML: введений HTML не виконується
  errorElement.classList.remove('hidden');
}

// Стан Success: зелена рамка, помилку приховано
function showSuccess(input) {
  const errorElement = getErrorElement(input);
  input.classList.remove('border-line', 'border-red-500');
  input.classList.add('border-green-500');
  input.setAttribute('aria-invalid', 'false');
  errorElement.textContent = '';
  errorElement.classList.add('hidden');
}

// Стан Normal: поле повернуто до початкового вигляду
function clearState(input) {
  const errorElement = getErrorElement(input);
  input.classList.remove('border-red-500', 'border-green-500');
  input.classList.add('border-line');
  input.setAttribute('aria-invalid', 'false');
  errorElement.textContent = '';
  errorElement.classList.add('hidden');
}

// Для чекбокса рамки немає: показуємо лише текст помилки
function showCheckboxError(message) {
  agreementInput.setAttribute('aria-invalid', 'true');
  const errorElement = getErrorElement(agreementInput);
  errorElement.textContent = message;
  errorElement.classList.remove('hidden');
}

function clearCheckboxError() {
  agreementInput.setAttribute('aria-invalid', 'false');
  const errorElement = getErrorElement(agreementInput);
  errorElement.textContent = '';
  errorElement.classList.add('hidden');
}

// ---------- Телефон: очищення і нормалізація ----------
// Під час набору прибираємо все, крім цифр і «+», а «+» лишаємо тільки на початку
function sanitizePhone(value) {
  return value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
}

// Після виходу з поля 0501234567 і 380501234567 перетворюємо на +380501234567
function normalizePhone(value) {
  const cleaned = sanitizePhone(value);
  if (/^0\d{9}$/.test(cleaned)) return '+38' + cleaned;
  if (/^380\d{9}$/.test(cleaned)) return '+' + cleaned;
  return cleaned;
}

// ---------- Функції валідації: кожна перевіряє одне поле ----------
function validateName() {
  const value = nameInput.value.trim();
  if (value.length < NAME_MIN) {
    showError(nameInput, `Ім'я має містити щонайменше ${NAME_MIN} символи.`);
    return false;
  }
  if (value.length > NAME_MAX) {
    showError(nameInput, `Ім'я не може бути довшим за ${NAME_MAX} символів.`);
    return false;
  }
  if (!REGEX_NAME.test(value)) {
    showError(nameInput, "Ім'я може містити лише літери, пробіл, апостроф і дефіс.");
    return false;
  }
  showSuccess(nameInput);
  return true;
}

function validateEmail() {
  if (!REGEX_EMAIL.test(emailInput.value.trim())) {
    showError(emailInput, 'Введіть коректну електронну адресу, наприклад user@mail.com.');
    return false;
  }
  showSuccess(emailInput);
  return true;
}

function validatePhone() {
  if (!REGEX_PHONE.test(phoneInput.value)) {
    showError(phoneInput, 'Формат має бути +380XXXXXXXXX, наприклад +380501234567.');
    return false;
  }
  showSuccess(phoneInput);
  return true;
}

function validateMessage() {
  const value = messageInput.value.trim();
  if (value.length < MESSAGE_MIN) {
    showError(messageInput, `Повідомлення має містити щонайменше ${MESSAGE_MIN} символів.`);
    return false;
  }
  if (value.length > MESSAGE_MAX) {
    showError(messageInput, `Повідомлення не може бути довшим за ${MESSAGE_MAX} символів.`);
    return false;
  }
  showSuccess(messageInput);
  return true;
}

function validateAgreement() {
  if (!agreementInput.checked) {
    showCheckboxError('Потрібна згода з політикою конфіденційності.');
    return false;
  }
  clearCheckboxError();
  return true;
}

// Поле -> функція перевірки (щоб не писати окремі слухачі для кожного поля)
const validators = new Map([
  [nameInput, validateName],
  [emailInput, validateEmail],
  [phoneInput, validatePhone],
  [messageInput, validateMessage],
  [agreementInput, validateAgreement],
]);

// ---------- Динамічна валідація: input, blur, change ----------
// Помилок немає, доки користувач не почав взаємодіяти з полем:
// blur (вихід з поля) = перша й підсумкова перевірка, input = оновлення стану під час введення
validators.forEach((validate, field) => {
  field.addEventListener('blur', () => {
    if (field === phoneInput) phoneInput.value = normalizePhone(phoneInput.value);
    touched.add(field);
    validate();
  });

  field.addEventListener('input', () => {
    if (field === phoneInput) phoneInput.value = sanitizePhone(phoneInput.value);
    if (touched.has(field)) validate();
  });
});

// Чекбокс не містить введеного тексту, тому додатково перевіряємо його при зміні стану
agreementInput.addEventListener('change', () => {
  touched.add(agreementInput);
  validateAgreement();
});

// ---------- Модальне вікно успіху ----------
const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModalBtn');
let lastFocusedElement = null; // куди повернути фокус після закриття

function isModalOpen() {
  return !successModal.classList.contains('hidden');
}

function openModal() {
  lastFocusedElement = document.activeElement;
  successModal.classList.remove('hidden');
  successModal.classList.add('flex'); // у Tailwind видимість керується класами hidden / flex
  document.body.classList.add('overflow-hidden'); // блокуємо прокрутку сторінки під вікном
  closeModalBtn.focus();
}

function closeModal() {
  successModal.classList.add('hidden');
  successModal.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
  if (lastFocusedElement) lastFocusedElement.focus();
}

closeModalBtn.addEventListener('click', closeModal);

// Клік по затемненому фону закриває вікно; клік усередині картки ігнорується,
// бо event.target у такому випадку не дорівнює самому оверлею
successModal.addEventListener('click', (event) => {
  if (event.target === successModal) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (!isModalOpen()) return;
  if (event.key === 'Escape') closeModal();
  // У вікні одна кнопка: Tab не повинен виводити фокус на сторінку під ним
  if (event.key === 'Tab') {
    event.preventDefault();
    closeModalBtn.focus();
  }
});

// ---------- Успішне завершення ----------
function handleSuccess() {
  form.reset();
  touched.clear();
  validators.forEach((validate, field) => {
    if (field === agreementInput) clearCheckboxError();
    else clearState(field);
  });
}

// ---------- Надсилання форми ----------
form.addEventListener('submit', (event) => {
  event.preventDefault(); // не перезавантажувати сторінку
  if (isModalOpen()) return; // захист від повторного натискання, поки вікно відкрите

  // Нормалізуємо телефон до перевірки: користувач міг натиснути Enter, не виходячи з поля
  phoneInput.value = normalizePhone(phoneInput.value);

  // Перевіряємо ВСІ поля (не зупиняючись на першій помилці), щоб показати всі помилки одразу
  const results = [...validators].map(([field, validate]) => {
    touched.add(field);
    return { field, valid: validate() };
  });

  const firstInvalid = results.find((result) => !result.valid);
  if (firstInvalid) {
    firstInvalid.field.focus(); // фокус на першому полі з помилкою
    return;
  }

  // Реального надсилання на сервер немає: це демонстрація успішної клієнтської валідації
  handleSuccess();
  openModal();
});
