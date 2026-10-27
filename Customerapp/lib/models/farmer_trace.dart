/// Farmer traceability entered by admin / vendor on a product
/// (`farmerName`, `farmerLocation`, … plus the nested `farmerDetails`).
class FarmerTrace {
  const FarmerTrace({
    this.name = '',
    this.location = '',
    this.farmerImage = '',
    this.farmImage = '',
    this.totalArea = '',
    this.cultivationArea = '',
    this.cropCycle = '',
    this.agricultureMethod = '',
    this.lastCropTaken = '',
    this.currentCrop = '',
    this.waterSource = '',
    this.soilType = '',
    this.farmTools = '',
    this.harvestingDate = '',
    this.packingDate = '',
    this.experience = '',
    this.bio = '',
    this.crops = const [],
  });

  final String name;
  final String location;
  final String farmerImage;
  final String farmImage;
  final String totalArea;
  final String cultivationArea;
  final String cropCycle;
  final String agricultureMethod;
  final String lastCropTaken;
  final String currentCrop;
  final String waterSource;
  final String soilType;
  final String farmTools;
  final String harvestingDate;
  final String packingDate;
  final String experience;
  final String bio;
  final List<FarmerCrop> crops;

  bool get isEmpty => name.isEmpty && location.isEmpty;

  factory FarmerTrace.fromProductJson(Map<String, dynamic> json) {
    final details = json['farmerDetails'] is Map<String, dynamic>
        ? json['farmerDetails'] as Map<String, dynamic>
        : const <String, dynamic>{};
    String pick(String detailKey, [String? productKey]) {
      final fromDetails = details[detailKey]?.toString().trim() ?? '';
      if (fromDetails.isNotEmpty) return fromDetails;
      return productKey == null ? '' : json[productKey]?.toString().trim() ?? '';
    }

    return FarmerTrace(
      name: pick('name', 'farmerName'),
      location: pick('location', 'farmerLocation'),
      farmerImage: pick('farmerImage', 'farmerImage'),
      farmImage: pick('farmImage', 'farmImage'),
      totalArea: pick('totalArea'),
      cultivationArea: pick('cultivationArea'),
      cropCycle: pick('cropCycle'),
      agricultureMethod: pick('agricultureMethod'),
      lastCropTaken: pick('lastCropTaken'),
      currentCrop: pick('currentCrop'),
      waterSource: pick('waterSource'),
      soilType: pick('soilType'),
      farmTools: pick('farmTools'),
      harvestingDate: pick('harvestingDate', 'harvestingDate'),
      packingDate: json['packingDate']?.toString().trim() ?? '',
      experience: pick('experience'),
      bio: pick('bio'),
      crops: (details['crops'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(FarmerCrop.fromJson)
          .where((c) => c.name.isNotEmpty || c.variety.isNotEmpty)
          .toList(),
    );
  }
}

class FarmerCrop {
  const FarmerCrop({this.name = '', this.variety = '', this.area = '', this.status = ''});

  final String name;
  final String variety;
  final String area;
  final String status;

  factory FarmerCrop.fromJson(Map<String, dynamic> json) => FarmerCrop(
        name: json['name']?.toString().trim() ?? '',
        variety: json['variety']?.toString().trim() ?? '',
        area: json['area']?.toString().trim() ?? '',
        status: json['status']?.toString().trim() ?? '',
      );
}
