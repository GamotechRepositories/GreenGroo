import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_info.dart';
import '../../config/theme.dart';
import '../../core/providers/package_info_provider.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/utils/address_utils.dart';
import '../../core/utils/website_share.dart';
import '../../features/address/address_controller.dart';
import '../../features/auth/auth_controller.dart';
import '../../models/address.dart';
import '../../models/user.dart';
import '../../routes/route_paths.dart';
import '../../widgets/address/address_form.dart';
import '../../widgets/common/refreshable_body.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/layout/shell_bottom_insets.dart';

String _profileInitials(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return 'G';
  if (parts.length == 1) return parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();
  final _addressesSectionKey = GlobalKey();

  bool _showAddressForm = false;
  Address? _editingAddress;
  bool _savingAddress = false;
  String? _formError;
  bool _isAddressesExpanded = false;

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    Future.microtask(() {
      if (mounted) {
        ref.read(addressControllerProvider.notifier).loadAddresses();
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.account, _scrollController);
    });
  }

  @override
  void dispose() {
    _tabScrollRegistry.unregister(ShellTabIndex.account, _scrollController);
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _refreshProfile() async {
    await ref.read(addressControllerProvider.notifier).loadAddresses();
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

  void _openAddressesDropdown() {
    setState(() {
      _isAddressesExpanded = true;
    });
    ref.read(addressControllerProvider.notifier).loadAddresses();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToAddresses();
    });
  }

  void _toggleAddressesDropdown() {
    setState(() {
      _isAddressesExpanded = !_isAddressesExpanded;
    });
    if (_isAddressesExpanded) {
      ref.read(addressControllerProvider.notifier).loadAddresses();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToAddresses();
      });
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Remove address?'),
        content: const Text('This address will be removed from your saved list.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
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
    final result = await showDialog<String?>(
      context: context,
      builder: (context) {
        String? localError;
        return StatefulBuilder(
          builder: (context, setLocalState) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Text('Edit $title', style: const TextStyle(fontWeight: FontWeight.bold)),
            content: TextField(
              controller: controller,
              keyboardType: keyboardType,
              autofocus: true,
              decoration: InputDecoration(
                labelText: title,
                hintText: 'Enter your $title',
                errorText: localError,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () {
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

    if (result == null || !mounted) return;

    final updateError = await ref.read(authControllerProvider.notifier).updateProfile({
      fieldKey: result,
    });

    if (!mounted) return;
    if (updateError != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(updateError)));
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Log out of GreenGroo?'),
        content: const Text('You will need to sign in again to access your account and saved addresses.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      ref.read(authControllerProvider.notifier).logout();
    }
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
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: AppColors.headerFadeBg,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                  ),
                  child: const Icon(Icons.account_circle_outlined, size: 54, color: AppColors.primary),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Account Access Required',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in to manage your account details, saved addresses & quick checkout.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => ref.read(authControllerProvider.notifier).openAuthModal(),
                    icon: const Icon(Icons.login_rounded),
                    label: const Text('Login / Sign Up', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
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

    final topInset = MediaQuery.paddingOf(context).top;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          color: AppColors.pageBackground,
          padding: EdgeInsets.fromLTRB(16, topInset > 0 ? topInset + 12 : 20, 16, 12),
          child: const Text(
            'My Account',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
              letterSpacing: -0.3,
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _refreshProfile,
            child: ListView(
              controller: _scrollController,
              physics: AppScrollConfig.listPhysics,
              cacheExtent: AppScrollConfig.cacheExtent,
              padding: ShellBottomInsets.listPadding(context, top: 4),
              children: [
                _ProfileHeaderCard(
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
          const SizedBox(height: 16),
          _QuickActionsGrid(
            onAddresses: _openAddressesDropdown,
            onWishlist: () => context.push(RoutePaths.wishlist),
            onSupport: () => context.push(RoutePaths.support),
          ),
          const SizedBox(height: 20),
          _SavedAddressesSection(
            sectionKey: _addressesSectionKey,
            isExpanded: _isAddressesExpanded,
            onToggleExpand: _toggleAddressesDropdown,
            addresses: addresses,
            loading: addressesLoading,
            showForm: _showAddressForm,
            editingAddress: _editingAddress,
            savingAddress: _savingAddress,
            formError: _formError,
            onAddAddress: () => setState(() {
              _isAddressesExpanded = true;
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
              _isAddressesExpanded = true;
              _editingAddress = address;
              _showAddressForm = true;
              _formError = null;
            }),
            onDeleteAddress: _handleDeleteAddress,
          ),
          const SizedBox(height: 20),
          _MenuSection(
            onSupport: () => context.push(RoutePaths.support),
            onPrivacy: () => context.push(RoutePaths.privacyPolicy),
            onTerms: () => context.push(RoutePaths.terms),
            onContact: () => context.push(RoutePaths.contact),
            onAbout: () => context.push(RoutePaths.about),
            onShare: () async {
              final messenger = ScaffoldMessenger.of(context);
              try {
                await shareWebsite();
              } catch (_) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Could not share website. Try again.')),
                );
              }
            },
          ),
          const SizedBox(height: 20),
          _LogoutButton(onTap: _handleLogout),
          const SizedBox(height: 16),
          Center(
            child: ref.watch(packageInfoProvider).when(
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
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                  ),
                ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    ),
  ),
],
);
}
}

class _ProfileHeaderCard extends StatelessWidget {
  const _ProfileHeaderCard({
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
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppColors.headerSearchBg,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2), width: 2),
                ),
                alignment: Alignment.center,
                child: Text(
                  _profileInitials(user.name),
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            user.name.isNotEmpty ? user.name : 'GreenGroo User',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        IconButton(
                          onPressed: onEditName,
                          icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textMuted),
                          constraints: const BoxConstraints(),
                          padding: const EdgeInsets.all(4),
                          tooltip: 'Edit Name',
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.headerSearchBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified_rounded, size: 12, color: AppColors.primary),
                          SizedBox(width: 4),
                          Text(
                            'Verified Account',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 12),
          _ProfileDetailTile(
            icon: Icons.phone_android_rounded,
            label: 'Registered Phone Number',
            value: user.phone.isNotEmpty ? user.phone : 'Not provided',
            onEdit: onEditPhone,
          ),
          const SizedBox(height: 8),
          _ProfileDetailTile(
            icon: Icons.email_outlined,
            label: 'Email Address',
            value: user.email.isNotEmpty ? user.email : 'Not provided',
            onEdit: onEditEmail,
          ),
        ],
      ),
    );
  }
}

