import 'package:deliveryapp/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

import '../../core/routes/app_routes.dart';
import '../widgets/layout/app_bottom_navigation.dart';
import '../widgets/layout/app_drawer.dart';
import '../widgets/layout/custom_app_bar.dart';
import '../screens/home/home_dashboard_screen.dart';
import '../screens/navigation/live_navigation_screen.dart';
import '../screens/orders/new_orders_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/wallet/wallet_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  String _titleForIndex(AppLocalizations l10n, int index) {
    return switch (index) {
      0 => l10n.dashboard,
      1 => l10n.orders,
      2 => l10n.navigation,
      3 => l10n.wallet,
      4 => l10n.profile,
      _ => l10n.dashboard,
    };
  }

  Widget _buildPage(int index) {
    return switch (index) {
      0 => const HomeDashboardScreen(),
      1 => const NewOrdersScreen(embedded: true),
      2 => const LiveNavigationScreen(),
      3 => const WalletScreen(embedded: true),
      4 => const ProfileScreen(embedded: true),
      _ => const HomeDashboardScreen(),
    };
  }

  bool get _useShellAppBar => _currentIndex != 2;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      extendBody: true,
      drawer: const AppDrawer(),
      appBar: _useShellAppBar
          ? CustomAppBar(
              title: _titleForIndex(l10n, _currentIndex),
              leading: Builder(
                builder: (context) => IconButton(
                  icon: const Icon(Icons.menu),
                  onPressed: () => Scaffold.of(context).openDrawer(),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.notifications),
                ),
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.settings),
                ),
              ],
            )
          : null,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: KeyedSubtree(
          key: ValueKey(_currentIndex),
          child: _buildPage(_currentIndex),
        ),
      ),
      bottomNavigationBar: AppBottomNavigation(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}
