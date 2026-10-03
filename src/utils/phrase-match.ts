// Helpers for figuring out which form label / phrase a tapped word belongs to,
// and for matching saved dictionary entries to a tap.
//
// Example: on the line "Date of Birth", tapping "Date" or "Birth" should both
// find the entry for the phrase "Date of Birth", but tapping "Date" on the line
// "Date of Issue" must NOT.

// Lowercases and strips punctuation ("BARANGAY:" -> "barangay").
// Keeps digits and Latin letters incl. accented ones (e.g. ñ).
export const normalizeToken = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/g, "");

// Splits text into normalized word tokens.
export const tokenize = (text: string): string[] =>
  text
    .split(/\s+/)
    .map(normalizeToken)
    .filter((t) => t !== "");

const withinOneEdit = (a: string, b: string): boolean => {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    edits++;
    if (edits > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (la - i) + (lb - j) <= 1;
};

// Two tokens match if equal, or (for longer words) if they differ by a single
// character, which forgives small OCR mistakes like "birlh" vs "birth".
export const tokensMatch = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 5) return false;
  return withinOneEdit(a, b);
};

// Key used to store a phrase in the cache ("Date of Birth:" -> "date of birth").
export const termKey = (term: string): string => tokenize(term).join(" ");

// Counts how many times each word has appeared so far, so a tapped word can be
// identified as "the 2nd NAME on this line". Create one counter per line.
export const createOccurrenceCounter = () => {
  const seen: Record<string, number> = {};
  return (text: string): number => {
    const key = normalizeToken(text);
    const count = seen[key] ?? 0;
    seen[key] = count + 1;
    return count;
  };
};

// Finds where the tapped word sits in the line's tokens (0-based index) or -1.
const findTargetIndex = (
  lineTokens: string[],
  tappedToken: string,
  occurrence: number,
): number => {
  const matches: number[] = [];
  lineTokens.forEach((token, index) => {
    if (tokensMatch(token, tappedToken)) matches.push(index);
  });
  if (matches.length === 0) return -1;
  return matches[Math.min(Math.max(occurrence, 0), matches.length - 1)];
};

// All places where the term's tokens appear in a row inside the line.
const findSpans = (
  lineTokens: string[],
  termTokens: string[],
): Array<[number, number]> => {
  const spans: Array<[number, number]> = [];
  const m = termTokens.length;
  if (m === 0) return spans;
  for (let i = 0; i + m <= lineTokens.length; i++) {
    let ok = true;
    for (let j = 0; j < m; j++) {
      if (!tokensMatch(lineTokens[i + j], termTokens[j])) {
        ok = false;
        break;
      }
    }
    if (ok) spans.push([i, i + m]);
  }
  return spans;
};

// True when `term` appears in `line` and that occurrence includes the tapped word.
export const phraseCoversTap = (
  term: string,
  line: string,
  tapped: string,
  occurrence: number = 0,
): boolean => {
  const lineTokens = tokenize(line);
  const termTokens = tokenize(term);
  const spans = findSpans(lineTokens, termTokens);
  if (spans.length === 0) return false;

  const tappedTokens = tokenize(tapped);
  // Tapped box is not a single word (e.g. a whole line): any occurrence counts.
  if (tappedTokens.length !== 1) return true;

  const target = findTargetIndex(lineTokens, tappedTokens[0], occurrence);
  if (target === -1) return false;
  return spans.some(([start, end]) => target >= start && target < end);
};

// Checks the phrase Gemini reported. If it is missing, too long, or does not
// actually contain the tapped word on that line, falls back to the tapped word.
export const resolveTerm = (
  rawTerm: unknown,
  tapped: string,
  line?: string,
  occurrence: number = 0,
): string => {
  const fallback = tapped.trim();
  if (typeof rawTerm !== "string") return fallback;

  const cleaned = rawTerm
    .trim()
    .replace(/^["'\u201c\u201d]+|["'\u201c\u201d]+$/g, "")
    .trim();
  if (!cleaned || cleaned.length > 80) return fallback;

  const termTokens = tokenize(cleaned);
  if (termTokens.length === 0 || termTokens.length > 8) return fallback;

  if (line && line.trim() !== "") {
    return phraseCoversTap(cleaned, line, tapped, occurrence)
      ? cleaned
      : fallback;
  }

  // No line available: at least require the phrase to include the tapped word.
  const tappedTokens = tokenize(tapped);
  if (
    tappedTokens.length === 1 &&
    !termTokens.some((t) => tokensMatch(t, tappedTokens[0]))
  ) {
    return fallback;
  }
  return cleaned;
};

// Picks the saved entry whose phrase appears in the line AND includes the
// tapped word. If several match, the longest (most specific) phrase wins.
export const findEntryForTap = <T extends { term: string }>(
  entries: T[],
  tapped: string,
  line: string,
  occurrence: number = 0,
): T | null => {
  let best: T | null = null;
  let bestLength = 0;
  for (const entry of entries) {
    if (!phraseCoversTap(entry.term, line, tapped, occurrence)) continue;
    const length = tokenize(entry.term).length;
    if (length > bestLength) {
      best = entry;
      bestLength = length;
    }
  }
  return best;
};

// Entries whose phrase contains the tapped word (used for the offline
// "saved from a different form" fallback).
export const findEntriesContainingWord = <T extends { term: string }>(
  entries: T[],
  tapped: string,
): T[] => {
  const tappedTokens = tokenize(tapped);
  if (tappedTokens.length !== 1) return [];
  return entries.filter((entry) =>
    tokenize(entry.term).some((t) => tokensMatch(t, tappedTokens[0])),
  );
};

// How alike two pieces of text are, from 0 (nothing in common) to 1 (same words).
// Ignores case, punctuation and word order. A word that differs by a single
// character (a likely OCR mistake, e.g. "registerd") still counts as the same word,
// but a genuinely different word (e.g. "male" vs "female") does not.
export const tokenSimilarity = (a: string, b: string): number => {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 && tokensB.length === 0) return 1;
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const used = new Array<boolean>(tokensB.length).fill(false);
  let shared = 0;
  for (const tokenA of tokensA) {
    for (let j = 0; j < tokensB.length; j++) {
      if (!used[j] && tokensMatch(tokenA, tokensB[j])) {
        used[j] = true;
        shared++;
        break;
      }
    }
  }
  return shared / (tokensA.length + tokensB.length - shared);
};
