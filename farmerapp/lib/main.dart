import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/theme/app_theme.dart';
import 'screens/main_shell.dart';
import 'screens/auth/login_screen.dart';
import 'screens/documents/documents_screen.dart';
import 'services/farmer_state.dart';
import 'services/api_service.dart';

final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();
final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarDividerColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  await ApiService().init();
  await FarmerState().initPreferences();

  // Listen for real-time document verification notifications from vendor
  FarmerState().onDocumentStatusChanged = (doc) {
    final isApproved = doc.status == 'approved';
    rootScaffoldMessengerKey.currentState?.hideCurrentSnackBar();
    rootScaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        backgroundColor: isApproved ? const Color(0xFF15803D) : const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 6),
        content: Row(
          children: [
            Icon(
              isApproved ? Icons.verified_rounded : Icons.warning_amber_rounded,
              color: Colors.white,
              size: 24,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isApproved
                        ? 'कागदपत्र मंजूर ✓ (${doc.title})'
                        : 'कागदपत्र अमान्य ❌ (${doc.title})',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isApproved
                        ? 'व्हेंडरने तुमचे कागदपत्र मंजूर केले आहे.'
                        : (doc.rejectionReason.isNotEmpty ? 'कारण: ${doc.rejectionReason}' : 'कृपया पुन्हा अपलोड करा.'),
                    style: const TextStyle(fontSize: 11, color: Colors.white70),
                  ),
                ],
              ),
            ),
          ],
        ),
        action: SnackBarAction(
          label: 'पहा',
          textColor: Colors.amberAccent,
          onPressed: () {
            final ctx = rootNavigatorKey.currentContext;
            if (ctx != null) {
              Navigator.push(ctx, MaterialPageRoute(builder: (_) => const DocumentsScreen()));
            }
          },
        ),
      ),
    );
  };

  runApp(const FarmerApp());
}

class FarmerApp extends StatelessWidget {
  const FarmerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GreenGrocc Farmer',
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: rootScaffoldMessengerKey,
      navigatorKey: rootNavigatorKey,
      theme: AppTheme.lightTheme,
      home: const _SessionGate(),
    );
  }
}

/// Switches login and home only when the session changes.
/// Data refreshes must not rebuild the whole shell.
class _SessionGate extends StatefulWidget {
  const _SessionGate();

  @override
  State<_SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<_SessionGate> {
  late bool _loggedIn;

  @override
  void initState() {
    super.initState();
    _loggedIn = FarmerState().isLoggedIn;
    FarmerState().addListener(_onFarmerState);
  }

  @override
  void dispose() {
    FarmerState().removeListener(_onFarmerState);
    super.dispose();
  }

  void _onFarmerState() {
    final next = FarmerState().isLoggedIn;
    if (next == _loggedIn || !mounted) return;
    setState(() => _loggedIn = next);
  }

  @override
  Widget build(BuildContext context) {
    return _loggedIn ? const MainShell() : const LoginScreen();
  }
}
