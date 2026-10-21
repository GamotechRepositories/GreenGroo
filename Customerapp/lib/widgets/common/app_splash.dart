import 'package:flutter/material.dart';

import 'splash_screen_view.dart';

class AppSplash extends StatelessWidget {
  const AppSplash({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return const SplashScreenView(isStandalone: true);
  }
}

