class FarmerProfile {
  final String id;
  final String fullName;
  final String mobile;
  final String email;
  final String preferredLanguage;
  final String farmName;
  final double totalAcres;
  final String soilType;
  final String irrigationType;
  final String waterSource;
  final String farmingMethod;
  final String village;
  final String taluka;
  final String district;
  final String state;
  final String pincode;
  final String kycStatus; // PENDING, SUBMITTED, APPROVED

  FarmerProfile({
    required this.id,
    required this.fullName,
    required this.mobile,
    this.email = '',
    this.preferredLanguage = 'मराठी (Marathi)',
    required this.farmName,
    required this.totalAcres,
    this.soilType = 'Black Soil (काळी माती)',
    this.irrigationType = 'Drip (ठिबक)',
    this.waterSource = 'Borewell (बोअरवेल)',
    this.farmingMethod = 'Mixed (मिश्र)',
    this.village = 'Baramati',
    this.taluka = 'Baramati',
    this.district = 'Pune',
    this.state = 'Maharashtra',
    this.pincode = '413102',
    this.kycStatus = 'APPROVED',
  });

  factory FarmerProfile.fromJson(Map<String, dynamic> json) {
    final addr = json['address'] is Map ? json['address'] as Map<String, dynamic> : <String, dynamic>{};
    final farm = json['farm'] is Map ? json['farm'] as Map<String, dynamic> : <String, dynamic>{};

    double acres = 2.0;
    if (json['farmArea'] != null) {
      acres = double.tryParse(json['farmArea'].toString()) ?? 2.0;
    } else if (farm['totalFarmArea'] != null) {
      acres = double.tryParse(farm['totalFarmArea'].toString()) ?? 2.0;
    }

    String str(dynamic val, String fallback) {
      if (val == null) return fallback;
      final s = val.toString().trim();
      return s.isNotEmpty ? s : fallback;
    }

    String lang = str(json['preferredLanguage'], 'मराठी (Marathi)');
    if (lang != 'मराठी (Marathi)' && lang != 'हिंदी (Hindi)' && lang != 'English') {
      lang = 'मराठी (Marathi)';
    }

    return FarmerProfile(
      id: str(json['id'] ?? json['farmerId'], 'FARM-001'),
      fullName: str(json['name'] ?? json['fullName'], 'Farmer'),
      mobile: str(json['mobile'], ''),
      email: str(json['email'], ''),
      preferredLanguage: lang,
      farmName: str(json['farmName'] ?? farm['farmName'], 'My Krushi Farm'),
      totalAcres: acres,
      soilType: str(farm['soilType'] ?? json['soilType'], 'Black Soil (काळी माती)'),
      irrigationType: str(farm['irrigationType'] ?? json['irrigationType'], 'Drip (ठिबक)'),
      waterSource: str(farm['waterSource'], 'Well / Borewell'),
      farmingMethod: str(farm['farmingMethod'] ?? json['farmType'], 'Organic (सेंद्रिय)'),
      village: str(addr['village'] ?? json['village'], 'Baramati'),
      taluka: str(addr['taluka'] ?? json['taluka'], 'Sangamner'),
      district: str(addr['district'] ?? json['district'], 'Ahilyanagar'),
      state: str(addr['state'] ?? json['state'], 'Maharashtra'),
      pincode: str(addr['pincode'] ?? json['pincode'], '422605'),
      kycStatus: str(json['verificationStatus'] ?? json['kycStatus'], 'APPROVED').toUpperCase(),
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
    this.estimatedQuantity = 1000.0,
    this.unit = 'Kg',
    this.soilType = 'Black Soil (काळी माती)',
    this.irrigationType = 'Drip (ठिबक)',
    this.farmingMethod = 'Mixed (मिश्र)',
    this.farmingType = 'Organic (सेंद्रिय)',
    this.farmName = 'My Krushi Farm',
    this.farmLocation = 'Sawargaon Tal',
    this.photos = const [],
    required this.status,
    required this.progress,
    required this.stageIndex,
  });

  String get businessId {
    if (id.startsWith('GGC-CRP')) return id;
    final cleanName = cropName.split(' ')[0].replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
    final code = cleanName.length >= 3 ? cleanName.substring(0, 3) : 'CRP';
    final cleanVar = variety.split(' ')[0].replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
    final varCode = cleanVar.length >= 3 ? cleanVar.substring(0, 3) : 'HYB';
    final numDigits = id.replaceAll(RegExp(r'[^0-9]'), '');
    final serial = numDigits.isNotEmpty ? numDigits.padLeft(5, '0') : '00001';
    return 'GGC-CRP-VEG-$code-$varCode-${serial.length > 5 ? serial.substring(serial.length - 5) : serial}';
  }

