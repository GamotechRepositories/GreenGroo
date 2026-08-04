import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Opens [url] in the device browser or matching app.
Future<bool> openExternalUrl(
  String url, {
  BuildContext? context,
  String? errorMessage,
}) async {
  final uri = Uri.tryParse(url.trim());
  if (uri == null) {
    _showError(context, errorMessage ?? 'Invalid link.');
    return false;
  }

  try {
    final launched = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );
    if (!launched) {
      if (context != null && context.mounted) {
        _showError(context, errorMessage ?? 'Could not open link.');
      }
    }
    return launched;
  } catch (_) {
    if (context != null && context.mounted) {
      _showError(context, errorMessage ?? 'Could not open link.');
    }
    return false;
  }
}

void _showError(BuildContext? context, String message) {
  if (context == null || !context.mounted) return;
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message)),
  );
}
