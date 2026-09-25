class FarmerProfile {
  final String id;
  final String fullName;
  final String mobile;
  final String email;
  final String preferredLanguage;
  final String farmName;
  final double totalAcres;
  final String? _totalFarmAreaUnit;
  final double? _cultivatedArea;
  final String? _cultivatedAreaUnit;
  final String soilType;
  final String irrigationType;
  final String waterSource;
  final String farmingMethod;
  final String? _farmingType;
  final String? _mainCrops;
  final String village;
  final String taluka;
  final String district;
  final String state;
  final String pincode;
  final String? _farmAddress;
  final double? latitude;
  final double? longitude;
  final bool? _locationConfirmed;
  final String? _kycStatus;
  final String? _bankVerificationStatus;
  final String profilePhoto;
  final String farmPhoto;
  final List<String>? _farmPhotos;
  final List<String>? _farmVideos;

  String get totalFarmAreaUnit => _totalFarmAreaUnit ?? 'Acre';
  double get cultivatedArea => _cultivatedArea ?? totalAcres;
  String get cultivatedAreaUnit => _cultivatedAreaUnit ?? 'Acre';
  String get farmingType => _farmingType ?? 'Individual (स्वतःची)';
  String get mainCrops => _mainCrops ?? '';
  String get farmAddress => _farmAddress ?? '';
  bool get locationConfirmed => _locationConfirmed ?? false;
  String get kycStatus => _kycStatus ?? 'PENDING';
  String get bankVerificationStatus => _bankVerificationStatus ?? 'PENDING';
  List<String> get farmPhotos => _farmPhotos ?? const [];
  List<String> get farmVideos => _farmVideos ?? const [];

  FarmerProfile({
    required this.id,
    required this.fullName,
    required this.mobile,
    this.email = '',
    this.preferredLanguage = 'मराठी (Marathi)',
    required this.farmName,
    required this.totalAcres,
    String? totalFarmAreaUnit,
    double? cultivatedArea,
    String? cultivatedAreaUnit,
    this.soilType = '',
    this.irrigationType = '',
    this.waterSource = '',
    this.farmingMethod = '',
    String? farmingType,
    String? mainCrops,
    this.village = '',
    this.taluka = '',
    this.district = '',
    this.state = '',
    this.pincode = '',
    String? farmAddress,
    this.latitude,
    this.longitude,
    bool? locationConfirmed,
    String? kycStatus,
    String? bankVerificationStatus,
    this.profilePhoto = '',
    this.farmPhoto = '',
    List<String>? farmPhotos,
    List<String>? farmVideos,
  })  : _totalFarmAreaUnit = totalFarmAreaUnit ?? 'Acre',
        _cultivatedArea = cultivatedArea,
        _cultivatedAreaUnit = cultivatedAreaUnit ?? 'Acre',
        _farmingType = farmingType ?? '',
        _mainCrops = mainCrops ?? '',
        _farmAddress = farmAddress ?? '',
        _locationConfirmed = locationConfirmed ?? false,
        _kycStatus = kycStatus ?? 'PENDING',
        _bankVerificationStatus = bankVerificationStatus ?? 'PENDING',
        _farmPhotos = farmPhotos ?? const [],
        _farmVideos = farmVideos ?? const [];

  FarmerProfile copyWith({
    String? id,
    String? fullName,
    String? mobile,
    String? email,
    String? preferredLanguage,
    String? farmName,
    double? totalAcres,
    String? totalFarmAreaUnit,
    double? cultivatedArea,
    String? cultivatedAreaUnit,
    String? soilType,
    String? irrigationType,
    String? waterSource,
    String? farmingMethod,
    String? farmingType,
    String? mainCrops,
    String? village,
    String? taluka,
    String? district,
    String? state,
    String? pincode,
    String? farmAddress,
    double? latitude,
    double? longitude,
    bool? locationConfirmed,
    String? kycStatus,
    String? bankVerificationStatus,
    String? profilePhoto,
    String? farmPhoto,
    List<String>? farmPhotos,
    List<String>? farmVideos,
  }) {
    return FarmerProfile(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      mobile: mobile ?? this.mobile,
      email: email ?? this.email,
      preferredLanguage: preferredLanguage ?? this.preferredLanguage,
      farmName: farmName ?? this.farmName,
      totalAcres: totalAcres ?? this.totalAcres,
      totalFarmAreaUnit: totalFarmAreaUnit ?? this.totalFarmAreaUnit,
      cultivatedArea: cultivatedArea ?? this.cultivatedArea,
      cultivatedAreaUnit: cultivatedAreaUnit ?? this.cultivatedAreaUnit,
      soilType: soilType ?? this.soilType,
      irrigationType: irrigationType ?? this.irrigationType,
      waterSource: waterSource ?? this.waterSource,
      farmingMethod: farmingMethod ?? this.farmingMethod,
      farmingType: farmingType ?? this.farmingType,
      mainCrops: mainCrops ?? this.mainCrops,
      village: village ?? this.village,
      taluka: taluka ?? this.taluka,
      district: district ?? this.district,
      state: state ?? this.state,
      pincode: pincode ?? this.pincode,
      farmAddress: farmAddress ?? this.farmAddress,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      locationConfirmed: locationConfirmed ?? this.locationConfirmed,
      kycStatus: kycStatus ?? this.kycStatus,
      bankVerificationStatus: bankVerificationStatus ?? this.bankVerificationStatus,
      profilePhoto: profilePhoto ?? this.profilePhoto,
      farmPhoto: farmPhoto ?? this.farmPhoto,
      farmPhotos: farmPhotos ?? this.farmPhotos,
      farmVideos: farmVideos ?? this.farmVideos,
    );
  }

  factory FarmerProfile.fromJson(Map<String, dynamic> json) {
    final addr = json['address'] is Map ? json['address'] as Map<String, dynamic> : <String, dynamic>{};
    final farm = json['farm'] is Map ? json['farm'] as Map<String, dynamic> : <String, dynamic>{};
    final loc = json['farmLocation'] is Map ? json['farmLocation'] as Map<String, dynamic> : <String, dynamic>{};

    double acres = 0;
    if (json['farmArea'] != null) {
      acres = double.tryParse(json['farmArea'].toString()) ?? 0;
    } else if (farm['totalFarmArea'] != null) {
      acres = double.tryParse(farm['totalFarmArea'].toString()) ?? 0;
    }

    double cultArea = acres;
    if (farm['cultivatedArea'] != null) {
      cultArea = double.tryParse(farm['cultivatedArea'].toString()) ?? acres;
    }

    String str(dynamic val, String fallback) {
      if (val == null) return fallback;
      final s = val.toString().trim();
      return s.isNotEmpty ? s : fallback;
    }

    String lang = str(json['preferredLanguage'], 'मराठी (Marathi)');
    if (!lang.contains('Marathi') && !lang.contains('Hindi') && !lang.contains('English')) {
      if (lang.toLowerCase() == 'marathi') {
        lang = 'मराठी (Marathi)';
      } else if (lang.toLowerCase() == 'hindi') {
        lang = 'हिंदी (Hindi)';
      } else if (lang.toLowerCase() == 'english') {
        lang = 'English';
      }
    }

    double? lat = loc['latitude'] != null ? double.tryParse(loc['latitude'].toString()) : null;
    double? lng = loc['longitude'] != null ? double.tryParse(loc['longitude'].toString()) : null;

    return FarmerProfile(
      id: str(json['id'] ?? json['farmerId'] ?? json['farmerCode'], ''),
      fullName: str(json['name'] ?? json['fullName'], ''),
      mobile: str(json['mobile'], ''),
      email: str(json['email'], ''),
      preferredLanguage: lang,
      farmName: str(farm['farmName'] ?? json['farmName'], ''),
      totalAcres: acres,
      totalFarmAreaUnit: str(farm['totalFarmAreaUnit'], 'Acre'),
      cultivatedArea: cultArea,
      cultivatedAreaUnit: str(farm['cultivatedAreaUnit'], 'Acre'),
      soilType: str(farm['soilType'] ?? json['soilType'], ''),
      irrigationType: str(farm['irrigationType'] ?? json['irrigationType'], ''),
      waterSource: str(farm['waterSource'], ''),
      farmingMethod: str(farm['farmingMethod'] ?? json['farmType'], ''),
      farmingType: str(farm['farmingType'], ''),
      mainCrops: str(farm['mainCrops'], ''),
      village: str(loc['village'] ?? addr['village'] ?? json['village'], ''),
      taluka: str(loc['taluka'] ?? addr['taluka'] ?? json['taluka'], ''),
      district: str(loc['district'] ?? addr['district'] ?? json['district'], ''),
      state: str(loc['state'] ?? addr['state'] ?? json['state'], ''),
      pincode: str(loc['pincode'] ?? addr['pincode'] ?? json['pincode'], ''),
      farmAddress: str(loc['farmAddress'] ?? json['farmAddress'], ''),
      latitude: lat,
      longitude: lng,
      locationConfirmed: loc['confirmed'] == true || loc['confirmed'] == 'true',
      kycStatus: str(json['verificationStatus'] ?? json['kycStatus'], 'PENDING').toUpperCase(),
      bankVerificationStatus: str(json['bankVerificationStatus'], 'PENDING').toUpperCase(),
      profilePhoto: str(json['profileImage'] ?? json['profilePhoto'], ''),
      farmPhoto: str(farm['farmPhoto'], ''),
      farmPhotos: (farm['farmPhotos'] is List) ? List<String>.from(farm['farmPhotos'].map((e) => e.toString())) : [],
      farmVideos: (farm['farmVideos'] is List) ? List<String>.from(farm['farmVideos'].map((e) => e.toString())) : [],
    );
  }
}

