import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../schemes/schemes_screen.dart';
import '../orders/orders_screen.dart';
import '../earnings/earnings_screen.dart';
import '../products/products_screen.dart';

class NotificationItemModel {
  final String id;
  final String title;
  final String body;
  final String time;
  final String category; // 'orders', 'payments', 'schemes', 'advisory', 'products'
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String actionLabel;
  final VoidCallback? onAction;
  bool isRead;

  NotificationItemModel({
    required this.id,
    required this.title,
    required this.body,
    required this.time,
    required this.category,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.actionLabel,
    this.onAction,
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

  late List<NotificationItemModel> _notifications;

  @override
  void initState() {
    super.initState();
    _initNotifications();
  }

  void _initNotifications() {
    _notifications = [
      NotificationItemModel(
        id: '1',
        title: 'नवीन काढणी ऑर्डर प्राप्त (New Harvest Order)',
        body: 'तुमच्या टोमॅटो पिकासाठी 250 KG ची नवीन ऑर्डर नोंदवली गेली आहे. वेळेत पॅकिंग तयार ठेवा.',
        time: '१० मिनिटांपूर्वी',
        category: 'orders',
        icon: Icons.shopping_bag_outlined,
        iconColor: Colors.blue.shade700,
        iconBg: Colors.blue.shade50,
        actionLabel: 'ऑर्डर तपासा (View Order)',
        isRead: false,
        onAction: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen()));
        },
      ),
      NotificationItemModel(
        id: '2',
        title: 'पेमेंट यशस्वी जमा (Payment Received)',
        body: 'मागील आठवड्यातील काढणी ऑर्डरचे ₹12,500 थेट बँक खात्यात ट्रान्सफर करण्यात आले आहेत.',
        time: '२ तासांपूर्वी',
        category: 'payments',
        icon: Icons.account_balance_wallet_outlined,
        iconColor: AppColors.primary,
        iconBg: AppColors.primaryLight,
        actionLabel: 'हिशोब पहा (View Statement)',
        isRead: false,
        onAction: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const EarningsScreen()));
        },
      ),
      NotificationItemModel(
        id: '3',
        title: 'महाडीबीटी योजना सूचना (Govt Scheme Live)',
        body: 'कृषी यांत्रिकीकरण उप-अभियान २०२६ चे अर्ज सुरू झाले आहेत. सबसिडीचा लाभ घेण्यासाठी लगेच अर्ज करा.',
        time: '५ तासांपूर्वी',
        category: 'schemes',
        icon: Icons.account_balance_outlined,
        iconColor: Colors.orange.shade800,
        iconBg: Colors.orange.shade50,
        actionLabel: 'योजना पहा (View Scheme)',
        isRead: false,
        onAction: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const SchemesScreen()));
        },
      ),
      NotificationItemModel(
        id: '4',
        title: 'हवामान अंदाज व कृषी सल्ला (Weather Advisory)',
        body: 'पुढील २४ ते ४८ तासात भागात हलक्या ते मध्यम पावसाची शक्यता आहे. औषध फवारणी व काढणीचे नियोजन सावधगिरीने करा.',
        time: '१ दिवसापूर्वी',
        category: 'advisory',
        icon: Icons.wb_sunny_outlined,
        iconColor: Colors.amber.shade900,
        iconBg: Colors.amber.shade50,
        actionLabel: 'सल्ला वाचा (Read Advisory)',
        isRead: true,
        onAction: () {
          _showAdvisoryDialog(context);
        },
      ),
      NotificationItemModel(
        id: '5',
        title: 'स्टॉक अपडेट सूचना (Stock Alert)',
        body: 'तुमच्या उत्पादनांचा उपलब्ध साठा नियमित अपडेट ठेवा जेणेकरून खरेदीदार ग्राहकांना थेट ऑर्डर करता येईल.',
        time: '२ दिवसांपूर्वी',
        category: 'products',
        icon: Icons.inventory_2_outlined,
        iconColor: Colors.teal.shade700,
        iconBg: Colors.teal.shade50,
        actionLabel: 'उत्पादने पहा (My Products)',
        isRead: true,
        onAction: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen()));
        },
      ),
    ];
  }

  void _markAllAsRead() {
    setState(() {
      for (final n in _notifications) {
        n.isRead = true;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('सर्व सूचना वाचल्या म्हणून चिन्हांकित केल्या.'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _showAdvisoryDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.wb_sunny, color: Colors.orange),
            SizedBox(width: 8),
            Text('कृषी हवामान सल्ला', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'हवामान विभागाने दिलेल्या अंदाजानुसार पुढील २ दिवस ढगाळ हवामान राहील. आवश्यक सिंचन नियंत्रित करा आणि फवारणी पाऊस थांबल्यानंतरच करा.',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('समजले'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !n.isRead).length;

    final filteredList = _notifications.where((n) {
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
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 22),
          tooltip: 'मागे जा (Back)',
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'सर्व सूचना (Notifications)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
            Text(
              unreadCount > 0 ? '$unreadCount नवीन न वाचलेल्या सूचना' : 'सर्व सूचना वाचल्या आहेत',
              style: TextStyle(
                fontSize: 11,
                color: unreadCount > 0 ? AppColors.primaryDark : AppColors.muted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          if (unreadCount > 0)
            TextButton.icon(
              onPressed: _markAllAsRead,
              icon: const Icon(Icons.done_all, size: 16, color: AppColors.primary),
              label: const Text(
                'सर्व वाचा',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter Pills Bar
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _filterChip(id: 'all', label: 'सर्व (All)'),
                    const SizedBox(width: 6),
                    _filterChip(id: 'unread', label: 'नवीन ($unreadCount)'),
                    const SizedBox(width: 6),
                    _filterChip(id: 'orders', label: '📦 ऑर्डर्स'),
                    const SizedBox(width: 6),
                    _filterChip(id: 'payments', label: '💰 पेमेंट'),
                    const SizedBox(width: 6),
                    _filterChip(id: 'schemes', label: '🏛️ योजना'),
                    const SizedBox(width: 6),
                    _filterChip(id: 'advisory', label: '🌦️ सल्ला'),
                  ],
                ),
              ),
            ),
            const Divider(height: 1, color: AppColors.border),

            // Notification List View
            Expanded(
              child: filteredList.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.notifications_off_outlined, size: 56, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          const Text(
                            'कोणतीही सूचना उपलब्ध नाही',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'नवीन सूचना आल्यावर तुम्हाला येथे दिसेल.',
                            style: TextStyle(fontSize: 12, color: AppColors.muted),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 30),
                      itemCount: filteredList.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final item = filteredList[index];
                        return _buildNotificationCard(item);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _filterChip({required String id, required String label}) {
    final isSelected = _selectedFilter == id;
    return InkWell(
      onTap: () {
        setState(() => _selectedFilter = id);
      },
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade300,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF475569),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationCard(NotificationItemModel item) {
    return Container(
      decoration: BoxDecoration(
        color: item.isRead ? Colors.white : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: item.isRead ? AppColors.border : AppColors.primary.withValues(alpha: 0.35),
          width: item.isRead ? 1 : 1.5,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: item.iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, color: item.iconColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            item.title,
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: item.isRead ? FontWeight.w600 : FontWeight.bold,
                              color: AppColors.textPrimary,
                              height: 1.25,
                            ),
                          ),
                        ),
                        if (!item.isRead)
                          Container(
                            margin: const EdgeInsets.only(left: 6, top: 2),
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              'नवीन',
                              style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item.body,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF475569),
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item.time,
                      style: TextStyle(fontSize: 10.5, color: Colors.grey.shade500, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (item.onAction != null) ...[
            const SizedBox(height: 10),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  visualDensity: VisualDensity.compact,
                ),
                onPressed: () {
                  setState(() => item.isRead = true);
                  item.onAction!();
                },
                icon: const Icon(Icons.arrow_forward, size: 14),
                label: Text(
                  item.actionLabel,
                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
