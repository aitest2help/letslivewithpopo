import { icon } from '../icons.js';
import { SpeechController } from '../speech.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let language = 'id';
let content;
let photos;
let audioState = { state: 'idle', key: null };
let noticeTimer;
let observer;
const records = new Map();
const ui = {
  id: {
    tagline: 'Kenali. Pahami. Temani.', chapter: 'Bab', section: 'Bagian',
    listen: 'Dengarkan bagian ini', pause: 'Jeda', resume: 'Lanjutkan',
    preparing: 'Menyiapkan suara…', playing: 'Sedang dibacakan', paused: 'Dijeda', stop: 'Hentikan',
    nav: 'Pilih bab', skip: 'Langsung ke cerita', safety: 'Penting untuk keselamatan',
    missing: 'Suara Bahasa Indonesia belum tersedia di perangkat ini. Aktifkan atau unduh suara Bahasa Indonesia di pengaturan suara ponsel, lalu coba lagi. Tidak ada suara bahasa lain yang dipilih.',
    unsupported: 'Browser ini belum mendukung pembacaan teks. Coba browser ponsel yang mendukung suara Bahasa Indonesia.',
    blocked: 'Pembacaan diblokir oleh browser. Coba buka halaman ini di tab sendiri dan ketuk Dengarkan lagi.',
    error: 'Suara belum berhasil diputar. Periksa pengaturan suara perangkat dan coba lagi.',
    hero2: 'Ia tetap punya perasaan. Ia tetap ingin dihargai.',
    hero2small: 'Karya dan perhatian kecil membantu kita mengenal Popo, bukan hanya demensianya.'
  },
  en: {
    tagline: 'Know. Understand. Be alongside.', chapter: 'Chapter', section: 'Section',
    listen: 'Listen to this part', pause: 'Pause', resume: 'Resume',
    preparing: 'Preparing voice…', playing: 'Reading aloud', paused: 'Paused', stop: 'Stop',
    nav: 'Choose a chapter', skip: 'Skip to the story', safety: 'Important for safety',
    missing: 'An English voice is not available on this device. Enable or download an English voice in your phone’s speech settings, then try again. No other-language voice was selected.',
    unsupported: 'This browser does not support reading text aloud. Try a phone browser with a matching speech voice.',
    blocked: 'The browser blocked playback. Try opening this page in its own tab and tap Listen again.',
    error: 'The voice could not play. Check your device’s speech settings and try again.',
    hero2: 'She still has feelings. She still wants to be valued.',
    hero2small: 'Her artwork and small shared moments help us know Popo, not only her dementia.'
  }
};

const value = (record, field) => record[`${field}_${language}`] ?? '';
const controller = new SpeechController({
  synth: window.speechSynthesis,
  Utterance: window.SpeechSynthesisUtterance,
  onChange: state => { audioState = state; updatePlayer(); },
  onNotice: showNotice
});

function showNotice(key) {
  const node = $('audio-notice');
  node.textContent = ui[language][key] || ui[language].error;
  node.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { node.hidden = true; }, 12000);
}

function listenButton(key) {
  const record = records.get(key);
  const label = value(record, 'title');
  return `<button type="button" class="listen" data-listen="${esc(key)}" aria-pressed="false" aria-label="${esc(ui[language].listen + ': ' + label)}">${icon('sound')}<span>${esc(ui[language].listen)}</span></button>`;
}

function renderCard(card) {
  records.set(card.id, card);
  const title = value(card, 'title');
  const quote = value(card, 'quote');
  const classes = ['card', card.image ? 'has-photo' : '', quote ? 'quote' : '', card.kind || ''].filter(Boolean).join(' ');
  const image = card.image && photos[card.image]
    ? `<figure class="photo"><img src="${photos[card.image]}" alt="${esc(title)}" decoding="async" ${card.image === 'popo-sunglasses' ? 'fetchpriority="high"' : 'loading="lazy"'}></figure>` : '';
  const paragraphs = (value(card, 'body') || []).map(p => `<p>${esc(p)}</p>`).join('');
  const bullets = (value(card, 'bullets') || []).map(p => `<li>${esc(p)}</li>`).join('');
  const quoteMarkup = quote ? `<span class="quote-symbol" aria-hidden="true">“</span><blockquote><p>${esc(quote)}</p><cite>— ${esc(card.author)}</cite></blockquote>` : '';
  const note = value(card, 'note');
  return `<article class="${classes}" id="${esc(card.id)}">
    ${image}<div class="copy">
      ${card.kind === 'safety' ? `<p class="safety-label">${esc(ui[language].safety)}</p>` : ''}
      <h3>${esc(title)}</h3>${paragraphs}${bullets ? `<ul>${bullets}</ul>` : ''}${quoteMarkup}
      ${note ? `<p class="gentle-note">${esc(note)}</p>` : ''}${listenButton(card.id)}
    </div></article>`;
}

function renderChapter(chapter) {
  const titleTag = chapter.number === 1 ? 'h1' : 'h2';
  const hero2 = chapter.number === 2 ? `<figure class="chapter-photo wrap">
    <img src="${photos['popo-art-ch2']}" alt="${esc(language === 'id' ? 'Popo fokus pada kegiatan berkarya' : 'Popo engaged in artwork')}" loading="lazy" decoding="async">
    <figcaption>${esc(ui[language].hero2)}<small>${esc(ui[language].hero2small)}</small></figcaption>
  </figure>` : '';
  const sections = chapter.sections.map((section, index) => `<section class="section wrap" id="${esc(section.id)}" aria-labelledby="${esc(section.id)}-title">
    <div class="section-heading"><span class="section-symbol">${icon(section.icon)}</span><div><span class="section-number">${esc(ui[language].section)} ${String(index + 1).padStart(2, '0')}</span><h2 id="${esc(section.id)}-title">${esc(value(section, 'title'))}</h2></div></div>
    <div class="cards">${section.cards.map(renderCard).join('')}</div>
  </section>`).join('');
  return `<section class="chapter" id="${esc(chapter.id)}" aria-labelledby="${esc(chapter.id)}-title">
    <div class="chapter-heading wrap"><div><p class="eyebrow">${esc(ui[language].chapter)} ${String(chapter.number).padStart(2, '0')}</p><${titleTag} id="${esc(chapter.id)}-title">${esc(value(chapter, 'title'))}</${titleTag}><p class="subtitle">${esc(value(chapter, 'subtitle'))}</p></div></div>
    ${hero2}${sections}
  </section>`;
}

