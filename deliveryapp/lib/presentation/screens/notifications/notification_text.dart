import '../../../data/services/notification_inbox_service.dart';
import '../../../l10n/app_localizations.dart';

/// Server notifications are stored in English; rebuild known types in the active locale.
({String title, String body}) localizedNotification(
  AppLocalizations l10n,
  RiderNotification n,
) {
  final data = n.data;
  final fallbackBody = n.body.isEmpty ? n.title : n.body;
  String amount() {
    final raw = data['amount']?.toString() ?? '';
    if (raw.isNotEmpty) return raw;
    return n.amount == null ? '0' : n.amount!.round().toString();
  }

  switch (n.type.toUpperCase()) {
    case 'VERIFICATION_COMPLETED':
      return (title: l10n.notifVerifiedTitle, body: l10n.notifVerifiedBody);
    case 'SHIFT_STARTED':
      return (title: l10n.notifShiftStartedTitle, body: l10n.notifShiftStartedBody);
    case 'SHIFT_REMINDER':
      final mins = int.tryParse(data['minutesLeft']?.toString() ?? '') ?? 15;
      return (title: l10n.notifShiftReminderTitle, body: l10n.notifShiftReminderBody(mins));
    case 'ORDER_RECEIVED':
      return (title: l10n.notifNewOrderTitle, body: l10n.notifNewOrderBody);
    case 'ORDER_ASSIGNED':
      final count = int.tryParse(data['orderCount']?.toString() ?? '') ?? 1;
      final numbers = (data['orderNumbers']?.toString() ?? '')
          .split(',')
          .where((e) => e.trim().isNotEmpty)
          .map((e) => '#${e.trim()}')
          .join(', ');
      if ((data['screen']?.toString() ?? '') == 'preorder_deliveries') {
        return (
          title: l10n.notifPreOrdersAssignedTitle(count),
          body: l10n.notifPreOrdersAssignedBody,
        );
      }
      return (
        title: l10n.notifOrdersAssignedTitle(count),
        body: l10n.notifOrdersAssignedBody(numbers),
      );
    case 'ORDER_COMPLETED':
      return (title: l10n.notifOrderCompletedTitle, body: l10n.notifOrderCompletedBody(amount()));
    case 'WALLET_CREDITED':
      return (title: l10n.notifWalletCreditedTitle(amount()), body: l10n.notifWalletCreditedBody);
    case 'NEW_GIG':
      return (title: l10n.notifNewGigTitle, body: l10n.notifNewGigBody);
    default:
      return (title: n.title, body: fallbackBody);
  }
}
