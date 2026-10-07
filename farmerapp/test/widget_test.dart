import 'package:flutter_test/flutter_test.dart';
import 'package:farmerapp/main.dart';

void main() {
  testWidgets('Haritsetu basic smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const FarmerApp());
    expect(find.text('Haritsetu'), findsOneWidget);
  });
}
