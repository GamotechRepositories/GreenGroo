class CropPlan {
  final String id;
  final String cropName;
  final String variety;
  final String farmLocation;
  final double farmAreaAcres;
  final DateTime sowingDate;
  final DateTime expectedHarvestDate;
  final String currentStage;
  final double estimatedProductionKg;
  final String status;

  CropPlan({
    required this.id,
    required this.cropName,
    required this.variety,
    required this.farmLocation,
    required this.farmAreaAcres,
    required this.sowingDate,
    required this.expectedHarvestDate,
    required this.currentStage,
    required this.estimatedProductionKg,
    required this.status,
  });

  // 26 Comprehensive Agricultural Lifecycle Stages
  static const List<String> allStages = [
    'Planning Created',
    'Soil Testing Pending',
    'Soil Testing Completed',
    'Soil Report Uploaded',
    'Soil Report Under Review',
    'Soil Report Approved',
    'Land Preparation',
    'Crop & Variety Selected',
    'Seed/Input Planning',
    'Sowing/Plantation Started',
    'Sowing/Plantation Completed',
    'Crop Growing',
    'Irrigation in Progress',
    'Fertilizer Application',
    'Pesticide Application',
    'Pest/Disease Monitoring',
    'Field Inspection Pending',
    'Field Inspection Completed',
    'Crop Growth Monitoring',
    'Pre-Harvest Inspection',
    'Harvest Readiness',
    'Ready for Harvest',
    'Harvesting Started',
    'Harvesting In Progress',
    'Harvesting Completed',
    'Harvest Quantity Recorded',
    'Harvest Batch Created',
    'Completed',
  ];
}
