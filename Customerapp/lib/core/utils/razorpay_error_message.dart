import 'package:razorpay_flutter/razorpay_flutter.dart';

bool isPlaceholderUserMessage(String? value) {
  if (value == null) return true;
  final trimmed = value.trim();
  if (trimmed.isEmpty) return true;
  final lower = trimmed.toLowerCase();
  return lower == 'undefined' ||
      lower == 'null' ||
      lower == 'nan' ||
      lower == '[object object]';
}

String sanitizeUserMessage(String? value, {required String fallback}) {
  if (isPlaceholderUserMessage(value)) return fallback;
  return value!.trim();
}

String razorpayErrorMessage(PaymentFailureResponse response) {
  if (!isPlaceholderUserMessage(response.message)) {
    return response.message!.trim();
  }

  final body = response.error;
  if (body != null) {
    for (final key in ['description', 'reason', 'message', 'error']) {
      final text = body[key]?.toString();
      if (!isPlaceholderUserMessage(text)) return text!.trim();
    }

    final nested = body['error'];
    if (nested is Map) {
      for (final key in ['description', 'reason', 'message']) {
        final text = nested[key]?.toString();
        if (!isPlaceholderUserMessage(text)) return text!.trim();
      }
    }
  }

  switch (response.code) {
    case Razorpay.PAYMENT_CANCELLED:
      return 'Payment cancelled. Your order was not placed.';
    case Razorpay.NETWORK_ERROR:
      return 'Network error. Check your internet connection and try again.';
    case Razorpay.INVALID_OPTIONS:
      return 'Payment could not be started. Please try again or contact support.';
    case Razorpay.TLS_ERROR:
      return 'Secure connection failed. Please try again.';
    case Razorpay.INCOMPATIBLE_PLUGIN:
      return 'Payment setup issue. Update the app and try again.';
    default:
      return 'Payment failed. Please try again or use another payment method.';
  }
}
