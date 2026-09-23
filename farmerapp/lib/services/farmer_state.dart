import 'package:flutter/material.dart';
import '../models/farmer_models.dart';
import '../core/constants/farmer_constants.dart';
import 'api_service.dart';

class FarmerState extends ChangeNotifier {
  static final FarmerState _instance = FarmerState._internal();
  factory FarmerState() => _instance;
  FarmerState._internal() {
    _initDefaultData();
    fetchFromBackend();
  }

  bool isLoggedIn = true;
  bool isConnectedToBackend = false;
  String backendUrl = '';
  bool isLoadingFromBackend = false;
  String connectionMessage = 'Connecting...';

  void logout() {
    isLoggedIn = false;
    ApiService().setToken(null);
    notifyListeners();
  }

  void login() {
    isLoggedIn = true;
    fetchFromBackend();
    notifyListeners();
  }

  Future<void> fetchFromBackend() async {
    isLoadingFromBackend = true;
    notifyListeners();

    try {
      final healthy = await ApiService().checkHealth();
      isConnectedToBackend = healthy;
      backendUrl = ApiService().baseUrl;

      if (healthy) {
        connectionMessage = 'Connected: $backendUrl';

        // 1. Fetch Profile
        try {
          final pRes = await ApiService().fetchFarmerProfile(profile.id);
          if (pRes is Map<String, dynamic>) {
            final fMap = (pRes['farmer'] is Map) ? pRes['farmer'] as Map<String, dynamic> : pRes;
            profile = FarmerProfile.fromJson(fMap);
          }
        } catch (_) {}

        // 2. Fetch Products
        try {
          final prodRes = await ApiService().fetchProducts(profile.id);
          if (prodRes is List && prodRes.isNotEmpty) {
            final fetched = prodRes
                .map((p) {
                  try {
                    return ProductItem.fromJson(p as Map<String, dynamic>);
                  } catch (_) {
                    return null;
                  }
                })
                .whereType<ProductItem>()
                .toList();
            if (fetched.isNotEmpty) {
              products = fetched;
            }
          }
        } catch (_) {}

        // 3. Fetch Orders
        try {
          final ordRes = await ApiService().fetchOrders(profile.id);
          if (ordRes is List && ordRes.isNotEmpty) {
            orders = ordRes.map((o) => FarmerOrderItem.fromJson(o as Map<String, dynamic>)).toList();
          }
        } catch (_) {}

        // 4. Fetch Crops
        try {
          final cropRes = await ApiService().fetchCrops();
          if (cropRes is List && cropRes.isNotEmpty) {
            crops = cropRes.map((c) => CropItem.fromJson(c as Map<String, dynamic>)).toList();
          }
        } catch (_) {}

        // 5. Fetch Documents from Backend
        try {
          final docRes = await ApiService().fetchDocuments(profile.id);
          if (docRes is List && docRes.isNotEmpty) {
            final Map<String, dynamic> docMap = {};
            for (final d in docRes) {
              if (d is Map) {
                final type = (d['type'] ?? '').toString().toLowerCase();
                if (type.isNotEmpty) docMap[type] = d;
              }
            }

            if (documents.isEmpty) {
              _initDefaultData();
            }

            documents = documents.map((localDoc) {
              final backendDoc = docMap[localDoc.type.toLowerCase()];
              if (backendDoc != null) {
                final st = (backendDoc['status'] ?? 'Not Uploaded').toString();
                final fUrl = (backendDoc['fileUrl'] ?? '').toString();
                final rReason = (backendDoc['rejectionReason'] ?? '').toString();
                final hasFile = fUrl.isNotEmpty && (backendDoc['fileName'] ?? '').toString().isNotEmpty;
                return DocumentItem(
                  id: localDoc.id,
                  type: localDoc.type,
                  title: localDoc.title,
                  marathiTitle: localDoc.marathiTitle,
                  isUploaded: hasFile,
                  status: st == 'Approved'
                      ? 'approved'
                      : (st == 'Rejected' ? 'rejected' : (hasFile ? 'pending' : 'not_uploaded')),
                  uploadDate: backendDoc['uploadedAt'] != null ? 'Uploaded' : localDoc.uploadDate,
                  fileUrl: fUrl.isNotEmpty ? fUrl : localDoc.fileUrl,
                  rejectionReason: rReason,
                );
              }
              return localDoc;
            }).toList();
          }
        } catch (_) {}
      } else {
        connectionMessage = 'Disconnected (Using Offline Cache)';
      }
    } catch (e) {
      isConnectedToBackend = false;
      connectionMessage = 'Offline ($e)';
    } finally {
      isLoadingFromBackend = false;
      notifyListeners();
    }
  }

