import 'package:flutter_test/flutter_test.dart';
import 'package:farmerapp/main.dart';

void main() {
  testWidgets('Farmer App basic smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const FarmerApp());
    expect(find.text('GreenGroo Farmer'), findsOneWidget);
  });
}
