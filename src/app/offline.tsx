// Shown when the app is opened without internet. Scanning needs internet, so
// the person can either open their saved scans or try the connection again.
import { useLocalization } from "@/context/LocalizationContext";
import { checkIsOffline } from "@/utils/connectivity";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OfflineScreen() {
  const { t } = useLocalization();
  const [isChecking, setIsChecking] = useState(false);
  const [stillOffline, setStillOffline] = useState(false);

  const openHistory = () => {
    router.replace("/(tabs)/forms" as any);
  };

  const tryAgain = async () => {
    setIsChecking(true);
    setStillOffline(false);
    try {
      if (await checkIsOffline()) {
        setStillOffline(true);
      } else {
        router.replace("/(tabs)" as any);
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={72} color="#B26A00" />
        <Text style={styles.title}>{t("offline_title")}</Text>
        <Text style={styles.message}>{t("offline_message")}</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={openHistory}
          accessibilityRole="button"
        >
          <Ionicons name="time-outline" size={22} color="white" />
          <Text style={styles.primaryText}>{t("offline_go_history")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, isChecking && styles.disabled]}
          onPress={tryAgain}
          disabled={isChecking}
          accessibilityRole="button"
        >
          <Ionicons name="refresh" size={20} color="#2182DE" />
          <Text style={styles.secondaryText}>
            {isChecking ? t("offline_checking") : t("offline_try_again")}
          </Text>
        </TouchableOpacity>

        {stillOffline && <Text style={styles.still}>{t("offline_still")}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#111", marginTop: 8 },
  message: {
    fontSize: 17,
    color: "#444",
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2182DE",
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: 24,
    alignSelf: "stretch",
  },
  primaryText: { color: "white", fontSize: 18, fontWeight: "700" },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#2182DE",
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 24,
    alignSelf: "stretch",
    backgroundColor: "white",
  },
  secondaryText: { color: "#2182DE", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  still: { color: "#B26A00", fontSize: 15, textAlign: "center" },
});
