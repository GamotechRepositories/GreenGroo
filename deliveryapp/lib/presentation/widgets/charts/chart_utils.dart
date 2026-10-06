import 'dart:math' as math;

double niceMaxY(double maxValue) {
  if (maxValue <= 0) return 4;
  final padded = maxValue * 1.15;
  final magnitude = math.pow(10, (math.log(padded) / math.ln10).floor()).toDouble();
  final normalized = padded / magnitude;
  final step = normalized <= 1
      ? 1
      : normalized <= 2
          ? 2
          : normalized <= 2.5
              ? 2.5
              : normalized <= 5
                  ? 5
                  : 10;
  final nice = step * magnitude;
  return nice < 4 ? 4 : nice;
}

String compactNumber(num value) {
  final v = value.abs();
  if (v >= 10000000) return '${_trim(value / 10000000)}Cr';
  if (v >= 100000) return '${_trim(value / 100000)}L';
  if (v >= 1000) return '${_trim(value / 1000)}k';
  return value % 1 == 0 ? value.toInt().toString() : value.toStringAsFixed(1);
}

String _trim(num v) {
  final s = v.toStringAsFixed(1);
  return s.endsWith('.0') ? s.substring(0, s.length - 2) : s;
}

String rupeeAmount(num? value) {
  final n = (value ?? 0).round();
  final digits = n.abs().toString();
  String grouped;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    final last3 = digits.substring(digits.length - 3);
    final rest = digits.substring(0, digits.length - 3).replaceAllMapped(
          RegExp(r'(\d)(?=(\d{2})+$)'),
          (m) => '${m[1]},',
        );
    grouped = '$rest,$last3';
  }
  return '${n < 0 ? '-' : ''}₹$grouped';
}
