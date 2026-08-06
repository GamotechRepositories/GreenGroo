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

  final _titles = ['Dashboard', 'Orders', 'Navigation', 'Wallet', 'Profile'];

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
    return Scaffold(
      extendBody: true,
      drawer: const AppDrawer(),
      appBar: _useShellAppBar
          ? CustomAppBar(
              title: _titles[_currentIndex],
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
