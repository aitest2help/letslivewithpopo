// Interface-only helpers: the guide's care content remains in content.json.
export const foodGroups = {
  all: ['Semua hidangan', 'All dishes'],
  breakfast: ['Sarapan', 'Breakfast'],
  meals: ['Makan siang & malam', 'Lunch & dinner'],
  snacks: ['Camilan & minuman', 'Snacks & drinks'],
  ideas: ['Rujukan resep', 'Recipe references']
};
export const chapterSummaries = [
  ['Kisah hidup, harga diri, kebiasaan dan hal yang Popo sukai.', 'Her life, pride, habits and the things she loves.'],
  ['Apa yang berubah karena demensia, dan perasaan yang tetap ada.', 'What dementia changes, and the feelings that remain.'],
  ['Enam momen sehari, kegiatan di rumah dan pilihan akhir pekan.', 'Six day moments, home activities and weekend choices.'],
  ['Pahami saat sulit, cari dukungan bersama dan kenali keadaan darurat.', 'Understand difficult moments, share support and recognise emergencies.'],
  ['Istirahat, ruang pribadi, perasaan Anda dan belajar bersama.', 'Your rest, personal space, feelings and learning together.'],
  ['Contoh pesan, catatan tensi, panduan perawatan dan masakan yang akrab.', 'Message formats, BP records, care guidance and familiar food.']
];
export function resolveGuideRoute(hash, chapters) {
  let id;
  try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { id = ''; }
  if (!id || id === 'home') return { view: 'home', target: null };
  if (id === 'all') return { view: 'all', target: null };
  if (id === 'main') return { view: null, target: 'main' };
  const chapter = chapters.find(ch => ch.id === id || ch.sections.some(s => s.id === id || s.cards.some(c => c.id === id)));
  return chapter ? { view: chapter.id, target: id } : { view: 'home', target: null };
}
export function normaliseSearch(text) {
  return String(text).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}
export function matchesFood(card, sectionId, category, query) {
  const groups = { breakfast: ['breakfast'], meals: ['meals'], snacks: ['snacks', 'drinks'], ideas: ['ideas'] };
  if (category !== 'all' && !(groups[category] || []).some(name => sectionId === 'ch6-food-' + name)) return false;
  const haystack = normaliseSearch([
    card.id, card.title_id, card.title_en,
    ...(card.body_id || []), ...(card.body_en || []), ...(card.bullets_id || []), ...(card.bullets_en || []),
    card.image_caption_id, card.image_caption_en,
    ...(card.additional_images || []).flatMap(image => [image.caption_id, image.caption_en]),
    card.note_id, card.note_en
  ].filter(Boolean).join(' '));
  return normaliseSearch(query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}
export async function copyPlainText(text, clipboard, document) {
  try {
    if (clipboard?.writeText) { await clipboard.writeText(text); return true; }
  } catch { /* Use manual-compatible fallback if permission is denied. */ }
  const focused = document.activeElement;
  const input = document.createElement('textarea');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
  document.body.appendChild(input);
  let copied = false;
  try { input.select(); copied = Boolean(document.execCommand?.('copy')); } catch { copied = false; }
  finally { input.remove(); focused?.focus({ preventScroll: true }); }
  return copied;
}