class CropItem {
  final String id;
  final String cropName;
  final String variety;
  final double acreage;
  final String areaUnit;
  final String sowingDate;
  final String estHarvestDate;
  final double estimatedQuantity;
  final String unit;
  final String soilType;
  final String irrigationType;
  final String farmingMethod;
  final String farmingType;
  final String farmName;
  final String farmLocation;
  final List<String> photos;
  String status;
  double progress;
  int stageIndex;

  CropItem({
    required this.id,
    required this.cropName,
    required this.variety,
    required this.acreage,
    this.areaUnit = 'Acre',
    required this.sowingDate,
    required this.estHarvestDate,
    this.estimatedQuantity = 0,
    this.unit = 'Kg',
    this.soilType = '',
    this.irrigationType = '',
    this.farmingMethod = '',
    this.farmingType = '',
    this.farmName = '',
    this.farmLocation = '',
    this.photos = const [],
    required this.status,
    required this.progress,
    required this.stageIndex,
  });

  String get businessId {
    try {
      if (id.startsWith('GGC-CRP')) return id;
      final cleanName = (cropName.isNotEmpty ? cropName : 'Crop').split(' ')[0].replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
      final code = cleanName.length >= 3 ? cleanName.substring(0, 3) : 'CRP';
      final cleanVar = (variety.isNotEmpty ? variety : 'Hybrid').split(' ')[0].replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
      final varCode = cleanVar.length >= 3 ? cleanVar.substring(0, 3) : 'HYB';
      final numDigits = id.replaceAll(RegExp(r'[^0-9]'), '');
      final serial = numDigits.isNotEmpty ? numDigits.padLeft(5, '0') : '00001';
      return 'GGC-CRP-VEG-$code-$varCode-${serial.length > 5 ? serial.substring(serial.length - 5) : serial}';
    } catch (_) {
      return 'GGC-CRP-VEG-CRP-HYB-00001';
    }
  }

