import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../constants/app_colors.dart';

/// Helper widget to render images whether they are Base64 strings or Network URLs.
class AppImageWidget extends StatelessWidget {
  final String imageStr;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Widget? fallback;
  final BorderRadius? borderRadius;

  const AppImageWidget({
    super.key,
    required this.imageStr,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.fallback,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    Widget content;
    final clean = imageStr.trim();

    if (clean.isEmpty) {
      content = fallback ?? _buildDefaultFallback();
    } else if (clean.startsWith('data:image')) {
      try {
        final commaIdx = clean.indexOf(',');
        final b64 = commaIdx != -1 ? clean.substring(commaIdx + 1) : clean;
        final bytes = base64Decode(b64);
        content = Image.memory(
          bytes,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (_, _, _) => fallback ?? _buildDefaultFallback(),
        );
      } catch (_) {
        content = fallback ?? _buildDefaultFallback();
      }
    } else if (clean.startsWith('http://') || clean.startsWith('https://')) {
      content = Image.network(
        clean,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (_, _, _) => fallback ?? _buildDefaultFallback(),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            width: width,
            height: height,
            color: const Color(0xFFF1F5F9),
            child: const Center(
              child: SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
              ),
            ),
          );
        },
      );
    } else {
      content = fallback ?? _buildDefaultFallback();
    }

    if (borderRadius != null) {
      return ClipRRect(borderRadius: borderRadius!, child: content);
    }
    return content;
  }

  Widget _buildDefaultFallback() {
    return Container(
      width: width,
      height: height,
      color: const Color(0xFFF1F5F9),
      child: const Center(
        child: Icon(Icons.image_outlined, size: 20, color: Color(0xFF94A3B8)),
      ),
    );
  }
}

/// Universal Photo Picker bottom sheet offering:
/// 1. Live Camera capture (कॅमेरा वापरा)
/// 2. Gallery picker (गॅलरी मधून निवडा)
/// 3. Presets & URL input (नमुना फोटो / URL)
Future<void> showAppPhotoPicker(
  BuildContext context, {
  required ValueChanged<String> onPhotoSelected,
  String title = 'फोटो निवडा (Upload Photo)',
  String subtitle = 'कॅमेऱ्याने लाईव्ह फोटो काढा किंवा गॅलरी मधून निवडा',
  String? presetCategory,
}) async {
  final ImagePicker picker = ImagePicker();

  Future<void> pickWithSource(ImageSource source) async {
    try {
      final XFile? picked = await picker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 80,
      );
      if (picked != null) {
        final bytes = await picked.readAsBytes();
        final base64Str = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        onPhotoSelected(base64Str);
      }
    } catch (e) {
      if (context.mounted) {
        _showFallbackDialog(context, onPhotoSelected, presetCategory);
      }
    }
  }

  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) => Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20, color: Color(0xFF64748B)),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const Divider(height: 20),

            // Option 1: Live Camera
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: const Icon(Icons.camera_alt_rounded, color: Color(0xFF059669), size: 22),
              ),
              title: const Text('Live Camera Photo (कॅमेरा वापरा)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
              subtitle: const Text('कॅमेऱ्याने लाईव्ह फोटो क्लिक करा (Live Camera Click)', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                pickWithSource(ImageSource.camera);
              },
            ),

            // Option 2: Gallery
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: const Icon(Icons.photo_library_rounded, color: Color(0xFF2563EB), size: 22),
              ),
              title: const Text('Choose from Gallery (गॅलरी निवडा)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
              subtitle: const Text('मोबाईलमधील सेव्ह असलेला फोटो अपलोड करा', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                pickWithSource(ImageSource.gallery);
              },
            ),

            // Option 3: Presets & Image URL
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3E8FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE9D5FF)),
                ),
                child: const Icon(Icons.collections_rounded, color: Color(0xFF7E22CE), size: 22),
              ),
              title: const Text('Sample Presets / Web URL (नमुना फोटो किंवा URL)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
              subtitle: const Text('टोमॅटो, कांदा, शेती नमुना फोटो किंवा डायरेक्ट URL द्या', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                _showFallbackDialog(context, onPhotoSelected, presetCategory);
              },
            ),
          ],
        ),
      ),
    ),
  );
}

void _showFallbackDialog(
  BuildContext context,
  ValueChanged<String> onPhotoSelected,
  String? presetCategory,
) {
  final urlController = TextEditingController();

  final presets = [
    {'title': 'Tomato (टोमॅटो)', 'url': 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=500'},
    {'title': 'Onion (कांदा)', 'url': 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=500'},
    {'title': 'Brinjal (वांगी)', 'url': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500'},
    {'title': 'Farm Field (शेत/मळा)', 'url': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500'},
    {'title': 'Vegetables (भाजीपाला)', 'url': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500'},
    {'title': 'Green Crop (पीक)', 'url': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500'},
    {'title': 'Document / KYC (कागदपत्र)', 'url': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500'},
  ];

  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.add_photo_alternate_outlined, color: Color(0xFF217346)),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Sample Photo / URL (फोटो निवडा)',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Choose a sample photo below or paste an image URL:',
              style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: presets.map((p) {
                return ActionChip(
                  backgroundColor: const Color(0xFFECFDF5),
                  side: const BorderSide(color: Color(0xFFA7F3D0)),
                  label: Text(
                    p['title']!,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                  ),
                  onPressed: () {
                    onPhotoSelected(p['url']!);
                    Navigator.pop(ctx);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 14),
            const Text(
              'Or enter Image URL / Base64:',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: urlController,
              style: const TextStyle(fontSize: 12),
              decoration: InputDecoration(
                hintText: 'https://example.com/photo.jpg',
                hintStyle: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF217346),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          onPressed: () {
            final val = urlController.text.trim();
            if (val.isNotEmpty) {
              onPhotoSelected(val);
            }
            Navigator.pop(ctx);
          },
          child: const Text('Apply Photo', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}
