import AsyncStorage from '@react-native-async-storage/async-storage';

export type OcrMode = 'native' | 'desktop';

const OCR_MODE_KEY = '@govform_ocr_mode';
const OCR_IP_KEY = '@govform_ocr_desktop_ip';

export const getOcrSettings = async (): Promise<{ mode: OcrMode; desktopIp: string }> => {
  try {
    const mode = await AsyncStorage.getItem(OCR_MODE_KEY);
    const ip = await AsyncStorage.getItem(OCR_IP_KEY);
    return {
      mode: (mode as OcrMode) || 'native',
      desktopIp: ip || '192.168.137.1',
    };
  } catch (e) {
    console.error('Failed to fetch OCR settings', e);
    return { mode: 'native', desktopIp: '192.168.137.1' };
  }
};

export const saveOcrMode = async (mode: OcrMode) => {
  try {
    await AsyncStorage.setItem(OCR_MODE_KEY, mode);
  } catch (e) {
    console.error('Failed to save OCR mode', e);
  }
};

export const saveDesktopIp = async (ip: string) => {
  try {
    await AsyncStorage.setItem(OCR_IP_KEY, ip);
  } catch (e) {
    console.error('Failed to save desktop IP', e);
  }
};