  factory CropItem.fromJson(Map<String, dynamic> json) {
    double area = 1.0;
    if (json['area'] != null) {
      area = (json['area'] is num) ? (json['area'] as num).toDouble() : (double.tryParse(json['area'].toString()) ?? 1.0);
    } else if (json['acreage'] != null) {
      area = (json['acreage'] is num) ? (json['acreage'] as num).toDouble() : (double.tryParse(json['acreage'].toString()) ?? 1.0);
    }

    double estQty = 0;
    if (json['estimatedQuantity'] != null) {
      estQty = (json['estimatedQuantity'] is num) ? (json['estimatedQuantity'] as num).toDouble() : (double.tryParse(json['estimatedQuantity'].toString()) ?? 1000.0);
    }

    List<String> photoList = [];
    if (json['photos'] is List) {
      photoList = (json['photos'] as List).map((p) => p.toString()).where((p) => p.isNotEmpty).toList();
    }

    return CropItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? json['cropId']?.toString() ?? 'CRP-${DateTime.now().millisecondsSinceEpoch}',
      cropName: json['cropName']?.toString() ?? json['name']?.toString() ?? 'Crop',
      variety: json['variety']?.toString() ?? 'Hybrid',
      acreage: area,
      areaUnit: json['areaUnit']?.toString() ?? 'Acre',
      sowingDate: json['sowingDate']?.toString() ?? '',
      estHarvestDate: json['expectedHarvestDate']?.toString() ?? json['estHarvestDate']?.toString() ?? '',
      estimatedQuantity: estQty,
      unit: json['unit']?.toString() ?? 'Kg',
      soilType: json['soilType']?.toString() ?? '',
      irrigationType: json['irrigationType']?.toString() ?? '',
      farmingMethod: json['farmingMethod']?.toString() ?? '',
      farmingType: json['farmingType']?.toString() ?? '',
      farmName: json['farmName']?.toString() ?? '',
      farmLocation: json['farmLocation']?.toString() ?? '',
      photos: photoList,
      status: json['status']?.toString() ?? '',
      progress: (json['progress'] is num) ? (json['progress'] as num).toDouble() : 0,
      stageIndex: (json['stageIndex'] is int) ? json['stageIndex'] as int : 0,
    );
  }
}

