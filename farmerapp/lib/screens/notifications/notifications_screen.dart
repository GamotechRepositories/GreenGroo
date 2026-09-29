import '../../services/sound_service.dart';
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/app_loader.dart';
import '../../core/widgets/pull_to_refresh.dart';
import '../../core/widgets/skeleton_loader.dart';
import '../../services/farmer_state.dart';
import '../orders/order_detail_screen.dart';
import '../earnings/earnings_screen.dart';
import '../documents/documents_screen.dart';

import '../../services/app_language.dart';
class NotificationItemModel {
  final String id;
  final String title;
  final String? orderCode;
  final String body;
  final String time;
  final String category; // 'orders', 'payments', 'schemes', 'profile'
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String actionLabel;
  final VoidCallback onAction;
  final bool isRead;

  NotificationItemModel({
    required this.id,
    required this.title,
    this.orderCode,
    required this.body,
    required this.time,
    required this.category,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.actionLabel,
    required this.onAction,
    this.isRead = false,
  });
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedFilter = 'all';

  List<NotificationItemModel> _buildLiveNotifications(BuildContext context, FarmerState state) {
    final List<NotificationItemModel> list = [];

    // 1. Live Real Orders Notifications
    for (final order in state.orders) {
      final notifId = 'order_${order.id}';
      final paymentNotifId = 'payment_${order.id}';

      final st = order.status.toLowerCase();
      final isCompleted = st == 'completed' || st == 'order_completed';
      final isReady = st.contains('ready');
      final isNew = st == 'new' || st == 'pending';

      if (isNew) {
        if (state.deletedNotificationIds.contains(notifId)) continue;
        final isRead = state.readNotificationIds.contains(notifId);
        list.add(
          NotificationItemModel(
            id: notifId,
            title: AppLanguage().tr(mr: 'नवीन काढणी ऑर्डर: ₹${order.totalAmount.toStringAsFixed(0)}', en: 'New harvest order: ₹${order.totalAmount.toStringAsFixed(0)}'),
            orderCode: order.orderCode.isNotEmpty ? order.orderCode : order.id,
            body: AppLanguage().tr(mr: '${order.buyerName.isNotEmpty ? order.buyerName : 'खरेदीदार'} यांनी ${order.productName} ची ${order.quantity.toStringAsFixed(0)} ${AppLanguage().pick(order.unit)} ऑर्डर नोंदवली आहे.', en: '${order.buyerName.isNotEmpty ? order.buyerName : 'Buyer'} placed an order for ${order.quantity.toStringAsFixed(0)} ${AppLanguage().pick(order.unit)} of ${order.productName}.'),
            time: order.createdAt.isNotEmpty ? order.createdAt : AppLanguage().tr(mr: 'आज', en: 'Today'),
            category: 'orders',
            icon: Icons.shopping_bag_outlined,
            iconColor: Colors.blue.shade700,
            iconBg: Colors.blue.shade50,
            actionLabel: AppLanguage().tr(mr: 'ऑर्डर पहा', en: 'View Order'),
            isRead: isRead,
            onAction: () {
              state.markNotificationAsRead(notifId);
              Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)));
            },
          ),
        );
      } else if (isReady) {
        if (state.deletedNotificationIds.contains(notifId)) continue;
        final isRead = state.readNotificationIds.contains(notifId);
        list.add(
          NotificationItemModel(
            id: notifId,
            title: AppLanguage().tr(mr: 'पिकअप स्लॉट तयार', en: 'Pickup slot ready'),
            orderCode: order.orderCode.isNotEmpty ? order.orderCode : order.id,
            body: AppLanguage().tr(mr: '${order.productName} चे कलेक्शन सेंटर: ${order.collectionCentre} • दिनांक: ${order.pickupDate} (${order.pickupSlot})', en: '${order.productName} collection centre: ${order.collectionCentre} • Date: ${order.pickupDate} (${order.pickupSlot})'),
            time: order.pickupDate.isNotEmpty ? order.pickupDate : AppLanguage().tr(mr: 'आज', en: 'Today'),
            category: 'orders',
            icon: Icons.local_shipping_outlined,
            iconColor: Colors.orange.shade800,
            iconBg: Colors.orange.shade50,
            actionLabel: AppLanguage().tr(mr: 'पिकअप तपशील', en: 'Pickup Info'),
            isRead: isRead,
            onAction: () {
              state.markNotificationAsRead(notifId);
              Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)));
            },
          ),
        );
      } else if (isCompleted) {
        if (state.deletedNotificationIds.contains(paymentNotifId)) continue;
        final isRead = state.readNotificationIds.contains(paymentNotifId);
        list.add(
          NotificationItemModel(
            id: paymentNotifId,
            title: AppLanguage().tr(mr: 'पेमेंट जमा: ₹${order.totalAmount.toStringAsFixed(0)}', en: 'Payment credited: ₹${order.totalAmount.toStringAsFixed(0)}'),
            orderCode: order.orderCode.isNotEmpty ? order.orderCode : order.id,
            body: AppLanguage().tr(mr: '${order.productName} ची काढणी ऑर्डर यशस्वीरीत्या पूर्ण झाली असून रक्कम खात्यावर जमा झाली आहे.', en: 'Harvest order for ${order.productName} completed and the amount has been credited to your account.'),
            time: order.pickupDate.isNotEmpty ? order.pickupDate : AppLanguage().tr(mr: 'पूर्ण झाले', en: 'Completed'),
            category: 'payments',
            icon: Icons.account_balance_wallet_outlined,
            iconColor: AppColors.primary,
            iconBg: AppColors.primaryLight,
            actionLabel: AppLanguage().tr(mr: 'हिशोब पहा', en: 'View Statement'),
            isRead: isRead,
            onAction: () {
              state.markNotificationAsRead(paymentNotifId);
              Navigator.push(context, MaterialPageRoute(builder: (_) => const EarningsScreen()));
            },
          ),
        );
      }
    }

    // 2. Document Verification Status Notifications (कागदपत्र पडताळणी सूचना)
    for (final doc in state.documents) {
      final st = doc.status.toLowerCase();
      if (st != 'approved' && st != 'rejected') continue;

      final notifId = 'doc_${doc.id}_$st';
      if (state.deletedNotificationIds.contains(notifId)) continue;
      final isRead = state.readNotificationIds.contains(notifId);
      final isApproved = st == 'approved';

      list.add(
        NotificationItemModel(
          id: notifId,
          title: isApproved
              ? AppLanguage().tr(mr: 'कागदपत्र मंजूर ✓: ${doc.displayTitle}', en: 'Document approved ✓: ${doc.displayTitle}')
              : AppLanguage().tr(mr: 'कागदपत्र अमान्य ⚠️: ${doc.displayTitle}', en: 'Document rejected ⚠️: ${doc.displayTitle}'),
          orderCode: doc.type.toUpperCase(),
          body: isApproved
              ? AppLanguage().tr(mr: 'व्हेंडरने तुमचे ${doc.displayTitle} तपासले असून ते यशस्वीरीत्या मंजूर केले आहे.', en: 'The vendor has reviewed and approved your ${doc.displayTitle}.')
              : AppLanguage().tr(mr: 'व्हेंडरने तुमचे ${doc.displayTitle} अमान्य केले आहे.${doc.rejectionReason.isNotEmpty ? ' अमान्य कारण: ${doc.rejectionReason}.' : ''} कृपया स्पष्ट प्रत पुन्हा अपलोड करा.', en: 'The vendor has rejected your ${doc.displayTitle}.${doc.rejectionReason.isNotEmpty ? ' Reason: ${doc.rejectionReason}.' : ''} Please re-upload a clear copy.'),
          time: doc.uploadDate.isNotEmpty ? doc.uploadDate : AppLanguage().tr(mr: 'आज', en: 'Today'),
          category: 'documents',
          icon: isApproved ? Icons.verified_rounded : Icons.warning_amber_rounded,
          iconColor: isApproved ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
          iconBg: isApproved ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
          actionLabel: isApproved ? AppLanguage().tr(mr: 'कागदपत्रे पहा', en: 'View Documents') : AppLanguage().tr(mr: 'पुन्हा अपलोड करा', en: 'Re-upload'),
          isRead: isRead,
          onAction: () {
            state.markNotificationAsRead(notifId);
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const DocumentsScreen()),
            );
          },
        ),
      );
    }

    return list;
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final state = FarmerState();
        final isLoading = !state.isPreferencesLoaded || (state.isLoadingFromBackend && state.orders.isEmpty && state.documents.isEmpty);
        if (isLoading) {
          return const NotificationsSkeletonLoader();
        }

        final allLiveNotifications = _buildLiveNotifications(context, state);

        final unreadCount = allLiveNotifications.where((n) => !n.isRead).length;

        final filteredList = allLiveNotifications.where((n) {
          if (_selectedFilter == 'all') return true;
          if (_selectedFilter == 'unread') return !n.isRead;
          return n.category == _selectedFilter;
        }).toList();

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 20),
              tooltip: AppLanguage().tr(mr: 'मागे जा', en: 'Go back'),
              onPressed: () => Navigator.pop(context),
            ),
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppLanguage().tr(mr: 'सूचना', en: 'Notifications'),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                ),
                Text(
                  unreadCount > 0 ? AppLanguage().tr(mr: '$unreadCount नवीन सूचना', en: '$unreadCount new notifications') : AppLanguage().tr(mr: 'सर्व सूचना वाचल्या आहेत', en: 'All notifications read'),
                  style: TextStyle(
                    fontSize: 10.5,
                    color: unreadCount > 0 ? AppColors.primaryDark : AppColors.muted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            actions: [
              if (unreadCount > 0)
                IconButton(
                  icon: const Icon(Icons.done_all, size: 20, color: AppColors.primary),
                  tooltip: AppLanguage().tr(mr: 'सर्व वाचा', en: 'Mark all read'),
                  onPressed: () {
                    state.markAllNotificationsAsRead(allLiveNotifications.map((n) => n.id));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(AppLanguage().tr(mr: 'सर्व सूचना वाचल्या म्हणून चिन्हांकित केल्या.', en: 'All notifications marked as read.')), duration: Duration(seconds: 2)),
                    );
                  },
                ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, size: 20, color: Color(0xFF475569)),
                onSelected: (val) {
                  if (val == 'test_sound') {
                    NotificationSoundService().playNotificationSound();
                  } else if (val == 'clear_all') {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        title: Text(AppLanguage().tr(mr: 'सर्व सूचना काढून टाकायच्या?', en: 'Clear all notifications?'), style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                        content: Text(AppLanguage().tr(mr: 'यामुळे सर्व सूचना यादीतून साफ होतील.', en: 'This will clear all notifications from the list.'), style: TextStyle(fontSize: 12)),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(AppLanguage().tr(mr: 'रद्द करा', en: 'Cancel'))),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                            onPressed: () {
                              state.clearAllNotifications(allLiveNotifications.map((n) => n.id));
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(AppLanguage().tr(mr: 'सर्व सूचना साफ करण्यात आल्या.', en: 'All notifications cleared.'))),
                              );
                            },
                            child: Text(AppLanguage().tr(mr: 'साफ करा', en: 'Clear')),
                          ),
                        ],
                      ),
                    );
                  }
                },
                itemBuilder: (ctx) => [
                  PopupMenuItem(
                    value: 'test_sound',
                    child: Row(
                      children: [
                        Icon(Icons.volume_up, size: 16, color: AppColors.primary),
                        SizedBox(width: 8),
                        Text(AppLanguage().tr(mr: 'आवाज तपासा', en: 'Test Sound'), style: TextStyle(fontSize: 12)),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: 'clear_all',
                    child: Row(
                      children: [
                        Icon(Icons.delete_sweep_outlined, size: 16, color: Colors.red),
                        SizedBox(width: 8),
                        Text(AppLanguage().tr(mr: 'सर्व साफ करा', en: 'Clear All'), style: TextStyle(fontSize: 12, color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 4),
            ],
          ),
          body: SafeArea(
            child: Column(
              children: [
                // Filter Pills Bar
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _filterChip(id: 'all', label: AppLanguage().tr(mr: 'सर्व (${allLiveNotifications.length})', en: 'All (${allLiveNotifications.length})')),
                        const SizedBox(width: 4),
                        _filterChip(id: 'unread', label: AppLanguage().tr(mr: 'नवीन ($unreadCount)', en: 'New ($unreadCount)')),
                        const SizedBox(width: 4),
                        _filterChip(id: 'documents', label: AppLanguage().tr(mr: '📑 कागदपत्रे', en: '📑 Documents')),
                        const SizedBox(width: 4),
                        _filterChip(id: 'orders', label: AppLanguage().tr(mr: '📦 ऑर्डर्स', en: '📦 Orders')),
                        const SizedBox(width: 4),
                        _filterChip(id: 'payments', label: AppLanguage().tr(mr: '💰 पेमेंट', en: '💰 Payments')),
                        const SizedBox(width: 4),
                        _filterChip(id: 'schemes', label: AppLanguage().tr(mr: '🏛️ योजना', en: '🏛️ Schemes')),
                      ],
                    ),
                  ),
                ),
                const Divider(height: 1, color: AppColors.border),

                // Notification List View
                Expanded(
                  child: filteredList.isEmpty
                      ? (allLiveNotifications.isEmpty && (!state.ordersReady || !state.documentsReady || !state.schemesReady))
                          ? AppLoader(message: AppLanguage().tr(mr: 'सूचना लोड होत आहेत...', en: 'Loading notifications...'))
                          : PullToRefresh(
                          onRefresh: () => Future.wait([state.refreshOrders(), state.refreshDocuments(), state.refreshSchemes(), state.refreshCrops()]),
                          child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.notifications_off_outlined, size: 48, color: Colors.grey.shade400),
                              const SizedBox(height: 10),
                              Text(
                                AppLanguage().tr(mr: 'कोणतीही सूचना उपलब्ध नाही', en: 'No notifications available'),
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                AppLanguage().tr(mr: 'नवीन ऑर्डर, पीक नियोजन किंवा योजना आल्यावर येथे दिसेल.', en: 'New orders, crop planning updates or schemes will appear here.'),
                                style: TextStyle(fontSize: 11, color: AppColors.muted),
                              ),
                            ],
                          ),
                        ),
                        )
                      : RefreshIndicator(
                          onRefresh: () => Future.wait([state.refreshOrders(), state.refreshDocuments(), state.refreshSchemes(), state.refreshCrops()]),
                          child: ListView.separated(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(10),
                            itemCount: filteredList.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final item = filteredList[index];
                              return Dismissible(
                                key: Key(item.id),
                                direction: DismissDirection.endToStart,
                                background: Container(
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 16),
                                  decoration: BoxDecoration(
                                    color: Colors.red.shade600,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.delete_outline, color: Colors.white, size: 20),
                                      SizedBox(width: 4),
                                      Text(AppLanguage().tr(mr: 'काढून टाका', en: 'Remove'), style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                                onDismissed: (direction) {
                                  state.deleteNotification(item.id);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(AppLanguage().tr(mr: 'सूचना काढून टाकली.', en: 'Notification removed.')), duration: Duration(seconds: 2)),
                                  );
                                },
                                child: _buildNotificationCard(context, state, item),
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _filterChip({required String id, required String label}) {
    final isSelected = _selectedFilter == id;
    return InkWell(
      onTap: () {
        setState(() => _selectedFilter = id);
      },
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade300,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationCard(BuildContext context, FarmerState state, NotificationItemModel item) {
    return Container(
      decoration: BoxDecoration(
        color: item.isRead ? Colors.white : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: item.isRead ? AppColors.border : AppColors.primary.withValues(alpha: 0.3),
          width: item.isRead ? 0.8 : 1.2,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: item.iconBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(item.icon, color: item.iconColor, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: item.isRead ? FontWeight.w600 : FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              if (item.orderCode != null && item.orderCode!.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade100,
                                      borderRadius: BorderRadius.circular(3),
                                      border: Border.all(color: Colors.grey.shade300, width: 0.5),
                                    ),
                                    child: Text(
                                      '#${item.orderCode}',
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.grey.shade700,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (!item.isRead)
                          Container(
                            margin: const EdgeInsets.only(left: 4, top: 2),
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              AppLanguage().tr(mr: 'नवीन', en: 'New'),
                              style: TextStyle(color: Colors.white, fontSize: 8.5, fontWeight: FontWeight.bold),
                            ),
                          ),
                        const SizedBox(width: 4),
                        IconButton(
                          icon: const Icon(Icons.close, size: 16, color: AppColors.muted),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          tooltip: AppLanguage().tr(mr: 'काढून टाका', en: 'Remove'),
                          onPressed: () {
                            state.deleteNotification(item.id);
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.body,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF475569),
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.time,
                      style: TextStyle(fontSize: 9.5, color: Colors.grey.shade500, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerRight,
            child: InkWell(
              onTap: item.onAction,
              borderRadius: BorderRadius.circular(4),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      item.actionLabel,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(width: 2),
                    const Icon(Icons.arrow_forward_ios, size: 8, color: Colors.white),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
