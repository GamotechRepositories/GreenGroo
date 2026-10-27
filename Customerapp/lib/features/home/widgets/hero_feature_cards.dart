import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../routes/route_paths.dart';

const _green = Color(0xFF0A6C38);

/// Website HeroFeatureCards (mobile): swipeable farmer / QR / tracking cards.
class HeroFeatureCards extends StatefulWidget {
  const HeroFeatureCards({super.key});

  @override
  State<HeroFeatureCards> createState() => _HeroFeatureCardsState();
}

class _HeroFeatureCardsState extends State<HeroFeatureCards> {
  final _controller = ScrollController();
  int _active = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cardWidth = (MediaQuery.sizeOf(context).width * 0.88).clamp(0.0, 360.0);
    final cards = [
      (
        image: 'assets/website/feature_farmer.jpg',
        title: 'Meet Your Farmer',
        subtitle: 'शेतकऱ्यांना भेटा',
        description: 'प्रत्येक उत्पादनामागील खरी कहाणी जाणून घ्या.',
        button: 'शेतकरी प्रोफाईल',
        onTap: () => _showFarmers(context),
      ),
      (
        image: 'assets/website/feature_scan_qr.jpg',
        title: 'Scan & Know',
        subtitle: 'उत्पादनाची खरी माहिती',
        description: 'QR स्कॅन करा आणि कापणी, पॅकिंग, गुणवत्ता पहा.',
        button: 'QR स्कॅन करा',
        onTap: () => _showScanInfo(context),
      ),
      (
        image: 'assets/website/feature_track_order.jpg',
        title: 'Track Your Order',
        subtitle: 'ऑर्डरचा मागोवा घ्या',
        description: 'शेतापासून तुमच्या घरापर्यंत संपूर्ण प्रवास पाहा.',
        button: 'माझा ऑर्डर ट्रॅक करा',
        onTap: () => context.go(RoutePaths.orders),
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        children: [
          SizedBox(
            height: 128,
            child: NotificationListener<ScrollNotification>(
              onNotification: (_) {
                final i = (_controller.offset / (cardWidth + 12)).round().clamp(0, cards.length - 1);
                if (i != _active) setState(() => _active = i);
                return false;
              },
              child: ListView.separated(
                controller: _controller,
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                physics: const PageScrollPhysics().applyTo(const BouncingScrollPhysics()),
                itemCount: cards.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) {
                  final c = cards[i];
                  return GestureDetector(
                    onTap: c.onTap,
                    child: Container(
                      width: cardWidth,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF4FAF6),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFD2EAD7)),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          SizedBox(width: 112, child: Image.asset(c.image, fit: BoxFit.cover)),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    c.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF113821),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    c.subtitle,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.notoSansDevanagari(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: _green,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    c.description,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.notoSansDevanagari(
                                      fontSize: 10.5,
                                      height: 1.3,
                                      color: const Color(0xFF4B5563),
                                    ),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: _green,
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Flexible(
                                          child: Text(
                                            c.button,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: GoogleFonts.notoSansDevanagari(
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 5),
                                        const Icon(Icons.arrow_forward_rounded,
                                            size: 13, color: Colors.white),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(cards.length, (i) {
              final active = i == _active;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: active ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: active ? _green : const Color(0xFFD1D5DB),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

Widget _dialogShell(
  BuildContext context, {
  required IconData icon,
  required String title,
  required String subtitle,
  required List<Widget> children,
  required List<Widget> actions,
}) {
  return Dialog(
    insetPadding: const EdgeInsets.all(16),
    backgroundColor: Colors.white,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: const BorderSide(color: Color(0xFFD2EAD7)),
    ),
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF7EE),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: _green, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.notoSansDevanagari(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF111827),
                      ),
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _green,
                      ),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: const Icon(Icons.close_rounded, color: Color(0xFF9CA3AF)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
          const SizedBox(height: 16),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: actions),
        ],
      ),
    ),
  );
}

Widget _pillButton(String label, VoidCallback onTap, {bool expand = false}) {
  final button = ElevatedButton(
    onPressed: onTap,
    style: ElevatedButton.styleFrom(
      backgroundColor: _green,
      foregroundColor: Colors.white,
      elevation: 0,
      shape: const StadiumBorder(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
    ),
    child: Text(
      label,
      style: GoogleFonts.notoSansDevanagari(fontSize: 12, fontWeight: FontWeight.w600),
    ),
  );
  return expand ? Expanded(child: button) : button;
}

void _showFarmers(BuildContext context) {
  final farmers = [
    (
      image: 'assets/website/feature_farmer.jpg',
      name: 'तुकाराम शिंदे (Tukaram Shinde)',
      tag: 'सेंद्रिय शेती',
      place: 'सातारा (Satara, Maharashtra)',
      detail: 'पालक, मेथी, शेपू आणि देशी भाज्यांचे विशेषज्ञ (12 वर्षांचा अनुभव).',
    ),
    (
      image: 'assets/website/farmer_ramesh_avatar.jpg',
      name: 'रमेश पाटील (Ramesh Patil)',
      tag: 'नैसर्गिक खत',
      place: 'नाशिक (Nashik, Maharashtra)',
      detail: 'टोमॅटो, वांगी, गाजर आणि कांदा (विना कीटकनाशक).',
    ),
  ];
  showDialog<void>(
    context: context,
    builder: (ctx) => _dialogShell(
      ctx,
      icon: Icons.groups_rounded,
      title: 'शेतकऱ्यांना भेटा (Meet Our Farmers)',
      subtitle: '100% Direct From Local Organic Farmers',
      children: [
        for (final f in farmers)
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF7FBF8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFDCEDDF)),
            ),
            child: Row(
              children: [
                CircleAvatar(radius: 28, backgroundImage: AssetImage(f.image)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        f.name,
                        style: GoogleFonts.notoSansDevanagari(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF111827),
                        ),
                      ),
                      Container(
                        margin: const EdgeInsets.only(top: 2),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEAF7EE),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          f.tag,
                          style: GoogleFonts.notoSansDevanagari(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: _green,
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 14, color: _green),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              f.place,
                              style: GoogleFonts.notoSansDevanagari(
                                fontSize: 11.5,
                                color: const Color(0xFF4B5563),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        f.detail,
                        style: GoogleFonts.notoSansDevanagari(
                          fontSize: 11,
                          color: const Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(ctx).pop();
            context.push(RoutePaths.about);
          },
          child: Text(
            'आमच्याबद्दल अधिक वाचा →',
            style: GoogleFonts.notoSansDevanagari(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: _green,
            ),
          ),
        ),
        _pillButton('समजले (Close)', () => Navigator.of(ctx).pop()),
      ],
    ),
  );
}

void _showScanInfo(BuildContext context) {
  final points = [
    (
      icon: Icons.check_circle_outline_rounded,
      bold: 'थेट शेतातून कापणी (Harvest Record): ',
      text: 'प्रत्येक पॅकवर कापणीची नेमकी तारीख व वेळ नोंदवलेली असते.',
    ),
    (
      icon: Icons.verified_user_outlined,
      bold: 'लॅब चाचणी प्रमाणित (Lab Tested): ',
      text: '100% कीटकनाशक-मुक्त व नैसर्गिक शेतीची खात्री.',
    ),
    (
      icon: Icons.auto_awesome_outlined,
      bold: 'कसे वापरावे? ',
      text: 'तुमच्या डिलिव्हर झालेल्या पॅकवरील QR कोड स्कॅन करा आणि शेतकरी व शेताचा तपशील थेट पाहा!',
    ),
  ];
  showDialog<void>(
    context: context,
    builder: (ctx) => _dialogShell(
      ctx,
      icon: Icons.qr_code_2_rounded,
      title: 'उत्पादनाची खरी माहिती (Scan & Know)',
      subtitle: 'Farm-to-Fork Live Verification',
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF7FBF8),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFDCEDDF)),
          ),
          child: Column(
            children: [
              for (final p in points)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(p.icon, size: 16, color: _green),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: p.bold,
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              TextSpan(text: p.text),
                            ],
                          ),
                          style: GoogleFonts.notoSansDevanagari(
                            fontSize: 12,
                            color: const Color(0xFF374151),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
      actions: [_pillButton('समजले (Got it)', () => Navigator.of(ctx).pop(), expand: true)],
    ),
  );
}