class ProductItem {
  final String id;
  final String productId;
  final String productName;
  final String variety;
  final String category;
  final String cropLinked;
  final String grade; // Grade A, Grade B, Grade C
  final String unit; // Kg, Quintal, Box
  final double pricePerUnit;
  double stockQuantity;
  final double minimumOrderQuantity;
  final String farmingType;
  final String farmName;
  final String farmLocation;
  final String sowingDate;
  final String harvestDate;
  final String availableFrom;
  final String availableUntil;
  String status; // Active, Draft, Paused, Published, Out of Stock
  final String imageUrl;
  final List<String> photos;
  final double gradeAPrice;
  final double gradeAQty;
  final double gradeBPrice;
  final double gradeBQty;
  final double gradeCPrice;
  final double gradeCQty;

  ProductItem({
    String? id,
    String? productId,
    String? productName,
    String? variety,
    String? category,
    String? cropLinked,
    String? grade,
    String? unit,
    double? pricePerUnit,
    double? stockQuantity,
    double? minimumOrderQuantity,
    String? farmingType,
    String? farmName,
    String? farmLocation,
    String? sowingDate,
    String? harvestDate,
    String? availableFrom,
    String? availableUntil,
    String? status,
    String? imageUrl,
    List<String>? photos,
    double? gradeAPrice,
    double? gradeAQty,
    double? gradeBPrice,
    double? gradeBQty,
    double? gradeCPrice,
    double? gradeCQty,
  })  : id = id ?? '',
        productId = (productId != null && productId.isNotEmpty) ? productId : (id ?? ''),
        productName = productName ?? '',
        variety = variety ?? '',
        category = category ?? '',
        cropLinked = cropLinked ?? '',
        grade = grade ?? '',
        unit = (unit != null && unit.isNotEmpty) ? unit : 'Kg',
        pricePerUnit = pricePerUnit ?? 0,
        stockQuantity = stockQuantity ?? 0,
        minimumOrderQuantity = minimumOrderQuantity ?? 0,
        farmingType = farmingType ?? '',
        farmName = farmName ?? '',
        farmLocation = farmLocation ?? '',
        sowingDate = sowingDate ?? '',
        harvestDate = harvestDate ?? '',
        availableFrom = availableFrom ?? '',
        availableUntil = availableUntil ?? '',
        status = status ?? '',
        imageUrl = imageUrl ?? '',
        photos = photos ?? const [],
        gradeAPrice = gradeAPrice ?? (pricePerUnit ?? 0),
        gradeAQty = gradeAQty ?? 0,
        gradeBPrice = gradeBPrice ?? 0,
        gradeBQty = gradeBQty ?? 0,
        gradeCPrice = gradeCPrice ?? 0,
        gradeCQty = gradeCQty ?? 0;

  String get displayBusinessId {
    if (productId.isNotEmpty) return productId;
    return id;
  }