  factory CropItem.fromJson(Map<String, dynamic> json) {
    double area = 1.0;
    if (json['area'] != null) {
      area = (json['area'] is num) ? (json['area'] as num).toDouble() : (double.tryParse(json['area'].toString()) ?? 1.0);
    } else if (json['acreage'] != null) {
      area = (json['acreage'] is num) ? (json['acreage'] as num).toDouble() : (double.tryParse(json['acreage'].toString()) ?? 1.0);
    }

    double estQty = 1000.0;
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
      sowingDate: json['sowingDate']?.toString() ?? '2026-08-01',
      estHarvestDate: json['expectedHarvestDate']?.toString() ?? json['estHarvestDate']?.toString() ?? '2026-10-15',
      estimatedQuantity: estQty,
      unit: json['unit']?.toString() ?? 'Kg',
      soilType: json['soilType']?.toString() ?? 'Black Soil (काळी माती)',
      irrigationType: json['irrigationType']?.toString() ?? 'Drip (ठिबक)',
      farmingMethod: json['farmingMethod']?.toString() ?? 'Mixed (मिश्र)',
      farmingType: json['farmingType']?.toString() ?? 'Organic (सेंद्रिय)',
      farmName: json['farmName']?.toString() ?? 'My Krushi Farm',
      farmLocation: json['farmLocation']?.toString() ?? 'Sawargaon Tal',
      photos: photoList,
      status: json['status']?.toString() ?? 'Crop Growing',
      progress: (json['progress'] is num) ? (json['progress'] as num).toDouble() : 0.65,
      stageIndex: (json['stageIndex'] is int) ? json['stageIndex'] as int : 16,
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
    required this.id,
    String? productId,
    required this.productName,
    this.variety = '',
    required this.category,
    required this.cropLinked,
    required this.grade,
    required this.unit,
    required this.pricePerUnit,
    required this.stockQuantity,
    this.minimumOrderQuantity = 10.0,
    this.farmingType = 'Organic (सेंद्रिय)',
    this.farmName = 'My Krushi Farm',
    this.farmLocation = 'Baramati, Pune',
    this.sowingDate = '15 Aug 2026',
    this.harvestDate = '14 Oct 2026',
    this.availableFrom = '15 Oct 2026',
    this.availableUntil = '30 Nov 2026',
    required this.status,
    this.imageUrl = '',
    this.photos = const [],
    double? gradeAPrice,
    double? gradeAQty,
    double? gradeBPrice,
    double? gradeBQty,
    this.gradeCPrice = 0.0,
    this.gradeCQty = 0.0,
  })  : productId = productId ?? (id.startsWith('GGC-PRD') ? id : 'GGC-PRD-20260908-000${id.replaceAll(RegExp(r'[^0-9]'), '').padLeft(2, '1')}'),
        gradeAPrice = gradeAPrice ?? pricePerUnit,
        gradeAQty = gradeAQty ?? (stockQuantity * 0.70).roundToDouble(),
        gradeBPrice = gradeBPrice ?? (pricePerUnit * 0.4).roundToDouble(),
        gradeBQty = gradeBQty ?? (stockQuantity * 0.25).roundToDouble();

  String get displayBusinessId {
    if (productId.isNotEmpty) return productId;
    if (id.startsWith('GGC-PRD')) return id;
    final cleanId = id.replaceAll(RegExp(r'[^0-9]'), '');
    return 'GGC-PRD-20260908-${cleanId.isNotEmpty ? cleanId.padLeft(5, '0') : '00001'}';
  }

  factory ProductItem.fromJson(Map<String, dynamic> json) {
    String grade = 'Grade A';
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
    if (json['stock'] != null) {
      stock = (json['stock'] is num) ? (json['stock'] as num).toDouble() : (double.tryParse(json['stock'].toString()) ?? 0.0);
    } else if (json['availableQuantity'] != null) {
      stock = (json['availableQuantity'] is num) ? (json['availableQuantity'] as num).toDouble() : (double.tryParse(json['availableQuantity'].toString()) ?? 0.0);
    }

    List<String> photoList = [];
    if (json['photos'] is List) {
      photoList = (json['photos'] as List).map((p) => p.toString()).where((p) => p.isNotEmpty).toList();
    } else if (json['media'] is Map && (json['media'] as Map)['mainPhoto'] != null) {
      photoList.add((json['media'] as Map)['mainPhoto'].toString());
    }

    final rawId = json['id']?.toString() ?? json['_id']?.toString() ?? json['productId']?.toString() ?? 'PRD-001';
    final pId = json['productId']?.toString() ?? json['businessId']?.toString() ?? (rawId.startsWith('GGC-PRD') ? rawId : 'GGC-PRD-20260908-00001');

    return ProductItem(
      id: rawId,
      productId: pId,
      productName: json['name']?.toString() ?? json['productName']?.toString() ?? 'Farm Product',
      variety: json['variety']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Vegetables',
      cropLinked: json['cropName']?.toString() ?? json['cropLinked']?.toString() ?? '',
      grade: grade,
      unit: json['unit']?.toString() ?? 'Kg',
      pricePerUnit: price,
      stockQuantity: stock,
      minimumOrderQuantity: (json['minimumOrderQuantity'] is num) ? (json['minimumOrderQuantity'] as num).toDouble() : (double.tryParse(json['minimumOrderQuantity']?.toString() ?? '') ?? 10.0),
      farmingType: json['farmingType']?.toString() ?? 'Organic (सेंद्रिय)',
      farmName: json['farmName']?.toString() ?? 'My Krushi Farm',
      farmLocation: json['farmLocation']?.toString() ?? 'Baramati, Pune',
      sowingDate: json['sowingDate']?.toString() ?? (json['crop'] is Map ? json['crop']['sowingDate']?.toString() ?? '15 Aug 2026' : '15 Aug 2026'),
      harvestDate: json['harvestDate']?.toString() ?? (json['crop'] is Map ? json['crop']['expectedHarvestDate']?.toString() ?? '14 Oct 2026' : '14 Oct 2026'),
      availableFrom: json['availableFrom']?.toString() ?? '15 Oct 2026',
      availableUntil: json['availableUntil']?.toString() ?? '30 Nov 2026',
      status: json['status']?.toString() ?? json['stockStatus']?.toString() ?? 'Active',
      imageUrl: json['profileImage']?.toString() ?? json['image']?.toString() ?? '',
      photos: photoList,
    );
  }
}

