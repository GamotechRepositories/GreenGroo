import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../routes/app_router.dart';
import '../../core/utils/deep_link_utils.dart';

/// Navigates the app when opened from a shared product link or web URL.
class DeepLinkListener extends ConsumerStatefulWidget {
  const DeepLinkListener({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<DeepLinkListener> createState() => _DeepLinkListenerState();
}

class _DeepLinkListenerState extends ConsumerState<DeepLinkListener> {
  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _subscription;
  Uri? _pendingUri;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  Future<void> _init() async {
    _subscription = _appLinks.uriLinkStream.listen(_queueUri);

    final initial = await _appLinks.getInitialLink();
    if (initial != null) {
      _queueUri(initial);
    }
  }

  void _queueUri(Uri? uri) {
    if (uri == null || !mounted) return;
    _pendingUri = uri;
    WidgetsBinding.instance.addPostFrameCallback((_) => _flushPendingUri());
  }

  void _flushPendingUri() {
    if (!mounted || _pendingUri == null) return;

    final uri = _pendingUri!;
    _pendingUri = null;

    final route = mapDeepLinkToRoute(uri);
    if (route == null) {
      if (kDebugMode) {
        debugPrint('DeepLinkListener: unhandled uri=$uri');
      }
      return;
    }

    if (kDebugMode) {
      debugPrint('DeepLinkListener: navigate to $route from $uri');
    }

    ref.read(routerProvider).go(route);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
