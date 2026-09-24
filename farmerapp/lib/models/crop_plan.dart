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

  // 22 Comprehensive Agricultural Lifecycle Stages
  static const List<String> allStages = [
    'Planning Created',
    'Land Preparation',
    'Soil Testing',
    'Land Preparation Completed',
    'Seed Selection',
    'Seed Treatment',
    'Sowing / Plantation',
    'Germination Started',
    'First Fertilizer Application',
    'Irrigation',
    'Crop Growth',
    'Spray / Pest Control',
    'Weeding / Intercultivation',
    'Second Fertilizer Application',
    'Spray / Disease Control',
    'Second Irrigation',
    'Crop Monitoring',
    'Nutrient / Micronutrient Spray',
    'Flowering / Fruiting',
    'Final Fertilizer / Required Treatment',
    'Pre-Harvest Stage',
    'Ready for Harvest',
  ];
}