class FarmerOrderItem {
  final String id;
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

  FarmerOrderItem({
    required this.id,
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
    this.qualityStatus = 'GRADE_CONFIRMED',
    this.paymentStatus = 'PAID',
    required this.pickupDate,
    required this.pickupSlot,
    required this.createdAt,
    this.rejectionReason = '',
    this.transactionId = '',
  })  : orderedQuantity = orderedQuantity ?? quantity,
        receivedQuantity = receivedQuantity ?? quantity,
        rate = rate ?? (quantity > 0 ? (totalAmount / quantity).roundToDouble() : 30.0),
        gradeAQty = gradeAQty ?? (quantity >= 290.0 ? 200.0 : (quantity * 0.70).roundToDouble()),
        gradeARate = gradeARate ?? (rate ?? 30.0),
        gradeBQty = gradeBQty ?? (quantity >= 290.0 ? 80.0 : (quantity * 0.25).roundToDouble()),
        gradeBRate = gradeBRate ?? ((rate ?? 30.0) * 0.4).roundToDouble(),
        rejectedQuantity = rejectedQuantity ?? (quantity >= 290.0 ? 10.0 : (quantity * 0.05).roundToDouble());

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

    final q = parseDbl(json['quantity'] ?? json['orderedQuantity'] ?? json['qty'], 290.0);
    final totAmt = parseDbl(json['totalAmount'] ?? json['orderValue'] ?? json['finalAmount'] ?? json['amount'], 6960.0);
    final r = parseDbl(json['price'] ?? json['rate'] ?? json['sellingPrice'] ?? json['pricePerUnit'], 30.0);

    // Extract grade particulars if present
    double gA = parseDbl(json['gradeAAssigned'] ?? json['gradeAQuantity'] ?? json['gradeAQty'], q >= 290 ? 200.0 : (q * 0.70).roundToDouble());
    double gAR = parseDbl(json['gradeAPrice'] ?? json['gradeARate'], r);
    double gB = parseDbl(json['gradeBAssigned'] ?? json['gradeBQuantity'] ?? json['gradeBQty'], q >= 290 ? 80.0 : (q * 0.25).roundToDouble());
    double gBR = parseDbl(json['gradeBPrice'] ?? json['gradeBRate'], (r * 0.4).roundToDouble());
    double gC = parseDbl(json['gradeCAssigned'] ?? json['gradeCQuantity'] ?? json['gradeCQty'], 0.0);
    double gCR = parseDbl(json['gradeCPrice'] ?? json['gradeCRate'], 0.0);
    double rej = parseDbl(json['rejectedQuantity'] ?? json['rejectedQty'], q >= 290 ? 10.0 : (q * 0.05).roundToDouble());

