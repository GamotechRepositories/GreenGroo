import 'package:flutter/foundation.dart';
import 'package:image_picker_android/image_picker_android.dart';
import 'package:image_picker_platform_interface/image_picker_platform_interface.dart';

/// Forces Android Photo Picker for gallery picks on all supported API levels.
///
/// Android 13+ already defaults to Photo Picker in `image_picker`. Enabling it
/// explicitly also covers Android 11–12 (and backported picker devices), so the
/// app never needs READ_MEDIA_IMAGES / READ_MEDIA_VIDEO.
void configureAndroidPhotoPicker() {
  if (kIsWeb) return;

  final implementation = ImagePickerPlatform.instance;
  if (implementation is ImagePickerAndroid) {
    implementation.useAndroidPhotoPicker = true;
  }
}
