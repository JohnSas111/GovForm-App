import OfflineBanner from "@/components/offline-banner";
import RecentScansList from "@/components/recent-scans-list";
import { getRecentForms, RecentForm } from "@/utils/storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FormsScreen() {
  const [recentForms, setRecentForms] = useState<RecentForm[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadForms();
    }, []),
  );

  const loadForms = async () => {
    const forms = await getRecentForms();
    setRecentForms(forms);
  };

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>Recent Scans</Text>
      </View>
      <RecentScansList recentForms={recentForms} onRefresh={loadForms} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },
});
