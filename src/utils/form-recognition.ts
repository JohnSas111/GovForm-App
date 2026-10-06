// Works out WHICH of the supported forms was scanned, using only the text the OCR
// read. No AI and no internet: each dictionary term found on the page "votes" for
// the forms it belongs to (a term used on one form votes strongly, a term used on
// all seven votes weakly), and a few strong clues (the form title, reference
// numbers such as BReN / DReN / MReN) add extra weight.
//
// The result is one of:
//   confident : one form is clearly ahead
//   unsure    : two or three forms are close (usually the three PSA forms)
//   unknown   : not enough evidence, so the form is probably not one of the 7
import dictionaryData from "@/data/bisaya-dictionary.json";
import { getForms } from "@/utils/form-summaries";
import { GENERIC_TERMS } from "@/utils/glossary";
import {
  containsAllWords,
  containsPhrase,
  tokenize,
  tokensMatch,
} from "@/utils/phrase-match";

export type RecognitionStatus = "confident" | "unsure" | "unknown";

export interface FormScore {
  formId: string;
  score: number; // total weighted evidence
  specific: number; // how many found terms belong to only one or two forms
  cueHits: number; // how many title / reference-number clues were found
}

export interface FormRecognition {
  status: RecognitionStatus;
  formId: string | null; // set only when confident
  candidates: string[]; // best guesses, best first (set when unsure)
  scores: FormScore[]; // every form, best first
}

// Tuning values (checked against simulated scans; real photos may need small changes)
export const RECOGNITION_SETTINGS = {
  CUE_BONUS: 2, // extra score for each title / reference-number clue found
  MIN_SPECIFIC: 5, // need this many form-specific terms (or one clue) to say anything
  MIN_SCORE: 2, // and at least this much total evidence
  CONFIDENT_RATIO: 2.0, // without a title clue, the best must beat the runner-up by this factor
  CONFIDENT_RATIO_WITH_CLUE: 1.4, // with MORE title clues than the runner-up, a smaller lead is enough
  UNSURE_RATIO: 0.6, // forms scoring at least this share of the best are offered as candidates
  MAX_CANDIDATES: 3,
  LONG_TERM_MIN_TOKENS: 5, // long statements may wrap over printed lines
};

interface DictionaryTerm {
  tokens: string[];
  generic: boolean;
  long: boolean;
  formIds: string[];
  weight: number;
  specific: boolean;
}

let cachedTerms: DictionaryTerm[] | null = null;

const getTerms = (): DictionaryTerm[] => {
  if (cachedTerms) return cachedTerms;
  const idByName = new Map(getForms().map((f) => [f.form_name, f.id]));
  const terms: DictionaryTerm[] = [];
  for (const entry of dictionaryData as Array<{
    word: string;
    applicable_forms?: string[];
  }>) {
    const formIds = (entry.applicable_forms ?? [])
      .map((name) => idByName.get(name))
      .filter((id): id is string => !!id);
    const tokens = tokenize(entry.word);
    if (tokens.length === 0 || formIds.length === 0) continue;
    terms.push({
      tokens,
      generic: GENERIC_TERMS.has(tokens.join(" ")),
      long: tokens.length >= RECOGNITION_SETTINGS.LONG_TERM_MIN_TOKENS,
      formIds,
      weight: 1 / formIds.length,
      specific: formIds.length <= 2,
    });
  }
  cachedTerms = terms;
  return terms;
};

// "12. Date" -> "date" (leading numbering ignored for whole-line terms)
const stripNumbering = (tokens: string[]): string[] => {
  let t = tokens;
  while (t.length > 1 && /^(\d+|[a-z])$/.test(t[0])) t = t.slice(1);
  return t;
};

export interface RecognizableBox {
  line?: string;
  sentence?: string;
  text?: string;
}

export const recognizeForm = (boxes: RecognizableBox[]): FormRecognition => {
  const forms = getForms();
  const S = RECOGNITION_SETTINGS;

  // The distinct printed lines and text blocks the OCR found.
  const lines = new Set<string>();
  const blocks = new Set<string>();
  for (const box of boxes) {
    const line = box.line?.trim() || box.sentence?.trim() || box.text?.trim();
    if (line) lines.add(line);
    if (box.sentence?.trim()) blocks.add(box.sentence.trim());
  }
  const lineTokens = [...lines].map(tokenize).filter((t) => t.length > 0);
  const blockTokens = [...blocks].map(tokenize).filter((t) => t.length > 0);
  const wholeLines = lineTokens.map(stripNumbering);

  const score: Record<string, FormScore> = {};
  for (const f of forms)
    score[f.id] = { formId: f.id, score: 0, specific: 0, cueHits: 0 };

  if (lineTokens.length > 0) {
    // 1. Dictionary terms found on the page vote for their forms.
    for (const term of getTerms()) {
      let found: boolean;
      if (term.generic) {
        found = wholeLines.some(
          (l) =>
            l.length === term.tokens.length &&
            term.tokens.every((tok, i) => tokensMatch(l[i], tok)),
        );
      } else {
        found = lineTokens.some((l) => containsPhrase(l, term.tokens));
        if (!found && term.long)
          found = blockTokens.some((b) => containsPhrase(b, term.tokens));
      }
      if (!found) continue;
      for (const id of term.formIds) {
        score[id].score += term.weight;
        if (term.specific) score[id].specific += 1;
      }
    }

    // 2. Strong clues (title words, reference numbers) add extra weight.
    for (const f of forms) {
      for (const group of f.cues) {
        // A clue must sit on ONE printed line, so words from neighbouring fields
        // ("Date of Birth" next to "Certificate") are never mistaken for a title.
        const hit = lineTokens.some((l) => containsAllWords(l, group));
        if (hit) {
          score[f.id].cueHits += 1;
          score[f.id].score += S.CUE_BONUS;
        }
      }
    }
  }

  const ranked = Object.values(score).sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const second = ranked[1];

  const hasEvidence =
    !!top &&
    (top.cueHits > 0 || top.specific >= S.MIN_SPECIFIC) &&
    top.score >= S.MIN_SCORE;
  if (!hasEvidence) {
    return { status: "unknown", formId: null, candidates: [], scores: ranked };
  }
  const ratio =
    top.cueHits > second.cueHits
      ? S.CONFIDENT_RATIO_WITH_CLUE
      : S.CONFIDENT_RATIO;
  if (!second || top.score >= ratio * second.score) {
    return {
      status: "confident",
      formId: top.formId,
      candidates: [top.formId],
      scores: ranked,
    };
  }
  const candidates = ranked
    .filter((r) => r.score >= S.UNSURE_RATIO * top.score)
    .slice(0, S.MAX_CANDIDATES)
    .map((r) => r.formId);
  return { status: "unsure", formId: null, candidates, scores: ranked };
};