function render() {
  observer?.disconnect();
  records.clear();
  $('guide').innerHTML = content.chapters.map(renderChapter).join('');
  document.documentElement.lang = language;
  document.title = language === 'id' ? 'Hidup bersama Popo — Kenalan dan memahami' : 'Life with Popo — Know and understand';
  $('header-tagline').textContent = ui[language].tagline;
  $('skip-link').textContent = ui[language].skip;
  $('chapter-nav').setAttribute('aria-label', ui[language].nav);
  $('chapter-nav').innerHTML = content.chapters.map(ch => `<a href="#${esc(ch.id)}"><span class="nav-icon">${icon(ch.number === 1 ? 'heart' : 'note')}<span class="nav-number">${String(ch.number).padStart(2, '0')}</span></span><span>${esc(value(ch, 'short'))}</span></a>`).join('');
  document.querySelectorAll('[data-language]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.language === language)));
  $('player-symbol').innerHTML = icon('sound');
  const navLinks = Array.from($('chapter-nav').querySelectorAll('a'));
  function highlight() {
    const current = content.chapters.filter(ch => $(ch.id).getBoundingClientRect().top <= 170).at(-1) || content.chapters[0];
    navLinks.forEach(a => current.id === a.hash.slice(1) ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
  }
  observer = new IntersectionObserver(highlight, { threshold: 0, rootMargin: '-150px 0px -65% 0px' });
  document.querySelectorAll('.chapter').forEach(ch => observer.observe(ch));
  highlight();
  updatePlayer();
}

function cardText(card) {
  return [value(card, 'title'), ...(value(card, 'body') || []), ...(value(card, 'bullets') || []), value(card, 'quote'), value(card, 'note')].filter(Boolean).join('. ');
}

function updatePlayer() {
  const active = !['idle'].includes(audioState.state);
  $('audio-player').hidden = !active;
  $('player-label').textContent = audioState.label || '';
  $('player-status').textContent = ui[language][audioState.state] || '';
  const paused = audioState.state === 'paused';
  $('player-pause').innerHTML = icon(paused ? 'play' : 'pause');
  $('player-pause').setAttribute('aria-label', paused ? ui[language].resume : ui[language].pause);
  $('player-pause').disabled = audioState.state === 'preparing';
  $('player-stop').innerHTML = icon('stop');
  $('player-stop').setAttribute('aria-label', ui[language].stop);
  document.querySelectorAll('[data-listen]').forEach(button => {
    const record = records.get(button.dataset.listen);
    const selected = active && audioState.key === button.dataset.listen;
    const action = selected ? (paused ? ui[language].resume : audioState.state === 'preparing' ? ui[language].preparing : ui[language].pause) : ui[language].listen;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${action}: ${record ? value(record, 'title') : ''}`);
    button.innerHTML = icon(selected && audioState.state === 'playing' ? 'pause' : 'sound') + `<span>${esc(action)}</span>`;
  });
}

function changeLanguage(next) {
  if (next === language || !content) return;
  const firstVisible = Array.from(document.querySelectorAll('.card')).find(el => el.getBoundingClientRect().bottom > 170);
  const position = firstVisible ? { id: firstVisible.id, offset: firstVisible.getBoundingClientRect().top } : null;
  const nearTop = window.scrollY < 120;
  controller.stop();
  $('audio-notice').hidden = true;
  language = next;
  render();
  if (!nearTop && position && $(position.id)) {
    requestAnimationFrame(() => window.scrollBy(0, $(position.id).getBoundingClientRect().top - position.offset));
  }
}

document.addEventListener('click', event => {
  const langButton = event.target.closest('[data-language]');
  if (langButton) { changeLanguage(langButton.dataset.language); return; }
  if (event.target.closest('#chapter-nav a')) { controller.stop(); return; }
  const button = event.target.closest('[data-listen]');
  if (button) {
    $('audio-notice').hidden = true;
    const record = records.get(button.dataset.listen);
    if (record) void controller.play({ key: record.id, label: value(record, 'title'), text: cardText(record), language });
  }
});
$('player-pause').addEventListener('click', () => audioState.state === 'paused' ? controller.resume() : controller.pause());
$('player-stop').addEventListener('click', () => controller.stop());
window.addEventListener('pagehide', () => controller.stop());

try {
  const responses = await Promise.all([fetch(new URL('./content.json', import.meta.url)), fetch(new URL('./photos.json', import.meta.url))]);
  if (responses.some(r => !r.ok)) throw new Error('Guide files unavailable');
  [content, photos] = await Promise.all(responses.map(r => r.json()));
  render();
  if (window.location.hash) {
    requestAnimationFrame(() => {
      const target = $(decodeURIComponent(window.location.hash.slice(1)));
      target?.scrollIntoView({ block: 'start' });
    });
  }
} catch (error) {
  $('loading-message').textContent = 'Panduan belum berhasil dimuat. Muat ulang halaman ini untuk mencoba lagi.';
  console.error('Onboarding guide:', error);
}
