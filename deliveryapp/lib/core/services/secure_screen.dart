import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// Blocks screenshots and screen recording (Android FLAG_SECURE) while any
/// [SecureScreen] is mounted, so riders can't capture customer phone numbers
/// or addresses.
class SecureScreen extends StatefulWidget {
  const SecureScreen({super.key, required this.child});

  final Widget child;

  static const _channel = MethodChannel('greenrow/secure_screen');
  static int _holders = 0;

  static bool get _supported =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  static Future<void> _apply(bool secure) async {
    if (!_supported) return;
    try {
      await _channel.invokeMethod<void>(secure ? 'enable' : 'disable');
    } catch (e) {
      debugPrint('[SecureScreen] $e');
    }
  }

  @override
  State<SecureScreen> createState() => _SecureScreenState();
}

class _SecureScreenState extends State<SecureScreen> {
  @override
  void initState() {
    super.initState();
    if (SecureScreen._holders++ == 0) SecureScreen._apply(true);
  }

  @override
  void dispose() {
    if (--SecureScreen._holders == 0) SecureScreen._apply(false);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
