import { useLocalization } from "@/context/LocalizationContext";
import { defineWordWithLLM, LLMResponse } from "@/utils/llm";
import { speakText, stopSpeaking } from "@/utils/tts";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AiDictionaryModalProps {
  visible: boolean;
  wordText: string | null;
  wordSentence: string | undefined;
  onClose: () => void;
}

export default function AiDictionaryModal({
  visible,
  wordText,
  wordSentence,
  onClose,
}: AiDictionaryModalProps) {
  const { language } = useLocalization();

  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [llmResult, setLlmResult] = useState<LLMResponse | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const fetchDefinition = async () => {
      if (!visible || !wordText) return;

      stopSpeaking();
      setIsSpeaking(false);
      setLlmResult(null);
      setLlmError(null);
      setIsLlmLoading(true);

      try {
        const result = await defineWordWithLLM(
          wordText,
          wordSentence,
          language,
        );
        setLlmResult(result);
      } catch (err: any) {
        setLlmError(
          err.message ||
            "Failed to connect to Gemini Flash 3.6. Make sure your device has internet connection.",
        );
      } finally {
        setIsLlmLoading(false);
      }
    };

    fetchDefinition();
  }, [visible, wordText, wordSentence, language]);

  // Stop any in-progress speech whenever the modal is hidden or unmounted,
  // so audio never keeps playing after the user leaves the dictionary.
  useEffect(() => {
    if (!visible) {
      stopSpeaking();
      setIsSpeaking(false);
    }
    return () => stopSpeaking();
  }, [visible]);

  const handleClose = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setLlmResult(null);
    setLlmError(null);
    onClose();
  };

  // Builds the same definition text currently shown on screen (matching
  // the selected language section below) so the "listen" button always
  // reads exactly what the user is looking at.
  const getSpeakableText = (): string => {
    if (!wordText || !llmResult) return "";

    const langData =
      language === "English"
        ? llmResult.english
        : language === "Tagalog"
          ? llmResult.tagalog
          : language === "Cebuano"
            ? llmResult.bisaya
            : undefined;

    if (langData?.definition) {
      const sentence = langData.example_sentence || llmResult.context_sentence;
      return [wordText, langData.definition, sentence]
        .filter(Boolean)
        .join(". ");
    }

    // Fallback for unexpected response shapes: read whatever definition
    // text is available.
    const fallbackEntry = Object.values(llmResult).find(
      (value): value is { definition: string } =>
        typeof value === "object" && value !== null && "definition" in value,
    );
    return [wordText, fallbackEntry?.definition].filter(Boolean).join(". ");
  };

  const handleSpeakToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = getSpeakableText();
    if (!textToSpeak) return;

    setIsSpeaking(true);
    speakText(textToSpeak, language, {
      onDone: () => setIsSpeaking(false),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Dictionary</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {wordText && (
            <View style={styles.selectedWordRow}>
              <Text style={styles.selectedWord}>"{wordText}"</Text>
              {llmResult && (
                <TouchableOpacity
                  onPress={handleSpeakToggle}
                  style={styles.speakButton}
                  accessibilityLabel={
                    isSpeaking
                      ? "Stop reading definition aloud"
                      : "Read definition aloud"
                  }
                >
                  <Ionicons
                    name={isSpeaking ? "volume-mute" : "volume-high"}
                    size={22}
                    color="#2182DE"
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {isLlmLoading && (
            <View style={styles.llmLoadingContainer}>
              <ActivityIndicator size="large" color="#2182DE" />
              <Text style={styles.loadingText}>Asking Gemini Flash 3.6...</Text>
            </View>
          )}

          {llmError && (
            <ScrollView style={styles.errorContainer}>
              <Ionicons
                name="warning-outline"
                size={32}
                color="#FF3B30"
                style={{ alignSelf: "center", marginBottom: 8 }}
              />
              <Text style={styles.errorTitle}>Connection Error</Text>
              <Text style={styles.errorTextDetails}>{llmError}</Text>
            </ScrollView>
          )}

          {llmResult && (
            <ScrollView
              style={styles.resultContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Context Sentence */}
              {(() => {
                let displaySentence = llmResult.context_sentence;
                let isOriginal = true;

                if (
                  language === "Tagalog" &&
                  llmResult.tagalog?.example_sentence
                ) {
                  displaySentence = llmResult.tagalog.example_sentence;
                  isOriginal = false;
                } else if (
                  language === "Cebuano" &&
                  llmResult.bisaya?.example_sentence
                ) {
                  displaySentence = llmResult.bisaya.example_sentence;
                  isOriginal = false;
                } else if (
                  language === "English" &&
                  llmResult.english?.example_sentence
                ) {
                  displaySentence = llmResult.english.example_sentence;
                  isOriginal = false;
                }

                if (!displaySentence) return null;

                return (
                  <>
                    <Text
                      style={[
                        styles.sectionTitle,
                        {
                          fontSize: 13,
                          color: "#888",
                          marginBottom: 4,
                          marginTop: 0,
                        },
                      ]}
                    >
                      {isOriginal
                        ? "Original Text from Document"
                        : "Context Sentence"}
                    </Text>
                    <Text style={styles.contextSentence}>
                      "{displaySentence}"
                    </Text>
                    <View style={styles.divider} />
                  </>
                );
              })()}

              {/* English Section */}
              {language === "English" && llmResult.english && (
                <>
                  <Text style={styles.sectionTitle}>English</Text>
                  <Text style={styles.resultText}>
                    {llmResult.english.definition}
                  </Text>
                  {llmResult.english.synonyms &&
                    llmResult.english.synonyms.length > 0 && (
                      <Text style={styles.synonymsText}>
                        Synonyms: {llmResult.english.synonyms.join(", ")}
                      </Text>
                    )}
                  <View style={styles.divider} />
                </>
              )}

              {/* Tagalog Section */}
              {language === "Tagalog" && llmResult.tagalog && (
                <>
                  <Text style={styles.sectionTitle}>Tagalog</Text>
                  <Text style={styles.resultText}>
                    {llmResult.tagalog.definition}
                  </Text>
                  {llmResult.tagalog.synonyms &&
                    llmResult.tagalog.synonyms.length > 0 && (
                      <Text style={styles.synonymsText}>
                        Synonyms: {llmResult.tagalog.synonyms.join(", ")}
                      </Text>
                    )}
                </>
              )}

              {/* Bisaya / Cebuano Section */}
              {language === "Cebuano" && llmResult.bisaya && (
                <>
                  <Text style={styles.sectionTitle}>Cebuano</Text>
                  <Text style={styles.resultText}>
                    {llmResult.bisaya.definition}
                  </Text>
                  {llmResult.bisaya.synonyms &&
                    llmResult.bisaya.synonyms.length > 0 && (
                      <Text style={styles.synonymsText}>
                        Synonyms: {llmResult.bisaya.synonyms.join(", ")}
                      </Text>
                    )}
                </>
              )}

              {/* Fallback for when the model returns an unexpected format */}
              {!llmResult.english &&
                !llmResult.tagalog &&
                !llmResult.bisaya && (
                  <View>
                    {Object.entries(llmResult).map(([key, value]) => {
                      if (key === "word" || key === "context_sentence")
                        return null;

                      const isStructured =
                        typeof value === "object" &&
                        value !== null &&
                        "definition" in value;

                      return (
                        <View key={key} style={{ marginBottom: 16 }}>
                          <Text style={styles.sectionTitle}>{key}</Text>
                          {isStructured ? (
                            <View>
                              <Text style={styles.resultText}>
                                {(value as any).definition}
                              </Text>
                              {(value as any).synonyms &&
                                (value as any).synonyms.length > 0 && (
                                  <Text style={styles.synonymsText}>
                                    Synonyms:{" "}
                                    {(value as any).synonyms.join(", ")}
                                  </Text>
                                )}
                            </View>
                          ) : (
                            <Text style={styles.resultText}>
                              {typeof value === "string"
                                ? value
                                : JSON.stringify(value)}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: "50%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  selectedWordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  selectedWord: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2182DE",
    textAlign: "center",
  },
  speakButton: {
    marginLeft: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#EAF3FC",
  },
  llmLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  resultContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 8,
  },
  contextSentence: {
    fontSize: 18,
    fontStyle: "italic",
    color: "#444",
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  synonymsText: {
    fontSize: 14,
    color: "#2182DE",
    fontWeight: "500",
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#EAEAEA",
    marginVertical: 20,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 8,
  },
  errorTextDetails: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    lineHeight: 20,
  },
});
