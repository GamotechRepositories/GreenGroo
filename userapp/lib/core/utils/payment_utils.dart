class PaymentPlan {
  static const advance = 'cod_advance';
  static const full = 'online';
}

class PaymentStatus {
  static const unpaid = 'unpaid';
  static const paid10 = 'paid_10';
  static const paid = 'paid';
}

class PaymentUtils {
  static const advancePercent = 0.1;

  static double advanceAmount(double total) =>
      ((total * advancePercent * 100).roundToDouble()) / 100;

  /// Recorded advance from Razorpay/UPI transaction — not recalculated from order total.
  static double recordedAdvanceAmount({
    required double total,
    required String paymentStatus,
    double codAdvanceAmount = 0,
  }) {
    if (paymentStatus != PaymentStatus.paid10) return 0;
    if (codAdvanceAmount > 0) return codAdvanceAmount;
    return 0;
  }

  static double payableAmount(double total, String paymentPlan) {
    if (paymentPlan == PaymentPlan.advance) {
      return advanceAmount(total);
    }
    return ((total * 100).roundToDouble()) / 100;
  }

  static String checkoutPaymentMethod(String paymentPlan) =>
      paymentPlan == PaymentPlan.advance ? 'cod' : 'online';

  static String paymentStatusLabel(String? status) {
    switch (status) {
      case PaymentStatus.paid10:
        return 'Paid 10%';
      case PaymentStatus.paid:
        return 'Paid';
      case PaymentStatus.unpaid:
        return 'Unpaid';
      default:
        return status ?? 'Unpaid';
    }
  }
}
