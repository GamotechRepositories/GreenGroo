import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';

class VehicleSelectionScreen extends StatefulWidget {
  const VehicleSelectionScreen({super.key});

  @override
  State<VehicleSelectionScreen> createState() => _VehicleSelectionScreenState();
}

class _VehicleSelectionScreenState extends State<VehicleSelectionScreen> {
  String? _selected;

  static const _options = [
    _VehicleOption(
      id: 'motorcycle',
      title: 'Motorcycle',
      image: AppAssets.motorcycle,
    ),
    _VehicleOption(
      id: 'bicycle',
      title: 'Bicycle',
      image: AppAssets.bicycle,
    ),
    _VehicleOption(
      id: 'electric',
      title: 'Electric scooter',
      image: AppAssets.ebike,
    ),
    _VehicleOption(
      id: 'van',
      title: 'Van',
      image: AppAssets.van,
    ),
    _VehicleOption(
      id: 'no_vehicle',
      title: "I don't have a vehicle",
      subtitle: "No vehicle? We'll help!",
      isNoVehicle: true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Select vehicle',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: false,
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                itemCount: _options.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final option = _options[index];
                  return _VehicleCard(
                    option: option,
                    selected: _selected == option.id,
                    onTap: () => setState(() => _selected = option.id),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
              child: _NextButton(
                enabled: _selected != null,
                onPressed: _selected == null
                    ? null
                    : () => Navigator.pushNamed(context, AppRoutes.selectCity),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VehicleOption {
  const _VehicleOption({
    required this.id,
    required this.title,
    this.subtitle,
    this.image,
    this.isNoVehicle = false,
  });

  final String id;
  final String title;
  final String? subtitle;
  final String? image;
  final bool isNoVehicle;
}

class _VehicleCard extends StatelessWidget {
  const _VehicleCard({
    required this.option,
    required this.selected,
    required this.onTap,
  });

  final _VehicleOption option;
  final bool selected;
  final VoidCallback onTap;

  static const _footerColor = Color(0xFF2B2B2B);
  static const _imageHeight = 118.0;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppColors.primary : Colors.transparent,
              width: 2,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  height: _imageHeight,
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  child: option.isNoVehicle
                      ? const _NoVehicleIllustration()
                      : Image.asset(
                          option.image!,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) => Icon(
                            Icons.image_not_supported_outlined,
                            size: 40,
                            color: AppColors.textMuted,
                          ),
                        ),
                ),
                Container(
                  width: double.infinity,
                  color: _footerColor,
                  padding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: option.subtitle == null ? 12 : 10,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              option.title,
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                            if (option.subtitle != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                option.subtitle!,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.white.withValues(alpha: 0.65),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      _SelectionIndicator(selected: selected),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NoVehicleIllustration extends StatelessWidget {
  const _NoVehicleIllustration();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _BlockedVehicleIcon(icon: Icons.two_wheeler_rounded),
        const SizedBox(width: 20),
        Icon(
          Icons.sentiment_dissatisfied_outlined,
          size: 52,
          color: Colors.grey.shade600,
        ),
        const SizedBox(width: 20),
        _BlockedVehicleIcon(icon: Icons.pedal_bike_rounded),
      ],
    );
  }
}

class _BlockedVehicleIcon extends StatelessWidget {
  const _BlockedVehicleIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 44,
      height: 44,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(icon, size: 36, color: Colors.grey.shade500),
          CustomPaint(
            size: const Size(44, 44),
            painter: _SlashPainter(),
          ),
        ],
      ),
    );
  }
}

class _SlashPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE53935)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(
      Offset(size.width * 0.15, size.height * 0.85),
      Offset(size.width * 0.85, size.height * 0.15),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _SelectionIndicator extends StatelessWidget {
  const _SelectionIndicator({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected ? AppColors.primary : Colors.transparent,
        border: Border.all(
          color: AppColors.primary,
          width: 2,
        ),
      ),
      child: selected
          ? const Icon(Icons.check, size: 13, color: Colors.white)
          : null,
    );
  }
}

class _NextButton extends StatelessWidget {
  const _NextButton({
    required this.enabled,
    required this.onPressed,
  });

  final bool enabled;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.45),
          disabledForegroundColor: Colors.white.withValues(alpha: 0.75),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          elevation: 0,
        ),
        child: Text(
          'Next',
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
