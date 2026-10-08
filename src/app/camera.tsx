import AiDictionaryModal from "@/components/ai-dictionary-modal";
import FormSummaryChip from "@/components/form-summary-sheet";
import { HowToUseButton } from "@/components/how-to-use-sheet";
import LargeTextView, {
  ViewMode,
  ViewModeSwitch,
} from "@/components/large-text-view";
import { recognizeForm } from "@/utils/form-recognition";
import {
  getLargeTextSize,
  getOpenInLargeText,
  LargeTextSize,
  saveLargeTextSize,
} from "@/utils/large-text-settings";
import { buildBoxesFromMlKit } from "@/utils/line-context";
import { logEvent } from "@/utils/metrics";
import { getOcrSettings } from "@/utils/ocr-settings";
import { saveRecentForm, updateRecentFormId } from "@/utils/storage";
import { clampPan, fitSize, MAX_ZOOM } from "@/utils/zoom-bounds";
import { Ionicons } from "@expo/vector-icons";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DocumentScanner from "react-native-document-scanner-plugin";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import ExpoBlurDetector from "../../modules/expo-blur-detector/src/ExpoBlurDetectorModule";

export interface BoundingBoxItem {
  id?: string;
  text: string;
  sentence?: string; // the whole text block around the word
  line?: string; // the single line of text the word is on
  occurrence?: number; // 0 = first time this word appears on its line, 1 = second, ...
  group?: number; // same number = same field or phrase (used by the Large text view)
  x: number; // Original image pixel X
  y: number; // Original image pixel Y
  width: number; // Original image pixel width
  height: number; // Original image pixel height
}

