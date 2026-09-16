import { registerWebModule, NativeModule } from 'expo';

class ExpoBlurDetectorModule extends NativeModule<{}> {}

export default registerWebModule(ExpoBlurDetectorModule, 'ExpoBlurDetectorModule');
