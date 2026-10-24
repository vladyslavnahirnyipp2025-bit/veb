// plugins.js: ініціалізація Swiper, Fancybox і Typed.js (ЛР №10).
// Бібліотеки підключені через CDN у index.html. Кожна ініціалізація обгорнута в перевірку,
// тому збій завантаження одного плагіна не ламає решту сторінки.

document.addEventListener('DOMContentLoaded', () => {
  // Користувачам, які просять менше анімацій, автопрогортання й друк тексту вимикаємо
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Swiper: слайдер сценаріїв накопичень ----------
  const sliderEl = document.querySelector('.scenario-swiper');
  if (sliderEl && typeof Swiper !== 'undefined') {
    new Swiper(sliderEl, {
      loop: true,                 // після останнього слайда знову перший
      speed: 500,                 // тривалість анімації перемикання, мс
      spaceBetween: 24,
      grabCursor: true,
      autoplay: reduceMotion ? false : {
        delay: 3500,              // пауза між автоперемиканнями, мс
        pauseOnMouseEnter: true,  // при наведенні миші автоплей зупиняється
        disableOnInteraction: false
      },
      pagination: { el: '.scenario-pagination', clickable: true },
      navigation: { prevEl: '.scenario-prev', nextEl: '.scenario-next' },
      // Адаптивність: 1 слайд на телефоні, 2 на планшеті, 3 на десктопі
      breakpoints: {
        0: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      },
      a11y: {
        prevSlideMessage: 'Попередній сценарій',
        nextSlideMessage: 'Наступний сценарій',
        paginationBulletMessage: 'Перейти до сценарію {{index}}'
      }
    });
  }

  // ---------- Fancybox: галерея зображень з групуванням за data-fancybox ----------
  if (typeof Fancybox !== 'undefined') {
    Fancybox.bind('[data-fancybox="service-gallery"]', {
      Carousel: { transition: 'fade' },   // ефект зміни кадрів
      Images: { zoom: true },             // збільшення колесом миші та жестом
      l10n: {
        CLOSE: 'Закрити',
        NEXT: 'Далі',
        PREV: 'Назад',
        MODAL: 'Закрити це вікно можна клавішею Esc',
        TOGGLE_ZOOM: 'Збільшити або зменшити',
        TOGGLE_THUMBS: 'Мініатюри',
        TOGGLE_FULLSCREEN: 'На весь екран'
      }
    });
  }

  // ---------- Typed.js: рядок, що друкується, у Hero ----------
  const typedEl = document.getElementById('typed-text');
  if (typedEl && typeof Typed !== 'undefined' && !reduceMotion) {
    new Typed(typedEl, {
      strings: ['подушку безпеки', 'відпустку', 'навчання', 'перший внесок'],
      typeSpeed: 60,
      backSpeed: 35,
      backDelay: 1600,
      smartBackspace: true,
      loop: true
    });
  }
});
