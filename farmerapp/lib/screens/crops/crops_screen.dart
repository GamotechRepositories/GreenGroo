import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/app_loader.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import '../../core/utils/photo_picker_sheet.dart';
import 'add_crop_screen.dart';
import 'crop_detail_screen.dart';
import '../products/add_product_screen.dart';
import '../main_shell.dart';

class CropsScreen extends StatefulWidget {
  const CropsScreen({super.key});

  @override
  State<CropsScreen> createState() => _CropsScreenState();
}

class _CropsScreenState extends State<CropsScreen> {
  String _search = '';

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    final s = status.toLowerCase();
    if (s.contains('progress') || s.contains('वाढ') || s.contains('सुरू')) {
      bg = const Color(0xFFEFF6FF); // blue-50
      fg = const Color(0xFF1D4ED8); // blue-700
    } else if (s.contains('harvest') || s.contains('काढणी')) {
      bg = const Color(0xFFFEF3C7); // amber-100
      fg = const Color(0xFFB45309); // amber-700
    } else if (s.contains('sold') || s.contains('विक्री') || s.contains('completed')) {
      bg = const Color(0xFFF1F5F9); // slate-100
      fg = const Color(0xFF475569); // slate-600
    } else {
      bg = const Color(0xFFECFDF5); // emerald-50
      fg = const Color(0xFF047857); // emerald-700
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: fg.withValues(alpha: 0.2)),
      ),
      child: Text(
        status,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg),
      ),
    );
  }

  void _confirmDelete(CropItem crop) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: const Text(
            'Delete crop?',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          content: const Text(
            'This will also remove the crop plan. This cannot be undone.',
            style: TextStyle(fontSize: 13, color: Color(0xFF475569)),
          ),
          actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          actions: [
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF334155),
                side: const BorderSide(color: Color(0xFFCBD5E1)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () async {
                Navigator.pop(dialogContext);
                await FarmerState().deleteCrop(crop.id);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Crop "${crop.cropName}" deleted'),
                      backgroundColor: Colors.red[700],
                      duration: const Duration(seconds: 2),
                    ),
                  );
                }
              },
              child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final allCrops = FarmerState().crops;
        final crops = allCrops.where((c) {
          final q = _search.trim().toLowerCase();
          if (q.isEmpty) return true;
          return c.cropName.toLowerCase().contains(q) ||
              c.variety.toLowerCase().contains(q) ||
              c.businessId.toLowerCase().contains(q);
        }).toList();

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.menu, color: AppColors.primaryDark),
              tooltip: 'मेनू उघडा (Menu)',
              onPressed: () => MainShell.openDrawer(context),
            ),
            title: const Text(
              'My Crops',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
          body: RefreshIndicator(
            onRefresh: () => FarmerState().refresh(),
            color: AppColors.primary,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search Bar & Add Crop Button in 1 Row
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 42,
                          child: TextField(
                            decoration: InputDecoration(
                              hintText: 'Search crop or variety (उदा. Tomato)...',
                              hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                              prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF64748B)),
                              suffixIcon: _search.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 16, color: Color(0xFF64748B)),
                                      onPressed: () => setState(() => _search = ''),
                                    )
                                  : null,
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: AppColors.primary),
                              ),
                            ),
                            onChanged: (val) => setState(() => _search = val),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 42,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text('Add Crop', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          onPressed: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const AddCropScreen()));
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Crop List / Empty State
                  if (crops.isEmpty && allCrops.isEmpty && !FarmerState().cropsReady)
                    const AppLoader(message: 'पिके लोड होत आहेत...')
                  else if (crops.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 54,
                            height: 54,
                            decoration: const BoxDecoration(
                              color: Color(0xFFF1F5F9),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.eco_outlined, size: 28, color: Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'No crops yet',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Add your first crop to start crop planning.',
                            style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Add Crop', style: TextStyle(fontWeight: FontWeight.bold)),
                            onPressed: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const AddCropScreen()));
                            },
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: crops.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final crop = crops[index];
                        final hasPhoto = crop.photos.isNotEmpty && crop.photos.first.isNotEmpty;

                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x05000000),
                                blurRadius: 4,
                                offset: Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Top row: CropPhoto, Name, Variety, Status, BusinessId, Dates
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // CropPhoto
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: Container(
                                      width: 52,
                                      height: 52,
                                      color: const Color(0xFFECFDF5),
                                      child: hasPhoto
                                          ? AppImageWidget(
                                              imageStr: crop.photos.first,
                                              width: 52,
                                              height: 52,
                                              fit: BoxFit.cover,
                                              fallback: Center(
                                                child: Text(
                                                  crop.cropName.isNotEmpty ? crop.cropName[0].toUpperCase() : 'C',
                                                  style: const TextStyle(
                                                    fontSize: 20,
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFF047857),
                                                  ),
                                                ),
                                              ),
                                            )
                                          : Center(
                                              child: Text(
                                                crop.cropName.isNotEmpty ? crop.cropName[0].toUpperCase() : 'C',
                                                style: const TextStyle(
                                                  fontSize: 20,
                                                  fontWeight: FontWeight.bold,
                                                  color: Color(0xFF047857),
                                                ),
                                              ),
                                            ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),

                                  // Details
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Name & Status
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Expanded(
                                              child: RichText(
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                text: TextSpan(
                                                  text: crop.cropName,
                                                  style: const TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFF0F172A),
                                                  ),
                                                  children: [
                                                    if (crop.variety.isNotEmpty)
                                                      TextSpan(
                                                        text: ' · ${crop.variety}',
                                                        style: const TextStyle(
                                                          fontSize: 12,
                                                          fontWeight: FontWeight.normal,
                                                          color: Color(0xFF64748B),
                                                        ),
                                                      ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            _buildStatusBadge(crop.status),
                                          ],
                                        ),
                                        const SizedBox(height: 2),

                                        // Monospace Business ID Label
                                        Text(
                                          crop.businessId,
                                          style: const TextStyle(
                                            fontFamily: 'monospace',
                                            fontSize: 10,
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFF047857),
                                            letterSpacing: 0.5,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 2),

                                        // Sowing → Harvest dates
                                        Text(
                                          '${crop.sowingDate.isNotEmpty ? crop.sowingDate : "—"} → ${crop.estHarvestDate.isNotEmpty ? crop.estHarvestDate : "—"}',
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),

                              // Progress bar
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: crop.progress,
                                  backgroundColor: const Color(0xFFF1F5F9),
                                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                                  minHeight: 5,
                                ),
                              ),
                              const SizedBox(height: 10),

                              // 4 Action Buttons Grid (View, Edit, Product, Delete)
                              Row(
                                children: [
                                  // View
                                  Expanded(
                                    child: SizedBox(
                                      height: 30,
                                      child: OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: const Color(0xFF334155),
                                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                                          backgroundColor: Colors.white,
                                          padding: EdgeInsets.zero,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                        ),
                                        onPressed: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(builder: (_) => CropDetailScreen(crop: crop)),
                                          );
                                        },
                                        child: const Text('View', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 5),

                                  // Edit
                                  Expanded(
                                    child: SizedBox(
                                      height: 30,
                                      child: OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: const Color(0xFF334155),
                                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                                          backgroundColor: Colors.white,
                                          padding: EdgeInsets.zero,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                        ),
                                        onPressed: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(builder: (_) => AddCropScreen(editCrop: crop)),
                                          );
                                        },
                                        child: const Text('Edit', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 5),

                                  // Product (Primary emerald button)
                                  Expanded(
                                    child: SizedBox(
                                      height: 30,
                                      child: ElevatedButton(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF047857),
                                          foregroundColor: Colors.white,
                                          elevation: 0,
                                          padding: EdgeInsets.zero,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                        ),
                                        onPressed: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => AddProductScreen(prefilledCrop: crop.cropName),
                                            ),
                                          );
                                        },
                                        child: const Text('Product', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 5),

                                  // Delete (Danger button)
                                  Expanded(
                                    child: SizedBox(
                                      height: 30,
                                      child: OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: const Color(0xFFDC2626),
                                          side: const BorderSide(color: Color(0xFFFEE2E2)),
                                          backgroundColor: Colors.white,
                                          padding: EdgeInsets.zero,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                        ),
                                        onPressed: () => _confirmDelete(crop),
                                        child: const Text('Delete', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