    if (json['finalStatement'] is List && (json['finalStatement'] as List).isNotEmpty) {
      for (final item in (json['finalStatement'] as List)) {
        if (item is Map) {
          final lbl = item['label']?.toString() ?? item['grade']?.toString() ?? '';
          final qty = parseDbl(item['quantity'] ?? item['finalQty'] ?? item['assignedQuantity'], 0.0);
          final prc = parseDbl(item['price'] ?? item['rate'], 0.0);
          final rj = parseDbl(item['rejectedQuantity'], 0.0);
          if (lbl.contains('A')) {
            gA = qty;
            gAR = prc > 0 ? prc : gAR;
          } else if (lbl.contains('B')) {
            gB = qty;
            gBR = prc > 0 ? prc : gBR;
          } else if (lbl.contains('C')) {
            gC = qty;
            gCR = prc > 0 ? prc : gCR;
          }
          if (rj > 0) rej += rj;
        }
      }
    }

    final pStatus = json['paymentStatus']?.toString() ?? 'PAID';
    final st = json['status']?.toString() ?? 'Completed';

    return FarmerOrderItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? 'ORD-001',
      orderCode: json['orderDisplayId']?.toString() ?? json['orderCode']?.toString() ?? json['id']?.toString() ?? 'GGC-ORD-20260907-00001',
      buyerName: json['buyerName']?.toString() ?? json['customerName']?.toString() ?? 'Swastik Supermarket Pune',
      buyerPhone: json['buyerPhone']?.toString() ?? json['customerPhone']?.toString() ?? '+91 98501 23456',
      productName: json['productName']?.toString() ?? json['name']?.toString() ?? 'Brinjal (वांगी)',
      cropName: json['cropName']?.toString() ?? json['cropLinked']?.toString() ?? 'Brinjal (वांगी)',
      variety: json['variety']?.toString() ?? 'Pusa Purple Long',
      quantity: q,
      orderedQuantity: parseDbl(json['orderedQuantity'], q),
      receivedQuantity: parseDbl(json['receivedQuantity'], q),
      unit: json['unit']?.toString() ?? 'Kg',
      rate: r,
      gradeAQty: gA,
      gradeARate: gAR,
      gradeARejected: parseDbl(json['gradeARejected'], 0.0),
      gradeBQty: gB,
      gradeBRate: gBR,
      gradeBRejected: parseDbl(json['gradeBRejected'], 0.0),
      gradeCQty: gC,
      gradeCRate: gCR,
      gradeCRejected: parseDbl(json['gradeCRejected'], 0.0),
      rejectedQuantity: rej,
      totalAmount: totAmt,
      status: st,
      qualityStatus: json['qualityStatus']?.toString() ?? 'GRADE_CONFIRMED',
      paymentStatus: pStatus,
      pickupDate: json['pickupDate']?.toString() ?? '08/09/2026, Tuesday',
      pickupSlot: json['pickupSlot']?.toString() ?? json['pickupTime']?.toString() ?? '7:00 AM',
      createdAt: json['createdAt']?.toString() ?? json['orderDate']?.toString() ?? '07/09/2026, Monday',
      rejectionReason: json['rejectionReason']?.toString() ?? '',
      transactionId: json['transactionId']?.toString() ?? (json['paymentDetails'] is Map ? json['paymentDetails']['transactionId']?.toString() ?? '' : ''),
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
  final String status;
  final String statusBadge; // active, closing, upcoming
  final String subsidyPercent;
  final String maxAmount;
  final String description;
  final List<String> eligibility;
  final List<String> documents;
  final String portalUrl;
  final String deadline;

  GovtScheme({
    required this.id,
    required this.title,
    required this.shortName,
    required this.category,
    required this.status,
    required this.statusBadge,
    required this.subsidyPercent,
    required this.maxAmount,
    required this.description,
    required this.eligibility,
    required this.documents,
    this.portalUrl = 'https://mahadbt.maharashtra.gov.in',
    required this.deadline,
  });
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

  DocumentItem({
    required this.id,
    required this.type,
    required this.title,
    required this.marathiTitle,
    required this.isUploaded,
    required this.status,
    this.uploadDate = '',
    this.fileUrl = '',
  });
}
