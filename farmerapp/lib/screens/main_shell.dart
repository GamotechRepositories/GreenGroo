import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants/app_colors.dart';
import 'dashboard/dashboard_screen.dart';
import 'crops/crops_screen.dart';
import 'crops/add_crop_screen.dart';
import 'crops/crop_planning_screen.dart';
import 'products/products_screen.dart';
import 'products/add_product_screen.dart';
import 'orders/orders_screen.dart';
import 'orders/harvest_orders_screen.dart';
import 'schemes/schemes_screen.dart';
import 'earnings/earnings_screen.dart';
import 'documents/documents_screen.dart';
import 'profile/profile_screen.dart';
import 'auth/login_screen.dart';
import 'market/market_comparison_screen.dart';
import '../services/farmer_state.dart';
import '../services/app_language.dart';

class MainShell extends StatefulWidget {
  final int initialTab;
  const MainShell({super.key, this.initialTab = 0});

  static void openDrawer(BuildContext context) {
    context.findAncestorStateOfType<_MainShellState>()?.openDrawer();
  }

  static void setTab(BuildContext context, int index) {
    context.findAncestorStateOfType<_MainShellState>()?.setTab(index);
  }

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final GlobalKey<EarningsScreenState> _earningsKey = GlobalKey<EarningsScreenState>();
  late int _currentIndex;
  final Set<int> _builtTabs = <int>{};

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTab;
    _builtTabs.add(_currentIndex);
  }

  void openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  void setTab(int index) {
    _showTab(index);
  }

  void _showTab(int index) {
    setState(() {
      _builtTabs.add(index);
      _currentIndex = index;
    });
  }

  late final List<Widget> _screens = <Widget>[
    const DashboardScreen(),
    const ProductsScreen(),
    const OrdersScreen(),
    EarningsScreen(key: _earningsKey, embeddedInShell: true),
    const ProfileScreen(),
  ];

  /// Closes the sidebar without [Navigator.pop]. Popping here can remove the
  /// home route when the drawer history entry is missing, which leaves a blank screen.
  void _closeDrawer() {
    final ScaffoldState? scaffold = _scaffoldKey.currentState;
    if (scaffold != null && scaffold.isDrawerOpen) {
      scaffold.closeDrawer();
    }
  }

  void _selectTab(int index) {
    _closeDrawer();
    _showTab(index);
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppLanguage(),
      builder: (context, _) {
        final lang = AppLanguage();

        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, result) {
            if (didPop) return;
            if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
              _closeDrawer();
              return;
            }
            if (_currentIndex == 3 && (_earningsKey.currentState?.consumeSystemBack() ?? false)) {
              return;
            }
            if (_currentIndex != 0) {
              _showTab(0);
              return;
            }
            SystemNavigator.pop();
          },
          child: Scaffold(
            key: _scaffoldKey,
            drawer: FarmerSidebarDrawer(
              currentTabIndex: _currentIndex,
              onSelectTab: _selectTab,
            ),
            body: IndexedStack(
              index: _currentIndex,
              sizing: StackFit.expand,
              children: List<Widget>.generate(_screens.length, (index) {
                if (!_builtTabs.contains(index)) return const SizedBox.shrink();
                return _screens[index];
              }),
            ),
            bottomNavigationBar: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 8,
                    offset: Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: BottomNavigationBar(
                  currentIndex: _currentIndex,
                  selectedItemColor: AppColors.primary,
                  unselectedItemColor: AppColors.muted,
                  type: BottomNavigationBarType.fixed,
                  backgroundColor: Colors.white,
                  elevation: 0,
                  selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                  unselectedLabelStyle: const TextStyle(fontSize: 11),
                  onTap: _showTab,
                  items: [
                    BottomNavigationBarItem(
                      icon: const Icon(Icons.dashboard_outlined),
                      activeIcon: const Icon(Icons.dashboard),
                      label: lang.tr(mr: 'डॅशबोर्ड', en: 'Dashboard'),
                    ),
                    BottomNavigationBarItem(
                      icon: const Icon(Icons.inventory_2_outlined),
                      activeIcon: const Icon(Icons.inventory_2),
                      label: lang.tr(mr: 'उत्पादने', en: 'Products'),
                    ),
                    BottomNavigationBarItem(
                      icon: const Icon(Icons.shopping_bag_outlined),
                      activeIcon: const Icon(Icons.shopping_bag),
                      label: lang.tr(mr: 'ऑर्डर्स', en: 'Orders'),
                    ),
                    BottomNavigationBarItem(
                      icon: const Icon(Icons.account_balance_wallet_outlined),
                      activeIcon: const Icon(Icons.account_balance_wallet),
                      label: lang.tr(mr: 'उत्पन्न', en: 'Earnings'),
                    ),
                    BottomNavigationBarItem(
                      icon: const Icon(Icons.person_outline),
                      activeIcon: const Icon(Icons.person),
                      label: lang.tr(mr: 'प्रोफाईल', en: 'Profile'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class FarmerSidebarDrawer extends StatelessWidget {
  final int? currentTabIndex;
  final ValueChanged<int>? onSelectTab;

  const FarmerSidebarDrawer({
    super.key,
    this.currentTabIndex,
    this.onSelectTab,
  });

  void _handleSelectTab(BuildContext context, int index) {
    if (onSelectTab != null) {
      onSelectTab!(index);
    } else {
      Navigator.of(context).popUntil((route) => route.isFirst);
      MainShell.setTab(context, index);
    }
  }

  void _handleNavigate(BuildContext context, Widget target) {
    Navigator.pop(context);
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => target));
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: ListenableBuilder(
        listenable: Listenable.merge([FarmerState(), AppLanguage()]),
        builder: (context, _) {
          final profile = FarmerState().profile;
          final lang = AppLanguage();

          return SafeArea(
            child: Column(
              children: [
                // Farmer Sidebar Header matching FarmerSidebar.jsx
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: const BoxDecoration(
                    color: AppColors.background,
                    border: Border(bottom: BorderSide(color: AppColors.border)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Center(
                          child: Text(
                            'GG',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('GreenGrocc', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            Text(
                              lang.tr(mr: 'शेतकरी पॅनेल', en: 'Farmer Panel'),
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary),
                            ),
                            Text(
                              profile.farmName.isNotEmpty ? profile.farmName : profile.fullName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 10, color: AppColors.muted),
                            ),
                          ],
                        ),
                      ),
                      // Language Selector Button in Drawer Header
                      InkWell(
                        onTap: () {
                          Navigator.pop(context);
                          AppLanguage.showSelectionDialog(context);
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(lang.isMarathi ? '🇮🇳' : '🌐', style: const TextStyle(fontSize: 12)),
                              const SizedBox(width: 4),
                              Text(
                                lang.isMarathi ? 'मराठी' : 'ENG',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Sidebar Menu Items matching D:\GreenGroo\farmer exactly
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    children: [
                      _drawerItem(
                        icon: Icons.dashboard_outlined,
                        label: lang.tr(mr: 'डॅशबोर्ड', en: 'Dashboard'),
                        isSelected: currentTabIndex == 0,
                        onTap: () => _handleSelectTab(context, 0),
                      ),
                      _drawerItem(
                        icon: Icons.account_balance_outlined,
                        label: lang.tr(mr: 'शासकीय योजना', en: 'Govt Schemes'),
                        onTap: () => _handleNavigate(context, const SchemesScreen()),
                      ),
                      _drawerItem(
                        icon: Icons.trending_up_rounded,
                        label: lang.tr(mr: 'बाजार भाव तुलना', en: 'Market Prices'),
                        onTap: () => _handleNavigate(context, const MarketComparisonScreen()),
                      ),

                      // Crops Group
                      ExpansionTile(
                        leading: const Icon(Icons.eco_outlined, size: 20, color: AppColors.primary),
                        title: Text(
                          lang.tr(mr: 'पिके व नियोजन', en: 'Crops & Planning'),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        childrenPadding: const EdgeInsets.only(left: 48),
                        children: [
                          _subItem(
                            label: lang.tr(mr: 'माझी पिके', en: 'My Crops'),
                            onTap: () => _handleNavigate(context, const CropsScreen()),
                          ),
                          _subItem(
                            label: lang.tr(mr: 'नवीन पीक जोडा', en: 'Add Crop'),
                            onTap: () => _handleNavigate(context, const AddCropScreen()),
                          ),
                          _subItem(
                            label: lang.tr(mr: '२६ टप्पे पीक नियोजन', en: '26 Stages Crop Plan'),
                            onTap: () => _handleNavigate(context, const CropPlanningScreen()),
                          ),
                        ],
                      ),

                      // Products Group
                      ExpansionTile(
                        initiallyExpanded: currentTabIndex == 1,
                        leading: const Icon(Icons.inventory_2_outlined, size: 20, color: AppColors.primary),
                        title: Text(
                          lang.tr(mr: 'उत्पादने', en: 'Products'),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        childrenPadding: const EdgeInsets.only(left: 48),
                        children: [
                          _subItem(
                            label: lang.tr(mr: 'माझी उत्पादने', en: 'My Products'),
                            onTap: () => _handleSelectTab(context, 1),
                          ),
                          _subItem(
                            label: lang.tr(mr: 'नवीन उत्पादन जोडा', en: 'Add Product'),
                            onTap: () => _handleNavigate(context, const AddProductScreen()),
                          ),
                          _subItem(
                            label: lang.tr(mr: 'उत्पादन तपशील', en: 'Product Details'),
                            onTap: () => _handleSelectTab(context, 1),
                          ),
                        ],
                      ),

                      // Orders Group
                      ExpansionTile(
                        initiallyExpanded: currentTabIndex == 2,
                        leading: const Icon(Icons.shopping_bag_outlined, size: 20, color: AppColors.primary),
                        title: Text(
                          lang.tr(mr: 'ऑर्डर्स', en: 'Orders'),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        childrenPadding: const EdgeInsets.only(left: 48),
                        children: [
                          _subItem(
                            label: lang.tr(mr: 'सर्व ऑर्डर्स', en: 'All Orders'),
                            onTap: () => _handleSelectTab(context, 2),
                          ),
                          _subItem(
                            label: lang.tr(mr: 'काढणी ऑर्डर्स', en: 'Harvest Orders'),
                            onTap: () => _handleNavigate(context, const HarvestOrdersScreen()),
                          ),
                        ],
                      ),

                      _drawerItem(
                        icon: Icons.account_balance_wallet_outlined,
                        label: lang.tr(mr: 'उत्पन्न व हिशोब', en: 'Earnings & Statement'),
                        isSelected: currentTabIndex == 3,
                        onTap: () => _handleSelectTab(context, 3),
                      ),
                      _drawerItem(
                        icon: Icons.description_outlined,
                        label: lang.tr(mr: 'कागदपत्रे व KYC', en: 'Documents & KYC'),
                        onTap: () => _handleNavigate(context, const DocumentsScreen()),
                      ),

                      // Profile Group
                      ExpansionTile(
                        initiallyExpanded: currentTabIndex == 4,
                        leading: const Icon(Icons.person_outline, size: 20, color: AppColors.primary),
                        title: Text(
                          lang.tr(mr: 'शेतकरी प्रोफाईल', en: 'Farmer Profile'),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        childrenPadding: const EdgeInsets.only(left: 48),
                        children: [
                          _subItem(
                            label: lang.tr(mr: 'शेतकरी माहिती', en: 'Farmer Info'),
                            onTap: () => _handleSelectTab(context, 4),
                          ),
                          _subItem(
                            label: lang.tr(mr: 'शेताचा तपशील', en: 'Farm Details'),
                            onTap: () => _handleSelectTab(context, 4),
                          ),
                          _subItem(
                            label: lang.tr(mr: 'शेताचा पत्ता', en: 'Farm Location'),
                            onTap: () => _handleSelectTab(context, 4),
                          ),
                        ],
                      ),

                      const Divider(height: 18),

                      // Language Switcher Menu Row
                      ListTile(
                        dense: true,
                        leading: const Icon(Icons.translate_rounded, size: 20, color: AppColors.primary),
                        title: Text(
                          lang.tr(mr: 'भाषा बदला (Change Language)', en: 'Change Language (भाषा बदला)'),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            lang.isMarathi ? '🇮🇳 मराठी' : '🌐 English',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                          ),
                        ),
                        onTap: () {
                          Navigator.pop(context);
                          AppLanguage.showSelectionDialog(context);
                        },
                      ),

                      // Sign Out
                      ListTile(
                        dense: true,
                        leading: const Icon(Icons.logout, size: 20, color: AppColors.error),
                        title: Text(
                          lang.tr(mr: 'लॉग आउट करा', en: 'Sign Out'),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.error),
                        ),
                        onTap: () {
                          Navigator.pop(context);
                          _showSignOutDialog(context, lang);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _drawerItem({required IconData icon, required String label, bool isSelected = false, required VoidCallback onTap}) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: Material(
        color: isSelected ? AppColors.primaryLight : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        clipBehavior: Clip.antiAlias,
        child: ListTile(
          dense: true,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          leading: Icon(icon, size: 20, color: isSelected ? AppColors.primary : AppColors.primaryDark),
          title: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              color: isSelected ? AppColors.primary : AppColors.textPrimary,
            ),
          ),
          onTap: onTap,
        ),
      ),
    );
  }

  Widget _subItem({required String label, required VoidCallback onTap}) {
    return ListTile(
      dense: true,
      visualDensity: VisualDensity.compact,
      title: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.muted, fontWeight: FontWeight.w500)),
      onTap: onTap,
    );
  }

  void _showSignOutDialog(BuildContext context, AppLanguage lang) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(lang.tr(mr: 'लॉग आउट', en: 'Sign Out')),
        content: Text(
          lang.tr(
            mr: 'तुम्हाला नक्की GreenGrocc Farmer App वरून लॉग आउट करायचे आहे का?',
            en: 'Are you sure you want to sign out from GreenGrocc Farmer App?',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(lang.tr(mr: 'रद्द करा', en: 'Cancel')),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            onPressed: () {
              Navigator.pop(ctx);
              FarmerState().logout();
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: Text(lang.tr(mr: 'लॉग आउट करा', en: 'Sign Out')),
          ),
        ],
      ),
    );
  }
}