export default function CameraOCRScreen() {
  const [capturedImage, setCapturedImage] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Processing document with OCR...",
  );
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBoxItem[]>([]);
  const [selectedWord, setSelectedWord] = useState<BoundingBoxItem | null>(
    null,
  );

  // Photo view (highlights on the picture) or Large text view (big words).
  const [viewMode, setViewMode] = useState<ViewMode>("photo");
  const [textSize, setTextSize] = useState<LargeTextSize>("medium");

  // A new scan opens in Large text only if the person turned that on in Settings.
  const applyLargeTextPreference = async () => {
    setViewMode((await getOpenInLargeText()) ? "text" : "photo");
    setTextSize(await getLargeTextSize());
  };

  const handleChangeTextSize = (size: LargeTextSize) => {
    setTextSize(size);
    saveLargeTextSize(size);
  };
  // Height of the buttons at the top, so the Large text panel starts below them.
  const [topAreaHeight, setTopAreaHeight] = useState(240);

  // Layout container dimensions for accurate coordinate scaling
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  // Guards so the scanner is opened exactly once per request:
  // - hasAutoLaunchedRef: the automatic launch when this screen first appears
  // - scannerBusyRef: blocks a second launch while one is already in progress
  // The saved copy of this scan, so a form the user picks can be saved with it.
  const savedRecentIdRef = useRef<string | null>(null);
  const hasAutoLaunchedRef = useRef(false);
  const scannerBusyRef = useRef(false);

  // Leave this screen and go back to where the user came from.
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // Open the document scanner ONCE when the screen first appears.
  // Any later scan (retry / refresh) is started explicitly by the user.
  useEffect(() => {
    if (hasAutoLaunchedRef.current) return;
    hasAutoLaunchedRef.current = true;
    launchScanner();
  }, []);

  // --- Zoom & Pan Gesture State ---
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Size of the picture on screen and of the viewing area, used to stop the
  // form from being dragged out of its box (see utils/zoom-bounds.ts).
  const boundW = useSharedValue(0);
  const boundH = useSharedValue(0);
  const viewW = useSharedValue(0);
  const viewH = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_ZOOM, Math.max(1, savedScale.value * e.scale));
      // Zooming out can leave the picture off-centre: pull it back inside.
      translateX.value = clampPan(
        translateX.value,
        scale.value,
        boundW.value,
        viewW.value,
      );
      translateY.value = clampPan(
        translateY.value,
        scale.value,
        boundH.value,
        viewH.value,
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        translateX.value = 0;
        translateY.value = 0;
      }
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = clampPan(
          savedTranslateX.value + e.translationX,
          scale.value,
          boundW.value,
          viewW.value,
        );
        translateY.value = clampPan(
          savedTranslateY.value + e.translationY,
          scale.value,
          boundH.value,
          viewH.value,
        );
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Tell the gestures how big the picture and the viewing area are.
  useEffect(() => {
    if (!capturedImage || containerSize.width <= 0 || containerSize.height <= 0)
      return;
    const fit = fitSize(
      capturedImage.width,
      capturedImage.height,
      containerSize.width,
      containerSize.height,
    );
    boundW.value = fit.width;
    boundH.value = fit.height;
    viewW.value = containerSize.width;
    viewH.value = containerSize.height;
  }, [capturedImage, containerSize]);

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const launchScanner = async () => {
    if (scannerBusyRef.current) return;
    scannerBusyRef.current = true;
    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
      });

      if (scannedImages && scannedImages.length > 0) {
        await processImage(scannedImages[0]);
      } else {
        // User cancelled scanning: go back. The scanner does NOT reopen by itself.
        goBack();
      }
    } catch (error) {
      console.error("Scanner error:", error);
      Alert.alert("Scanner Error", "Failed to open document scanner.");
      goBack();
    } finally {
      scannerBusyRef.current = false;
    }
  };

  const processImage = async (uri: string) => {
    const startedAt = Date.now(); // research mode: time from photo to word boxes
    savedRecentIdRef.current = null;
    try {
      setIsProcessing(true);
      setLoadingMessage("Optimizing image...");

      // Resize the image to 1000px width (maintaining aspect ratio) to drastically reduce upload size
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1000 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );

      setCapturedImage({
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
      });

      setLoadingMessage("Checking image quality...");

      const blurScore = await ExpoBlurDetector.getBlurScore(manipResult.uri);

      if (blurScore < 1000.0) {
        logEvent({
          event: "scan_rejected",
          source: "blur",
          ms: Date.now() - startedAt,
          value: String(Math.round(blurScore)),
          detail: "camera",
        });
        Alert.alert(
          "Image Blurry",
          "The image is too blurry. Please hold steady and try again.",
          [
            { text: "Cancel", style: "cancel", onPress: goBack },
            { text: "Try Again", onPress: () => launchScanner() },
          ],
          { cancelable: false },
        );
        setCapturedImage(null);
        setIsProcessing(false);
        return;
      }

      setLoadingMessage("Uploading image...");

      const ocrSettings = await getOcrSettings();
      let data: BoundingBoxItem[] = [];

      if (ocrSettings.mode === "desktop") {
        const url = `http://${ocrSettings.desktopIp}:8000/predict`;
        const response = await FileSystem.uploadAsync(url, manipResult.uri, {
          fieldName: "file",
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        });

        if (response.status === 200) {
          const result = JSON.parse(response.body);
          data = result.boxes.map((box: any) => ({
            text: box.text,
            sentence: box.text, // Fallback to text since Python Tesseract doesn't currently group sentences
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          }));
        } else {
          throw new Error("Desktop OCR failed with status " + response.status);
        }
      } else {
        // Skip Python Server! Process locally with Google ML Kit.
        const result = await TextRecognition.recognize(manipResult.uri);

        // Words, the fields they belong to, and phrases that wrap onto the
        // next line ("DATE OF" / "BIRTH") are worked out from their positions.
        data.push(...buildBoxesFromMlKit(result.blocks));
      }

      setBoundingBoxes(data);
      applyLargeTextPreference();
      logEvent({
        event: "scan",
        source: ocrSettings.mode === "desktop" ? "desktop" : "mlkit",
        ms: Date.now() - startedAt,
        value: String(data.length),
        detail: "camera",
      });

      // Save to recents in the background
      // ...together with the supported form it was recognized as, when the app is sure.
      const recognition = recognizeForm(data);
      saveRecentForm(
        manipResult.uri,
        data,
        recognition.status === "confident" ? recognition.formId : null,
      )
        .then((record) => {
          savedRecentIdRef.current = record?.id ?? null;
        })
        .catch((err) => console.log("Failed to save to recents", err));
    } catch (error) {
      console.error("ML Kit OCR Processing Error:", error);
      logEvent({
        event: "scan_error",
        ms: Date.now() - startedAt,
        detail: "camera",
      });
      Alert.alert(
        "Processing Error",
        "Could not run text recognition locally. Details: " +
          (error instanceof Error ? error.message : String(error)),
        [
          { text: "Cancel", style: "cancel", onPress: goBack },
          { text: "Try Again", onPress: () => launchScanner() },
        ],
        { cancelable: false },
      );
      setCapturedImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset and open the scanner again (explicit user action: refresh button)
  const handleReset = () => {
    setCapturedImage(null);
    setBoundingBoxes([]);
    setSelectedWord(null);
    setIsProcessing(false);
    setLoadingMessage("Processing document with OCR...");

    // Reset zoom state
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;

    launchScanner();
  };

  // Handle Box Tap
  const handleBoxPress = (item: BoundingBoxItem) => {
    setSelectedWord(item);
    console.log("----------------------------------------");
    console.log("📌 TAPPED WORD:", item.text);
    console.log(
      "📖 CONTEXT SENTENCE:",
      item.sentence || "No context sentence provided.",
    );
    console.log("----------------------------------------");
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  return (
    <View style={styles.container}>
      {capturedImage ? (
        <View style={styles.previewContainer} onLayout={handleLayout}>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
              <Image
                source={{ uri: capturedImage.uri }}
                style={styles.fullImage}
                resizeMode="contain"
              />

              {/* Bounding Box Overlay Layer */}
              {containerSize.width > 0 &&
                containerSize.height > 0 &&
                (() => {
                  const containerW = containerSize.width;
                  const containerH = containerSize.height;
                  const imgAspect = capturedImage.width / capturedImage.height;
                  const containerAspect = containerW / containerH;

                  let displayedW = containerW;
                  let displayedH = containerH;
                  let offsetX = 0;
                  let offsetY = 0;

                  if (containerAspect > imgAspect) {
                    displayedW = containerH * imgAspect;
                    offsetX = (containerW - displayedW) / 2;
                  } else {
                    displayedH = containerW / imgAspect;
                    offsetY = (containerH - displayedH) / 2;
                  }

                  const scaleVal = displayedW / capturedImage.width;

                  return boundingBoxes.map((item, index) => {
                    const boxStyle = {
                      left: offsetX + item.x * scaleVal,
                      top: offsetY + item.y * scaleVal,
                      width: item.width * scaleVal,
                      height: item.height * scaleVal,
                    };

                    const isSelected = selectedWord === item;

                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.7}
                        style={[
                          styles.boundingBox,
                          boxStyle,
                          isSelected && styles.selectedBoundingBox,
                        ]}
                        onPress={() => handleBoxPress(item)}
                      />
                    );
                  });
                })()}
            </Animated.View>
          </GestureDetector>

          {/* Large text view: covers the photo, under the buttons at the top */}
          {viewMode === "text" && (
            <View
              style={[styles.largeTextPanel, { paddingTop: topAreaHeight }]}
            >
              <LargeTextView
                boxes={boundingBoxes}
                selectedWord={selectedWord}
                onSelectWord={setSelectedWord}
                size={textSize}
                onChangeSize={handleChangeTextSize}
              />
            </View>
          )}

          {/* Header Controls overlay */}
          <SafeAreaView style={styles.overlayHeader}>
            <TouchableOpacity style={styles.iconButton} onPress={goBack}>
              <Ionicons name="arrow-back" size={26} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleReset}>
              <Ionicons name="refresh" size={26} color="white" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Which supported form this is (tap for its summary) */}
          <SafeAreaView
            pointerEvents="box-none"
            style={styles.formChipArea}
            onLayout={(event) =>
              setTopAreaHeight(event.nativeEvent.layout.height)
            }
          >
            <FormSummaryChip
              boxes={boundingBoxes}
              source="camera"
              onFormChange={(formId) => {
                if (savedRecentIdRef.current)
                  updateRecentFormId(savedRecentIdRef.current, formId);
              }}
            />
            <View style={styles.howToRow}>
              <HowToUseButton section="results" />
            </View>
            <View style={styles.viewModeRow}>
              <ViewModeSwitch mode={viewMode} onChange={setViewMode} />
            </View>
          </SafeAreaView>

          {/* Active Word AI Dictionary Modal */}
          <AiDictionaryModal
            visible={selectedWord !== null}
            wordText={selectedWord ? selectedWord.text : null}
            wordSentence={selectedWord ? selectedWord.sentence : undefined}
            wordLine={selectedWord ? selectedWord.line : undefined}
            wordOccurrence={selectedWord ? selectedWord.occurrence : undefined}
            onClose={() => setSelectedWord(null)}
          />

          {/* Processing Spinner Overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.processingText}>{loadingMessage}</Text>
            </View>
          )}
        </View>
      ) : (
        /* State 2: Waiting/Loading (Native Scanner overlays this) */
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: "white", marginTop: 10 }}>
            Opening Document Scanner...
          </Text>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  boundingBox: {
    position: "absolute",
    backgroundColor: "rgba(33, 130, 222, 0.25)",
    borderWidth: 1,
    borderColor: "#2182DE",
    borderRadius: 3,
  },
  selectedBoundingBox: {
    backgroundColor: "rgba(255, 204, 0, 0.45)",
    borderColor: "#FFCC00",
    borderWidth: 2,
  },
  howToRow: {
    marginTop: 8,
  },
  viewModeRow: {
    marginTop: 8,
    marginBottom: 8,
  },
  largeTextPanel: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#1E1F22",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  formChipArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 62,
    paddingHorizontal: 16,
    zIndex: 9,
  },
  overlayHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },
  processingText: {
    color: "white",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
});
