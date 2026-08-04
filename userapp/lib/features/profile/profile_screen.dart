import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_info.dart';
import '../../config/theme.dart';
import '../../core/providers/package_info_provider.dart';
import '../../core/providers/app_providers.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/utils/address_utils.dart';
import '../../core/utils/website_share.dart';
import '../../features/address/address_controller.dart';
import '../../features/auth/auth_controller.dart';
import '../../models/address.dart';
import '../../models/order.dart';
import '../../models/user.dart';
import '../../routes/route_paths.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import '../../widgets/address/address_form.dart';
import '../../widgets/common/refreshable_body.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/product/buy_again_card.dart';
import 'profile_recent_items.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();
  final _addressesSectionKey = GlobalKey();
  final _addressPageController = PageController();

  bool _showAddressForm = false;
  Address? _editingAddress;
  bool _savingAddress = false;
  String? _formError;
  int _addressPage = 0;
  List<OrderItem> _recentItems = [];
  bool _recentItemsLoading = false;

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    Future.microtask(_loadRecentItems);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.account, _scrollController);
    });
  }

  @override
  void dispose() {
    _tabScrollRegistry.unregister(ShellTabIndex.account, _scrollController);
    _scrollController.dispose();
    _addressPageController.dispose();
    super.dispose();
  }

  Future<void> _loadRecentItems() async {
    if (!ref.read(authControllerProvider).isLoggedIn) return;

    setState(() => _recentItemsLoading = true);
    try {
      final orders = await ref.read(apiServiceProvider).fetchMyOrders();
      if (!mounted) return;
      setState(() {
        _recentItems = extractRecentOrderItems(orders);
        _recentItemsLoading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _recentItems = [];
          _recentItemsLoading = false;
        });
      }
    }
  }

  Future<void> _refreshProfile() async {
    await Future.wait([
      ref.read(addressControllerProvider.notifier).loadAddresses(),
      _loadRecentItems(),
    ]);
  }

  void _scrollToAddresses() {
    final context = _addressesSectionKey.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _handleSaveAddress(Map<String, String> form) async {
    setState(() {
      _savingAddress = true;
      _formError = null;
    });

    final error = await ref.read(addressControllerProvider.notifier).saveAddress(
          form,
          editing: _editingAddress,
          makeDefault: _editingAddress == null &&
              ref.read(addressControllerProvider).addresses.isEmpty,
        );

    if (!mounted) return;

    setState(() {
      _savingAddress = false;
      if (error == null) {
        _showAddressForm = false;
        _editingAddress = null;
      } else {
        _formError = error;
      }
    });
  }

  Future<void> _handleDeleteAddress(Address address) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove address?'),
        content: const Text('This address will be removed from your account.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final error =
        await ref.read(addressControllerProvider.notifier).deleteAddress(address.id);
    if (error != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error)));
    }
  }

  Future<void> _editProfileField({
    required String title,
    required String fieldKey,
    required String initialValue,
    TextInputType keyboardType = TextInputType.text,
  }) async {
    final controller = TextEditingController(text: initialValue);
    final error = await showDialog<String?>(
      context: context,
      builder: (context) {
        String? localError;
        return StatefulBuilder(
          builder: (context, setLocalState) => AlertDialog(
            title: Text('Edit $title'),
            content: TextField(
              controller: controller,
              keyboardType: keyboardType,
              decoration: InputDecoration(
                labelText: title,
                errorText: localError,
              ),
              autofocus: true,
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
              FilledButton(
                onPressed: () async {
                  final value = controller.text.trim();
                  if (value.isEmpty) {
                    setLocalState(() => localError = '$title is required');
                    return;
                  }
                  Navigator.pop(context, value);
                },
                child: const Text('Save'),
              ),
            ],
          ),
        );
      },
    );

    if (error == null || !mounted) return;

    final updateError = await ref.read(authControllerProvider.notifier).updateProfile({
      fieldKey: error,
    });

    if (!mounted) return;
    if (updateError != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(updateError)));
    }
  }

  void _openAccountSettings() {
    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderLight,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Account Settings',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.share_outlined, color: AppColors.primary),
                title: const Text('Share Website'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  Navigator.pop(context);
                  try {
                    await shareWebsite();
                  } catch (_) {
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Could not share website. Try again.')),
                    );
                  }
                },
              ),
              ListTile(
                leading: const Icon(Icons.support_agent_outlined, color: AppColors.primary),
                title: const Text('Help & Support'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () {
                  Navigator.pop(context);
                  context.push(RoutePaths.support);
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout_rounded, color: Colors.red),
                title: const Text('Logout', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(context);
                  ref.read(authControllerProvider.notifier).logout();
                },
              ),
              const SizedBox(height: 8),
              ref.watch(packageInfoProvider).when(
                    loading: () => Text(
                      '${AppInfo.name} v${AppInfo.version}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                    error: (_, _) => Text(
                      '${AppInfo.name} v${AppInfo.version}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                    data: (info) => Text(
                      '${AppInfo.name} v${info.version}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                  ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = ref.watch(authControllerProvider.select((s) => s.isLoggedIn));
    final user = ref.watch(authControllerProvider.select((s) => s.user));
    final addresses = ref.watch(addressControllerProvider.select((s) => s.addresses));
    final addressesLoading =
        ref.watch(addressControllerProvider.select((s) => s.loading));

    if (!isLoggedIn) {
      return RefreshableBody(
        onRefresh: _refreshProfile,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Sign in to manage your account and addresses.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => ref.read(authControllerProvider.notifier).openAuthModal(),
                  child: const Text('Login / Sign Up'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (user == null) {
      return RefreshableBody(
        onRefresh: _refreshProfile,
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    return RefreshIndicator(
      onRefresh: _refreshProfile,
      child: ListView(
        controller: _scrollController,
        physics: AppScrollConfig.listPhysics,
        cacheExtent: AppScrollConfig.cacheExtent,
        padding: ShellBottomInsets.listPadding(context, top: 12),
        children: [
          _ProfileHeader(user: user),
          const SizedBox(height: 16),
          _ProfileInfoCard(
            user: user,
            onEditName: () => _editProfileField(
              title: 'Name',
              fieldKey: 'name',
              initialValue: user.name,
            ),
            onEditEmail: () => _editProfileField(
              title: 'Email',
              fieldKey: 'email',
              initialValue: user.email,
              keyboardType: TextInputType.emailAddress,
            ),
            onEditPhone: () => _editProfileField(
              title: 'Phone Number',
              fieldKey: 'phone',
              initialValue: user.phone,
              keyboardType: TextInputType.phone,
            ),
          ),
          const SizedBox(height: 14),
          _QuickLinksBar(
            onAddresses: _scrollToAddresses,
            onOrders: () => context.go(RoutePaths.orders),
            onWishlist: () => context.push(RoutePaths.wishlist),
            onSettings: _openAccountSettings,
          ),
          if (_recentItemsLoading || _recentItems.isNotEmpty) ...[
            const SizedBox(height: 20),
            _RecentOrderItemsSection(
              items: _recentItems,
              loading: _recentItemsLoading,
            ),
          ],
          const SizedBox(height: 20),
          _SavedAddressesSection(
            sectionKey: _addressesSectionKey,
            addresses: addresses,
            loading: addressesLoading,
            showForm: _showAddressForm,
            editingAddress: _editingAddress,
            savingAddress: _savingAddress,
            formError: _formError,
            pageController: _addressPageController,
            currentPage: _addressPage,
            onPageChanged: (index) => setState(() => _addressPage = index),
            onAddAddress: () => setState(() {
              _editingAddress = null;
              _showAddressForm = true;
              _formError = null;
            }),
            onCancelForm: () => setState(() {
              _showAddressForm = false;
              _editingAddress = null;
              _formError = null;
            }),
            onSubmitForm: _handleSaveAddress,
            onEditAddress: (address) => setState(() {
              _editingAddress = address;
              _showAddressForm = true;
              _formError = null;
            }),
            onDeleteAddress: _handleDeleteAddress,
          ),
        ],
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Hi, ${profileFirstName(user.name)} 👋',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Manage your profile & addresses',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
            ],
          ),
        ),
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.headerSearchBg,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
              ),
              alignment: Alignment.center,
              child: Text(
                profileInitials(user.name),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
            Positioned(
              right: -2,
              bottom: -2,
              child: Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.borderLight),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: const Icon(Icons.edit_rounded, size: 12, color: AppColors.primary),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ProfileInfoCard extends StatelessWidget {
  const _ProfileInfoCard({
    required this.user,
    required this.onEditName,
    required this.onEditEmail,
    required this.onEditPhone,
  });

  final User user;
  final VoidCallback onEditName;
  final VoidCallback onEditEmail;
  final VoidCallback onEditPhone;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          _ProfileInfoRow(
            icon: Icons.person_outline_rounded,
            label: 'Name',
            value: user.name,
            onEdit: onEditName,
            showDivider: true,
          ),
          _ProfileInfoRow(
            icon: Icons.mail_outline_rounded,
            label: 'Email',
            value: user.email.isNotEmpty ? user.email : 'Not provided',
            onEdit: onEditEmail,
            showDivider: true,
          ),
          _ProfileInfoRow(
            icon: Icons.phone_outlined,
            label: 'Phone Number',
            value: user.phone.isNotEmpty ? user.phone : 'Not provided',
            onEdit: onEditPhone,
            showDivider: false,
          ),
        ],
      ),
    );
  }
}

class _ProfileInfoRow extends StatelessWidget {
  const _ProfileInfoRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.onEdit,
    required this.showDivider,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onEdit;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.headerSearchBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 18, color: AppColors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    const SizedBox(height: 2),
                    Text(
                      value,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: onEdit,
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Edit', style: TextStyle(fontWeight: FontWeight.w600)),
                    Icon(Icons.chevron_right_rounded, size: 18),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (showDivider) const Divider(height: 1, indent: 62, endIndent: 14),
      ],
    );
  }
}

class _QuickLinksBar extends StatelessWidget {
  const _QuickLinksBar({
    required this.onAddresses,
    required this.onOrders,
    required this.onWishlist,
    required this.onSettings,
  });

  final VoidCallback onAddresses;
  final VoidCallback onOrders;
  final VoidCallback onWishlist;
  final VoidCallback onSettings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.headerFadeBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          _QuickLink(
            icon: Icons.location_on_outlined,
            label: 'My Addresses',
            onTap: onAddresses,
          ),
          _QuickLink(
            icon: Icons.receipt_long_outlined,
            label: 'My Orders',
            onTap: onOrders,
          ),
          _QuickLink(
            icon: Icons.favorite_border_rounded,
            label: 'Wishlist',
            onTap: onWishlist,
          ),
          _QuickLink(
            icon: Icons.settings_outlined,
            label: 'Account Settings',
            onTap: onSettings,
          ),
        ],
      ),
    );
  }
}

