/*
 * Title ordering in Mongolian alphabetical order (… н о ө п … у ү ф …).
 *
 * Sorting runs on the server and again in the browser (the Gantt chart), so it
 * must not depend on the locale data a browser happens to ship: a different
 * order would make hydration fail. This comparator is plain code, identical
 * everywhere. Case is ignored; anything outside the Cyrillic alphabet (Latin,
 * digits, punctuation) sorts by code point, before Cyrillic letters.
 */

const ALPHABET = "абвгдеёжзийклмноөпрстуүфхцчшщъыьэюя";
const OFFSET = 0x10000; // above every BMP code point
const rank = new Map([...ALPHABET].map((ch, i) => [ch, OFFSET + i]));

function weight(ch: string): number {
  return rank.get(ch) ?? ch.codePointAt(0)!;
}

export function compareText(a: string, b: string): number {
  const x = [...a.toLowerCase()];
  const y = [...b.toLowerCase()];
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) {
    const d = weight(x[i]) - weight(y[i]);
    if (d !== 0) return d;
  }
  return x.length - y.length;
}
