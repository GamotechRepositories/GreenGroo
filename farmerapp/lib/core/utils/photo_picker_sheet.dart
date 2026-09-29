import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../constants/app_colors.dart';

import '../../services/app_language.dart';
/// Decoded bytes of inline base64 images, reused across rebuilds. Handing
/// Image.memory the same Uint8List instance lets Flutter's ImageCache hit
/// instead of decoding the picture again on every rebuild.
class _DecodedImageCache {
  static const int _maxBytes = 24 * 1024 * 1024;
  static final Map<String, Uint8List> _entries = <String, Uint8List>{};
  static int _bytes = 0;

  static Uint8List decode(String source, String b64) {
    final cached = _entries.remove(source);
    if (cached != null) {
      _entries[source] = cached;
      return cached;
    }
    final bytes = base64Decode(b64);
    if (bytes.length <= _maxBytes ~/ 4) {
      _entries[source] = bytes;
      _bytes += bytes.length;
      while (_bytes > _maxBytes && _entries.isNotEmpty) {
        final oldest = _entries.keys.first;
        _bytes -= _entries.remove(oldest)!.length;
      }
    }
    return bytes;
  }
}

/// Helper widget to render images whether they are Base64 strings, Network URLs, or PDF documents.
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

  /// Decode width for fixed-size boxes. The 3x margin keeps BoxFit.cover crops
  /// of wide or tall photos sharp; Flutter never upscales past the source size.
  int? _decodeWidth(BuildContext context) {
    final w = width, h = height;
    if (w == null || h == null || !w.isFinite || !h.isFinite || w <= 0 || h <= 0) return null;
    final side = w > h ? w : h;
    return (side * MediaQuery.devicePixelRatioOf(context) * 3).round();
  }

  @override
  Widget build(BuildContext context) {
    Widget content;
    final clean = imageStr.trim();
    final decodeWidth = _decodeWidth(context);

    if (clean.isEmpty) {
      content = fallback ?? _buildDefaultFallback();
    } else if (clean.startsWith('data:application/pdf') || clean.toLowerCase().endsWith('.pdf')) {
      content = Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: borderRadius ?? BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFFECACA)),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFDC2626), size: 22),
              SizedBox(height: 2),
              Text(
                AppLanguage().tr(mr: 'PDF कागदपत्र', en: 'PDF DOC'),
                style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
              ),
            ],
          ),
        ),
      );
    } else if (clean.startsWith('data:image')) {
      try {
        final commaIdx = clean.indexOf(',');
        final b64 = commaIdx != -1 ? clean.substring(commaIdx + 1) : clean;
        final bytes = _DecodedImageCache.decode(clean, b64);
        content = Image.memory(
          bytes,
          width: width,
          height: height,
          fit: fit,
          cacheWidth: decodeWidth,
          gaplessPlayback: true,
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
        cacheWidth: decodeWidth,
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
    } else if (clean.startsWith('/') || clean.startsWith('file://') || File(clean).existsSync()) {
      try {
        final filePath = clean.startsWith('file://') ? clean.replaceFirst('file://', '') : clean;
        content = Image.file(
          File(filePath),
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (_, _, _) => fallback ?? _buildDefaultFallback(),
        );
      } catch (_) {
        content = fallback ?? _buildDefaultFallback();
      }
    } else if (clean.length > 100 && !clean.contains(' ') && RegExp(r'^[A-Za-z0-9+/=\s]+$').hasMatch(clean)) {
      try {
        final bytes = _DecodedImageCache.decode(
          clean,
          clean.replaceAll('\n', '').replaceAll('\r', '').replaceAll(' ', ''),
        );
        content = Image.memory(
          bytes,
          width: width,
          height: height,
          fit: fit,
          cacheWidth: decodeWidth,
          gaplessPlayback: true,
          errorBuilder: (_, _, _) => fallback ?? _buildDefaultFallback(),
        );
      } catch (_) {
        content = fallback ?? _buildDefaultFallback();
      }
    } else {
      content = fallback ?? _buildDefaultFallback();
    }

    if (borderRadius != null && !(clean.startsWith('data:application/pdf') || clean.toLowerCase().endsWith('.pdf'))) {
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

/// Universal Photo/Document Picker bottom sheet offering:
/// 1. Live Camera capture (कॅमेरा वापरा)
/// 2. Gallery picker (गॅलरी मधून निवडा)
/// 3. PDF Document picker (PDF फाईल अपलोड करा)
/// 4. Presets & URL input (नमुना फोटो / URL)
Future<void> showAppPhotoPicker(
  BuildContext context, {
  required ValueChanged<String> onPhotoSelected,
  String? title,
  String? subtitle,
  String? presetCategory,
  bool allowPdf = true,
  bool allowSamples = true,
}) async {
  final String sheetTitle = title ?? AppLanguage().tr(mr: 'फोटो / डॉक्युमेंट निवडा', en: 'Upload Photo / Document');
  final String sheetSubtitle = subtitle ?? AppLanguage().tr(mr: 'कॅमेऱ्याने फोटो काढा, गॅलरी किंवा PDF फाईल निवडा', en: 'Take a photo, choose from gallery or pick a PDF file');
  final ImagePicker picker = ImagePicker();

  void onPickFailed(Object error) {
    if (!context.mounted) return;
    if (allowSamples) {
      _showFallbackDialog(context, onPhotoSelected, presetCategory);
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLanguage().tr(mr: 'फाईल निवडता आली नाही. पुन्हा प्रयत्न करा. ($error)', en: 'Could not pick the file. Please try again. ($error)')),
        backgroundColor: const Color(0xFFDC2626),
      ),
    );
  }

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
      onPickFailed(e);
    }
  }

  Future<void> pickPdfFile() async {
    try {
      final files = await FilePickerPlatform.instance.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      );

      if (files.isNotEmpty) {
        final file = files.first;
        Uint8List? bytes;
        if (file.path != null && file.path!.isNotEmpty) {
          final f = File(file.path!);
          if (await f.exists()) {
            bytes = await f.readAsBytes();
          }
        }

        if (bytes != null) {
          final isPdf = file.name.toLowerCase().endsWith('.pdf');
          final mime = isPdf ? 'application/pdf' : 'image/jpeg';
          final base64Str = 'data:$mime;name=${Uri.encodeComponent(file.name)};base64,${base64Encode(bytes)}';
          onPhotoSelected(base64Str);
        }
      }
    } catch (e) {
      onPickFailed(e);
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
                        sheetTitle,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        sheetSubtitle,
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
              title: Text(AppLanguage().tr(mr: 'कॅमेरा वापरा', en: 'Live Camera Photo'), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
              subtitle: Text(AppLanguage().tr(mr: 'कॅमेऱ्याने लाईव्ह फोटो क्लिक करा', en: 'Live Camera Click'), style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
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
              title: Text(AppLanguage().tr(mr: 'गॅलरी निवडा', en: 'Choose from Gallery'), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
              subtitle: Text(AppLanguage().tr(mr: 'मोबाईलमधील सेव्ह असलेला फोटो अपलोड करा (JPG, PNG)', en: 'Upload a saved photo from your phone (JPG, PNG)'), style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
              onTap: () {
                Navigator.pop(ctx);
                pickWithSource(ImageSource.gallery);
              },
            ),

            // Option 3: PDF Document
            if (allowPdf)
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFDC2626), size: 22),
                ),
                title: Text(AppLanguage().tr(mr: 'PDF फाईल अपलोड करा', en: 'Upload PDF File'), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5, color: Color(0xFF991B1B))),
                subtitle: Text(AppLanguage().tr(mr: 'मोबाईलमधील ७/१२, ८-अ, केवायसी PDF कागदपत्र निवडा', en: 'Choose a 7/12, 8A or KYC PDF document from your phone'), style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
                onTap: () {
                  Navigator.pop(ctx);
                  pickPdfFile();
                },
              ),

            // Option 4: Presets & Image URL
            if (allowSamples)
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
              title: Text(AppLanguage().tr(mr: 'नमुना किंवा URL', en: 'Sample Presets / Web URL'), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
              subtitle: Text(AppLanguage().tr(mr: 'नमुना कागदपत्र किंवा डायरेक्ट URL द्वारे जोडा', en: 'Add via a sample document or direct URL'), style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
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
    {'title': AppLanguage().tr(mr: 'टोमॅटो', en: 'Tomato'), 'url': 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=500'},
    {'title': AppLanguage().tr(mr: 'कांदा', en: 'Onion'), 'url': 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=500'},
    {'title': AppLanguage().tr(mr: 'वांगी', en: 'Brinjal'), 'url': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500'},
    {'title': AppLanguage().tr(mr: 'शेत/मळा', en: 'Farm Field'), 'url': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500'},
    {'title': AppLanguage().tr(mr: 'भाजीपाला', en: 'Vegetables'), 'url': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500'},
    {'title': AppLanguage().tr(mr: 'पीक', en: 'Green Crop'), 'url': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500'},
    {'title': AppLanguage().tr(mr: 'कागदपत्र', en: 'Document / KYC'), 'url': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500'},
  ];

  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(Icons.add_photo_alternate_outlined, color: Color(0xFF217346)),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              AppLanguage().tr(mr: 'फोटो निवडा', en: 'Sample Photo / URL'),
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
            Text(
              AppLanguage().tr(mr: 'खालील नमुना फोटो निवडा किंवा फोटो URL टाका:', en: 'Choose a sample photo below or paste an image URL:'),
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
            Text(
              AppLanguage().tr(mr: 'किंवा फोटो URL / Base64 टाका:', en: 'Or enter Image URL / Base64:'),
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
          child: Text(AppLanguage().tr(mr: 'रद्द करा', en: 'Cancel'), style: TextStyle(color: Color(0xFF64748B))),
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
          child: Text(AppLanguage().tr(mr: 'फोटो लावा', en: 'Apply Photo'), style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}
