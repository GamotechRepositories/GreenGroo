import 'package:flutter/material.dart';
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
import '../services/farmer_state.dart';

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
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTab;
  }

  void openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  void setTab(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  final List<Widget> _screens = const [
    DashboardScreen(),
    CropsScreen(),
    ProductsScreen(),
    OrdersScreen(),
    ProfileScreen(),
  ];

  void _onDrawerNavigate(Widget targetScreen) {
    Navigator.pop(context); // Close drawer
    Navigator.push(context, MaterialPageRoute(builder: (_) => targetScreen));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      drawer: _buildFarmerSidebar(),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
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
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.dashboard_outlined),
                activeIcon: Icon(Icons.dashboard),
                label: 'Dashboard',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.eco_outlined),
                activeIcon: Icon(Icons.eco),
                label: 'My Crops',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.inventory_2_outlined),
                activeIcon: Icon(Icons.inventory_2),
                label: 'Products',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.shopping_bag_outlined),
                activeIcon: Icon(Icons.shopping_bag),
                label: 'Orders',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person_outline),
                activeIcon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFarmerSidebar() {
    final profile = FarmerState().profile;

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
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
                        const Text('Farmer Panel (शेतकरी पॅनेल)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary)),
                        Text(profile.farmName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10, color: AppColors.muted)),
                      ],
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
                    label: 'Dashboard (डॅशबोर्ड)',
                    isSelected: _currentIndex == 0,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 0);
                    },
                  ),
                  _drawerItem(
                    icon: Icons.account_balance_outlined,
                    label: 'Govt Schemes (शासकीय योजना)',
                    onTap: () => _onDrawerNavigate(const SchemesScreen()),
                  ),

                  // Crops Group
                  ExpansionTile(
                    initiallyExpanded: _currentIndex == 1,
                    leading: const Icon(Icons.eco_outlined, size: 20, color: AppColors.primary),
                    title: const Text('Crops (पिके व नियोजन)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    childrenPadding: const EdgeInsets.only(left: 48),
                    children: [
                      _subItem(
                        label: 'My Crops (माझी पिके)',
                        onTap: () {
                          Navigator.pop(context);
                          setState(() => _currentIndex = 1);
                        },
                      ),
                      _subItem(
                        label: 'Add Crop (नवीन पीक जोडा)',
                        onTap: () => _onDrawerNavigate(const AddCropScreen()),
                      ),
                      _subItem(
                        label: 'Crop Planning (२६ टप्पे नियोजन)',
                        onTap: () => _onDrawerNavigate(const CropPlanningScreen()),
                      ),
                    ],
                  ),

                  // Products Group
                  ExpansionTile(
                    initiallyExpanded: _currentIndex == 2,
                    leading: const Icon(Icons.inventory_2_outlined, size: 20, color: AppColors.primary),
                    title: const Text('Products (उत्पादने)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    childrenPadding: const EdgeInsets.only(left: 48),
                    children: [
                      _subItem(
                        label: 'My Products (माझी उत्पादने)',
                        onTap: () {
                          Navigator.pop(context);
                          setState(() => _currentIndex = 2);
                        },
                      ),
                      _subItem(
                        label: 'Add Product (उत्पादन जोडा)',
                        onTap: () => _onDrawerNavigate(const AddProductScreen()),
                      ),
                      _subItem(
                        label: 'Product Details (उत्पादन तपशील)',
                        onTap: () {
                          Navigator.pop(context);
                          setState(() => _currentIndex = 2);
                        },
                      ),
                    ],
                  ),

                  // Orders Group
                  ExpansionTile(
                    initiallyExpanded: _currentIndex == 3,
                    leading: const Icon(Icons.shopping_bag_outlined, size: 20, color: AppColors.primary),
                    title: const Text('Orders (ऑर्डर्स)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    childrenPadding: const EdgeInsets.only(left: 48),
                    children: [
                      _subItem(
                        label: 'All Orders (सर्व ऑर्डर्स)',
                        onTap: () {
                          Navigator.pop(context);
                          setState(() => _currentIndex = 3);
                        },
                      ),
                      _subItem(
                        label: 'Harvest Orders (काढणी ऑर्डर्स)',
                        onTap: () => _onDrawerNavigate(const HarvestOrdersScreen()),
                      ),
                    ],
                  ),

                  _drawerItem(
                    icon: Icons.account_balance_wallet_outlined,
                    label: 'Earnings (उत्पन्न व हिशोब)',
                    onTap: () => _onDrawerNavigate(const EarningsScreen()),
                  ),
                  _drawerItem(
                    icon: Icons.description_outlined,
                    label: 'Documents & KYC (कागदपत्रे)',
                    onTap: () => _onDrawerNavigate(const DocumentsScreen()),
                  ),

                  // Profile Group
                  ExpansionTile(
                    initiallyExpanded: _currentIndex == 4,
                    leading: const Icon(Icons.person_outline, size: 20, color: AppColors.primary),
                    title: const Text('Profile (शेतकरी प्रोफाईल)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    childrenPadding: const EdgeInsets.only(left: 48),
                    children: [
                      _subItem(
                        label: 'Farmer Profile (शेतकरी माहिती)',
                        onTap: () {
                          Navigator.pop(context);
                          setState(() => _currentIndex = 4);
                        },
                      ),
                      _subItem(
                        label: 'Farm Profile (शेताचा तपशील)',
                        onTap: () {
                          Navigator.pop(context);
                          setState(() => _currentIndex = 4);
                        },
                      ),
                      _subItem(
                        label: 'Farm Location (शेताचा पत्ता)',
                        onTap: () {
                          Navigator.pop(context);
                          setState(() => _currentIndex = 4);
                        },
                      ),
                    ],
                  ),

                  const Divider(height: 18),

                  // Sign Out
                  ListTile(
                    dense: true,
                    leading: const Icon(Icons.logout, size: 20, color: AppColors.error),
                    title: const Text(
                      'Sign Out (लॉग आउट करा)',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.error),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      _showSignOutDialog(context);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
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

  void _showSignOutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('लॉग आउट (Sign Out)'),
        content: const Text('तुम्हाला नक्की GreenGrocc Farmer App वरून लॉग आउट करायचे आहे का?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('रद्द करा (Cancel)')),
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
            child: const Text('लॉग आउट करा'),
          ),
        ],
      ),
    );
  }
}
