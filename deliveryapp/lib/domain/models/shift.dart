enum ShiftStatus { booked, available, completed, cancelled }

class Shift {
  const Shift({
    required this.id,
    required this.dateLabel,
    required this.timeRange,
    required this.area,
    required this.status,
    this.earningPotential,
    this.ordersExpected,
  });

  final String id;
  final String dateLabel;
  final String timeRange;
  final String area;
  final ShiftStatus status;
  final String? earningPotential;
  final int? ordersExpected;

  bool get isBooked => status == ShiftStatus.booked;
  bool get isAvailable => status == ShiftStatus.available;
}
