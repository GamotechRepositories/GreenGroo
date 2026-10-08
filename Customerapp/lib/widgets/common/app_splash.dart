import 'package:flutter/material.dart';

import '../../config/theme.dart';
import 'app_logo.dart';

class AppSplash extends StatelessWidget {
  const AppSplash({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Image.asset(
          'assets/images/app_icon_launcher.png',
          width: 140,
          height: 140,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => const SizedBox(
            width: 140,
            height: 140,
          ),
        ),
      ),
    );
  }
}
