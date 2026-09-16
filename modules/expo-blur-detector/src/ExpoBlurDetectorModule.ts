import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoBlurDetectorModule extends NativeModule {
  getBlurScore(imageUri: string): Promise<number>;
}

export default requireNativeModule<ExpoBlurDetectorModule>('ExpoBlurDetector');