class _QuickLink extends StatelessWidget {
  const _QuickLink({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          child: Column(
            children: [
              Icon(icon, color: AppColors.primary, size: 22),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentOrderItemsSection extends StatelessWidget {
  const _RecentOrderItemsSection({
    required this.items,
    required this.loading,
  });

  final List<OrderItem> items;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Buy Again',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        const Text(
          'Items from your recent orders',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 12),
        if (loading)
          SizedBox(
            height: 148,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 4,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (_, _) => Container(
                width: 112,
                decoration: BoxDecoration(
                  color: AppColors.mobileSurface,
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          )
        else
          SizedBox(
            height: 220,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, index) => BuyAgainCard(item: items[index]),
            ),
          ),
      ],
    );
  }
}

class _SavedAddressesSection extends StatelessWidget {
  const _SavedAddressesSection({
    required this.sectionKey,
    required this.addresses,
    required this.loading,
    required this.showForm,
    required this.editingAddress,
    required this.savingAddress,
    required this.formError,
    required this.pageController,
    required this.currentPage,
    required this.onPageChanged,
    required this.onAddAddress,
    required this.onCancelForm,
    required this.onSubmitForm,
    required this.onEditAddress,
    required this.onDeleteAddress,
  });

  final Key sectionKey;
  final List<Address> addresses;
  final bool loading;
  final bool showForm;
  final Address? editingAddress;
  final bool savingAddress;
  final String? formError;
  final PageController pageController;
  final int currentPage;
  final ValueChanged<int> onPageChanged;
  final VoidCallback onAddAddress;
  final VoidCallback onCancelForm;
  final Future<void> Function(Map<String, String> form) onSubmitForm;
  final ValueChanged<Address> onEditAddress;
  final ValueChanged<Address> onDeleteAddress;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: sectionKey,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'Saved Addresses',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
            if (!showForm)
              TextButton(
                onPressed: onAddAddress,
                child: const Text('+ Add Address'),
              ),
          ],
        ),
        if (formError != null && !showForm) ...[
          const SizedBox(height: 4),
          Text(formError!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
        ],
        if (showForm) ...[
          const SizedBox(height: 8),
          AddressForm(
            plain: true,
            initial: editingAddress != null ? mapAddressToForm(editingAddress!) : null,
            submitting: savingAddress,
            onCancel: onCancelForm,
            onSubmit: onSubmitForm,
          ),
          if (formError != null) ...[
            const SizedBox(height: 8),
            Text(formError!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
          ],
        ] else if (loading)
          const SkeletonAddressList()
        else if (addresses.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: const Text(
              'No saved addresses yet.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          )
        else ...[
          const SizedBox(height: 8),
          SizedBox(
            height: 210,
            child: PageView.builder(
              controller: pageController,
              itemCount: addresses.length,
              onPageChanged: onPageChanged,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: _AddressCard(
                    address: addresses[index],
                    onEdit: () => onEditAddress(addresses[index]),
                    onDelete: () => onDeleteAddress(addresses[index]),
                  ),
                );
              },
            ),
          ),
          if (addresses.length > 1) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                addresses.length,
                (index) => Container(
                  width: index == currentPage ? 8 : 6,
                  height: index == currentPage ? 8 : 6,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: index == currentPage
                        ? AppColors.primary
                        : AppColors.borderLight,
                  ),
                ),
              ),
            ),
          ],
        ],
      ],
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDelete,
  });

  final Address address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.headerSearchBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.home_outlined, size: 18, color: AppColors.primary),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    Text(
                      getAddressFullName(address),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    if (address.isDefault)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'DEFAULT',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF15803D),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded, size: 20),
                onSelected: (value) {
                  if (value == 'edit') onEdit();
                  if (value == 'delete') onDelete();
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'edit', child: Text('Edit')),
                  PopupMenuItem(value: 'delete', child: Text('Remove')),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          Expanded(
            child: Text(
              formatAddressLine(address),
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.45),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Row(
            children: [
              const Icon(Icons.phone_outlined, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(
                '+91 ${address.number}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const Spacer(),
              TextButton(
                onPressed: onEdit,
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('Edit'),
              ),
              TextButton(
                onPressed: onDelete,
                style: TextButton.styleFrom(
                  foregroundColor: Colors.red,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('Remove'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
