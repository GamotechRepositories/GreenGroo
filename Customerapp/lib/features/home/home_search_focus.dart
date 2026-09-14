import 'package:flutter/material.dart';

/// Bridges header search tap to the home scroll search field without Riverpod.
class HomeSearchFocus {
  HomeSearchFocus._();

  static FocusNode? _node;

  static void attach(FocusNode node) => _node = node;

  static void detach() {
    if (_node?.hasFocus ?? false) {
      _node?.unfocus();
    }
    _node = null;
  }

  static void requestFocus() => _node?.requestFocus();
}
