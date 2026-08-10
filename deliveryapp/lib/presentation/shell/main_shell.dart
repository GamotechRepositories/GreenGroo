import 'package:deliveryapp/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

import '../../core/routes/app_routes.dart';
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
  }

  @override
  void dispose() {
    _tabIndex.removeListener(_onTabChanged);
    ShellNavigation.instance.unbind();
    _tabIndex.dispose();
    super.dispose();
  }

  void _onTabChanged() {
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
    return switch (index) {
      0 => const HomeDashboardScreen(),
      1 => const MyShiftsScreen(embedded: true),
      2 => const LiveNavigationScreen(),
      3 => const WalletScreen(embedded: true),
      4 => const NotificationsScreen(embedded: true),
      _ => const HomeDashboardScreen(),
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      // Keep body above bottom bar so the tab sticks flush to the bottom.
      extendBody: false,
      drawer: const AppDrawer(),
      appBar: CustomAppBar(
        title: _titleForIndex(l10n, _currentIndex),
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.settings),
          ),
        ],
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: KeyedSubtree(
          key: ValueKey(_currentIndex),
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