  factory ProductItem.fromJson(Map<String, dynamic> json) {
    String grade = '';
    if (json['grades'] is List && (json['grades'] as List).isNotEmpty) {
      final firstGrade = (json['grades'] as List)[0];
      if (firstGrade is Map && firstGrade['grade'] != null) {
        grade = 'Grade ${firstGrade['grade']}';
      }
    } else if (json['grade'] != null) {
      grade = json['grade'].toString();
    }

    double price = 0.0;
    if (json['sellingPrice'] != null) {
      price = (json['sellingPrice'] is num) ? (json['sellingPrice'] as num).toDouble() : (double.tryParse(json['sellingPrice'].toString()) ?? 0.0);
    } else if (json['pricePerKg'] != null) {
      price = (json['pricePerKg'] is num) ? (json['pricePerKg'] as num).toDouble() : (double.tryParse(json['pricePerKg'].toString()) ?? 0.0);
    }

    double stock = 0.0;
    if (json['totalQuantity'] != null) {
      stock = (json['totalQuantity'] is num) ? (json['totalQuantity'] as num).toDouble() : (double.tryParse(json['totalQuantity'].toString()) ?? 0.0);
    } else if (json['stock'] != null) {
      stock = (json['stock'] is num) ? (json['stock'] as num).toDouble() : (double.tryParse(json['stock'].toString()) ?? 0.0);
    } else if (json['stockQuantity'] != null) {
      stock = (json['stockQuantity'] is num) ? (json['stockQuantity'] as num).toDouble() : (double.tryParse(json['stockQuantity'].toString()) ?? 0.0);
    } else if (json['availableQuantity'] != null) {
      stock = (json['availableQuantity'] is num) ? (json['availableQuantity'] as num).toDouble() : (double.tryParse(json['availableQuantity'].toString()) ?? 0.0);
    }

    List<String> photoList = [];
    String mainImg = '';
    if (json['media'] is Map) {
      final mediaMap = json['media'] as Map;
      if (mediaMap['mainPhoto'] != null && mediaMap['mainPhoto'].toString().isNotEmpty) {
        mainImg = mediaMap['mainPhoto'].toString();
        photoList.add(mainImg);
      }
      if (mediaMap['photos'] is List) {
        for (final p in mediaMap['photos']) {
          if (p != null && p.toString().isNotEmpty) photoList.add(p.toString());
        }
      }
    }
    if (json['photos'] is List) {
      for (final p in json['photos']) {
        if (p != null && p.toString().isNotEmpty && !photoList.contains(p.toString())) {
          photoList.add(p.toString());
        }
      }
    }
    if (mainImg.isEmpty) {
      if (json['profileImage'] != null && json['profileImage'].toString().isNotEmpty) {
        mainImg = json['profileImage'].toString();
      } else if (json['image'] != null && json['image'].toString().isNotEmpty) {
        mainImg = json['image'].toString();
      } else if (photoList.isNotEmpty) {
        mainImg = photoList.first;
      }
    }

    final rawId = json['id']?.toString() ?? json['_id']?.toString() ?? json['productId']?.toString() ?? '';
    final pId = json['productId']?.toString() ?? json['businessId']?.toString() ?? rawId;

    String rawHarvest = json['harvestDate']?.toString() ?? (json['crop'] is Map ? json['crop']['expectedHarvestDate']?.toString() ?? '' : '');
    String formattedHarvest = rawHarvest;
    try {
      if (RegExp(r'^\d{4}-\d{2}-\d{2}').hasMatch(rawHarvest)) {
        final parts = rawHarvest.split('-');
        final year = parts[0];
        final monthNum = int.tryParse(parts[1]) ?? 9;
        final day = parts[2].substring(0, 2);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        final monthName = (monthNum >= 1 && monthNum <= 12) ? months[monthNum - 1] : 'Sept';
        formattedHarvest = '$day $monthName $year';
      }
    } catch (_) {}

    return ProductItem(
      id: rawId,
      productId: pId,
      productName: json['productName']?.toString() ?? json['name']?.toString() ?? '',
      variety: json['variety']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      cropLinked: json['cropName']?.toString() ?? json['cropLinked']?.toString() ?? '',
      grade: grade,
      unit: json['unit']?.toString() ?? 'Kg',
      pricePerUnit: price,
      stockQuantity: stock,
      minimumOrderQuantity: (json['minimumOrderQuantity'] is num) ? (json['minimumOrderQuantity'] as num).toDouble() : (double.tryParse(json['minimumOrderQuantity']?.toString() ?? '') ?? 0),
      farmingType: json['farmingType']?.toString() ?? '',
      farmName: json['farmName']?.toString() ?? '',
      farmLocation: json['farmLocation']?.toString() ?? '',
      sowingDate: json['sowingDate']?.toString() ?? (json['crop'] is Map ? json['crop']['sowingDate']?.toString() ?? '' : ''),
      harvestDate: formattedHarvest,
      availableFrom: json['availableFrom']?.toString() ?? '',
      availableUntil: json['availableUntil']?.toString() ?? '',
      status: json['status']?.toString() ?? json['stockStatus']?.toString() ?? '',
      imageUrl: mainImg,
      photos: photoList,
    );
  }
}

class FarmerOrderItem {
  final String id;
  final String? _productId;
  String get productId => _productId ?? '';
  final String orderCode;
  final String buyerName;
  final String buyerPhone;
  final String productName;
  final String cropName;
  final String variety;
  final double quantity;
  final double orderedQuantity;
  final double receivedQuantity;
  final String unit;
  final double rate;
  final double gradeAQty;
  final double gradeARate;
  final double gradeARejected;
  final double gradeBQty;
  final double gradeBRate;
  final double gradeBRejected;
  final double gradeCQty;
  final double gradeCRate;
  final double gradeCRejected;
  final double rejectedQuantity;
  final double totalAmount;
  String status; // New, Preparing, Ready for Pickup, Completed, Rejected
  final String qualityStatus;
  final String paymentStatus;
  final String pickupDate;
  final String pickupSlot;
  final String createdAt;
  final String rejectionReason;
  final String transactionId;
  final String? _collectionCentre;
  String get collectionCentre {
    final c = _collectionCentre;
    return (c != null && c.isNotEmpty) ? c : '';
  }
  final String? _collectionCentreId;
  String get collectionCentreId {
    final c = _collectionCentreId;
    return (c != null && c.isNotEmpty) ? c : '';
  }
  final String? _inspectorName;
  String get inspectorName {
    final n = _inspectorName;
    return (n != null && n.isNotEmpty) ? n : '';
  }
  final String? _weighbridgeStatus;
  String get weighbridgeStatus {
    final s = _weighbridgeStatus;
    return (s != null && s.isNotEmpty) ? s : '';
  }