  // Farmer Profile
  FarmerProfile profile = FarmerProfile(
    id: 'GGC-FR-MH-AHI-SAN-00001',
    fullName: 'Sunil Nehe (सुनील नेहे)',
    mobile: '9420179190',
    email: 'sunil.nehe@greengroo.in',
    farmName: 'Nehe Mala (नेहे मळा)',
    totalAcres: 5.0,
    village: 'Sawargaon Tal',
    taluka: 'Sangamner',
    district: 'Ahilyanagar',
    state: 'Maharashtra',
    pincode: '422605',
    soilType: 'Medium Black (मध्यम काळी)',
    irrigationType: 'Drip (ठिबक सिंचन)',
    waterSource: 'Well (विहीर)',
    farmingMethod: 'Mixed Natural (नैसर्गिक व सेंद्रिय)',
    kycStatus: 'APPROVED',
  );

  // Crops
  List<CropItem> crops = [];

  // Products
  List<ProductItem> products = [];

  // Orders
  List<FarmerOrderItem> orders = [];

  // Harvest Orders
  List<HarvestOrderItem> harvestOrders = [];

  // Govt Schemes
  List<GovtScheme> schemes = [];

  // Documents
  List<DocumentItem> documents = [];

  void _initDefaultData() {
    crops = [
      CropItem(
        id: 'CRP-001',
        cropName: 'Tomato (टोमॅटो)',
        variety: 'Bajeerao',
        acreage: 2.0,
        sowingDate: '01 Jun 2026',
        estHarvestDate: '01 Sept 2026',
        soilType: 'Medium Black (मध्यम काळी)',
        irrigationType: 'Drip (ठिबक)',
        status: 'Harvest Readiness',
        progress: 0.95,
        stageIndex: 20,
      ),
      CropItem(
        id: 'CRP-002',
        cropName: 'Onion (कांदा)',
        variety: 'Hybrid',
        acreage: 1.5,
        sowingDate: '10 Jun 2026',
        estHarvestDate: '02 Sept 2026',
        soilType: 'Medium Black (मध्यम काळी)',
        irrigationType: 'Drip (ठिबक)',
        status: 'Harvest Readiness',
        progress: 0.90,
        stageIndex: 20,
      ),
      CropItem(
        id: 'CRP-003',
        cropName: 'Brinjal (वांगी)',
        variety: 'Pusa Purple Long',
        acreage: 1.0,
        sowingDate: '15 May 2026',
        estHarvestDate: '05 Sept 2026',
        soilType: 'Medium Black (मध्यम काळी)',
        irrigationType: 'Drip (ठिबक)',
        status: 'Harvest Readiness',
        progress: 0.92,
        stageIndex: 20,
      ),
    ];

    products = [
      ProductItem(
        id: 'GGC-ART-VEG-TOM-BAJ-00002',
        productId: 'GGC-ART-VEG-TOM-BAJ-00002',
        productName: 'Tomato',
        variety: 'Bajeerao',
        category: 'Vegetables (भाजीपाला)',
        cropLinked: 'Tomato',
        grade: 'Grade A',
        unit: 'Kg',
        pricePerUnit: 30.0,
        stockQuantity: 3000.0,
        minimumOrderQuantity: 1.0,
        farmingType: 'Organic',
        farmName: 'Krushna',
        farmLocation: 'sawargaon tal',
        sowingDate: '01 Jun 2026',
        harvestDate: '01 Sept 2026',
        availableFrom: '05 Sept 2026',
        availableUntil: '30 Sept 2026',
        status: 'Active',
      ),
      ProductItem(
        id: 'GGC-ART-VEG-ONI-HYB-00002',
        productId: 'GGC-ART-VEG-ONI-HYB-00002',
        productName: 'Onion',
        variety: 'Hybrid',
        category: 'Vegetables (भाजीपाला)',
        cropLinked: 'Onion (कांदा)',
        grade: 'Grade A',
        unit: 'Kg',
        pricePerUnit: 35.0,
        stockQuantity: 500.0,
        minimumOrderQuantity: 50.0,
        farmingType: 'Organic (सेंद्रिय)',
        farmName: 'Nehe Mala',
        farmLocation: 'Sawargaon Tal, Sangamner',
        sowingDate: '10 Jun 2026',
        harvestDate: '02 Sept 2026',
        availableFrom: '02 Sept 2026',
        availableUntil: '30 Nov 2026',
        status: 'Out of Stock',
      ),
      ProductItem(
        id: 'GGC-ART-VEG-BRJ-PUS-00001',
        productId: 'GGC-ART-VEG-BRJ-PUS-00001',
        productName: 'Brinjal',
        variety: 'Pusa Purple Long',
        category: 'Vegetables (भाजीपाला)',
        cropLinked: 'Brinjal (वांगी)',
        grade: 'Grade A',
        unit: 'Kg',
        pricePerUnit: 30.0,
        stockQuantity: 1500.0,
        minimumOrderQuantity: 50.0,
        farmingType: 'Organic (सेंद्रिय)',
        farmName: 'Nehe Mala',
        farmLocation: 'Sawargaon Tal, Sangamner',
        sowingDate: '15 May 2026',
        harvestDate: '05 Sept 2026',
        availableFrom: '05 Sept 2026',
        availableUntil: '30 Nov 2026',
        status: 'Active',
      ),
    ];

    orders = [
      FarmerOrderItem(
        id: 'GGC-ORD-20260907-00001',
        orderCode: 'GGC-ORD-20260907-00001',
        productId: 'GGC-ART-VEG-TOM-BAJ-00002',
        buyerName: 'Daily Harvest Statement',
        buyerPhone: '9921182753',
        productName: 'Tomato',
        cropName: 'Tomato',
        variety: 'Bajeerao',
        quantity: 300.0,
        orderedQuantity: 300.0,
        receivedQuantity: 300.0,
        unit: 'Kg',
        rate: 30.0,
        gradeAQty: 200.0,
        gradeARate: 30.0,
        gradeARejected: 0.0,
        gradeBQty: 80.0,
        gradeBRate: 12.0,
        gradeBRejected: 10.0,
        gradeCQty: 0.0,
        gradeCRate: 0.0,
        gradeCRejected: 0.0,
        rejectedQuantity: 10.0,
        totalAmount: 6960.0,
        status: 'ORDER_COMPLETED',
        qualityStatus: 'GRADE_CONFIRMED',
        paymentStatus: 'Pending',
        pickupDate: '08/09/2026, Tuesday',
        pickupSlot: '07:00 AM',
        createdAt: '07/09/2026, Monday',
        transactionId: 'TXN-GGC-20260907-6960',
        collectionCentre: 'Main Collection Centre',
        collectionCentreId: 'GGC-CC-MH-NK-NAS-NAS-001',
        inspectorName: 'Prajwal Nehe',
        weighbridgeStatus: 'Verified on Scale',
      ),
      FarmerOrderItem(
        id: 'GGC-ORD-20260903-00002',
        orderCode: 'GGC-ORD-20260903-00002',
        productId: 'GGC-ART-VEG-ONI-HYB-00002',
        buyerName: 'Swastik Supermarket Pune',
        buyerPhone: '+91 98501 23456',
        productName: 'Onion',
        cropName: 'Onion (कांदा)',
        variety: 'Hybrid',
        quantity: 123.0,
        orderedQuantity: 150.0,
        receivedQuantity: 150.0,
        unit: 'Kg',
        rate: 10.0,
        gradeAQty: 80.0,
        gradeARate: 10.0,
        gradeARejected: 20.0,
        gradeBQty: 43.0,
        gradeBRate: 3.0,
        gradeBRejected: 7.0,
        gradeCQty: 0.0,
        gradeCRate: 0.0,
        gradeCRejected: 0.0,
        rejectedQuantity: 27.0,
        totalAmount: 929.0,
        status: 'ORDER_COMPLETED',
        qualityStatus: 'GRADE_CONFIRMED',
        paymentStatus: 'Paid',
        pickupDate: '05/09/2026, Saturday',
        pickupSlot: '5:23 PM',
        createdAt: '03/09/2026, Thursday',
        transactionId: 'TXN-GGC-20260903-9291',
      ),
      FarmerOrderItem(
        id: 'GGC-ORD-20260903-00001',
        orderCode: 'GGC-ORD-20260903-00001',
        productId: 'GGC-ART-VEG-ONI-HYB-00002',
        buyerName: 'Nature Fresh Mart Mumbai',
        buyerPhone: '+91 98220 54321',
        productName: 'Onion',
        cropName: 'Onion (कांदा)',
        variety: 'Hybrid',
        quantity: 500.0,
        orderedQuantity: 500.0,
        receivedQuantity: 500.0,
        unit: 'Kg',
        rate: 20.0,
        gradeAQty: 500.0,
        gradeARate: 20.0,
        gradeARejected: 0.0,
        gradeBQty: 0.0,
        gradeBRate: 0.0,
        gradeBRejected: 0.0,
        gradeCQty: 0.0,
        gradeCRate: 0.0,
        gradeCRejected: 0.0,
        rejectedQuantity: 0.0,
        totalAmount: 10000.0,
        status: 'PREPARING',
        qualityStatus: 'PREPARING',
        paymentStatus: 'Pending',
        pickupDate: '05/09/2026, Saturday',
        pickupSlot: '5:00 AM',
        createdAt: '03/09/2026, Thursday',
        transactionId: '',
      ),
      FarmerOrderItem(
        id: 'GGC-ORD-20260916-00001',
        orderCode: 'GGC-ORD-20260916-00001',
        productId: 'GGC-ART-VEG-TOM-BAJ-00002',
        buyerName: 'Kisan Mandi Nashik',
        buyerPhone: '+91 98221 88990',
        productName: 'Tomato',
        cropName: 'Tomato (टोमॅटो)',
        variety: 'Bajeerao',
        quantity: 175.0,
        orderedQuantity: 175.0,
        receivedQuantity: 175.0,
        unit: 'Kg',
        rate: 12.0,
        gradeAQty: 110.0,
        gradeARate: 12.0,
        gradeARejected: 0.0,
        gradeBQty: 55.0,
        gradeBRate: 5.0,
        gradeBRejected: 0.0,
        gradeCQty: 10.0,
        gradeCRate: 2.0,
        gradeCRejected: 0.0,
        rejectedQuantity: 0.0,
        totalAmount: 1615.0,
        status: 'PREPARING',
        qualityStatus: 'PREPARING',
        paymentStatus: 'Pending',
        pickupDate: '17/09/2026, Thursday',
        pickupSlot: '2:33 PM',
        createdAt: '16/09/2026, Wednesday',
        transactionId: '',
      ),
    ];

    harvestOrders = [
      HarvestOrderItem(
        id: 'HRV-301',
        batchCode: 'BATCH-TOM-09',
        cropName: 'Tomato (टोमॅटो)',
        gradeAQty: 350.0,
        gradeBQty: 80.0,
        gradeCQty: 20.0,
        unit: 'Kg',
        harvestDate: '23 Sep 2026',
        pickupSlot: 'Morning Slot (06:00 AM - 08:30 AM)',
        status: 'Scheduled',
      ),
      HarvestOrderItem(
        id: 'HRV-302',
        batchCode: 'BATCH-BRJ-04',
        cropName: 'Brinjal (वांगी)',
        gradeAQty: 220.0,
        gradeBQty: 50.0,
        gradeCQty: 15.0,
        unit: 'Kg',
        harvestDate: '25 Sep 2026',
        pickupSlot: 'Morning Slot (07:00 AM - 09:30 AM)',
        status: 'Scheduled',
      ),
      HarvestOrderItem(
        id: 'HRV-290',
        batchCode: 'BATCH-ONI-01',
        cropName: 'Onion (कांदा)',
        gradeAQty: 600.0,
        gradeBQty: 150.0,
        gradeCQty: 50.0,
        unit: 'Kg',
        harvestDate: '12 Sep 2026',
        pickupSlot: 'Afternoon Slot (02:00 PM)',
        status: 'Completed',
      ),
    ];

    schemes = [
      GovtScheme(
        id: 'SCH-001',
        title: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) - Drip & Sprinkler Subsidy',
        shortName: 'PMKSY ठिबक व तुषार सिंचन योजना',
        category: 'Irrigation & Drip',
        status: 'Active (अर्जासाठी खुले)',
        statusBadge: 'active',
        subsidyPercent: 'Up to 55% - 80%',
        maxAmount: '₹55,000 / Acre',
        description: 'Under MahaDBT, farmers get 80% subsidy for small & marginal landholders and 75% for other farmers for installing micro-irrigation systems.',
        eligibility: [
          'Must possess 7/12 & 8-A in applicant name',
          'Aadhaar card linked with bank account',
          'Permanent water source (Well / Borewell / Canal) mandatory',
          'Electricity connection or solar pump receipt',
        ],
        documents: ['7/12 & 8-A Extract', 'Aadhaar Card', 'Electricity Bill / Solar connection', 'Bank Passbook', 'Quotation from authorized dealer'],
        deadline: '31 Dec 2026',
      ),
      GovtScheme(
        id: 'SCH-002',
        title: 'PM-Kusum Solar Pump Scheme (कुसुम सोलर कृषी पंप योजना)',
        shortName: 'KUSUM Solar Pump (सोलर पंप)',
        category: 'Solar & Energy',
        status: 'Closing Soon (अंतिम तारीख जवळ)',
        statusBadge: 'closing',
        subsidyPercent: '90% Subsidy (१०% शेतकरी हिस्सा)',
        maxAmount: '3 HP to 7.5 HP Solar DC Pump',
        description: 'Off-grid solar agricultural pumps with 90% subsidy for farmers without traditional electricity connection. Apply via MahaDBT / MSEDCL portal.',
        eligibility: [
          'Landholder farmer with no active electric pump connection',
          'Available surface water or functional borewell with water testing',
          'Only 10% farmer share payment required',
        ],
        documents: ['7/12 land extract', 'Aadhaar Card', 'Caste Certificate (if applicable)', 'Water source self-declaration'],
        deadline: '15 Oct 2026',
      ),
      GovtScheme(
        id: 'SCH-003',
        title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY - १ रुपयात पीक विमा)',
        shortName: 'PMFBY Crop Insurance (१ रु. पीक विमा)',
        category: 'Crop Insurance',
        status: 'Active (अर्जासाठी खुले)',
        statusBadge: 'active',
        subsidyPercent: '100% Premium Paid by Govt (Farmer pays ₹1 only)',
        maxAmount: 'Sum insured up to ₹45,000 / Acre',
        description: 'Comprehensive risk insurance against drought, floods, pest attack, and unseasonal rains for Kharif & Rabi crops at just ₹1 token fee.',
        eligibility: [
          'All crop growing farmers in notified revenue circles',
          'Sowing self-declaration or E-Pik Pahani entry on 7/12',
        ],
        documents: ['E-Pik Pahani receipt', '7/12 Extract', 'Aadhaar linked Bank passbook'],
        deadline: '30 Nov 2026',
      ),
      GovtScheme(
        id: 'SCH-004',
        title: 'Dr. Babasaheb Ambedkar Krushi Swavalamban Yojana',
        shortName: 'Ambedkar Swavalamban (नवीन विहीर व ठिबक)',
        category: 'Financial Benefit',
        status: 'Active (अर्जासाठी खुले)',
        statusBadge: 'active',
        subsidyPercent: '100% Financial Grant',
        maxAmount: '₹2,50,000 for New Well',
        description: 'Financial assistance for new well digging, in-well boring, electric pump, and micro-irrigation for eligible scheduled caste farmers.',
        eligibility: [
          'Annual family income up to ₹1,50,000',
          'Land holding between 0.40 Hectare to 6 Hectare',
          'No prior well subsidy received',
        ],
        documents: ['Caste certificate', 'Income certificate from Tehsildar', '7/12 & 8-A', 'Groundwater survey report'],
        deadline: '31 Jan 2027',
      ),
      GovtScheme(
        id: 'SCH-005',
        title: 'Agricultural Mechanization Promotion (कृषी यांत्रिकीकरण औजारे योजना)',
        shortName: 'Farm Machinery (ट्रॅक्टर व अवजारे अनुदान)',
        category: 'Machinery & Equipment',
        status: 'Upcoming (लवकरच सुरू)',
        statusBadge: 'upcoming',
        subsidyPercent: '40% - 50% Subsidy',
        maxAmount: 'Up to ₹1,25,000 for Tractor / Rotavator',
        description: 'Subsidy on purchase of Tractors, Power Tillers, Rotavators, Harvesters, and Multi-crop threshers via MahaDBT lottery system.',
        eligibility: [
          'One equipment per family over 10 years',
          'Must have driving license for tractor subsidy',
        ],
        documents: ['7/12 Extract', 'Aadhaar Card', 'Bank Passbook', 'Quotation from authorized dealer'],
        deadline: '15 Nov 2026',
      ),
    ];

    documents = [
      DocumentItem(
        id: 'DOC-1',
        type: 'aadhaar',
        title: 'Aadhaar Card',
        marathiTitle: 'आधार कार्ड',
        isUploaded: true,
        status: 'approved',
        uploadDate: '12 Aug 2026',
      ),
      DocumentItem(
        id: 'DOC-2',
        type: 'farmer_id',
        title: 'Farmer ID',
        marathiTitle: 'शेतकरी ओळखपत्र',
        isUploaded: false,
        status: 'not_uploaded',
      ),
      DocumentItem(
        id: 'DOC-3',
        type: 'land_712',
        title: '7/12 Extract',
        marathiTitle: '७/१२ उतारा',
        isUploaded: true,
        status: 'approved',
        uploadDate: '15 Aug 2026',
      ),
      DocumentItem(
        id: 'DOC-4',
        type: 'land_8a',
        title: '8A Extract',
        marathiTitle: '८-अ उतारा',
        isUploaded: false,
        status: 'not_uploaded',
      ),
      DocumentItem(
        id: 'DOC-5',
        type: 'bank',
        title: 'Bank Passbook',
        marathiTitle: 'बँक पासबुक',
        isUploaded: true,
        status: 'approved',
        uploadDate: '14 Aug 2026',
      ),
      DocumentItem(
        id: 'DOC-6',
        type: 'farmer_photo',
        title: 'Farmer Photo',
        marathiTitle: 'शेतकरी फोटो',
        isUploaded: true,
        status: 'approved',
        uploadDate: '16 Aug 2026',
      ),
      DocumentItem(
        id: 'DOC-7',
        type: 'address_proof',
        title: 'Address Proof',
        marathiTitle: 'रहिवासी दाखला',
        isUploaded: false,
        status: 'not_uploaded',
      ),
      DocumentItem(
        id: 'DOC-8',
        type: 'pan',
        title: 'PAN Card',
        marathiTitle: 'पॅन कार्ड',
        isUploaded: false,
        status: 'not_uploaded',
      ),
    ];
  }

  // Actions
  void addCrop(CropItem crop) {
    crops.insert(0, crop);
    notifyListeners();
    ApiService().createCrop({
      'cropName': crop.cropName,
      'variety': crop.variety,
      'area': crop.acreage,
      'areaUnit': crop.areaUnit,
      'acreage': crop.acreage,
      'sowingDate': crop.sowingDate,
      'expectedHarvestDate': crop.estHarvestDate,
      'estimatedQuantity': crop.estimatedQuantity,
      'unit': crop.unit,
      'soilType': crop.soilType,
      'irrigationType': crop.irrigationType,
      'farmingMethod': crop.farmingMethod,
      'farmingType': crop.farmingType,
      'photos': crop.photos,
    }).catchError((_) {});
  }

  void updateCrop(CropItem updatedCrop) {
    final idx = crops.indexWhere((c) => c.id == updatedCrop.id);
    if (idx != -1) {
      crops[idx] = updatedCrop;
      notifyListeners();
      ApiService().updateCrop(updatedCrop.id, {
        'cropName': updatedCrop.cropName,
        'variety': updatedCrop.variety,
        'area': updatedCrop.acreage,
        'areaUnit': updatedCrop.areaUnit,
        'sowingDate': updatedCrop.sowingDate,
        'expectedHarvestDate': updatedCrop.estHarvestDate,
        'estimatedQuantity': updatedCrop.estimatedQuantity,
        'unit': updatedCrop.unit,
        'soilType': updatedCrop.soilType,
        'irrigationType': updatedCrop.irrigationType,
        'farmingMethod': updatedCrop.farmingMethod,
        'farmingType': updatedCrop.farmingType,
        'status': updatedCrop.status,
      }).catchError((_) {});
    }
  }

  Future<void> refresh() async {
    await fetchFromBackend();
  }

  Future<void> deleteCrop(String cropId) async {
    crops.removeWhere((c) => c.id == cropId);
    notifyListeners();
    try {
      await ApiService().deleteCrop(cropId);
    } catch (_) {}
  }

  void updateCropStage(String cropId, String newStage) {
    final idx = crops.indexWhere((c) => c.id == cropId);
    if (idx != -1) {
      final stageIdx = FarmerConstants.cropStatuses.indexOf(newStage);
      crops[idx].status = newStage;
      crops[idx].stageIndex = stageIdx != -1 ? stageIdx : crops[idx].stageIndex;
      crops[idx].progress = (crops[idx].stageIndex + 1) / FarmerConstants.cropStatuses.length;
      notifyListeners();
    }
  }

  void addProduct(ProductItem product) {
    products.insert(0, product);
    notifyListeners();
    ApiService().createProduct(profile.id, {
      'productName': product.productName,
      'name': product.productName,
      'variety': product.variety,
      'category': product.category,
      'sellingPrice': product.pricePerUnit,
      'pricePerKg': product.pricePerUnit,
      'stock': product.stockQuantity,
      'stockQuantity': product.stockQuantity,
      'totalQuantity': product.stockQuantity,
      'availableQuantity': product.stockQuantity,
      'minimumOrderQuantity': product.minimumOrderQuantity,
      'unit': product.unit,
      'cropName': product.cropLinked,
      'farmingType': product.farmingType,
      'farmName': product.farmName,
      'farmLocation': product.farmLocation,
      'sowingDate': product.sowingDate,
      'harvestDate': product.harvestDate,
      'availableFrom': product.availableFrom,
      'availableUntil': product.availableUntil,
      'status': product.status,
      'image': product.imageUrl,
      'media': {
        'mainPhoto': product.imageUrl,
        'photos': product.photos,
      },
      'grades': [
        {'grade': product.grade.replaceAll('Grade ', '').trim(), 'quantity': product.stockQuantity}
      ]
    }).catchError((_) {});
  }

  void updateProduct(ProductItem updated) {
    final idx = products.indexWhere((p) => p.id == updated.id || p.productId == updated.productId);
    if (idx != -1) {
      products[idx] = updated;
      notifyListeners();
    }
    ApiService().updateProduct(updated.id, {
      'productName': updated.productName,
      'name': updated.productName,
      'variety': updated.variety,
      'category': updated.category,
      'sellingPrice': updated.pricePerUnit,
      'pricePerKg': updated.pricePerUnit,
      'stock': updated.stockQuantity,
      'stockQuantity': updated.stockQuantity,
      'totalQuantity': updated.stockQuantity,
      'availableQuantity': updated.stockQuantity,
      'minimumOrderQuantity': updated.minimumOrderQuantity,
      'unit': updated.unit,
      'cropName': updated.cropLinked,
      'farmingType': updated.farmingType,
      'farmName': updated.farmName,
      'farmLocation': updated.farmLocation,
      'sowingDate': updated.sowingDate,
      'harvestDate': updated.harvestDate,
      'availableFrom': updated.availableFrom,
      'availableUntil': updated.availableUntil,
      'status': updated.status,
      'image': updated.imageUrl,
      'media': {
        'mainPhoto': updated.imageUrl,
        'photos': updated.photos,
      },
      'grades': [
        {'grade': updated.grade.replaceAll('Grade ', '').trim(), 'quantity': updated.stockQuantity}
      ]
    }).catchError((_) {});
  }

  void updateProductStatus(String productId, String newStatus) {
    final idx = products.indexWhere((p) => p.id == productId || p.productId == productId);
    if (idx != -1) {
      products[idx].status = newStatus;
      notifyListeners();
    }
  }

  Future<void> deleteProduct(String productId) async {
    products.removeWhere((p) => p.id == productId || p.productId == productId);
    notifyListeners();
    try {
      await ApiService().deleteProduct(productId);
    } catch (_) {}
  }

  void updateProductStock(String productId, double newStock) {
    final idx = products.indexWhere((p) => p.id == productId || p.productId == productId);
    if (idx != -1) {
      products[idx].stockQuantity = newStock;
      notifyListeners();
    }
  }

  void updateOrderStatus(String orderId, String newStatus) {
    final idx = orders.indexWhere((o) => o.id == orderId || o.orderCode == orderId);
    if (idx != -1) {
      orders[idx].status = newStatus;
      notifyListeners();
      ApiService().updateOrderStatus(profile.id, orders[idx].id, newStatus).catchError((_) {});
    }
  }

  Future<void> acceptOrder(String orderId) async {
    final idx = orders.indexWhere((o) => o.id == orderId || o.orderCode == orderId);
    if (idx != -1) {
      orders[idx].status = 'ACCEPTED';
      notifyListeners();
    }
    try {
      await ApiService().acceptOrder(orderId);
    } catch (_) {}
  }

  Future<void> rejectOrder(String orderId, {required String reason, String note = ''}) async {
    final idx = orders.indexWhere((o) => o.id == orderId || o.orderCode == orderId);
    if (idx != -1) {
      orders[idx].status = 'REJECTED';
      notifyListeners();
    }
    try {
      await ApiService().rejectOrder(orderId, {
        'rejectionReason': reason,
        'rejectionNote': note,
      });
    } catch (_) {}
  }

  Future<void> packOrder(String orderId, {
    required double packedQuantity,
    required int packageCount,
    required String packageType,
    required double packageWeight,
    required String packingDate,
    String notes = '',
  }) async {
    final idx = orders.indexWhere((o) => o.id == orderId || o.orderCode == orderId);
    if (idx != -1) {
      orders[idx].status = 'PREPARING';
      notifyListeners();
    }
    try {
      await ApiService().packOrder(orderId, {
        'packedQuantity': packedQuantity,
        'packingDetails': {
          'packageCount': packageCount,
          'packageType': packageType,
          'packageWeight': packageWeight,
          'packingDate': packingDate,
          'notes': notes,
        },
      });
    } catch (_) {}
  }

  Future<void> readyOrder(String orderId) async {
    final idx = orders.indexWhere((o) => o.id == orderId || o.orderCode == orderId);
    if (idx != -1) {
      orders[idx].status = 'READY_FOR_PICKUP';
      notifyListeners();
    }
    try {
      await ApiService().readyOrder(orderId);
    } catch (_) {}
  }

  void updateProfile(FarmerProfile newProfile) {
    profile = newProfile;
    notifyListeners();
  }

  void uploadDocument(String docId, {String? fileUrl, String status = 'pending', String rejectionReason = ''}) {
    final idx = documents.indexWhere((d) => d.id == docId);
    if (idx != -1) {
      final doc = documents[idx];
      documents[idx] = DocumentItem(
        id: doc.id,
        type: doc.type,
        title: doc.title,
        marathiTitle: doc.marathiTitle,
        isUploaded: true,
        status: status,
        uploadDate: 'Today',
        fileUrl: fileUrl ?? doc.fileUrl,
        rejectionReason: rejectionReason,
      );
      notifyListeners();

      // Persist to backend database so it shows in vendor portal immediately
      if (fileUrl != null && fileUrl.isNotEmpty) {
        final isPdf = fileUrl.startsWith('data:application/pdf') || fileUrl.toLowerCase().endsWith('.pdf');
        final ext = isPdf ? 'pdf' : 'jpg';
        final sanitizedTitle = doc.title.replaceAll(RegExp(r'[^\w\s-]'), '').replaceAll(' ', '_');
        final fileName = '${sanitizedTitle}_${DateTime.now().millisecondsSinceEpoch}.$ext';

        ApiService().uploadDocument(profile.id, {
          'type': doc.type,
          'name': '${doc.title} (${doc.marathiTitle})',
          'fileName': fileName,
          'fileUrl': fileUrl,
          'status': status == 'approved' ? 'Approved' : 'Pending',
        }).catchError((err) {
          debugPrint('Failed to sync document to backend: $err');
        });
      }
    }
  }

  // Dashboard calculations
  double get totalEarnings => orders
      .where((o) => o.status == 'Completed')
      .fold(0.0, (sum, o) => sum + o.totalAmount) + 84500.0;

  double get pendingEarnings => orders
      .where((o) => o.status != 'Completed' && o.status != 'Rejected')
      .fold(0.0, (sum, o) => sum + o.totalAmount);

  double get totalStockKg => products.fold(0.0, (sum, p) => sum + (p.unit == 'Quintal' ? p.stockQuantity * 100 : p.stockQuantity));
}
