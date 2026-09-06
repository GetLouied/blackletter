/* Pure helpers — no React, no DOM. */

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function parseCloze(text) {
  const parts = [];
  const re = /\{\{(.+?)\}\}/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ t: "txt", v: text.slice(last, m.index) });
    parts.push({ t: "blank", v: m[1], i: i++ });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ t: "txt", v: text.slice(last) });
  return parts;
}

function pickCard(cards, prof, excludeId) {
  const pool = cards.filter((c) => c.id !== excludeId);
  const list = pool.length ? pool : cards;
  const weights = list.map((c) => {
    const p = prof[c.id];
    if (p === undefined) return 16; // new
    return (6 - p) * (6 - p); // 0→36 ... 5→1
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

const todayKey = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

const profLabel = (p) =>
  p === undefined ? "NEW" : p === 0 ? "STUDY PILE" : p <= 3 ? "LEARNING" : "MASTERED";

export { norm, parseCloze, pickCard, todayKey, profLabel };