  FarmerOrderItem({
    required this.id,
    String? productId,
    required this.orderCode,
    required this.buyerName,
    required this.buyerPhone,
    required this.productName,
    this.cropName = '',
    this.variety = 'Standard',
    required this.quantity,
    double? orderedQuantity,
    double? receivedQuantity,
    required this.unit,
    double? rate,
    double? gradeAQty,
    double? gradeARate,
    this.gradeARejected = 0.0,
    double? gradeBQty,
    double? gradeBRate,
    this.gradeBRejected = 0.0,
    this.gradeCQty = 0.0,
    this.gradeCRate = 0.0,
    this.gradeCRejected = 0.0,
    double? rejectedQuantity,
    required this.totalAmount,
    required this.status,
    this.qualityStatus = '',
    this.paymentStatus = '',
    required this.pickupDate,
    required this.pickupSlot,
    required this.createdAt,
    this.rejectionReason = '',
    this.transactionId = '',
    String? collectionCentre,
    String? collectionCentreId,
    String? inspectorName,
    String? weighbridgeStatus,
  })  : _productId = productId ?? '',
        _collectionCentre = collectionCentre ?? '',
        _collectionCentreId = collectionCentreId ?? '',
        _inspectorName = inspectorName ?? '',
        _weighbridgeStatus = weighbridgeStatus ?? '',
        orderedQuantity = orderedQuantity ?? quantity,
        receivedQuantity = receivedQuantity ?? quantity,
        rate = rate ?? (quantity > 0 && totalAmount > 0 ? (totalAmount / quantity) : 0),
        gradeAQty = gradeAQty ?? 0,
        gradeARate = gradeARate ?? (rate ?? 0),
        gradeBQty = gradeBQty ?? 0,
        gradeBRate = gradeBRate ?? 0,
        rejectedQuantity = rejectedQuantity ?? 0;

  double get gradeAAmt => gradeAQty * (gradeARate > 0 ? gradeARate : rate);
  double get gradeBAmt => gradeBQty * (gradeBRate > 0 ? gradeBRate : (rate * 0.4).roundToDouble());
  double get gradeCAmt => gradeCQty * gradeCRate;
  double get totalAcceptedQty => gradeAQty + gradeBQty + gradeCQty;
  double get effectiveTotalAmount => totalAmount > 0 ? totalAmount : (gradeAAmt + gradeBAmt + gradeCAmt);

  factory FarmerOrderItem.fromJson(Map<String, dynamic> json) {
    double parseDbl(dynamic v, double fallback) {
      if (v == null) return fallback;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString()) ?? fallback;
    }

    final q = parseDbl(json['quantity'] ?? json['orderedQuantity'] ?? json['totalQuantity'] ?? json['qty'], 0.0);
    final r = parseDbl(json['price'] ?? json['rate'] ?? json['sellingPrice'] ?? json['pricePerUnit'], 0.0);

    double gA = 0.0;
    double gAR = r > 0 ? r : 0.0;
    double gARej = 0.0;
    double gB = 0.0;
    double gBR = 0.0;
    double gBRej = 0.0;
    double gC = 0.0;
    double gCR = 0.0;
    double gCRej = 0.0;
    double totalRejFromGrades = 0.0;

    final dynamic gradeListRaw = json['finalStatement'] ?? json['grades'] ?? json['orderedGrades'] ?? json['products'];
    if (gradeListRaw is List && gradeListRaw.isNotEmpty) {
      for (final item in gradeListRaw) {
        if (item is Map) {
          final lbl = (item['label']?.toString() ?? item['name']?.toString() ?? item['grade']?.toString() ?? '').toUpperCase();
          final qty = parseDbl(item['quantity'] ?? item['finalQty'] ?? item['assignedQuantity'] ?? item['qty'], 0.0);
          final prc = parseDbl(item['price'] ?? item['rate'], 0.0);
          final rj = parseDbl(item['rejectedQuantity'] ?? item['rejectedQty'] ?? item['rejected'], 0.0);

          final clean = lbl.replaceAll('GRADE', '').replaceAll('_', '').replaceAll(' ', '').trim();
          final bool isGradeA = clean == 'A' || lbl == 'GRADE A' || lbl == 'GRADE_A' || lbl.startsWith('GRADE A') || lbl.endsWith(' A');
          final bool isGradeB = clean == 'B' || lbl == 'GRADE B' || lbl == 'GRADE_B' || lbl.startsWith('GRADE B') || lbl.endsWith(' B');
          final bool isGradeC = clean == 'C' || lbl == 'GRADE C' || lbl == 'GRADE_C' || lbl.startsWith('GRADE C') || lbl.endsWith(' C');

          if (isGradeA) {
            gA = qty;
            if (prc > 0) gAR = prc;
            gARej = rj;
          } else if (isGradeB) {
            gB = qty;
            if (prc > 0) gBR = prc;
            gBRej = rj;
          } else if (isGradeC) {
            gC = qty;
            if (prc > 0) gCR = prc;
            gCRej = rj;
          }
          totalRejFromGrades += rj;
        }
      }
    } else {
      gA = parseDbl(json['gradeAQuantity'] ?? json['gradeAQty'] ?? json['gradeAAssigned'], 0.0);
      gAR = parseDbl(json['gradeAPrice'] ?? json['gradeARate'], r);
      gARej = parseDbl(json['gradeARejected'], 0.0);
      gB = parseDbl(json['gradeBQuantity'] ?? json['gradeBQty'] ?? json['gradeBAssigned'], 0.0);
      gBR = parseDbl(json['gradeBPrice'] ?? json['gradeBRate'], 0.0);
      gBRej = parseDbl(json['gradeBRejected'], 0.0);
      gC = parseDbl(json['gradeCQuantity'] ?? json['gradeCQty'] ?? json['gradeCAssigned'], 0.0);
      gCR = parseDbl(json['gradeCPrice'] ?? json['gradeCRate'], 0.0);
      gCRej = parseDbl(json['gradeCRejected'], 0.0);
      totalRejFromGrades = gARej + gBRej + gCRej;
    }

