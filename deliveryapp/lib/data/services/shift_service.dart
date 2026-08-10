import '../../domain/models/shift.dart';
import '../../domain/models/daily_progress.dart';

/// Placeholder shift data until backend API is wired.
class ShiftService {
  ShiftService._();
  static final instance = ShiftService._();

  static const loginHoursToday = '4h 32m';
  static const earningsToday = '₹ 842';
  static const ordersToday = '12';

  static const dailyProgress = DailyProgress.sample;

  List<Shift> get myShifts => const [
        Shift(
          id: 's1',
          dateLabel: 'Today',
          timeRange: '10:00 AM – 2:00 PM',
          area: 'Kothrud',
          status: ShiftStatus.booked,
          earningPotential: '₹ 400–600',
          ordersExpected: 8,
        ),
        Shift(
          id: 's2',
          dateLabel: 'Tomorrow',
          timeRange: '6:00 PM – 10:00 PM',
          area: 'Baner',
          status: ShiftStatus.booked,
          earningPotential: '₹ 350–500',
          ordersExpected: 6,
        ),
        Shift(
          id: 's3',
          dateLabel: 'Wed, 12 Aug',
          timeRange: '8:00 AM – 12:00 PM',
          area: 'Hinjewadi',
          status: ShiftStatus.booked,
          earningPotential: '₹ 300–450',
          ordersExpected: 5,
        ),
      ];

  List<Shift> get availableShifts => const [
        Shift(
          id: 'a1',
          dateLabel: 'Today',
          timeRange: '2:00 PM – 6:00 PM',
          area: 'Kothrud',
          status: ShiftStatus.available,
          earningPotential: '₹ 350–550',
          ordersExpected: 7,
        ),
        Shift(
          id: 'a2',
          dateLabel: 'Tomorrow',
          timeRange: '10:00 AM – 2:00 PM',
          area: 'Wakad',
          status: ShiftStatus.available,
          earningPotential: '₹ 400–600',
          ordersExpected: 8,
        ),
        Shift(
          id: 'a3',
          dateLabel: 'Thu, 13 Aug',
          timeRange: '6:00 PM – 10:00 PM',
          area: 'Aundh',
          status: ShiftStatus.available,
          earningPotential: '₹ 300–500',
          ordersExpected: 6,
        ),
      ];
}
