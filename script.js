(() => {
  'use strict';

  // PERSONALIZATION: replace these links before publishing.
  const RSVP_URL = 'https://t.me/your_username';
  const WISHLIST_URL = 'https://example.com/your-wishlist';
  const EVENT_START = new Date('2026-12-12T11:00:00+03:00');
  const EVENT_END = new Date('2026-12-12T17:00:00+03:00');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const pad = value => String(value).padStart(2, '0');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const magazineModal = $('#magazineModal');
  const magazineBook = $('#magazineBook');
  const magazineLeft = $('#magazineLeft');
  const magazineRight = $('#magazineRight');
  const magazinePrev = $('#magazinePrev');
  const magazineNext = $('#magazineNext');
  const magazineHome = $('#magazineHome');
  const magazineCurrent = $('#magazinePageCurrent');
  const magazineTotal = $('#magazinePageTotal');
  const magazineProgress = $('#magazineProgressFill');
  const magazineDots = $('#magazineDots');
  const magazineToast = $('#magazineToast');
  let magazineIndex = 0;
  let magazineBusy = false;
  let toastTimer = 0;
  let pageGesture = null;
  const magazineIsMobile = () => window.matchMedia('(max-width: 760px)').matches;

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
  const insideCoverMarkup = `<div class="magazine-inside-cover"><div class="inside-top">THE BIRTHDAY ISSUE · VOL. 30</div><div class="inside-middle"><span class="inside-kicker">A LITTLE SOMETHING SPECIAL</span><h3>One day.<br><em>All the girls.</em><br>Endless memories.</h3><p>Листай — здесь собраны все детали нашего маленького большого праздника.</p></div><div class="inside-foot"><span>EST. 1996* / MAIN CHARACTER ERA</span><span>✳</span></div></div>`;
  const pageMarkup = index => magazinePages[index].html;

  const showToast = message => {
    if (!magazineToast) return;
    magazineToast.textContent = message;
    magazineToast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => magazineToast.classList.remove('is-visible'), 3200);
  };

  const updateControls = () => {
    if (magazinePrev) magazinePrev.disabled = magazineBusy || magazineIndex === 0;
    if (magazineNext) magazineNext.disabled = magazineBusy || magazineIndex === magazinePages.length - 1;
    if (magazineHome) magazineHome.disabled = magazineBusy;
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

  const leftMarkupForIndex = index => index <= 1 ? insideCoverMarkup : pageMarkup(index - 1);

  const setSpread = index => {
    if (!magazineLeft || !magazineRight) return;
    magazineIndex = Math.max(0, Math.min(magazinePages.length - 1, index));
    magazineLeft.innerHTML = leftMarkupForIndex(magazineIndex);
    magazineRight.innerHTML = pageMarkup(magazineIndex);
    updateControls();
  };

  const easeFlip = t => 0.5 - Math.cos(Math.PI * t) / 2;
  const removeTurnEffects = () => {
    magazineBook?.classList.remove('is-flipping', 'is-flipping-next', 'is-flipping-prev');
    magazineBook?.style.removeProperty('--book-lift');
    magazineBook?.style.removeProperty('--turn-ambient');
    magazineModal?.style.removeProperty('--turn-light-x');
  };

  const paintTurn = (flipper, t, direction) => {
    const progress = Math.max(0, Math.min(1, t));
    const bend = Math.sin(Math.PI * progress);
    const sign = direction === 'next' ? -1 : 1;
    const angle = sign * 180 * progress;
    // A tiny diagonal twist and Z-lift make the page feel flexible instead of a flat card.
    const twist = sign * 1.35 * bend;
    const lift = 22 * bend;
    const squeeze = 1 - 0.028 * bend;
    flipper.style.setProperty('--flip-progress', progress.toFixed(4));
    flipper.style.setProperty('--flip-light', bend.toFixed(4));
    flipper.style.setProperty('--flip-gloss-pos', `${(progress * 100).toFixed(2)}%`);
    flipper.style.transform = `rotateY(${angle.toFixed(3)}deg) rotateZ(${twist.toFixed(3)}deg) translateZ(${lift.toFixed(2)}px) scaleX(${squeeze.toFixed(4)})`;
    const side = direction === 'next' ? -1 : 1;
    flipper.style.boxShadow = `${side * (8 + 10 * bend).toFixed(1)}px ${5 + 4 * bend}px ${14 + 34 * bend}px rgba(13, 0, 10, ${(0.1 + 0.25 * bend).toFixed(3)})`;
    magazineBook?.style.setProperty('--book-lift', `${(-8 * bend).toFixed(2)}px`);
    magazineBook?.style.setProperty('--turn-ambient', (0.12 + 0.52 * bend).toFixed(3));
    magazineModal?.style.setProperty('--turn-light-x', `${(50 + sign * (progress - 0.5) * 32).toFixed(2)}%`);
  };

  const beginTurn = targetIndex => {
    if (!magazineModal || magazineBusy) return null;
    const nextIndex = Math.max(0, Math.min(magazinePages.length - 1, targetIndex));
    if (nextIndex === magazineIndex) return null;
    const direction = nextIndex > magazineIndex ? 'next' : 'prev';
    const currentIndex = magazineIndex;
    const mobile = magazineIsMobile();
    magazineBusy = true;
    magazineBook?.classList.remove('magazine-hovering');
    magazineBook?.style.setProperty('--book-tilt-x', '0deg');
    magazineBook?.style.setProperty('--book-tilt-y', '0deg');
    magazineBook?.classList.add('is-flipping', `is-flipping-${direction}`);
    updateControls();

    let frontMarkup;
    let backMarkup;
    let sheetClass = `magazine-turn-sheet turn-${direction}`;

    if (mobile) {
      frontMarkup = pageMarkup(currentIndex);
      backMarkup = pageMarkup(nextIndex);
      magazineRight.innerHTML = pageMarkup(nextIndex);
      sheetClass += ' is-mobile-turn';
    } else if (direction === 'next') {
      magazineLeft.innerHTML = leftMarkupForIndex(currentIndex);
      magazineRight.innerHTML = pageMarkup(nextIndex);
      frontMarkup = pageMarkup(currentIndex);
      backMarkup = leftMarkupForIndex(nextIndex);
    } else {
      magazineLeft.innerHTML = leftMarkupForIndex(nextIndex);
      magazineRight.innerHTML = pageMarkup(nextIndex);
      frontMarkup = leftMarkupForIndex(currentIndex);
      backMarkup = pageMarkup(nextIndex);
    }

    const flipper = document.createElement('div');
    flipper.className = sheetClass;
    flipper.setAttribute('aria-hidden', 'true');
    flipper.innerHTML = `<div class="turn-front">${frontMarkup}</div><div class="turn-back">${backMarkup}</div>`;
    magazineBook.appendChild(flipper);
    paintTurn(flipper, 0, direction);

    const handle = {
      flipper, currentIndex, nextIndex, direction, mobile,
      progress: 0, frameId: 0, finished: false,
      setProgress(progress) {
        this.progress = Math.max(0, Math.min(1, progress));
        paintTurn(flipper, this.progress, direction);
      },
      finish(commit) {
        if (this.finished) return;
        this.finished = true;
        if (this.frameId) cancelAnimationFrame(this.frameId);
        flipper.remove();
        setSpread(commit ? nextIndex : currentIndex);
        magazineBusy = false;
        removeTurnEffects();
        updateControls();
      }
    };
    return handle;
  };

  const animateTurn = (handle, from, to, duration) => {
    if (!handle || handle.finished) return;
    const start = performance.now();
    const distance = to - from;
    const frame = now => {
      if (handle.finished || !handle.flipper.isConnected) return;
      const t = Math.min(1, (now - start) / Math.max(1, duration));
      handle.setProgress(from + distance * easeFlip(t));
      if (t < 1) handle.frameId = requestAnimationFrame(frame);
      else handle.finish(to > from && to > 0.99);
    };
    handle.frameId = requestAnimationFrame(frame);
  };

  const turnToPage = targetIndex => {
    if (magazineBusy) return;
    const nextIndex = Math.max(0, Math.min(magazinePages.length - 1, targetIndex));
    if (nextIndex === magazineIndex) return;
    if (reduceMotion) {
      setSpread(nextIndex);
      return;
    }
    const handle = beginTurn(nextIndex);
    if (handle) animateTurn(handle, 0, 1, handle.mobile ? 900 : 1120);
  };

  const startPageGesture = event => {
    if (magazineBusy || reduceMotion || event.button > 0 || event.target.closest('button, a')) return;
    const mobile = magazineIsMobile();
    const page = event.target.closest('.magazine-page-right, .magazine-page-left');
    if (!page) return;
    const rect = page.getBoundingClientRect();
    let targetIndex = null;
    if (mobile) {
      if (!page.classList.contains('magazine-page-right')) return;
    } else {
      const x = event.clientX - rect.left;
      if (page.classList.contains('magazine-page-right') && x >= rect.width * 0.86 && magazineIndex < magazinePages.length - 1) targetIndex = magazineIndex + 1;
      else if (page.classList.contains('magazine-page-left') && x <= rect.width * 0.14 && magazineIndex > 0) targetIndex = magazineIndex - 1;
      else return;
    }
    pageGesture = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      lastX: event.clientX, lastAt: performance.now(), direction: null,
      targetIndex, mobile, pageWidth: rect.width, progress: 0, handle: null
    };
  };

  const movePageGesture = event => {
    const gesture = pageGesture;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const now = performance.now();
    gesture.velocity = Math.abs(event.clientX - gesture.lastX) / Math.max(1, now - gesture.lastAt);
    gesture.lastX = event.clientX;
    gesture.lastAt = now;
    if (!gesture.handle) {
      if (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(dy) * 1.18) return;
      const targetIndex = gesture.mobile ? magazineIndex + (dx < 0 ? 1 : -1) : gesture.targetIndex;
      if (targetIndex < 0 || targetIndex >= magazinePages.length) { pageGesture = null; return; }
      gesture.direction = dx < 0 ? 'next' : 'prev';
      gesture.handle = beginTurn(targetIndex);
      if (!gesture.handle) { pageGesture = null; return; }
      try { magazineBook.setPointerCapture(event.pointerId); } catch (_) {}
    }
    if (event.cancelable) event.preventDefault();
    const width = Math.max(100, gesture.pageWidth);
    const progress = Math.min(0.985, Math.abs(dx) / width);
    gesture.progress = progress;
    gesture.handle.setProgress(progress);
  };

  const endPageGesture = (event, cancelled = false) => {
    const gesture = pageGesture;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    pageGesture = null;
    if (!gesture.handle) return;
    const commit = !cancelled && (gesture.progress > 0.24 || (gesture.velocity || 0) > 0.58);
    const handle = gesture.handle;
    if (commit) animateTurn(handle, gesture.progress, 1, Math.max(190, (1 - gesture.progress) * (handle.mobile ? 760 : 860)));
    else animateTurn(handle, gesture.progress, 0, Math.max(150, gesture.progress * 410));
  };

  const returnToCover = () => {
    if (magazineBusy || magazineIndex === 0) return;
    turnToPage(0);
  };

  const escapeICS = value => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const formatICS = date => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).reduce((result, part) => (result[part.type] = part.value, result), {});
    return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
  };
  const downloadCalendar = () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//30 and Fabulous//Birthday invitation//RU',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VTIMEZONE', 'TZID:Europe/Moscow',
      'X-LIC-LOCATION:Europe/Moscow', 'BEGIN:STANDARD', 'TZOFFSETFROM:+0300', 'TZOFFSETTO:+0300',
      'TZNAME:MSK', 'DTSTART:19700101T000000', 'END:STANDARD', 'END:VTIMEZONE', 'BEGIN:VEVENT',
      `UID:birthday-30-fabulous-${formatICS(EVENT_START)}@invite`, `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Moscow:${formatICS(EVENT_START)}`, `DTEND;TZID=Europe/Moscow:${formatICS(EVENT_END)}`,
      `SUMMARY:${escapeICS('30 & fabulous — день рождения')}`, `LOCATION:${escapeICS('Калуга')}`,
      `DESCRIPTION:${escapeICS('День рождения: мастер-класс, фотосессия и ресторан. Точное расписание и адреса будут сообщены ближе к дате.')}`,
      'END:VEVENT', 'END:VCALENDAR', ''
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '30-and-fabulous-12-12-2026.ics';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    showToast('Календарь готов — сохрани событие на 12 декабря ♥');
  };

  if (magazineDots) {
    magazinePages.forEach((page, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'magazine-dot';
      dot.setAttribute('aria-label', `Открыть: ${page.name}`);
      dot.addEventListener('click', () => turnToPage(index));
      magazineDots.appendChild(dot);
    });
  }
  magazinePrev?.addEventListener('click', () => turnToPage(magazineIndex - 1));
  magazineNext?.addEventListener('click', () => turnToPage(magazineIndex + 1));
  magazineHome?.addEventListener('click', returnToCover);

  if (magazineModal) {
    magazineModal.addEventListener('click', event => {
      const outbound = event.target.closest('[data-mag-outbound]');
      if (outbound) {
        const kind = outbound.getAttribute('data-mag-outbound');
        const url = kind === 'rsvp' ? RSVP_URL : WISHLIST_URL;
        const isPlaceholder = !url || /your_username|your-wishlist|example\.com/i.test(url);
        if (isPlaceholder) {
          event.preventDefault();
          showToast(kind === 'rsvp' ? 'Перед публикацией укажи Telegram в RSVP_URL в script.js.' : 'Перед публикацией укажи ссылку на вишлист в WISHLIST_URL.');
        }
      }
      if (event.target.closest('[data-mag-calendar]')) downloadCalendar();

      // Tapping near the page edge is another intuitive way to flip the book.
      if (event.target.closest('button, a')) return;
      const page = event.target.closest('.magazine-page-right, .magazine-page-left');
      if (!page || magazineIsMobile()) return;
      const rect = page.getBoundingClientRect();
      const x = event.clientX - rect.left;
      if (page.classList.contains('magazine-page-right') && x > rect.width * .76) turnToPage(magazineIndex + 1);
      else if (page.classList.contains('magazine-page-left') && x < rect.width * .24) turnToPage(magazineIndex - 1);
    });

    magazineBook?.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || magazineIsMobile() || magazineBusy || reduceMotion) return;
      const rect = magazineBook.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / Math.max(rect.width, 1) * 2 - 1;
      const ny = (event.clientY - rect.top) / Math.max(rect.height, 1) * 2 - 1;
      magazineBook.style.setProperty('--book-tilt-x', `${(-ny * 1.1).toFixed(2)}deg`);
      magazineBook.style.setProperty('--book-tilt-y', `${(nx * 1.25).toFixed(2)}deg`);
      magazineModal.style.setProperty('--turn-light-x', `${(50 + nx * 18).toFixed(2)}%`);
      magazineBook.classList.add('magazine-hovering');
    });
    magazineBook?.addEventListener('pointerleave', () => {
      magazineBook?.style.setProperty('--book-tilt-x', '0deg');
      magazineBook?.style.setProperty('--book-tilt-y', '0deg');
      magazineModal?.style.setProperty('--turn-light-x', '50%');
      magazineBook?.classList.remove('magazine-hovering');
    });

    document.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); turnToPage(magazineIndex + 1); }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); turnToPage(magazineIndex - 1); }
      if (event.key === 'Home') { event.preventDefault(); returnToCover(); }
    });

    magazineBook?.addEventListener('pointerdown', startPageGesture);
    magazineBook?.addEventListener('pointermove', movePageGesture, { passive: false });
    magazineBook?.addEventListener('pointerup', event => endPageGesture(event, false));
    magazineBook?.addEventListener('pointercancel', event => endPageGesture(event, true));
  }

  // The book is the actual site now: build the first spread immediately.
  setSpread(0);
  updateControls();
})();
