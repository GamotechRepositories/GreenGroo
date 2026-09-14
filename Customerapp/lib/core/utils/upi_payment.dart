import 'dart:io';

import 'package:url_launcher/url_launcher.dart';

import '../../config/constants.dart';
import '../../config/env.dart';

class UpiPayment {
  UpiPayment._();

  static double getPayableAmount(double orderTotal, String paymentMethod) {
    if (paymentMethod == 'cod') {
      return (orderTotal * AppConstants.codAdvancePercent * 100).round() / 100;
    }
    return (orderTotal * 100).round() / 100;
  }

  static String buildPaymentQuery(
    double amount,
    String note, {
    String? merchantUpiId,
    String? merchantUpiName,
  }) {
    return _buildUpiQuery(
      amount,
      note,
      merchantUpiId: merchantUpiId,
      merchantUpiName: merchantUpiName,
    );
  }

  static String buildUpiUri(
    double amount, {
    String note = 'Order',
    String? merchantUpiId,
    String? merchantUpiName,
  }) {
    final query = _buildUpiQuery(
      amount,
      note,
      merchantUpiId: merchantUpiId,
      merchantUpiName: merchantUpiName,
    );
    return query.isEmpty ? '' : 'upi://pay?$query';
  }

  static String getQrCodeImageUrl(
    double amount, {
    String note = 'Order',
    String? merchantUpiId,
    String? merchantUpiName,
  }) {
    final uri = buildUpiUri(
      amount,
      note: note,
      merchantUpiId: merchantUpiId,
      merchantUpiName: merchantUpiName,
    );
    if (uri.isEmpty) return '';
    return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${Uri.encodeComponent(uri)}';
  }

  static String buildAndroidIntent(
    double amount, {
    String note = 'Order',
    String? merchantUpiId,
    String? merchantUpiName,
  }) {
    final query = _buildUpiQuery(
      amount,
      note,
      merchantUpiId: merchantUpiId,
      merchantUpiName: merchantUpiName,
    );
    return query.isEmpty ? '' : 'intent://pay?$query#Intent;scheme=upi;end';
  }

  static String _resolveUpiId(String? merchantUpiId) {
    final configured = merchantUpiId?.trim() ?? '';
    if (configured.isNotEmpty) return configured;
    return Env.merchantUpiId.trim();
  }

  static String _resolveUpiName(String? merchantUpiName) {
    final configured = merchantUpiName?.trim() ?? '';
    if (configured.isNotEmpty) return configured;
    return Env.merchantUpiName.trim();
  }

  static String _buildUpiQuery(
    double amount,
    String note, {
    String? merchantUpiId,
    String? merchantUpiName,
  }) {
    final upiId = _resolveUpiId(merchantUpiId);
    if (upiId.isEmpty) return '';

    final parts = <String>[
      'pa=${Uri.encodeComponent(upiId)}',
      'am=${Uri.encodeComponent(amount.toStringAsFixed(2))}',
      'cu=INR',
    ];

    final merchantName = _resolveUpiName(merchantUpiName);
    if (merchantName.isNotEmpty) {
      parts.insert(1, 'pn=${Uri.encodeComponent(merchantName)}');
    }

    final safeNote = _sanitizeNote(note);
    if (safeNote.isNotEmpty) {
      parts.add('tn=${Uri.encodeComponent(safeNote)}');
    }

    return parts.join('&');
  }

  static String _sanitizeNote(String note) {
    final cleaned = note
        .replaceAll('%', '')
        .replaceAll(RegExp(r'[^\w\s.-]'), '')
        .trim();
    if (cleaned.length <= 40) return cleaned;
    return cleaned.substring(0, 40);
  }

  static bool isValidUpiId(String value) {
    return RegExp(r'^[\w.-]+@[\w.-]+$').hasMatch(value.trim());
  }

  /// Opens the OS UPI app picker — only installed UPI apps are shown.
  static Future<bool> openUpiChooser({
    required double amount,
    String note = 'Order',
    String? merchantUpiId,
    String? merchantUpiName,
  }) async {
    final query = buildPaymentQuery(
      amount,
      note,
      merchantUpiId: merchantUpiId,
      merchantUpiName: merchantUpiName,
    );
    if (query.isEmpty) return false;

    if (Platform.isAndroid) {
      final intentUri = Uri.parse('intent://pay?$query#Intent;scheme=upi;end');
      if (await canLaunchUrl(intentUri)) {
        return launchUrl(intentUri, mode: LaunchMode.externalApplication);
      }
    }

    final upiUri = Uri.parse('upi://pay?$query');
    if (!await canLaunchUrl(upiUri)) return false;
    return launchUrl(upiUri, mode: LaunchMode.externalApplication);
  }
}
