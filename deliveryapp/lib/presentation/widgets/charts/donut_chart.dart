import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';

class DonutSegment {
  const DonutSegment({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final double value;
  final Color color;
}

class DonutChart extends StatelessWidget {
  const DonutChart({
    super.key,
    required this.segments,
    required this.centerTitle,
    this.centerSubtitle,
    this.size = 136,
    this.thickness = 16,
  });

  final List<DonutSegment> segments;
  final String centerTitle;
  final String? centerSubtitle;
  final double size;
  final double thickness;

  @override
  Widget build(BuildContext context) {
    final total = segments.fold<double>(0, (s, e) => s + (e.value > 0 ? e.value : 0));
    final visible = segments.where((s) => s.value > 0).toList();
    final sections = total <= 0
        ? [
            PieChartSectionData(
              value: 1,
              color: AppColors.border,
              radius: thickness,
              showTitle: false,
            ),
          ]
        : [
            for (final s in visible)
              PieChartSectionData(
                value: s.value,
                color: s.color,
                radius: thickness,
                showTitle: false,
              ),
          ];

    return Row(
      children: [
        SizedBox(
          width: size,
          height: size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              PieChart(
                PieChartData(
                  sections: sections,
                  centerSpaceRadius: size / 2 - thickness,
                  sectionsSpace: visible.length > 1 ? 2 : 0,
                  startDegreeOffset: -90,
                  pieTouchData: PieTouchData(enabled: false),
                ),
                duration: const Duration(milliseconds: 450),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    centerTitle,
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (centerSubtitle != null)
                    Text(
                      centerSubtitle!,
                      style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final s in segments)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(color: s.color, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          s.label,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                      Text(
                        s.value % 1 == 0 ? '${s.value.toInt()}' : s.value.toStringAsFixed(1),
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (total > 0) ...[
                        const SizedBox(width: 6),
                        SizedBox(
                          width: 40,
                          child: Text(
                            '${(s.value / total * 100).round()}%',
                            textAlign: TextAlign.right,
                            style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
