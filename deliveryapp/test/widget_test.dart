import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:deliveryapp/main.dart';

void main() {
  testWidgets('App launches splash screen', (tester) async {
    await tester.pumpWidget(const GreenGrocDeliveryApp());
    expect(find.byType(MaterialApp), findsOneWidget);
    // Title fades in mid-animation (~1.8s+)
    await tester.pump(const Duration(milliseconds: 2200));
    expect(find.text('GreenGroc'), findsOneWidget);
    await tester.pumpAndSettle(const Duration(seconds: 5));
  });
}
