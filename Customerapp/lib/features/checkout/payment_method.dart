import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum PaymentModeOption {
  gpay,
  phonepe,
  paytm,
  anyUpi,
  card,
  cod,
}

/// Razorpay UPI-intent app id for each app option.
const upiAppIds = {
  PaymentModeOption.gpay: 'google_pay',
  PaymentModeOption.phonepe: 'phonepe',
  PaymentModeOption.paytm: 'paytm',
};

extension PaymentModeOptionX on PaymentModeOption {
  String get label => switch (this) {
        PaymentModeOption.gpay => 'Google Pay',
        PaymentModeOption.phonepe => 'PhonePe',
        PaymentModeOption.paytm => 'Paytm UPI',
        PaymentModeOption.anyUpi => 'UPI',
        PaymentModeOption.card => 'Credit / Debit Card',
        PaymentModeOption.cod => 'Cash on Delivery',
      };

  /// SVG under assets/images/payment, or null when [icon] should be used.
  String? get asset => switch (this) {
        PaymentModeOption.gpay => 'assets/images/payment/gpay.svg',
        PaymentModeOption.phonepe => 'assets/images/payment/phonepe.svg',
        PaymentModeOption.paytm => 'assets/images/payment/paytm.svg',
        PaymentModeOption.anyUpi => 'assets/images/payment/bhim.svg',
        PaymentModeOption.card || PaymentModeOption.cod => null,
      };

  IconData get icon => switch (this) {
        PaymentModeOption.card => Icons.credit_card_rounded,
        PaymentModeOption.cod => Icons.payments_outlined,
        _ => Icons.account_balance_wallet_outlined,
      };
}

PaymentModeOption? paymentModeFromName(String? name) {
  if (name == null || name.isEmpty) return null;
  for (final mode in PaymentModeOption.values) {
    if (mode.name == name) return mode;
  }
  return null;
}

const _lastPaymentModeKey = 'checkout_last_payment_mode';

Future<PaymentModeOption?> loadLastPaymentMode() async {
  final prefs = await SharedPreferences.getInstance();
  return paymentModeFromName(prefs.getString(_lastPaymentModeKey));
}

Future<void> saveLastPaymentMode(PaymentModeOption mode) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_lastPaymentModeKey, mode.name);
}
