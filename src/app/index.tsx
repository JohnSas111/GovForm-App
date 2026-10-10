import { checkIsOffline } from "@/utils/connectivity";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  // Make sure we leave this screen only once (the timer AND a tap can both fire).
  const hasNavigatedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scanning needs internet. Without it the person sees the offline screen,
  // from where they can open their saved scans or try the connection again.
  const checkLanguageAndNavigate = async () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      const lang = await SecureStore.getItemAsync("selectedLanguage");
      if (lang) {
        if (await checkIsOffline()) {
          router.replace("/offline" as any);
        } else {
          router.replace("/(tabs)" as any);
        }
      } else {
        router.replace("/language" as any);
      }
    } catch (e) {
      router.replace("/language" as any);
    }
  };

  // Auto-navigate to appropriate screen after 2.5 seconds
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      checkLanguageAndNavigate();
    }, 2500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.content} onPress={checkLanguageAndNavigate}>
        <Text style={styles.title}>Hello Welcome</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#000000",
    fontSize: 32,
    fontWeight: "bold",
  },
});
