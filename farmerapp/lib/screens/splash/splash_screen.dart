import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../services/app_language.dart';

/// Animated launch screen shown while the app initializes.
/// Calls [onFinished] once the intro animation has played and [ready] has completed.
class SplashScreen extends StatefulWidget {
  final Future<void> ready;
  final VoidCallback onFinished;

  const SplashScreen({super.key, required this.ready, required this.onFinished});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late final AnimationController _intro;
  late final AnimationController _loop;

  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<double> _ringScale;
  late final Animation<double> _titleFade;
  late final Animation<Offset> _titleSlide;
  late final Animation<double> _tagFade;

  @override
  void initState() {
    super.initState();
    _intro = AnimationController(vsync: this, duration: const Duration(milliseconds: 1700));
    _loop = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();

    _logoScale = Tween(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _intro, curve: const Interval(0.0, 0.55, curve: Curves.elasticOut)),
    );
    _logoFade = CurvedAnimation(parent: _intro, curve: const Interval(0.0, 0.25, curve: Curves.easeOut));
    _ringScale = CurvedAnimation(parent: _intro, curve: const Interval(0.05, 0.6, curve: Curves.easeOutCubic));
    _titleFade = CurvedAnimation(parent: _intro, curve: const Interval(0.4, 0.75, curve: Curves.easeOut));
    _titleSlide = Tween(begin: const Offset(0, 0.6), end: Offset.zero).animate(
      CurvedAnimation(parent: _intro, curve: const Interval(0.4, 0.8, curve: Curves.easeOutCubic)),
    );
    _tagFade = CurvedAnimation(parent: _intro, curve: const Interval(0.65, 1.0, curve: Curves.easeOut));

    _run();
  }

  Future<void> _run() async {
    await Future.wait([_intro.forward(), widget.ready]);
    if (mounted) widget.onFinished();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    precacheImage(const AssetImage('assets/images/farmer_app_icon.png'), context);
  }

  @override
  void dispose() {
    _intro.dispose();
    _loop.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.white, Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const Spacer(flex: 5),
              SizedBox(
                width: 190,
                height: 190,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    ScaleTransition(
                      scale: _ringScale,
                      child: AnimatedBuilder(
                        animation: _loop,
                        builder: (_, _) => CustomPaint(
                          size: const Size(190, 190),
                          painter: _PulseRingPainter(_loop.value),
                        ),
                      ),
                    ),
                    FadeTransition(
                      opacity: _logoFade,
                      child: ScaleTransition(
                        scale: _logoScale,
                        child: Container(
                          width: 124,
                          height: 124,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF16A34A).withValues(alpha: 0.25),
                                blurRadius: 24,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Image.asset('assets/images/farmer_app_icon.png', fit: BoxFit.cover),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              SlideTransition(
                position: _titleSlide,
                child: FadeTransition(
                  opacity: _titleFade,
                  child: const Text(
                    'GreenGrocc Farmer',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF14532D),
                      letterSpacing: -0.4,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              FadeTransition(
                opacity: _tagFade,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.eco_rounded, size: 14, color: Color(0xFF16A34A)),
                    const SizedBox(width: 4),
                    Text(
                      AppLanguage().tr(mr: 'शेतीतून समृद्धी, आपल्या हातातच!', en: 'Prosperity from farming, in your hands!'),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF166534)),
                    ),
                  ],
                ),
              ),
              const Spacer(flex: 4),
              FadeTransition(
                opacity: _tagFade,
                child: AnimatedBuilder(
                  animation: _loop,
                  builder: (_, _) => Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(3, (i) {
                      final t = (_loop.value - i * 0.18) % 1.0;
                      final lift = math.sin(t * math.pi).clamp(0.0, 1.0);
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: 9,
                        height: 9,
                        transform: Matrix4.translationValues(0, -8 * lift, 0),
                        decoration: BoxDecoration(
                          color: Color.lerp(const Color(0xFF86EFAC), const Color(0xFF16A34A), lift),
                          shape: BoxShape.circle,
                        ),
                      );
                    }),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

class _PulseRingPainter extends CustomPainter {
  final double t;
  _PulseRingPainter(this.t);

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final maxR = size.width / 2;
    for (var i = 0; i < 2; i++) {
      final p = (t + i * 0.5) % 1.0;
      final r = maxR * (0.62 + 0.38 * p);
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..color = const Color(0xFF22C55E).withValues(alpha: (1 - p) * 0.45);
      canvas.drawCircle(center, r, paint);
    }
  }

  @override
  bool shouldRepaint(_PulseRingPainter old) => old.t != t;
}