class _ProfileDetailTile extends StatelessWidget {
  const _ProfileDetailTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onEdit,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: AppColors.headerFadeBg,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
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
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          child: const Text('Change', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid({
    required this.onAddresses,
    required this.onWishlist,
    required this.onSupport,
  });

  final VoidCallback onAddresses;
  final VoidCallback onWishlist;
  final VoidCallback onSupport;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _QuickActionTile(
          icon: Icons.location_on_outlined,
          label: 'Addresses',
          onTap: onAddresses,
        ),
        const SizedBox(width: 10),
        _QuickActionTile(
          icon: Icons.favorite_border_rounded,
          label: 'Wishlist',
          onTap: onWishlist,
        ),
        const SizedBox(width: 10),
        _QuickActionTile(
          icon: Icons.headset_mic_outlined,
          label: 'Help & FAQ',
          onTap: onSupport,
        ),
      ],
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
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
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.headerFadeBg,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: AppColors.primary, size: 20),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SavedAddressesSection extends StatelessWidget {
  const _SavedAddressesSection({
    required this.sectionKey,
    required this.isExpanded,
    required this.onToggleExpand,
    required this.addresses,
    required this.loading,
    required this.showForm,
    required this.editingAddress,
    required this.savingAddress,
    required this.formError,
    required this.onAddAddress,
    required this.onCancelForm,
    required this.onSubmitForm,
    required this.onEditAddress,
    required this.onDeleteAddress,
  });

  final Key sectionKey;
  final bool isExpanded;
  final VoidCallback onToggleExpand;
  final List<Address> addresses;
  final bool loading;
  final bool showForm;
  final Address? editingAddress;
  final bool savingAddress;
  final String? formError;
  final VoidCallback onAddAddress;
  final VoidCallback onCancelForm;
  final Future<void> Function(Map<String, String> form) onSubmitForm;
  final ValueChanged<Address> onEditAddress;
  final ValueChanged<Address> onDeleteAddress;

  @override
  Widget build(BuildContext context) {
    return Container(
      key: sectionKey,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: onToggleExpand,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.headerFadeBg,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.location_on_outlined, size: 20, color: AppColors.primary),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Flexible(
                                child: Text(
                                  'Saved Addresses',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (addresses.isNotEmpty) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                  decoration: BoxDecoration(
                                    color: AppColors.headerFadeBg,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${addresses.length}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isExpanded ? 'Tap to hide addresses' : 'Tap to view your saved addresses',
                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: const Icon(Icons.keyboard_arrow_down_rounded, size: 24, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (isExpanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!showForm && addresses.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${addresses.length} ${addresses.length == 1 ? 'Address' : 'Addresses'}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                        ),
                        OutlinedButton.icon(
                          onPressed: onAddAddress,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            side: const BorderSide(color: AppColors.primary),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          icon: const Icon(Icons.add_rounded, size: 14),
                          label: const Text('Add New', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                  ],
                  if (formError != null && !showForm) ...[
                    Text(formError!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
                    const SizedBox(height: 10),
                  ],
                  if (showForm) ...[
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
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.headerFadeBg.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.location_off_outlined, size: 36, color: AppColors.textMuted),
                          const SizedBox(height: 8),
                          const Text(
                            'No saved addresses yet',
                            style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Add your delivery location for faster checkout',
                            style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 10),
                          FilledButton.icon(
                            onPressed: onAddAddress,
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            icon: const Icon(Icons.add_location_alt_outlined, size: 16),
                            label: const Text('Add Delivery Address', style: TextStyle(fontSize: 12)),
                          ),
                        ],
                      ),
                    )
                  else
                    Column(
                      children: [
                        for (final address in addresses)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _AddressCard(
                              address: address,
                              onEdit: () => onEditAddress(address),
                              onDelete: () => onDeleteAddress(address),
                            ),
                          ),
                      ],
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
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

  IconData _getAddressTypeIcon(String tag) {
    final lower = tag.toLowerCase();
    if (lower.contains('home')) return Icons.home_outlined;
    if (lower.contains('work') || lower.contains('office')) return Icons.work_outline;
    return Icons.location_on_outlined;
  }

  @override
  Widget build(BuildContext context) {
    final tagLabel = address.shopName.trim().isNotEmpty
        ? address.shopName.trim()
        : (address.landmark.trim().isNotEmpty ? address.landmark.trim() : 'Address');
    final formattedAddress = formatAddressLine(address);
    final displayAddress = formattedAddress.isNotEmpty
        ? formattedAddress
        : (address.fullAddress.isNotEmpty
            ? address.fullAddress
            : '${address.shopNo} ${address.area} ${address.city} ${address.pincode}'.trim());
    final fullName = getAddressFullName(address);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
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
                  color: AppColors.headerFadeBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(_getAddressTypeIcon(tagLabel), size: 18, color: AppColors.primary),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            tagLabel.toUpperCase(),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              letterSpacing: 0.3,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (address.isDefault) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'DEFAULT',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF15803D),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (fullName.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        fullName,
                        style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded, size: 20, color: AppColors.textMuted),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onSelected: (value) {
                  if (value == 'edit') onEdit();
                  if (value == 'delete') onDelete();
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'edit', child: Text('Edit')),
                  PopupMenuItem(value: 'delete', child: Text('Remove', style: TextStyle(color: Colors.red))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            displayAddress.isNotEmpty ? displayAddress : 'Saved delivery address',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
          ),
          const Divider(height: 16),
          Row(
            children: [
              const Icon(Icons.phone_outlined, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  address.number.startsWith('+91') ? address.number : '+91 ${address.number}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: onEdit,
                borderRadius: BorderRadius.circular(4),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Text('Edit', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: onDelete,
                borderRadius: BorderRadius.circular(4),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Text('Remove', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  const _MenuSection({
    required this.onSupport,
    required this.onPrivacy,
    required this.onTerms,
    required this.onContact,
    required this.onAbout,
    required this.onShare,
  });

  final VoidCallback onSupport;
  final VoidCallback onPrivacy;
  final VoidCallback onTerms;
  final VoidCallback onContact;
  final VoidCallback onAbout;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Support & Legal',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderLight),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              _MenuItem(
                icon: Icons.help_outline_rounded,
                title: 'Help & Support / FAQs',
                onTap: onSupport,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                onTap: onPrivacy,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.article_outlined,
                title: 'Terms & Conditions',
                onTap: onTerms,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.contact_support_outlined,
                title: 'Contact Us',
                onTap: onContact,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.info_outline_rounded,
                title: 'About GreenGroo',
                onTap: onAbout,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.share_outlined,
                title: 'Share App / Website',
                onTap: onShare,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Icon(icon, color: AppColors.primary, size: 22),
      title: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
      ),
      trailing: const Icon(Icons.chevron_right_rounded, size: 20, color: AppColors.textMuted),
      onTap: onTap,
    );
  }
}

class _LogoutButton extends StatelessWidget {
  const _LogoutButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFFEF2F2),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFFECACA)),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.logout_rounded, color: Colors.red, size: 20),
              SizedBox(width: 8),
              Text(
                'Log Out',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
