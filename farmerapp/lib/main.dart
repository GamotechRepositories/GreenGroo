import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/theme/app_theme.dart';
import 'screens/main_shell.dart';
import 'screens/auth/login_screen.dart';
import 'screens/documents/documents_screen.dart';
import 'screens/splash/splash_screen.dart';
import 'models/farmer_models.dart';
import 'services/farmer_state.dart';
import 'services/api_service.dart';
import 'services/app_language.dart';
import 'services/push_notification_service.dart';

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
  await AppLanguage().init();
  runApp(const FarmerApp());
}

/// Runs behind the animated splash. FarmerState must be created only after
/// ApiService has resolved the backend host, because its constructor starts a sync.
Future<void> _initializeApp() async {
  await ApiService().init();
  await FarmerState().initPreferences();
  // Listen for real-time document verification notifications from vendor
  FarmerState().onDocumentStatusChanged = _showDocumentStatusSnackBar;
  // Not awaited: the permission prompt must not hold the splash screen.
  PushNotificationService.instance.init(navigatorKey: rootNavigatorKey);
}

void _showDocumentStatusSnackBar(DocumentItem doc) {
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
                      ? AppLanguage().tr(mr: 'कागदपत्र मंजूर ✓ (${doc.displayTitle})', en: 'Document approved ✓ (${doc.displayTitle})')
                      : AppLanguage().tr(mr: 'कागदपत्र अमान्य ❌ (${doc.displayTitle})', en: 'Document rejected ❌ (${doc.displayTitle})'),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                ),
                const SizedBox(height: 2),
                Text(
                  isApproved
                      ? AppLanguage().tr(mr: 'व्हेंडरने तुमचे कागदपत्र मंजूर केले आहे.', en: 'The vendor has approved your document.')
                      : (doc.rejectionReason.isNotEmpty ? AppLanguage().tr(mr: 'कारण: ${doc.rejectionReason}', en: 'Reason: ${doc.rejectionReason}') : AppLanguage().tr(mr: 'कृपया पुन्हा अपलोड करा.', en: 'Please upload again.')),
                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ],
            ),
          ),
        ],
      ),
      action: SnackBarAction(
        label: AppLanguage().tr(mr: 'पहा', en: 'View'),
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
}

class FarmerApp extends StatefulWidget {
  const FarmerApp({super.key});

  @override
  State<FarmerApp> createState() => _FarmerAppState();
}

class _FarmerAppState extends State<FarmerApp> {
  @override
  void initState() {
    super.initState();
    AppLanguage().addListener(_onLanguageChanged);
  }

  @override
  void dispose() {
    AppLanguage().removeListener(_onLanguageChanged);
    super.dispose();
  }

  /// Screens read AppLanguage() directly instead of listening to it, so every element
  /// (including pushed pages, dialogs and sheets) is rebuilt to switch text immediately.
  void _onLanguageChanged() {
    if (!mounted) return;
    void rebuild(Element element) {
      element.markNeedsBuild();
      element.visitChildren(rebuild);
    }

    (context as Element).visitChildren(rebuild);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hritsetu',
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: rootScaffoldMessengerKey,
      navigatorKey: rootNavigatorKey,
      theme: AppTheme.lightTheme,
      home: const _AppStartup(),
    );
  }
}

/// Plays the animated splash while the app initializes, then fades into the session gate.
class _AppStartup extends StatefulWidget {
  const _AppStartup();

  @override
  State<_AppStartup> createState() => _AppStartupState();
}

class _AppStartupState extends State<_AppStartup> {
  final Future<void> _ready = _initializeApp().catchError((_) {});
  bool _started = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 450),
      child: _started
          ? const _SessionGate()
          : SplashScreen(
              ready: _ready,
              onFinished: () => setState(() => _started = true),
            ),
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
    final loggedIn = _loggedIn;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) PushNotificationService.instance.setShellReady(loggedIn);
    });
    return loggedIn ? const MainShell() : const LoginScreen();
  }
}
