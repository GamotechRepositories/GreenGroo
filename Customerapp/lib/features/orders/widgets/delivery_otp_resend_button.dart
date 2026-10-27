import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/exceptions/api_exception.dart';
import '../../../core/providers/app_providers.dart';

/// "Resend SMS" for the delivery OTP (MSG91 delivery-verify template), with a
/// countdown matching the server's resend cooldown.
class DeliveryOtpResendButton extends ConsumerStatefulWidget {
  const DeliveryOtpResendButton({
    super.key,
    required this.orderId,
    this.color = const Color(0xFF065F46),
    this.fontSize = 12,
  });

  final String orderId;
  final Color color;
  final double fontSize;

  @override
  ConsumerState<DeliveryOtpResendButton> createState() => _DeliveryOtpResendButtonState();
}

class _DeliveryOtpResendButtonState extends ConsumerState<DeliveryOtpResendButton> {
  bool _sending = false;
  int _cooldown = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startCooldown(int seconds) {
    _timer?.cancel();
    setState(() => _cooldown = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted || _cooldown <= 1) {
        t.cancel();
        if (mounted) setState(() => _cooldown = 0);
        return;
      }
      setState(() => _cooldown -= 1);
    });
  }

  int _retryAfter(Object? data, int fallback) {
    if (data is Map && data['retryAfter'] != null) {
      return int.tryParse(data['retryAfter'].toString()) ?? fallback;
    }
    return fallback;
  }

  Future<void> _resend() async {
    if (_sending || _cooldown > 0 || widget.orderId.isEmpty) return;
    setState(() => _sending = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      final res = await ref.read(apiServiceProvider).resendDeliveryOtp(widget.orderId);
      final data = res.data;
      final message = data is Map ? data['message']?.toString() : null;
      messenger.showSnackBar(SnackBar(content: Text(message ?? 'Delivery OTP sent by SMS')));
      _startCooldown(_retryAfter(data, 30));
    } on DioException catch (e) {
      final wait = _retryAfter(e.response?.data, 0);
      if (wait > 0) _startCooldown(wait);
      messenger.showSnackBar(SnackBar(content: Text(ApiException.fromDio(e).message)));
    } catch (_) {
      messenger.showSnackBar(
        const SnackBar(content: Text("Couldn't send the OTP. Please try again.")),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = _sending || _cooldown > 0;
    final label = _sending
        ? 'Sending…'
        : _cooldown > 0
            ? 'Resend in ${_cooldown}s'
            : 'Resend SMS';
    return TextButton.icon(
      onPressed: busy ? null : _resend,
      icon: Icon(Icons.sms_outlined, size: widget.fontSize + 3),
      label: Text(
        label,
        style: TextStyle(fontWeight: FontWeight.w700, fontSize: widget.fontSize),
      ),
      style: TextButton.styleFrom(
        foregroundColor: widget.color,
        disabledForegroundColor: const Color(0xFF94A3B8),
        padding: const EdgeInsets.symmetric(horizontal: 6),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}
