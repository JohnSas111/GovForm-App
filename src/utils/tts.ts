import { LanguageKey } from "@/constants/translations";
import * as Speech from "expo-speech";
import { AppState, AppStateStatus } from "react-native";

/**
 * Text-to-speech is kept in one utility so every screen uses the same
 * lifecycle, locale mapping, and error handling.
 *
 * Cebuano does not have a consistently available native voice on mobile
 * operating systems, so Filipino is used as the closest built-in fallback.
 */
const LANGUAGE_TO_SPEECH_LOCALES: Record<LanguageKey, string[]> = {
  English: ["en-US", "en"],
  Tagalog: ["fil-PH", "fil"],
  Cebuano: ["fil-PH", "fil"],
};

interface SpeakOptions {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
}

interface CachedVoice {
  identifier: string;
  language: string;
}

let currentUtteranceId = 0;
let appStateSubscription: { remove: () => void } | null = null;

/**
 * Cache voices after the first lookup.
 *
 * getAvailableVoicesAsync() can be relatively slow on Android, especially
 * the first time it is called. Caching prevents that delay on every tap.
 */
let cachedVoices: CachedVoice[] | null = null;
let voicesLoadingPromise: Promise<CachedVoice[]> | null = null;

function stopForLifecycle() {
  // Speech.stop() is intentionally fire-and-forget here. Lifecycle handlers
  // must never throw if the native speech engine is unavailable.
  Speech.stop().catch(() => undefined);
}

function ensureLifecycleListener() {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener(
    "change",
    (state: AppStateStatus) => {
      if (state !== "active") {
        currentUtteranceId += 1;
        stopForLifecycle();
      }
    },
  );
}

/**
 * Loads available voices once and reuses them.
 */
async function getCachedVoices(): Promise<CachedVoice[]> {
  if (cachedVoices) {
    return cachedVoices;
  }

  if (voicesLoadingPromise) {
    return voicesLoadingPromise;
  }

  voicesLoadingPromise = Speech.getAvailableVoicesAsync()
    .then((voices) => {
      cachedVoices = voices.map((voice) => ({
        identifier: voice.identifier,
        language: voice.language,
      }));

      return cachedVoices;
    })
    .catch(() => {
      cachedVoices = [];
      return [];
    })
    .finally(() => {
      voicesLoadingPromise = null;
    });

  return voicesLoadingPromise;
}

async function getAvailableVoice(
  language: LanguageKey,
): Promise<CachedVoice | null> {
  try {
    const voices = await getCachedVoices();
    const locales = LANGUAGE_TO_SPEECH_LOCALES[language] ?? ["en-US", "en"];

    // Prefer an exact locale, then a language-family match.
    return (
      voices.find((voice) =>
        locales.some(
          (locale) => voice.language.toLowerCase() === locale.toLowerCase(),
        ),
      ) ??
      voices.find((voice) =>
        locales.some((locale) =>
          voice.language
            .toLowerCase()
            .startsWith(locale.split("-")[0].toLowerCase()),
        ),
      ) ??
      null
    );
  } catch {
    // Voice discovery is best-effort. Speech.speak can still ask the OS
    // for the requested language directly.
    return null;
  }
}

/**
 * Cebuano is currently spoken using the Filipino Android TTS voice.
 *
 * The Filipino voice can interpret the Cebuano word "usa" incorrectly.
 * This is deliberately limited to Cebuano and whole-word matches so
 * English and Tagalog text are not modified.
 *
 * "oo-sa" gives the Filipino TTS engine a pronunciation closer to the
 * Cebuano word "usa" ("one").
 */
function prepareCebuanoPronunciation(text: string): string {
  if (!text) return text;

  return text.replace(/\busa\b/gi, "oo-sa");
}

/**
 * Adds a natural pause between the definition and the context sentence.
 *
 * Android TTS does not provide a reliable exact millisecond pause inside
 * one utterance. A sentence boundary gives the speech engine a natural
 * pause without requiring multiple Speech.speak() calls.
 */
