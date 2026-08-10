/// Daily partner targets and current progress (placeholder until API).
class DailyProgress {
  const DailyProgress({
    required this.loginMinutes,
    required this.loginTargetMinutes,
    required this.ordersCompleted,
    required this.ordersTarget,
    required this.earningsAmount,
    required this.earningsTarget,
  });

  final int loginMinutes;
  final int loginTargetMinutes;
  final int ordersCompleted;
  final int ordersTarget;
  final int earningsAmount;
  final int earningsTarget;

  double get loginProgress =>
      loginTargetMinutes == 0 ? 0 : loginMinutes / loginTargetMinutes;

  double get ordersProgress =>
      ordersTarget == 0 ? 0 : ordersCompleted / ordersTarget;

  double get earningsProgress =>
      earningsTarget == 0 ? 0 : earningsAmount / earningsTarget;

  /// Overall daily completion (average of the three goals).
  double get overallProgress {
    final values = [loginProgress, ordersProgress, earningsProgress];
    return values.reduce((a, b) => a + b) / values.length;
  }

  int get overallPercent => (overallProgress.clamp(0, 1) * 100).round();

  String get loginHoursLabel {
    final h = loginMinutes ~/ 60;
    final m = loginMinutes % 60;
    if (h == 0) return '${m}m';
    if (m == 0) return '${h}h';
    return '${h}h ${m}m';
  }

  String get loginTargetLabel {
    final h = loginTargetMinutes ~/ 60;
    return '${h}h';
  }

  String get earningsLabel => '₹ $earningsAmount';
  String get earningsTargetLabel => '₹ $earningsTarget';

  static const sample = DailyProgress(
    loginMinutes: 272,
    loginTargetMinutes: 480,
    ordersCompleted: 12,
    ordersTarget: 20,
    earningsAmount: 842,
    earningsTarget: 1200,
  );
}
