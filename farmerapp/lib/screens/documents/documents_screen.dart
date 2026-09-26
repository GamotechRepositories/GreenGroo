import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/app_loader.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../profile/farmer_liveness_check_screen.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final allDocs = FarmerState().documents;
        final uploadedDocs = allDocs.where((d) => d.isUploaded || d.fileUrl.isNotEmpty || (d.status != 'not_uploaded' && d.status.isNotEmpty)).toList();
        final pendingDocs = allDocs.where((d) => !uploadedDocs.contains(d)).toList();
        final approvedCount = uploadedDocs.where((d) => d.status == 'approved').length;
        final pendingCount = uploadedDocs.where((d) => d.status == 'pending').length;
        final rejectedCount = uploadedDocs.where((d) => d.status == 'rejected').length;
        final isAllVerified = approvedCount == allDocs.length && allDocs.isNotEmpty;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Farmer Documents (कागदपत्रे)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                Text('KYC & Vendor Verification', style: TextStyle(fontSize: 11, color: AppColors.muted)),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.add_circle_outline_rounded, color: Color(0xFF217346), size: 22),
                tooltip: 'नवीन कागदपत्र जोडा (+ Upload)',
                onPressed: () => _showUploadDocumentPicker(context, allDocs),
              ),
              IconButton(
                icon: FarmerState().isLoadingFromBackend
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF217346)),
                      )
                    : const Icon(Icons.sync_rounded, color: Color(0xFF217346), size: 22),
                tooltip: 'ताजे करा (Refresh)',
                onPressed: () async {
                  await FarmerState().fetchFromBackend();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('कागदपत्र स्थिती ताजी केली! (Status Updated) ✓'),
                        backgroundColor: Color(0xFF217346),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  }
                },
              ),
            ],
          ),
          body: SafeArea(
            child: !FarmerState().documentsReady
                ? const AppLoader(message: 'कागदपत्रे लोड होत आहेत...')
                : RefreshIndicator(
              color: const Color(0xFF217346),
              onRefresh: () async {
                await FarmerState().fetchFromBackend();
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Verification Summary Banner
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isAllVerified
                              ? const [Color(0xFF166534), Color(0xFF15803D)]
                              : (pendingCount > 0
                                  ? const [Color(0xFFB45309), Color(0xFFD97706)]
                                  : (rejectedCount > 0
                                      ? const [Color(0xFF991B1B), Color(0xFFDC2626)]
                                      : const [Color(0xFF0F766E), Color(0xFF0D9488)])),
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isAllVerified
                                  ? Icons.verified
                                  : (pendingCount > 0
                                      ? Icons.hourglass_top_rounded
                                      : (rejectedCount > 0 ? Icons.error_outline_rounded : Icons.task_alt_rounded)),
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isAllVerified
                                      ? 'शेतकरी केवायसी प्रमाणित (100% Verified)'
                                      : (pendingCount > 0
                                          ? 'व्हेंडर पडताळणी चालू (Vendor Review Pending)'
                                          : (rejectedCount > 0
                                              ? 'काही कागदपत्रे अमान्य आहेत (Action Needed)'
                                              : (uploadedDocs.isNotEmpty
                                                  ? 'कागदपत्रे अपलोड केली आहेत (Uploaded)'
                                                  : 'केवायसी कागदपत्रे प्रलंबित (Upload Required)'))),
                                  style: const TextStyle(color: Colors.white, fontSize: 14.5, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  uploadedDocs.isEmpty
                                      ? 'केवायसी पडताळणीसाठी खालील बटणावर दाबून कागदपत्र अपलोड करा.'
                                      : '${uploadedDocs.length} अपलोड केलेली कागदपत्रे • $approvedCount मंजूर • $pendingCount पडताळणी चालू${rejectedCount > 0 ? ' • $rejectedCount अमान्य' : ''}',
                                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'अपलोड केलेली कागदपत्रे (${uploadedDocs.length})',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
                        ),
                        TextButton.icon(
                          onPressed: () => _showUploadDocumentPicker(context, allDocs),
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFF217346),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          ),
                          icon: const Icon(Icons.add_circle, size: 16),
                          label: const Text('+ नवीन जोडा', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    if (uploadedDocs.isNotEmpty) ...[
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: uploadedDocs.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final doc = uploadedDocs[index];
                          return _DocumentCard(doc: doc);
                        },
                      ),
                    ],

                    if (pendingDocs.isNotEmpty) ...[
                      const SizedBox(height: 22),
                      Row(
                        children: [
                          const Icon(Icons.upload_file_rounded, size: 18, color: Color(0xFF217346)),
                          const SizedBox(width: 6),
                          Text(
                            'आवश्यक कागदपत्रे - अपलोड करा (${pendingDocs.length})',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: pendingDocs.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final doc = pendingDocs[index];
                          return _PendingDocumentCard(
                            doc: doc,
                            onTap: () => _uploadDoc(context, doc),
                          );
                        },
                      ),
                    ],
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _showUploadDocumentPicker(BuildContext context, List<DocumentItem> allDocs) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'कागदपत्र निवडा (Select Document)',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Text(
                  'अपलोड करण्यासाठी खालीलपैकी कागदपत्राचा प्रकार निवडा:',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 12),
                ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.55),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: allDocs.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (context, idx) {
                      final doc = allDocs[idx];
                      final isUploaded = doc.isUploaded || doc.fileUrl.isNotEmpty;
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: doc.type == 'video_kyc' ? const Color(0xFFEFF6FF) : const Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            doc.type == 'video_kyc' ? Icons.videocam_rounded : _getDocIconForType(doc.type),
                            color: doc.type == 'video_kyc' ? const Color(0xFF2563EB) : const Color(0xFF217346),
                            size: 22,
                          ),
                        ),
                        title: Text(
                          '${doc.title} (${doc.marathiTitle})',
                          style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                        ),
                        subtitle: Text(
                          isUploaded ? 'आधीच अपलोड केलेले आहे (${doc.status})' : 'अपलोड करण्यासाठी टॅप करा',
                          style: TextStyle(
                            fontSize: 11,
                            color: isUploaded ? const Color(0xFF059669) : const Color(0xFF64748B),
                          ),
                        ),
                        trailing: Icon(
                          isUploaded ? Icons.check_circle_rounded : Icons.arrow_forward_ios_rounded,
                          size: 16,
                          color: isUploaded ? const Color(0xFF059669) : const Color(0xFF94A3B8),
                        ),
                        onTap: () {
                          Navigator.pop(ctx);
                          _uploadDoc(context, doc);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  static IconData _getDocIconForType(String type) {
    switch (type.toLowerCase()) {
      case 'aadhaar':
        return Icons.badge_outlined;
      case 'farmer_id':
        return Icons.card_membership_outlined;
      case 'land_712':
        return Icons.assignment_outlined;
      case 'land_8a':
        return Icons.description_outlined;
      case 'bank':
        return Icons.account_balance_outlined;
      case 'farmer_photo':
        return Icons.face_outlined;
      case 'address_proof':
        return Icons.home_outlined;
      case 'pan':
        return Icons.credit_card_outlined;
      case 'video_kyc':
        return Icons.videocam_rounded;
      default:
        return Icons.description_outlined;
    }
  }

  static void _uploadDoc(BuildContext context, DocumentItem doc) {
    if (doc.type == 'video_kyc') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => FarmerLivenessCheckScreen(
            farmerName: FarmerState().profile.fullName,
            onCompleted: (String? videoUrl) {
              if (videoUrl != null && videoUrl.isNotEmpty) {
                FarmerState().uploadDocument(doc.id, fileUrl: videoUrl, status: 'pending');
              }
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('व्हिडिओ केवायसी यशस्वीपणे रेकॉर्ड झाली! व्हेंडर पडताळणी प्रलंबित आहे. (Video KYC Submitted ⏳)'),
                  backgroundColor: Color(0xFFC2410C),
                  duration: Duration(seconds: 4),
                ),
              );
            },
          ),
        ),
      );
      return;
    }

    showAppPhotoPicker(
      context,
      title: 'Upload ${doc.title} (${doc.marathiTitle})',
      subtitle: 'कॅमेऱ्याने फोटो काढा, गॅलरी मधून किंवा PDF फाईल निवडा',
      presetCategory: 'Document',
      allowPdf: true,
      onPhotoSelected: (photoStr) {
        FarmerState().uploadDocument(doc.id, fileUrl: photoStr, status: 'pending');
        final isPdf = photoStr.startsWith('data:application/pdf') || photoStr.toLowerCase().endsWith('.pdf');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${doc.title} ${isPdf ? 'PDF फाईल' : 'कागदपत्र'} अपलोड झाले! व्हेंडर पडताळणी प्रलंबित आहे. (Vendor Review Pending ⏳)'),
            backgroundColor: const Color(0xFFC2410C),
            duration: const Duration(seconds: 4),
          ),
        );
      },
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final DocumentItem doc;
  const _DocumentCard({required this.doc});

  void _uploadDocumentPhoto(BuildContext context) {
    if (doc.type == 'video_kyc') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => FarmerLivenessCheckScreen(
            farmerName: FarmerState().profile.fullName,
            onCompleted: (String? videoUrl) {
              if (videoUrl != null && videoUrl.isNotEmpty) {
                FarmerState().uploadDocument(doc.id, fileUrl: videoUrl, status: 'pending');
              }
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('व्हिडिओ केवायसी यशस्वीपणे रेकॉर्ड झाली! व्हेंडर पडताळणी प्रलंबित आहे. (Video KYC Submitted ⏳)'),
                  backgroundColor: Color(0xFFC2410C),
                  duration: Duration(seconds: 4),
                ),
              );
            },
          ),
        ),
      );
      return;
    }

    showAppPhotoPicker(
      context,
      title: 'Upload ${doc.title} (${doc.marathiTitle})',
      subtitle: 'कॅमेऱ्याने फोटो काढा, गॅलरी मधून किंवा PDF फाईल निवडा',
      presetCategory: 'Document',
      allowPdf: true,
      onPhotoSelected: (photoStr) {
        // Document goes to 'pending' state until vendor explicitly approves it
        FarmerState().uploadDocument(doc.id, fileUrl: photoStr, status: 'pending');
        final isPdf = photoStr.startsWith('data:application/pdf') || photoStr.toLowerCase().endsWith('.pdf');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${doc.title} ${isPdf ? 'PDF फाईल' : 'कागदपत्र'} अपलोड झाले! व्हेंडर पडताळणी प्रलंबित आहे. (Vendor Review Pending ⏳)'),
            backgroundColor: const Color(0xFFC2410C),
            duration: const Duration(seconds: 4),
          ),
        );
      },
    );
  }

  Future<void> _downloadDocument(BuildContext context) async {
    try {
      if (doc.fileUrl.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('कागदपत्र अपलोड केलेले नाही! (Document not uploaded)'),
            backgroundColor: Color(0xFFDC2626),
          ),
        );
        return;
      }

      final isPdf = doc.fileUrl.startsWith('data:application/pdf') || doc.fileUrl.toLowerCase().endsWith('.pdf');
      final isVideo = doc.type == 'video_kyc' || doc.fileUrl.startsWith('data:video') || doc.fileUrl.toLowerCase().endsWith('.mp4');
      final ext = isPdf ? 'pdf' : (isVideo ? 'mp4' : 'jpg');
      final mimeType = isPdf ? 'application/pdf' : (isVideo ? 'video/mp4' : 'image/jpeg');
      final tempDir = await getTemporaryDirectory();
      final sanitizedTitle = doc.title.replaceAll(RegExp(r'[^\w\s-]'), '').replaceAll(' ', '_');
      final fileName = '${sanitizedTitle}_${DateTime.now().millisecondsSinceEpoch}.$ext';
      final file = File('${tempDir.path}/$fileName');

      if (doc.fileUrl.startsWith('data:')) {
        final commaIdx = doc.fileUrl.indexOf(',');
        final b64 = commaIdx != -1 ? doc.fileUrl.substring(commaIdx + 1) : doc.fileUrl;
        final bytes = base64Decode(b64);
        await file.writeAsBytes(bytes);
      } else {
        await file.writeAsString('Document: ${doc.title}\nMarathi: ${doc.marathiTitle}\nStatus: ${doc.status}');
      }

      // ignore: deprecated_member_use
      await Share.shareXFiles(
        [XFile(file.path, mimeType: mimeType)],
        text: 'GreenGrocc Document - ${doc.title} (${doc.marathiTitle})',
        subject: fileName,
      );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${doc.title} डाउनलोड / सेव्ह पर्याय उघडला! ✓'),
            backgroundColor: const Color(0xFF217346),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('डाउनलोड करताना त्रुटी: $e'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    }
  }

  void _openFullScreenView(BuildContext context) {
    final isPdf = doc.fileUrl.startsWith('data:application/pdf') || doc.fileUrl.toLowerCase().endsWith('.pdf');
    final isVideo = doc.type == 'video_kyc' || doc.fileUrl.startsWith('data:video') || doc.fileUrl.toLowerCase().endsWith('.mp4');
    final hasFile = doc.fileUrl.isNotEmpty;

    if (!hasFile) {
      _uploadDocumentPhoto(context);
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => Scaffold(
          backgroundColor: isPdf || isVideo ? const Color(0xFF0F172A) : Colors.black,
          appBar: AppBar(
            backgroundColor: const Color(0xFF1E293B),
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(ctx),
            ),
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doc.title,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                Text(
                  doc.marathiTitle,
                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.download_rounded, color: Colors.white),
                tooltip: 'Download / Share',
                onPressed: () => _downloadDocument(context),
              ),
              IconButton(
                icon: const Icon(Icons.edit_outlined, color: Colors.white),
                tooltip: 'Re-upload / बदला',
                onPressed: () {
                  Navigator.pop(ctx);
                  _uploadDocumentPhoto(context);
                },
              ),
            ],
          ),
          body: Center(
            child: isVideo
                ? Container(
                    margin: const EdgeInsets.all(24),
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 20, spreadRadius: 5),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: const BoxDecoration(
                            color: Color(0xFFEFF6FF),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.videocam_rounded, color: Color(0xFF2563EB), size: 56),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '${doc.title}.mp4',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          doc.marathiTitle,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: doc.status == 'approved' ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            doc.status == 'approved' ? 'Approved (व्हेंडर मंजूर ✓)' : 'Under Review (व्हेंडर पडताळणी चालू ⏳)',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: doc.status == 'approved' ? const Color(0xFF065F46) : const Color(0xFF92400E),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF217346),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              icon: const Icon(Icons.download_rounded, size: 16),
                              label: const Text('Download / Share Video', style: TextStyle(fontWeight: FontWeight.bold)),
                              onPressed: () => _downloadDocument(context),
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                : isPdf
                    ? Container(
                        margin: const EdgeInsets.all(24),
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 20, spreadRadius: 5),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: const BoxDecoration(
                                color: Color(0xFFFEF2F2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFDC2626), size: 56),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              '${doc.title}.pdf',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              doc.marathiTitle,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: doc.status == 'approved' ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                doc.status == 'approved' ? 'Approved (व्हेंडर मंजूर ✓)' : 'Under Review (व्हेंडर पडताळणी चालू ⏳)',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: doc.status == 'approved' ? const Color(0xFF065F46) : const Color(0xFF92400E),
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF217346),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  icon: const Icon(Icons.download_rounded, size: 16),
                                  label: const Text('Download / Share PDF', style: TextStyle(fontWeight: FontWeight.bold)),
                                  onPressed: () => _downloadDocument(context),
                                ),
                              ],
                            ),
                          ],
                        ),
                      )
                    : InteractiveViewer(
                        panEnabled: true,
                        minScale: 0.5,
                        maxScale: 4.0,
                        child: AppImageWidget(
                          imageStr: doc.fileUrl,
                          fit: BoxFit.contain,
                        ),
                      ),
          ),
        ),
      ),
    );
  }

  void _showDocumentPreview(BuildContext context) {
    final isPdf = doc.fileUrl.startsWith('data:application/pdf') || doc.fileUrl.toLowerCase().endsWith('.pdf');
    final isVideo = doc.type == 'video_kyc' || doc.fileUrl.startsWith('data:video') || doc.fileUrl.toLowerCase().endsWith('.mp4');
    final hasFile = doc.fileUrl.isNotEmpty;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        titlePadding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        contentPadding: const EdgeInsets.all(16),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: isPdf
                    ? const Color(0xFFFEF2F2)
                    : (isVideo ? const Color(0xFFEFF6FF) : const Color(0xFFECFDF5)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                isPdf
                    ? Icons.picture_as_pdf_rounded
                    : (isVideo ? Icons.videocam_rounded : _getDocumentIcon(doc.type)),
                color: isPdf
                    ? const Color(0xFFDC2626)
                    : (isVideo ? const Color(0xFF2563EB) : const Color(0xFF059669)),
                size: 22,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(doc.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  Text(doc.marathiTitle, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                ],
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Divider(height: 16),
            if (hasFile && isVideo)
              GestureDetector(
                onTap: () {
                  Navigator.pop(ctx);
                  _openFullScreenView(context);
                },
                child: Container(
                  width: double.infinity,
                  height: 180,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.videocam_rounded, color: Color(0xFF2563EB), size: 50),
                      SizedBox(height: 8),
                      Text(
                        'Live Video KYC Recording 🎥',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E40AF)),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'व्हिडिओ पाहण्यासाठी टॅप करा (Tap to view video)',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              )
            else if (hasFile && !isPdf)
              GestureDetector(
                onTap: () {
                  Navigator.pop(ctx);
                  _openFullScreenView(context);
                },
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: double.infinity,
                        height: 190,
                        child: AppImageWidget(imageStr: doc.fileUrl, fit: BoxFit.contain),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.zoom_in, color: Colors.white, size: 14),
                            SizedBox(width: 4),
                            Text('मोठा फोटो पाहण्यासाठी टॅप करा (Zoom)', style: TextStyle(color: Colors.white, fontSize: 10)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else if (hasFile && isPdf)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFDC2626), size: 44),
                    const SizedBox(height: 8),
                    Text(
                      '${doc.title}.pdf',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF991B1B)),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 3),
                    const Text('PDF Document (कागदपत्र फाईल)', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  ],
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.upload_file_outlined, color: Color(0xFF94A3B8), size: 40),
                    SizedBox(height: 6),
                    Text('अजून कोणतेही कागदपत्र अपलोड केलेले नाही.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
              ),
            const SizedBox(height: 12),
            // Overflow-safe Status Row
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Status (स्थिती): ', style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                Expanded(
                  child: Text(
                    doc.status == 'approved'
                        ? 'Approved by Vendor (व्हेंडर मंजूर ✓)'
                        : (doc.status == 'pending'
                            ? 'Under Review (व्हेंडर पडताळणी चालू ⏳)'
                            : (doc.status == 'rejected' ? 'Rejected by Vendor (व्हेंडर अमान्य ❌)' : 'Not Uploaded (अपलोड बाकी ⚠️)')),
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.bold,
                      color: doc.status == 'approved'
                          ? const Color(0xFF059669)
                          : (doc.status == 'pending'
                              ? const Color(0xFFD97706)
                              : (doc.status == 'rejected' ? const Color(0xFFDC2626) : const Color(0xFF64748B))),
                    ),
                  ),
                ),
              ],
            ),
            if (doc.status == 'rejected' && doc.rejectionReason.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.error_outline, size: 16, color: Color(0xFFDC2626)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'अमान्य कारण (Rejection Reason):\n${doc.rejectionReason}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF991B1B), fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        actionsPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        actions: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close (बंद)', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (hasFile) ...[
                    IconButton(
                      icon: const Icon(Icons.visibility_outlined, size: 20, color: Color(0xFF2563EB)),
                      tooltip: 'View Document',
                      onPressed: () {
                        Navigator.pop(ctx);
                        _openFullScreenView(context);
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.download_rounded, size: 20, color: Color(0xFF059669)),
                      tooltip: 'Download / Share',
                      onPressed: () {
                        Navigator.pop(ctx);
                        _downloadDocument(context);
                      },
                    ),
                  ],
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF217346),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(Icons.upload, size: 14),
                    label: Text(hasFile ? 'बदला' : 'Upload', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _uploadDocumentPhoto(context);
                    },
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _getDocumentIcon(String type) {
    switch (type.toLowerCase()) {
      case 'aadhaar':
        return Icons.badge_outlined;
      case 'farmer_id':
        return Icons.card_membership_outlined;
      case 'land_712':
        return Icons.assignment_outlined;
      case 'land_8a':
        return Icons.description_outlined;
      case 'bank':
        return Icons.account_balance_outlined;
      case 'farmer_photo':
        return Icons.face_outlined;
      case 'address_proof':
        return Icons.home_outlined;
      case 'pan':
        return Icons.credit_card_outlined;
      case 'video_kyc':
        return Icons.videocam_rounded;
      default:
        return Icons.description_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    Color badgeBg;
    Color badgeText;
    String statusLabel;
    final bool isApproved = doc.status == 'approved';
    final bool isPending = doc.status == 'pending' || (doc.isUploaded && !isApproved && doc.status != 'rejected');
    final bool isRejected = doc.status == 'rejected';
    final bool isNotUploaded = (doc.status == 'not_uploaded' || !doc.isUploaded) && !isPending;

    if (isApproved) {
      badgeBg = const Color(0xFFD1FAE5);
      badgeText = const Color(0xFF065F46);
      statusLabel = 'Approved (व्हेंडर मंजूर ✓)';
    } else if (isPending) {
      badgeBg = const Color(0xFFFEF3C7);
      badgeText = const Color(0xFF92400E);
      statusLabel = 'Under Review (व्हेंडर पडताळणी चालू ⏳)';
    } else if (isRejected) {
      badgeBg = const Color(0xFFFEE2E2);
      badgeText = const Color(0xFF991B1B);
      statusLabel = 'Rejected (व्हेंडर अमान्य ❌)';
    } else {
      badgeBg = const Color(0xFFF1F5F9);
      badgeText = const Color(0xFF475569);
      statusLabel = 'Not Uploaded (अपलोड करा ⚠️)';
    }

    final hasPhoto = doc.fileUrl.isNotEmpty;
    final isPdf = doc.fileUrl.startsWith('data:application/pdf') || doc.fileUrl.toLowerCase().endsWith('.pdf');

    return InkWell(
      onTap: () {
        if (hasPhoto) {
          _openFullScreenView(context);
        } else {
          _uploadDocumentPhoto(context);
        }
      },
      onLongPress: () => _showDocumentPreview(context),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isNotUploaded ? const Color(0xFFFCA5A5) : (isApproved ? const Color(0xFFA7F3D0) : AppColors.border),
            width: isNotUploaded || isApproved ? 1.0 : 0.8,
          ),
        ),
        child: Row(
          children: [
            // Document Thumbnail / Icon (Click to open full view)
            GestureDetector(
              onTap: () {
                if (hasPhoto) {
                  _openFullScreenView(context);
                } else {
                  _uploadDocumentPhoto(context);
                }
              },
              child: hasPhoto
                  ? Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          AppImageWidget(
                            imageStr: doc.fileUrl,
                            width: 50,
                            height: 50,
                            fit: BoxFit.cover,
                          ),
                          if (!isPdf)
                            Positioned(
                              bottom: 2,
                              right: 2,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.6),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Icon(Icons.zoom_in, color: Colors.white, size: 10),
                              ),
                            ),
                        ],
                      ),
                    )
                  : Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: isNotUploaded ? const Color(0xFFFEF2F2) : AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        _getDocumentIcon(doc.type),
                        color: isNotUploaded ? const Color(0xFFDC2626) : AppColors.primary,
                        size: 24,
                      ),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          doc.title,
                          style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppColors.text),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isPdf) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: const Text('PDF', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Color(0xFFDC2626))),
                        ),
                      ],
                    ],
                  ),
                  Text(
                    doc.marathiTitle,
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(4)),
                    child: Text(statusLabel, style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: badgeText)),
                  ),
                  if (doc.status == 'rejected' && doc.rejectionReason.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(
                      'कारण: ${doc.rejectionReason}',
                      style: const TextStyle(fontSize: 9.5, color: Color(0xFFDC2626), fontWeight: FontWeight.w600),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
            if (hasPhoto) ...[
              // Explicit View Button
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  backgroundColor: const Color(0xFFEFF6FF),
                  foregroundColor: const Color(0xFF1D4ED8),
                  side: const BorderSide(color: Color(0xFFBFDBFE)),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.visibility_outlined, size: 13, color: Color(0xFF1D4ED8)),
                label: const Text('पहा', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                onPressed: () => _openFullScreenView(context),
              ),
              const SizedBox(width: 6),
            ],
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: isNotUploaded
                    ? const Color(0xFF217346)
                    : (isApproved ? const Color(0xFFF1F5F9) : const Color(0xFFFEF3C7)),
                foregroundColor: isNotUploaded
                    ? Colors.white
                    : (isApproved ? const Color(0xFF334155) : const Color(0xFF92400E)),
                elevation: isNotUploaded ? 1 : 0,
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              icon: Icon(
                doc.type == 'video_kyc'
                    ? Icons.videocam_rounded
                    : (isNotUploaded ? Icons.cloud_upload_outlined : (isApproved ? Icons.change_circle_outlined : Icons.upload_file)),
                size: 13,
              ),
              label: Text(
                doc.type == 'video_kyc'
                    ? (isNotUploaded ? 'व्हिडिओ केवायसी' : (isApproved ? 'पुन्हा केवायसी' : 'अपडेट केवायसी'))
                    : (isNotUploaded ? 'अपलोड' : (isApproved ? 'बदला' : 'अपडेट')),
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
              ),
              onPressed: () => _uploadDocumentPhoto(context),
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingDocumentCard extends StatelessWidget {
  final DocumentItem doc;
  final VoidCallback onTap;

  const _PendingDocumentCard({required this.doc, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isVideo = doc.type == 'video_kyc';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isVideo ? const Color(0xFFEFF6FF) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                isVideo ? Icons.videocam_rounded : _DocumentsScreenState._getDocIconForType(doc.type),
                color: isVideo ? const Color(0xFF2563EB) : const Color(0xFF217346),
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doc.title,
                    style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppColors.text),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    doc.marathiTitle,
                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF217346),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              icon: Icon(isVideo ? Icons.videocam_rounded : Icons.cloud_upload_outlined, size: 14),
              label: Text(isVideo ? 'केवायसी' : 'Upload', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
              onPressed: onTap,
            ),
          ],
        ),
      ),
    );
  }
}

