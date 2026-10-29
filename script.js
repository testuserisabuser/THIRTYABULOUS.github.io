(() => {
  'use strict';

  // PERSONALIZATION: replace these two links before publishing.
  const RSVP_URL = 'https://t.me/your_username';
  const WISHLIST_URL = 'https://example.com/your-wishlist';
  const EVENT_START = new Date('2026-12-12T11:00:00+03:00');
  const EVENT_END = new Date('2026-12-12T17:00:00+03:00');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const rsvpLink = $('#rsvpLink');
  const wishlistLink = $('#wishlistLink');
  if (rsvpLink) rsvpLink.href = RSVP_URL;
  if (wishlistLink) wishlistLink.href = WISHLIST_URL;

  // Scroll reveals: fail open so the page remains readable if the API is unavailable.
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -30px 0px' });
    $$('.reveal').forEach(el => revealObserver.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // Scroll progress bar.
  const progress = $('#scrollProgress');
  let scrollScheduled = false;
  const updateScrollProgress = () => {
    if (!progress) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    progress.style.width = `${ratio * 100}%`;
    scrollScheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollScheduled) {
      window.requestAnimationFrame(updateScrollProgress);
      scrollScheduled = true;
    }
  }, { passive: true });
  updateScrollProgress();

  // Countdown with a graceful post-event state.
  const pad = value => String(value).padStart(2, '0');
  const updateCountdown = () => {
    const note = $('#countdownNote');
    const now = Date.now();
    if (now >= EVENT_END.getTime()) {
      ['days', 'hours', 'minutes', 'seconds'].forEach(id => {
        const target = document.getElementById(id);
        if (target) target.textContent = '00';
      });
      if (note) note.textContent = 'Это было прекрасно. Спасибо, что была частью этого дня! ♥';
      return;
    }
    if (now >= EVENT_START.getTime()) {
      ['days', 'hours', 'minutes', 'seconds'].forEach(id => {
        const target = document.getElementById(id);
        if (target) target.textContent = '00';
      });
      if (note) note.textContent = 'Сегодня сияем на максимум! ✨ До встречи!';
      return;
    }
    const diff = EVENT_START.getTime() - now;
    const values = {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    };
    Object.entries(values).forEach(([id, value]) => {
      const target = document.getElementById(id);
      if (target) target.textContent = pad(value);
    });
  };
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  // Calendar invite download. Uses the event's Kaluga/Moscow local time (UTC+3).
  const escapeICS = value => String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
  const formatICS = date => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).reduce((result, part) => (result[part.type] = part.value, result), {});
    return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
  };
  const calendarButton = $('#calendarButton');
  if (calendarButton) {
    calendarButton.addEventListener('click', () => {
      const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//30 and Fabulous//Birthday invitation//RU',
        'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
        `UID:birthday-30-fabulous-${formatICS(EVENT_START)}@invite`,
        `DTSTAMP:${stamp}`, `DTSTART;TZID=Europe/Moscow:${formatICS(EVENT_START)}`,
        `DTEND;TZID=Europe/Moscow:${formatICS(EVENT_END)}`,
        `SUMMARY:${escapeICS('30 & fabulous — день рождения')}`,
        `LOCATION:${escapeICS('Калуга')}`,
        `DESCRIPTION:${escapeICS('День рождения: мастер-класс, фотосессия и ресторан. Точное расписание и адреса будут сообщены ближе к дате.')}`,
        'END:VEVENT', 'END:VCALENDAR', ''
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '30-and-fabulous-12-12-2026.ics';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      const note = $('#calendarNote');
      if (note) note.textContent = 'Готово — открой файл и сохрани событие в календаре ♥';
    });
  }

  // Active navigation marker, helpful on long scrolls.
  if ('IntersectionObserver' in window) {
    const sectionLinks = $$('.main-nav a');
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sectionLinks.forEach(link => {
            const active = link.getAttribute('href') === `#${entry.target.id}`;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    ['invite', 'plan', 'details', 'rsvp'].forEach(id => {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  // Tiny sparkles, restricted to the background and disabled for reduced-motion users.
  const sparkleLayer = $('#sparkleLayer');
  if (sparkleLayer && !reduceMotion) {
    const symbols = ['✦', '✧', '⋆', '·', '♡'];
    for (let i = 0; i < 19; i += 1) {
      const sparkle = document.createElement('span');
      sparkle.className = 'sparkle';
      sparkle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      sparkle.style.left = `${Math.random() * 100}%`;
      sparkle.style.top = `${Math.random() * 100}%`;
      sparkle.style.fontSize = `${8 + Math.random() * 13}px`;
      sparkle.style.setProperty('--duration', `${3.1 + Math.random() * 4.5}s`);
      sparkle.style.setProperty('--delay', `${Math.random() * 5}s`);
      sparkleLayer.appendChild(sparkle);
    }
  }

  // Pointer glow and subtle hero photo parallax on mouse/trackpad devices only.
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const ambient = $('#ambientGlow');
  const heroPhoto = $('[data-parallax]');
  if (finePointer && !reduceMotion) {
    window.addEventListener('pointermove', event => {
      if (ambient) {
        ambient.style.setProperty('--glow-x', `${event.clientX - 160}px`);
        ambient.style.setProperty('--glow-y', `${event.clientY - 160}px`);
      }
      const area = $('[data-parallax-area]');
      if (area && heroPhoto) {
        const rect = area.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
          const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
          heroPhoto.style.transform = `rotate(${2.2 + dx * 2.0}deg) translate3d(${dx * -7}px, ${dy * -7}px, 0)`;
        }
      }
    }, { passive: true });
    const planCards = $$('.plan-card[data-tilt]');
    planCards.forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = `perspective(900px) rotateX(${y * -3.5}deg) rotateY(${x * 3.5}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    $$('.magnetic').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        button.style.transform = `translate(${dx * .08}px, ${dy * .12}px)`;
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }


  // Interactive editorial invitation: an actual page-turning magazine.
  const magazineModal = $('#magazineModal');
  const magazineBook = $('#magazineBook');
  const magazineLeft = $('#magazineLeft');
  const magazineRight = $('#magazineRight');
  const magazinePrev = $('#magazinePrev');
  const magazineNext = $('#magazineNext');
  const magazineCurrent = $('#magazinePageCurrent');
  const magazineTotal = $('#magazinePageTotal');
  const magazineProgress = $('#magazineProgressFill');
  const magazineDots = $('#magazineDots');
  const magazineToast = $('#magazineToast');
  const magazinePages = [
    { name: 'Обложка', className: 'mag-cover', html: `
      <div class="mag-page-content mag-page mag-cover">
        <div class="mag-page-top"><span>30 — THE BIRTHDAY ISSUE</span><span>№ 01</span></div>
        <div class="cover-art"><img src="girls-party.webp" alt="Именинница с подругами на розовой вечеринке" draggable="false"><span class="cover-vertical">THE GIRLS' EDITION · 2026</span><span class="cover-photo-stamp">30</span><div class="cover-title"><h2>THIRTY <em>&</em><br>FABULOUS<span style="color:#fff">.</span></h2><p>New decade. Same iconic energy.</p></div></div>
        <div class="cover-bottom"><span>DECEMBER 12 · KALUGA</span><span>THE PARTY ISSUE ✳</span></div>
      </div>` },
    { name: 'Письмо', className: 'mag-letter', html: `
      <div class="mag-page-content mag-page mag-letter">
        <span class="letter-number" aria-hidden="true">01</span>
        <div class="mag-page-top"><span>A NOTE FROM THE BIRTHDAY GIRL</span><span>02 / 06</span></div>
        <div class="letter-body"><p class="mag-kicker">TO MY FAVOURITE PEOPLE</p><h2>Дорогая<br><em>подружка,</em></h2><p>Мне исполняется <strong>30</strong> — и я хочу встретить этот день красиво, вкусно, весело и рядом с любимыми девочками.</p><p>Будет немного магии, много улыбок и моменты, которые захочется сохранить на фото. Очень хочу разделить этот день с тобой.</p><div class="letter-signature">Обнимаю и жду ♥</div></div>
        <div class="letter-stamp">LOVE<br>YOU<br>ALWAYS ✳</div>
        <div class="mag-page-bottom"><span>MADE OF MEMORIES</span><span>02</span></div>
      </div>` },
    { name: 'Программа', className: 'mag-agenda', html: `
      <div class="mag-page-content mag-page mag-agenda">
        <div class="mag-page-top"><span>THE BIRTHDAY AGENDA</span><span>03 / 06</span></div>
        <p class="mag-kicker">THREE ACTS. ONE ICONIC DAY.</p><h2>План на день<br><em>икс.</em></h2><p class="agenda-intro">Три повода нарядиться. Один день, который наш.</p>
        <div class="agenda-list">
          <div class="agenda-row"><span class="agenda-num">01</span><div><strong>Мастер-класс</strong><small>MAKE SOMETHING PRETTY</small></div><span class="agenda-symbol">✳</span></div>
          <div class="agenda-row"><span class="agenda-num">02</span><div><strong>Фотосессия</strong><small>SERVE THE LOOK</small></div><span class="agenda-symbol">↗</span></div>
          <div class="agenda-row"><span class="agenda-num">03</span><div><strong>Ресторан</strong><small>CHEERS, BABE!</small></div><span class="agenda-symbol">♡</span></div>
        </div>
        <p class="agenda-side-note">Точное расписание и адреса пришлю ближе к дате.</p>
        <div class="mag-page-bottom"><span>NO BORING PLANS ALLOWED</span><span>03</span></div>
      </div>` },
    { name: 'Дата и место', className: 'mag-details', html: `
      <div class="mag-page-content mag-page mag-details">
        <div class="mag-page-top"><span>BLOCK YOUR CALENDAR</span><span>04 / 06</span></div>
        <p class="mag-kicker">SAVE THE DATE</p><div class="details-day">12</div><div class="details-month">ДЕКАБРЯ</div><div class="details-year">СУББОТА · 2026</div>
        <div class="details-rule"></div><div class="details-facts"><div><span>ГОРОД</span><strong>Калуга</strong></div><div><span>ВРЕМЯ</span><strong>11:00—17:00</strong></div></div>
        <div class="dress-mini"><i></i><i></i><i></i> Pink, sparkle & your main-character energy.</div>
        <button class="mag-action" type="button" data-mag-calendar><span>Добавить в календарь</span><span class="action-arrow" aria-hidden="true">↗</span></button>
        <div class="mag-page-bottom"><span>YOUR PRESENCE IS THE PRESENT</span><span>04</span></div>
      </div>` },
    { name: 'Вишлист', className: 'mag-wishlist', html: `
      <div class="mag-page-content mag-page mag-wishlist">
        <div class="mag-page-top"><span>A LITTLE WISH LIST</span><span>05 / 06</span></div>
        <div class="gift-orbit"><span class="gift-emoji" aria-hidden="true">🎁</span></div>
        <p class="mag-kicker" style="text-align:center">THE BEST GIFT IS YOU</p><h2>Подарки — это<br><em>приятный бонус.</em></h2>
        <p class="wishlist-note">Самое главное — твоё присутствие. А если захочется выбрать для меня что-то особенное, я собрала желания в одном месте.</p>
        <a class="mag-action" href="${WISHLIST_URL}" target="_blank" rel="noopener noreferrer" data-mag-outbound="wishlist"><span>Открыть вишлист</span><span class="action-arrow" aria-hidden="true">↗</span></a>
        <div class="mag-page-bottom"><span>JUST BE THERE ♥</span><span>05</span></div>
      </div>` },
    { name: 'Ответить', className: 'mag-rsvp-page', html: `
      <div class="mag-page-content mag-page mag-rsvp-page" style="background:linear-gradient(155deg,#fff8f2,#f9d9e8)">
        <div class="mag-page-top"><span>ONE LAST THING, BABE</span><span>06 / 06</span></div>
        <div class="mag-rsvp-wrap"><div class="rsvp-spark" aria-hidden="true">✳</div><p class="mag-kicker">THE MOST IMPORTANT PART</p><h2>Ты<br><em>будешь?</em></h2><p>Очень надеюсь увидеть тебя рядом в этот день. Дай мне знать до 1 декабря — так я смогу всё красиво спланировать.</p><p class="rsvp-deadline">PLEASE REPLY BY DECEMBER 1</p><a class="mag-action mag-rsvp" href="${RSVP_URL}" target="_blank" rel="noopener noreferrer" data-mag-outbound="rsvp"><span>Да, я с тобой!</span><span class="action-arrow" aria-hidden="true">↗</span></a></div>
        <div class="mag-page-bottom"><span>CAN'T WAIT TO SEE YOU</span><span>06</span></div>
      </div>` }
  ];
  let magazineIndex = 0;
  let magazineBusy = false;
  let previousFocus = null;
  let toastTimer = 0;
  const magazineIsMobile = () => window.matchMedia('(max-width: 760px)').matches;
  const insideCoverMarkup = `<div class="magazine-inside-cover"><div class="inside-top">THE BIRTHDAY ISSUE · VOL. 30</div><div class="inside-middle"><span class="inside-kicker">A LITTLE SOMETHING SPECIAL</span><h3>One day.<br><em>All the girls.</em><br>Endless memories.</h3><p>Листай — здесь собраны все детали нашего маленького большого праздника.</p></div><div class="inside-foot"><span>EST. 1996* / MAIN CHARACTER ERA</span><span>✳</span></div></div>`;
  const pageMarkup = index => magazinePages[index].html;
  const setMagazineSpread = index => {
    if (!magazineLeft || !magazineRight) return;
    magazineIndex = Math.max(0, Math.min(magazinePages.length - 1, index));
    magazineLeft.innerHTML = magazineIndex === 0 ? insideCoverMarkup : pageMarkup(magazineIndex - 1);
    magazineRight.innerHTML = pageMarkup(magazineIndex);
    updateMagazineControls();
  };
  const updateMagazineControls = () => {
    if (magazinePrev) magazinePrev.disabled = magazineBusy || magazineIndex === 0;
    if (magazineNext) magazineNext.disabled = magazineBusy || magazineIndex === magazinePages.length - 1;
    if (magazineCurrent) magazineCurrent.textContent = pad(magazineIndex + 1);
    if (magazineTotal) magazineTotal.textContent = pad(magazinePages.length);
    if (magazineProgress) magazineProgress.style.width = `${((magazineIndex + 1) / magazinePages.length) * 100}%`;
    $$('.magazine-dot', magazineDots || document).forEach((dot, index) => {
      if (index === magazineIndex) dot.setAttribute('aria-current', 'page');
      else dot.removeAttribute('aria-current');
      dot.disabled = magazineBusy || index === magazineIndex;
    });
    if (magazineLeft) magazineLeft.setAttribute('aria-label', magazineIndex === 0 ? 'Внутренняя обложка' : `Страница ${magazineIndex}`);
    if (magazineRight) magazineRight.setAttribute('aria-label', `Страница ${magazineIndex + 1}: ${magazinePages[magazineIndex].name}`);
  };
  if (magazineDots) {
    magazinePages.forEach((page, index) => {
      const dot = document.createElement('button');
      dot.type = 'button'; dot.className = 'magazine-dot'; dot.setAttribute('aria-label', `Открыть: ${page.name}`);
      dot.addEventListener('click', () => turnToMagazinePage(index));
      magazineDots.appendChild(dot);
    });
  }
  const restoreMagazineControlFocus = direction => {
    const preferred = direction === 'next' ? magazineNext : magazinePrev;
    const fallback = direction === 'next' ? magazinePrev : magazineNext;
    const target = preferred && !preferred.disabled ? preferred : (fallback && !fallback.disabled ? fallback : $('.magazine-close', magazineModal));
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  };
  const showSiteToast = message => {
    const toast = $('#siteToast');
    if (!toast) { window.alert(message); return; }
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  };
  const showMagazineToast = message => {
    if (!magazineToast) return;
    magazineToast.textContent = message;
    magazineToast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => magazineToast.classList.remove('is-visible'), 2900);
  };
  const openMagazine = trigger => {
    if (!magazineModal) return;
    previousFocus = trigger || document.activeElement;
    magazineModal.hidden = false;
    document.body.classList.add('magazine-open');
    setMagazineSpread(magazineIndex);
    const close = $('.magazine-close', magazineModal);
    if (close) window.setTimeout(() => close.focus(), 60);
  };
  const closeMagazine = () => {
    if (!magazineModal || magazineModal.hidden) return;
    magazineModal.hidden = true;
    document.body.classList.remove('magazine-open');
    magazineBusy = false;
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  };
  const turnToMagazinePage = targetIndex => {
    if (!magazineModal || magazineModal.hidden || magazineBusy) return;
    const nextIndex = Math.max(0, Math.min(magazinePages.length - 1, targetIndex));
    if (nextIndex === magazineIndex) return;
    const direction = nextIndex > magazineIndex ? 'next' : 'prev';
    const currentIndex = magazineIndex;
    const mobile = magazineIsMobile();
    magazineBusy = true;
    updateMagazineControls();
    if (mobile) {
      const oldMarkup = pageMarkup(currentIndex);
      magazineRight.innerHTML = pageMarkup(nextIndex);
      const flipper = document.createElement('div');
      flipper.className = `magazine-turn-sheet is-mobile-turn turn-${direction}`;
      flipper.innerHTML = `<div class="turn-front">${oldMarkup}</div><div class="turn-back">${pageMarkup(nextIndex)}</div>`;
      magazineBook.appendChild(flipper);
      requestAnimationFrame(() => requestAnimationFrame(() => flipper.classList.add('is-turning')));
      const finish = () => {
        if (!flipper.isConnected) return;
        flipper.remove();
        magazineIndex = nextIndex;
        magazineBusy = false;
        updateMagazineControls();
        restoreMagazineControlFocus(direction);
      };
      flipper.addEventListener('transitionend', event => { if (event.target === flipper && event.propertyName === 'transform') finish(); }, { once: true });
      window.setTimeout(finish, 1000);
      return;
    }
    if (direction === 'next') {
      magazineLeft.innerHTML = pageMarkup(currentIndex);
      magazineRight.innerHTML = pageMarkup(nextIndex);
    } else {
      magazineLeft.innerHTML = nextIndex === 0 ? insideCoverMarkup : pageMarkup(nextIndex - 1);
      magazineRight.innerHTML = pageMarkup(nextIndex);
    }
    const flipper = document.createElement('div');
    flipper.className = `magazine-turn-sheet turn-${direction}`;
    const frontIndex = direction === 'next' ? currentIndex : currentIndex - 1;
    const backIndex = direction === 'next' ? nextIndex : Math.max(0, currentIndex - 2);
    const frontMarkup = frontIndex < 0 ? insideCoverMarkup : pageMarkup(frontIndex);
    const backMarkup = direction === 'prev' && nextIndex === 0 ? insideCoverMarkup : pageMarkup(backIndex);
    flipper.innerHTML = `<div class="turn-front">${frontMarkup}</div><div class="turn-back">${backMarkup}</div>`;
    magazineBook.appendChild(flipper);
    requestAnimationFrame(() => requestAnimationFrame(() => flipper.classList.add('is-turning')));
    const finish = () => {
      if (!flipper.isConnected) return;
      flipper.remove();
      magazineIndex = nextIndex;
      magazineBusy = false;
      // Normalize both pages to the selected spread, including direct-dot navigation.
      setMagazineSpread(nextIndex);
      restoreMagazineControlFocus(direction);
    };
    flipper.addEventListener('transitionend', event => { if (event.target === flipper && event.propertyName === 'transform') finish(); }, { once: true });
    window.setTimeout(finish, 1000);
  };
  $$('[data-open-magazine]').forEach(trigger => trigger.addEventListener('click', event => {
    event.preventDefault();
    openMagazine(trigger);
  }));
  $$('[data-close-magazine]').forEach(trigger => trigger.addEventListener('click', closeMagazine));
  if (magazinePrev) magazinePrev.addEventListener('click', () => turnToMagazinePage(magazineIndex - 1));
  if (magazineNext) magazineNext.addEventListener('click', () => turnToMagazinePage(magazineIndex + 1));
  if (magazineModal) {
    magazineModal.addEventListener('click', event => {
      const outbound = event.target.closest('[data-mag-outbound]');
      if (outbound) {
        const kind = outbound.getAttribute('data-mag-outbound');
        const url = kind === 'rsvp' ? RSVP_URL : WISHLIST_URL;
        const isPlaceholder = !url || /your_username|your-wishlist|example\.com/i.test(url);
        if (isPlaceholder) {
          event.preventDefault();
          showMagazineToast(kind === 'rsvp' ? 'Добавь свой Telegram в RSVP_URL в script.js.' : 'Укажи ссылку на вишлист в WISHLIST_URL в script.js.');
        }
      }
      const calendar = event.target.closest('[data-mag-calendar]');
      if (calendar && calendarButton) calendarButton.click();
    });
    document.addEventListener('keydown', event => {
      if (!magazineModal || magazineModal.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeMagazine(); return; }
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); turnToMagazinePage(magazineIndex + 1); }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); turnToMagazinePage(magazineIndex - 1); }
      if (event.key === 'Tab') {
        const focusable = $$('button:not(:disabled), a[href]', magazineModal).filter(el => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (!magazineModal.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    let touchStartX = 0, touchStartY = 0;
    magazineBook.addEventListener('touchstart', event => {
      if (!event.changedTouches.length) return;
      touchStartX = event.changedTouches[0].clientX;
      touchStartY = event.changedTouches[0].clientY;
    }, { passive: true });
    magazineBook.addEventListener('touchend', event => {
      if (!event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - touchStartX;
      const dy = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) turnToMagazinePage(magazineIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }
  // Guard unconfigured links on the main landing page too, rather than sending guests to dummy URLs.
  if (rsvpLink) rsvpLink.addEventListener('click', event => {
    if (/your_username/i.test(RSVP_URL)) { event.preventDefault(); showSiteToast('Добавь свой Telegram в RSVP_URL в script.js перед публикацией.'); }
  });
  if (wishlistLink) wishlistLink.addEventListener('click', event => {
    if (/your-wishlist|example\.com/i.test(WISHLIST_URL)) { event.preventDefault(); showSiteToast('Укажи ссылку на вишлист в WISHLIST_URL в script.js перед публикацией.'); }
  });

})();
