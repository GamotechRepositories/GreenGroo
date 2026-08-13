import 'dart:io';

String getPlatformApiHost(String baseUrl) {
  if (Platform.isAndroid) {
    // Android emulator: 127.0.0.1 and localhost both map to the emulator itself.
    // Use 10.0.2.2 to reach the host machine instead.
    return baseUrl
        .replaceFirst(RegExp(r'^http://127\.0\.0\.1'), 'http://10.0.2.2')
        .replaceFirst(RegExp(r'^http://localhost'), 'http://10.0.2.2');
  }
  return baseUrl;
}
