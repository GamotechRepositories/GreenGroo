import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Same two plans as the website checkout: cash on delivery, or pay now
/// through Razorpay (UPI, card, netbanking, wallets).
enum PaymentModeOption {
  cod,
  online,
}

extension PaymentModeOptionX on PaymentModeOption {
  String label({bool pickup = false}) => switch (this) {
        PaymentModeOption.cod => pickup ? 'Pay at store' : 'Cash on Delivery',
        PaymentModeOption.online => 'Pay now · UPI / Card',
      };

  String title({bool pickup = false}) => switch (this) {
        PaymentModeOption.cod => pickup ? 'Pay at store' : 'Cash on Delivery',
        PaymentModeOption.online => 'Pay now',
      };

  IconData get icon => switch (this) {
        PaymentModeOption.cod => Icons.payments_outlined,
        PaymentModeOption.online => Icons.credit_card_rounded,
      };
}

const _legacyOnlineModes = {'gpay', 'phonepe', 'paytm', 'anyUpi', 'card'};

PaymentModeOption? paymentModeFromName(String? name) {
  if (name == null || name.isEmpty) return null;
  if (_legacyOnlineModes.contains(name)) return PaymentModeOption.online;
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
