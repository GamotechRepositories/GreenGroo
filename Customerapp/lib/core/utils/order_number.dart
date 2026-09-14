import '../../models/order.dart';

String getOrderNumber(Order order) {
  final num = order.orderNumber;
  if (RegExp(r'^\d{6}$').hasMatch(num)) return num;

  final digits = num.replaceAll(RegExp(r'\D'), '');
  if (digits.length >= 6) return digits.substring(digits.length - 6);

  final fromId = order.id.replaceAll(RegExp(r'\D'), '');
  final slice = fromId.length >= 6
      ? fromId.substring(fromId.length - 6)
      : fromId;
  return slice.padLeft(6, '0');
}

String getInvoiceFilename(Order order) => 'Invoice_${getOrderNumber(order)}.pdf';
