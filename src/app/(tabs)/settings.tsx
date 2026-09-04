import { LanguageKey } from '@/constants/translations';
import { useLocalization } from '@/context/LocalizationContext';
import { getOcrSettings, OcrMode, saveDesktopIp, saveOcrMode } from '@/utils/ocr-settings';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LANGUAGES: LanguageKey[] = ["English", "Tagalog", "Cebuano"];

export default function SettingsScreen() {
  const { language, setLanguage, t } = useLocalization();

  const [ocrMode, setOcrMode] = useState<OcrMode>('native');
  const [desktopIp, setDesktopIp] = useState('192.168.137.1');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getOcrSettings();
      setOcrMode(settings.mode);
      setDesktopIp(settings.desktopIp);
    };
    loadSettings();
  }, []);

  const handleModeChange = (mode: OcrMode) => {
    setOcrMode(mode);
    saveOcrMode(mode);
  };

  const handleIpChange = (ip: string) => {
    setDesktopIp(ip);
    saveDesktopIp(ip);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('nav_settings')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sectionTitle')}</Text>
          <View style={styles.card}>
            {LANGUAGES.map((lang, index) => {
              const isSelected = language === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageOption,
                    index !== LANGUAGES.length - 1 && styles.borderBottom
                  ]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={styles.languageText}>{lang}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#2182DE" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OCR Engine</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.languageOption, styles.borderBottom]}
              onPress={() => handleModeChange('native')}
            >
              <Text style={styles.languageText}>Native ML-Kit (Fast, Offline)</Text>
              {ocrMode === 'native' && (
                <Ionicons name="checkmark-circle" size={24} color="#2182DE" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => handleModeChange('desktop')}
            >
              <Text style={styles.languageText}>Desktop Tesseract (Custom)</Text>
              {ocrMode === 'desktop' && (
                <Ionicons name="checkmark-circle" size={24} color="#2182DE" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {ocrMode === 'desktop' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desktop IP Address</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.textInput}
                value={desktopIp}
                onChangeText={handleIpChange}
                placeholder="e.g. 192.168.137.1"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.helperText}>
              Ensure your computer is running the local_ocr_server.py script and your phone is on the same network or mobile hotspot.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
    marginLeft: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageText: {
    fontSize: 16,
    color: '#000',
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    paddingVertical: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    marginLeft: 8,
    lineHeight: 18,
  },
});
