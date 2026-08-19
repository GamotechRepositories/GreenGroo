import 'package:deliveryapp/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

import '../../core/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../widgets/layout/app_bottom_navigation.dart';
import '../widgets/layout/app_drawer.dart';
import '../widgets/layout/custom_app_bar.dart';
import '../screens/home/home_dashboard_screen.dart';
import '../screens/navigation/live_navigation_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/shifts/my_shifts_screen.dart';
import '../screens/wallet/wallet_screen.dart';
import 'shell_navigation.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  final _tabIndex = ValueNotifier<int>(0);

  @override
  void initState() {
    super.initState();
    ShellNavigation.instance.bind(_tabIndex);
    _tabIndex.addListener(_onTabChanged);
    ThemeController.instance.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    ThemeController.instance.removeListener(_onThemeChanged);
    _tabIndex.removeListener(_onTabChanged);
    ShellNavigation.instance.unbind();
    _tabIndex.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (mounted) setState(() {});
  }

  void _onThemeChanged() {
    if (mounted) setState(() {});
  }

  int get _currentIndex => _tabIndex.value;

  String _titleForIndex(AppLocalizations l10n, int index) {
    return switch (index) {
      0 => l10n.dashboard,
      1 => l10n.myShifts,
      2 => l10n.navigation,
      3 => l10n.wallet,
      4 => l10n.notifications,
      _ => l10n.dashboard,
    };
  }

  Widget _buildPage(int index) {
    // Non-const so theme rebuilds remount/update page colors.
    return switch (index) {
      0 => HomeDashboardScreen(key: ValueKey('home_${ThemeController.instance.isDark}')),
      1 => MyShiftsScreen(
          key: ValueKey('shifts_${ThemeController.instance.isDark}'),
          embedded: true,
        ),
      2 => LiveNavigationScreen(
          key: ValueKey('map_${ThemeController.instance.isDark}'),
        ),
      3 => WalletScreen(
          key: ValueKey('wallet_${ThemeController.instance.isDark}'),
          embedded: true,
        ),
      4 => NotificationsScreen(
          key: ValueKey('notif_${ThemeController.instance.isDark}'),
          embedded: true,
        ),
      _ => HomeDashboardScreen(
          key: ValueKey('home_${ThemeController.instance.isDark}'),
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    Theme.of(context); // track Material themeMode changes too

    return Scaffold(
      backgroundColor: AppColors.surface,
      extendBody: false,
      drawer: const AppDrawer(),
      appBar: _currentIndex == 0
          ? null
          : CustomAppBar(
              title: _titleForIndex(l10n, _currentIndex),
              showTitle: true,
              leading: Builder(
                builder: (context) => IconButton(
                  icon: const Icon(Icons.menu),
                  onPressed: () => Scaffold.of(context).openDrawer(),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  onPressed: () =>
                      Navigator.pushNamed(context, AppRoutes.settings),
                ),
              ],
            ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: KeyedSubtree(
          key: ValueKey('${_currentIndex}_${ThemeController.instance.isDark}'),
          child: _buildPage(_currentIndex),
        ),
      ),
      bottomNavigationBar: AppBottomNavigation(
        currentIndex: _currentIndex,
        onTap: (index) => _tabIndex.value = index,
      ),
    );
  }
}
