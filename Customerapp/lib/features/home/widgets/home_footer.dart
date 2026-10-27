import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../config/contact.dart';
import '../../../routes/route_paths.dart';

const footerGreen = Color(0xFF006030);

/// Website mobile footer: farmer over a green dome, logo badge, contacts,
/// social links and the copyright / legal line.
class HomeFooter extends StatelessWidget {
  const HomeFooter({super.key});

  void _open(String url) => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

  IconData _socialIcon(String platform) => switch (platform) {
        'instagram' => Icons.camera_alt_outlined,
        'facebook' => Icons.facebook_rounded,
        _ => Icons.chat_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final white = GoogleFonts.plusJakartaSans(color: Colors.white);
    final legal = white.copyWith(fontSize: 11, color: Colors.white70);

    Widget contactRow(IconData icon, Widget child, {VoidCallback? onTap}) => InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                  child: Icon(icon, color: footerGreen, size: 18),
                ),
                const SizedBox(width: 14),
                Expanded(child: child),
              ],
            ),
          ),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Stack(
          alignment: Alignment.topCenter,
          children: [
            Positioned.fill(
              top: 40,
              child: CustomPaint(painter: _DomePainter()),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Image.asset(
                'assets/website/footer_farmer_crate.webp',
                width: 270,
                fit: BoxFit.contain,
              ),
            ),
          ],
        ),
        Container(
          color: footerGreen,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Transform.translate(
                  offset: const Offset(10, -24),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(999),
                      boxShadow: const [
                        BoxShadow(color: Color(0x40000000), blurRadius: 20, offset: Offset(0, 8)),
                      ],
                    ),
                    child: Image.asset('assets/images/gg_logo.png', height: 32),
                  ),
                ),
              ),
              Text(
                'CONTACTS',
                style: white.copyWith(fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: 1),
              ),
              const SizedBox(height: 6),
              contactRow(
                Icons.location_on_rounded,
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'GreenGrocc Corporate Office',
                      style: white.copyWith(fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      ContactConfig.contactAddress,
                      style: white.copyWith(fontSize: 12, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              contactRow(
                Icons.phone_rounded,
                Text(
                  ContactConfig.contactPhoneDisplay,
                  style: white.copyWith(fontSize: 14, fontWeight: FontWeight.w500),
                ),
                onTap: () => _open(ContactConfig.contactPhoneTel),
              ),
              contactRow(
                Icons.email_rounded,
                Text(
                  ContactConfig.contactEmail,
                  style: white.copyWith(fontSize: 14, fontWeight: FontWeight.w500),
                ),
                onTap: () => _open('mailto:${ContactConfig.contactEmail}'),
              ),
              const SizedBox(height: 18),
              Center(
                child: Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 14,
                  runSpacing: 10,
                  children: [
                    for (final link in ContactConfig.socialLinks)
                      Tooltip(
                        message: link.label,
                        child: InkWell(
                          onTap: () => _open(link.href),
                          customBorder: const CircleBorder(),
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white60),
                            ),
                            child: Icon(_socialIcon(link.platform), color: Colors.white, size: 19),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Divider(color: Color(0x26FFFFFF), height: 1),
              const SizedBox(height: 14),
              Center(
                child: Wrap(
                  alignment: WrapAlignment.center,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    Text('© ${DateTime.now().year}, GreenGrocc', style: legal),
                    Text('|', style: legal.copyWith(color: Colors.white54)),
                    GestureDetector(
                      onTap: () => context.push(RoutePaths.privacyPolicy),
                      child: Text('Privacy Policy', style: legal),
                    ),
                    Text('|', style: legal.copyWith(color: Colors.white54)),
                    GestureDetector(
                      onTap: () => context.push(RoutePaths.terms),
                      child: Text('Terms & Conditions', style: legal),
                    ),
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

/// Website `M0,120 Q500,5 1000,120` dome on top of the green block.
class _DomePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const arc = 71.0;
    final path = Path()
      ..moveTo(0, arc)
      ..quadraticBezierTo(size.width / 2, 3, size.width, arc)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path, Paint()..color = footerGreen);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
