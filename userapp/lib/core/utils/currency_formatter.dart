import 'package:intl/intl.dart';

final _inrFormatter = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
);

final _inrFormatterWithDecimals = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 2,
);

String formatInr(num value, {bool withDecimals = false}) {
  if (withDecimals) {
    return _inrFormatterWithDecimals.format(value);
  }
  return _inrFormatter.format(value);
}
