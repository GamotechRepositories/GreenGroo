import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../config/env.dart';
import '../../../models/farmer_trace.dart';
import '../../../models/product.dart';
import '../../../widgets/common/app_network_image.dart';

const _green = Color(0xFF0A6C38);
const _border = Color(0xFFDDEADB);

/// "Meet Your Farmer" + traceability QR. The QR holds the full farmer record
/// as plain text so any phone camera / scanner shows it without the app.
class FarmerTraceabilityCard extends StatelessWidget {
  const FarmerTraceabilityCard({super.key, required this.product});

  final Product product;

  static String qrPayload(Product product) {
    final f = product.farmer;
    final lines = <String>['GreenGrocc Farm Traceability', ''];
    void add(String label, String value) {
      if (value.trim().isNotEmpty) lines.add('$label: ${value.trim()}');
    }

    add('Product', product.name);
    add('Farmer', f.name);
    add('Location', f.location);
    add('Experience', f.experience);
    add('Total area', f.totalArea);
    add('Cultivation area', f.cultivationArea);
    add('Farming method', f.agricultureMethod);
    add('Certification', product.certification);
    add('Current crop', f.currentCrop);
    add('Last crop', f.lastCropTaken);
    add('Crop cycle', f.cropCycle);
    add('Water source', f.waterSource);
    add('Soil type', f.soilType);
    add('Farm tools', f.farmTools);
    add('Harvested on', f.harvestingDate);
    add('Packed on', f.packingDate);
    if (f.crops.isNotEmpty) {
      lines.add('Crops:');
      for (final c in f.crops) {
        final parts = [
          c.name,
          if (c.variety.isNotEmpty) '(${c.variety})',
          if (c.area.isNotEmpty) '- ${c.area}',
          if (c.status.isNotEmpty) '[${c.status}]',
        ].where((s) => s.trim().isNotEmpty).join(' ');
        lines.add('  • $parts');
      }
    }
    add('About', f.bio);
    if (product.id.isNotEmpty) {
      lines
        ..add('')
        ..add('${Env.websiteAssetUrl}/product/${product.id}');
    }
    return lines.join('\n');
  }

  void _openQr(BuildContext context, String data) {
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Scan to trace this product',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1F2937)),
              ),
              const SizedBox(height: 4),
              Text(
                'Farmer, farm and harvest details',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 16),
              QrImageView(
                data: data,
                size: 260,
                backgroundColor: Colors.white,
                errorCorrectionLevel: QrErrorCorrectLevel.L,
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Close', style: TextStyle(color: _green, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final f = product.farmer;
    final data = qrPayload(product);
    final area = f.cultivationArea.isNotEmpty ? f.cultivationArea : f.totalArea;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF6FBF4),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Meet Your Farmer',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1F2937)),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              ClipOval(
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: f.farmerImage.isNotEmpty
                      ? AppNetworkImage(imageUrl: f.farmerImage, fit: BoxFit.cover)
                      : Container(
                          color: const Color(0xFFE3F1E1),
                          child: const Icon(Icons.agriculture_rounded, color: _green, size: 30),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      f.name.isNotEmpty ? f.name : 'GreenGrocc Farmer',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF14532D)),
                    ),
                    if (f.location.isNotEmpty) _InfoLine(icon: Icons.location_on_outlined, text: f.location),
                    if (area.isNotEmpty) _InfoLine(icon: Icons.spa_outlined, text: area),
                    if (f.agricultureMethod.isNotEmpty)
                      _InfoLine(icon: Icons.eco_outlined, text: f.agricultureMethod),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _DetailsGrid(farmer: f, certification: product.certification),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () => _openQr(context, data),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: _border),
              ),
              child: Row(
                children: [
                  QrImageView(
                    data: data,
                    size: 96,
                    padding: const EdgeInsets.all(4),
                    backgroundColor: Colors.white,
                    errorCorrectionLevel: QrErrorCorrectLevel.L,
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Farm Traceability QR',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF1F2937)),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Scan with any camera to see the farmer, farm, crop and harvest details.',
                          style: TextStyle(fontSize: 11.5, height: 1.35, color: Color(0xFF6B7280)),
                        ),
                        SizedBox(height: 6),
                        Text(
                          'Tap to enlarge',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _green),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 3),
      child: Row(
        children: [
          Icon(icon, size: 14, color: _green),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563)),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailsGrid extends StatelessWidget {
  const _DetailsGrid({required this.farmer, required this.certification});

  final FarmerTrace farmer;
  final String certification;

  @override
  Widget build(BuildContext context) {
    final items = <(String, String)>[
      ('Experience', farmer.experience),
      ('Current crop', farmer.currentCrop),
      ('Water source', farmer.waterSource),
      ('Soil type', farmer.soilType),
      ('Harvested', farmer.harvestingDate),
      ('Packed', farmer.packingDate),
      ('Certification', certification),
    ].where((e) => e.$2.trim().isNotEmpty).toList();
    if (items.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (label, value) in items)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _border),
            ),
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: '$label: ', style: TextStyle(color: Colors.grey.shade600)),
                  TextSpan(
                    text: value,
                    style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1F2937)),
                  ),
                ],
              ),
              style: const TextStyle(fontSize: 11.5),
            ),
          ),
      ],
    );
  }
}
