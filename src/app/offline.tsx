import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRecentForms, RecentForm } from '@/utils/storage';
import RecentScansList from '@/components/recent-scans-list';

export default function OfflineScreen() {
  const [recentForms, setRecentForms] = useState<RecentForm[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadForms();
    }, [])
  );

  const loadForms = async () => {
    const forms = await getRecentForms();
    setRecentForms(forms);
  };

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const state = await Network.getNetworkStateAsync();
      if (state.isConnected) {
        // Redirect to the main app if connection is restored
        router.replace('/(tabs)');
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-offline-outline" size={48} color="#FF3B30" />
        <Text style={styles.title}>You are Offline</Text>
        <Text style={styles.subtitle}>
          The AI features require an internet connection, but you can still view your previously saved scans below.
        </Text>
        
        <TouchableOpacity 
          style={[styles.retryButton, isChecking && styles.retryButtonDisabled]} 
          onPress={checkConnection}
          disabled={isChecking}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryText}>
            {isChecking ? "Checking..." : "Retry Connection"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <RecentScansList recentForms={recentForms} onRefresh={loadForms} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2182DE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    marginTop: 16,
  },
});