    double finalRej = parseDbl(json['rejectedQuantity'] ?? json['rejectionQty'] ?? json['rejectedQty'], totalRejFromGrades);
    if (finalRej <= 0 && totalRejFromGrades > 0) {
      finalRej = totalRejFromGrades;
    }

    double totAmt = parseDbl(json['totalAmount'] ?? json['orderValue'] ?? json['finalAmount'] ?? json['amount'], 0.0);

    double calculatedAmount = (gA * gAR) + (gB * gBR) + (gC * gCR);
    if (totAmt <= 0) {
      totAmt = calculatedAmount > 0 ? calculatedAmount : (q * r);
    }

    final pStatus = json['paymentStatus']?.toString() ?? 'Pending';
    final st = json['status']?.toString() ?? 'NEW';
    final qStatus = json['qualityStatus']?.toString() ?? '';

    return FarmerOrderItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? json['orderCode']?.toString() ?? json['orderDisplayId']?.toString() ?? '',
      productId: json['productId']?.toString() ?? json['product_id']?.toString() ?? '',
      orderCode: json['orderDisplayId']?.toString() ?? json['orderCode']?.toString() ?? json['id']?.toString() ?? '',
      buyerName: json['buyerName']?.toString() ?? json['customerName']?.toString() ?? '',
      buyerPhone: json['buyerPhone']?.toString() ?? json['customerPhone']?.toString() ?? '',
      productName: json['productName']?.toString() ?? json['cropName']?.toString() ?? json['name']?.toString() ?? '',
      cropName: json['cropName']?.toString() ?? json['cropLinked']?.toString() ?? json['productName']?.toString() ?? '',
      variety: json['variety']?.toString() ?? '',
      quantity: q,
      orderedQuantity: parseDbl(json['orderedQuantity'] ?? json['totalQuantity'], q),
      receivedQuantity: parseDbl(json['receivedQuantity'], q),
      unit: json['unit']?.toString() ?? 'Kg',
      rate: r > 0 ? r : gAR,
      gradeAQty: gA,
      gradeARate: gAR,
      gradeARejected: gARej,
      gradeBQty: gB,
      gradeBRate: gBR,
      gradeBRejected: gBRej,
      gradeCQty: gC,
      gradeCRate: gCR,
      gradeCRejected: gCRej,
      rejectedQuantity: finalRej,
      totalAmount: totAmt,
      status: st,
      qualityStatus: qStatus,
      paymentStatus: pStatus,
      pickupDate: json['pickupDate']?.toString() ?? '',
      pickupSlot: json['pickupTime']?.toString() ?? json['pickupSlot']?.toString() ?? '',
      createdAt: json['createdAt']?.toString() ?? json['orderDate']?.toString() ?? '',
      rejectionReason: json['rejectionReason']?.toString() ?? '',
      transactionId: json['transactionId']?.toString() ?? (json['paymentDetails'] is Map ? json['paymentDetails']['transactionId']?.toString() ?? '' : ''),
      collectionCentre: json['collectionCentre']?.toString() ?? (json['collection_centre']?.toString()) ?? '',
      collectionCentreId: json['collectionCentreId']?.toString() ?? (json['pickup'] is Map ? json['pickup']['collectionCentreId']?.toString() : null) ?? '',
      inspectorName: json['inspectorName']?.toString() ?? (json['inspection'] is Map ? json['inspection']['inspectorName']?.toString() : null) ?? json['receivedBy']?.toString() ?? '',
      weighbridgeStatus: json['weighbridgeStatus']?.toString() ?? '',
    );
  }
}