function prepareSpeechText(text: string, language: LanguageKey): string {
  let prepared = text;

  if (language === "Cebuano") {
    prepared = prepareCebuanoPronunciation(prepared);
  }

  /**
   * Strengthen the pause after the first sentence.
   *
   * The AI Dictionary currently builds speech text from the definition
   * followed by the example/context sentence. A semicolon plus period
   * encourages Android TTS to pause before continuing.
   *
   * We only modify the first sentence boundary.
   */
  const firstSentenceMatch = prepared.match(/^(.+?[.!?])\s+(.+)$/);

  if (firstSentenceMatch) {
    const [, firstSentence, remainingText] = firstSentenceMatch;

    prepared = `${firstSentence}  ${remainingText}`;
  }

  return prepared.replace(/\s+/g, " ").trim();
}

/**
 * Speaks text using the selected application language.
 *
 * Returns a promise so callers can keep UI state synchronized with the
 * native speech engine. Only the latest utterance is allowed to update
 * callbacks.
 */
export async function speakText(
  text: string,
  language: LanguageKey,
  options: SpeakOptions = {},
): Promise<boolean> {
  const cleaned = text?.replace(/\s+/g, " ").trim();

  if (!cleaned) return false;

  const utteranceId = ++currentUtteranceId;
  ensureLifecycleListener();

  try {
    /**
     * Only stop speech if something is actually speaking.
     *
     * Calling Speech.stop() every time adds an unnecessary native bridge
     * operation and can contribute to startup delay.
     */
    const currentlySpeaking = await Speech.isSpeakingAsync().catch(() => false);

    if (currentlySpeaking) {
      await Speech.stop().catch(() => undefined);
    }

    /**
     * Voice discovery is cached, so after the first call we don't have to
     * wait for getAvailableVoicesAsync() again.
     */
    const voice = await getAvailableVoice(language);

    const locale = LANGUAGE_TO_SPEECH_LOCALES[language]?.[0] ?? "en-US";

    const speechText = prepareSpeechText(cleaned, language);

    /**
     * Some Android TTS engines expose a voice identifier but fail when that
     * specific voice is passed to Speech.speak(). We therefore try the
     * discovered voice first, then retry using only the locale.
     */
    const speakOnce = async (voiceIdentifier?: string): Promise<void> => {
      await new Promise<void>((resolve, reject) => {
        Speech.speak(speechText, {
          language: locale,
          ...(voiceIdentifier ? { voice: voiceIdentifier } : {}),
          pitch: 1.0,

          /**
           * Slightly faster than the previous 0.92 setting.
           *
           * This mainly helps reduce perceived waiting time while keeping
           * the speech understandable.
           */
          rate: language === "English" ? 0.98 : 0.92,

          volume: 1.0,

          onStart: () => {
            if (utteranceId === currentUtteranceId) {
              options.onStart?.();
            }
          },

          onDone: () => {
            if (utteranceId === currentUtteranceId) {
              options.onDone?.();
            }

            resolve();
          },

          onStopped: () => {
            if (utteranceId === currentUtteranceId) {
              options.onDone?.();
            }

            resolve();
          },

          onError: (error) => {
            reject(error);
          },
        });
      });
    };

    try {
      /**
       * First attempt: use the detected Android voice.
       */
      await speakOnce(voice?.identifier);
    } catch (firstError) {
      /**
       * If a specific voice caused the failure, retry without the voice ID.
       * This lets Android choose the default voice for the locale.
       */
      if (!voice?.identifier) {
        throw firstError;
      }

      await Speech.stop().catch(() => undefined);

      await speakOnce();
    }

    return true;
  } catch (error) {
    if (utteranceId === currentUtteranceId) {
      options.onError?.(error);
    }

    return false;
  }
}

export function stopSpeaking(): void {
  currentUtteranceId += 1;
  stopForLifecycle();
}

export async function isSpeakingNow(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
