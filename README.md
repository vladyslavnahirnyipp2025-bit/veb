# Потік монет

Лендинг сервісу планування особистого бюджету із симулятором заощаджень.
Навчальний проєкт з дисципліни «Технології веб-розробки та дизайну» (ЛР №5–№9).

## Що це

Односторінковий сайт: користувач рухає три повзунки (дохід, витрати, термін) і бачить прогнозовану суму
заощаджень. На сторінці також є відео про планування бюджету, інтерактивна карта та форма зворотного зв'язку.

## Технології

- HTML5 (семантичні теги `header`, `main`, `section`, `article`, `aside`, `footer`)
- Tailwind CSS (CDN) + невеликий файл `custom-styles.css`
- Vanilla JavaScript (мобільне меню)
- Google Fonts (Inter, Montserrat), Font Awesome 6

## Запуск локально

1. Клонувати репозиторій: `git clone <посилання на репозиторій>`
2. Відкрити папку у VS Code: File → Open Folder.
3. Правою кнопкою на `index.html` → Open with Live Server (розширення Live Server).
   Можна й просто відкрити `index.html` у браузері. Потрібен інтернет: Tailwind, шрифти й іконки підключені через CDN.

## Структура

```
potik-monet/
├── index.html           сторінка
├── custom-styles.css    власні стилі (фокус, reduced motion)
├── assets/
│   ├── images/          logo.svg, hero-bg.webp
│   └── icons/           stopwatch.svg, shield.svg, slider.svg
├── README.md
└── .gitignore
```

## Демо

- GitHub Pages: _додати посилання після публікації_
- Netlify: _додати посилання після публікації_

## Автор

Нагірний Владислав, група ПП-24.