class HarvestOrderItem {
  final String id;
  final String batchCode;
  final String cropName;
  final double gradeAQty;
  final double gradeBQty;
  final double gradeCQty;
  final String unit;
  final String harvestDate;
  final String pickupSlot;
  final String status; // Scheduled, In Progress, Completed

  HarvestOrderItem({
    required this.id,
    required this.batchCode,
    required this.cropName,
    required this.gradeAQty,
    required this.gradeBQty,
    required this.gradeCQty,
    required this.unit,
    required this.harvestDate,
    required this.pickupSlot,
    required this.status,
  });

  double get totalQty => gradeAQty + gradeBQty + gradeCQty;
}

class GovtScheme {
  final String id;
  final String title;
  final String shortName;
  final String category;
  final String? _govtLevel;
  final String status;
  final String statusBadge; // active, closing_soon, upcoming
  final String subsidyPercent;
  final String maxAmount;
  final String description;
  final String? _image;
  final List<String>? _eligibility;
  final List<String>? _documents;
  final String? _portalUrl;
  final String deadline;

  String get image => _image ?? '';
  String get govtLevel => _govtLevel ?? 'Central';
  List<String> get eligibility => _eligibility ?? const [];
  List<String> get documents => _documents ?? const [];
  String get portalUrl {
    final p = _portalUrl;
    return (p != null && p.isNotEmpty) ? p : 'https://mahadbt.maharashtra.gov.in/Farmer/AgriLogin/AgriLogin';
  }

  GovtScheme({
    required this.id,
    required this.title,
    required this.shortName,
    required this.category,
    String? govtLevel,
    required this.status,
    required this.statusBadge,
    required this.subsidyPercent,
    required this.maxAmount,
    required this.description,
    String? image,
    List<String>? eligibility,
    List<String>? documents,
    String? portalUrl,
    required this.deadline,
  })  : _govtLevel = govtLevel ?? 'Central',
        _image = image ?? '',
        _eligibility = eligibility ?? const [],
        _documents = documents ?? const [],
        _portalUrl = portalUrl ?? 'https://mahadbt.maharashtra.gov.in/Farmer/AgriLogin/AgriLogin';

  static List<String> _splitTextLines(dynamic value) {
    if (value is List) {
      return value.map((item) => item.toString().trim()).where((item) => item.isNotEmpty).toList();
    }
    if (value == null) return [];
    return value
        .toString()
        .split(RegExp(r'\r?\n|[•;|]'))
        .map((item) => item.replaceAll(RegExp(r'^[-*\d.)\s]+'), '').trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }

  factory GovtScheme.fromApiJson(Map<String, dynamic> json) {
    const statusLabels = {
      'active': 'Active (अर्जासाठी खुले)',
      'closing_soon': 'Closing Soon (अंतिम तारीख जवळ)',
      'upcoming': 'Upcoming (लवकरच सुरू)',
      'closed': 'Closed',
    };

    final statusBadge = (json['statusBadge'] ?? json['status'] ?? 'active').toString();
    final applyUrl = (json['applyUrl'] ?? '').toString().trim();
    final deadline = (json['deadline'] ?? '').toString().trim();
    final image = (json['image'] ?? '').toString().trim();
    final govtLevel = (json['govtLevel'] ?? 'Central').toString().trim();

    return GovtScheme(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      shortName: (json['shortName'] ?? json['title'] ?? '').toString(),
      category: (json['category'] ?? 'Financial Benefit').toString(),
      govtLevel: govtLevel,
      status: (json['statusLabel'] ?? statusLabels[statusBadge] ?? statusBadge).toString(),
      statusBadge: statusBadge,
      subsidyPercent: (json['subsidyAmount'] ?? '—').toString(),
      maxAmount: (json['maxBenefit'] ?? '—').toString(),
      description: (json['description'] ?? '').toString(),
      image: image,
      eligibility: _splitTextLines(json['eligibility']),
      documents: _splitTextLines(json['documents']),
      portalUrl: applyUrl.isNotEmpty ? applyUrl : 'https://mahadbt.maharashtra.gov.in/Farmer/AgriLogin/AgriLogin',
      deadline: deadline.isNotEmpty ? deadline : '—',
    );
  }
}

class DocumentItem {
  final String id;
  final String type;
  final String title;
  final String marathiTitle;
  final bool isUploaded;
  final String status; // approved, pending, rejected, not_uploaded
  final String uploadDate;
  final String fileUrl;
  final String rejectionReason;

  DocumentItem({
    required this.id,
    required this.type,
    required this.title,
    required this.marathiTitle,
    required this.isUploaded,
    required this.status,
    this.uploadDate = '',
    this.fileUrl = '',
    this.rejectionReason = '',
  });
}
