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
            products = prodRes.map((p) => ProductItem.fromJson(p as Map<String, dynamic>)).toList();
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
    id: 'FARM-8942',
    fullName: 'Ramesh Shinde (रमेश शिंदे)',
    mobile: '9822345678',
    email: 'ramesh.shinde@greengroo.in',
    farmName: 'Shree Ganesh Krushi Farm (श्री गणेश कृषी फार्म)',
    totalAcres: 4.5,
    village: 'Malegaon Budruk',
    taluka: 'Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '413115',
    soilType: 'Black Soil (काळी माती)',
    irrigationType: 'Drip (ठिबक सिंचन)',
    waterSource: 'Well + Canal (विहीर व कालवा)',
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
        cropName: 'Brinjal (वांगी)',
        variety: 'Pusa Purple Long',
        acreage: 1.5,
        sowingDate: '15 Aug 2026',
        estHarvestDate: '14 Oct 2026',
        soilType: 'Black Soil (काळी माती)',
        irrigationType: 'Drip (ठिबक)',
        status: 'Harvest Readiness',
        progress: 0.85,
        stageIndex: 20,
      ),
      CropItem(
        id: 'CRP-002',
        cropName: 'Tomato (टोमॅटो)',
        variety: 'Abhinav Hybrid',
        acreage: 2.0,
        sowingDate: '01 Sep 2026',
        estHarvestDate: '02 Nov 2026',
        soilType: 'Loamy Soil (गाळाची माती)',
        irrigationType: 'Drip (ठिबक)',
        status: 'Crop Growth Monitoring',
        progress: 0.68,
        stageIndex: 18,
      ),
      CropItem(
        id: 'CRP-003',
        cropName: 'Onion (कांदा)',
        variety: 'Nashik Red',
        acreage: 1.0,
        sowingDate: '10 Sep 2026',
        estHarvestDate: '15 Dec 2026',
        soilType: 'Medium Black (मध्यम काळी)',
        irrigationType: 'Sprinkler (तुषार)',
        status: 'Sowing/Plantation Completed',
        progress: 0.38,
        stageIndex: 10,
      ),
    ];

    products = [
      ProductItem(
        id: 'PRD-102',
        productId: 'GGC-ART-VEG-TOM-BAJ-00002',
        productName: 'Tomato',
        variety: 'Bajeerao',
        category: 'Vegetables (भाजीपाला)',
        cropLinked: 'Tomato (टोमॅटो)',
        grade: 'Grade A',
        unit: 'Kg',
        pricePerUnit: 25.0,
        stockQuantity: 3000.0,
        minimumOrderQuantity: 50.0,
        farmingType: 'Organic (सेंद्रिय)',
        farmName: 'My Krushi Farm',
        farmLocation: 'Sawargaon Tal, Baramati',
        sowingDate: '01 Jun 2026',
        harvestDate: '01 Sept 2026',
        availableFrom: '01 Sept 2026',
        availableUntil: '30 Oct 2026',
        status: 'Active',
      ),
      ProductItem(
        id: 'PRD-103',
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
        farmName: 'My Krushi Farm',
        farmLocation: 'Sawargaon Tal, Baramati',
        sowingDate: '10 Jun 2026',
        harvestDate: '02 Sept 2026',
        availableFrom: '02 Sept 2026',
        availableUntil: '30 Nov 2026',
        status: 'Out of Stock',
      ),
      ProductItem(
        id: 'PRD-101',
        productId: 'GGC-ART-VEG-BRJ-PUS-00001',
        productName: 'Brinjal',
        variety: 'Pusa Purple Long',
        category: 'Vegetables (भाजीपाला)',
        cropLinked: 'Brinjal (वांगी)',
        grade: 'Grade A',
        unit: 'Kg',
        pricePerUnit: 30.0,
        stockQuantity: 500.0,
        minimumOrderQuantity: 20.0,
        farmingType: 'Organic (सेंद्रिय)',
        farmName: 'My Krushi Farm',
        farmLocation: 'Sawargaon Tal, Baramati',
        sowingDate: '15 Aug 2026',
        harvestDate: '14 Oct 2026',
        availableFrom: '15 Oct 2026',
        availableUntil: '30 Nov 2026',
        status: 'Active',
      ),
    ];

    orders = [
      FarmerOrderItem(
        id: 'ORD-501',
        orderCode: 'GGC-ORD-20260907-00001',
        buyerName: 'Swastik Supermarket Pune',
        buyerPhone: '+91 98501 23456',
        productName: 'Fresh Organic Brinjal',
        cropName: 'Brinjal (वांगी)',
        variety: 'Pusa Purple Long',
        quantity: 290.0,
        orderedQuantity: 290.0,
        receivedQuantity: 290.0,
        unit: 'Kg',
        rate: 30.0,
        gradeAQty: 200.0,
        gradeARate: 30.0,
        gradeARejected: 0.0,
        gradeBQty: 80.0,
        gradeBRate: 12.0,
        gradeBRejected: 0.0,
        gradeCQty: 0.0,
        gradeCRate: 0.0,
        gradeCRejected: 0.0,
        rejectedQuantity: 10.0,
        totalAmount: 6960.0,
        status: 'Completed',
        qualityStatus: 'ORDER_COMPLETED',
        paymentStatus: 'PAID',
        pickupDate: '08/09/2026, Tuesday',
        pickupSlot: '7:00 AM',
        createdAt: '07/09/2026, Monday',
        transactionId: 'TXN-GGC-20260907-9921',
      ),
      FarmerOrderItem(
        id: 'ORD-502',
        orderCode: 'GGC-ORD-20260910-00002',
        buyerName: 'Nature Fresh Mart Mumbai',
        buyerPhone: '+91 98220 54321',
        productName: 'Fresh Hybrid Tomatoes',
        cropName: 'Tomato (टोमॅटो)',
        variety: 'Abhinav Hybrid',
        quantity: 435.0,
        orderedQuantity: 435.0,
        receivedQuantity: 435.0,
        unit: 'Kg',
        rate: 25.0,
        gradeAQty: 300.0,
        gradeARate: 25.0,
        gradeARejected: 0.0,
        gradeBQty: 120.0,
        gradeBRate: 10.0,
        gradeBRejected: 0.0,
        gradeCQty: 0.0,
        gradeCRate: 0.0,
        gradeCRejected: 0.0,
        rejectedQuantity: 15.0,
        totalAmount: 8700.0,
        status: 'Completed',
        qualityStatus: 'ORDER_COMPLETED',
        paymentStatus: 'PAID',
        pickupDate: '11/09/2026, Friday',
        pickupSlot: '7:30 AM',
        createdAt: '10/09/2026, Thursday',
        transactionId: 'TXN-GGC-20260910-4412',
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
        title: 'Aadhaar / ID Proof',
        marathiTitle: 'आधार कार्ड',
        isUploaded: true,
        status: 'approved',
        uploadDate: '12 Aug 2026',
      ),
      DocumentItem(
        id: 'DOC-2',
        type: 'pan',
        title: 'PAN Card',
        marathiTitle: 'पॅन कार्ड',
        isUploaded: true,
        status: 'approved',
        uploadDate: '12 Aug 2026',
      ),
      DocumentItem(
        id: 'DOC-3',
        type: 'bank',
        title: 'Bank Passbook / Cheque',
        marathiTitle: 'बँक पासबुक / धनादेश',
        isUploaded: true,
        status: 'approved',
        uploadDate: '14 Aug 2026',
      ),
      DocumentItem(
        id: 'DOC-4',
        type: 'land_712',
        title: '7/12 & 8-A Extract',
        marathiTitle: '७/१२ व ८-अ उतारा',
        isUploaded: true,
        status: 'approved',
        uploadDate: '15 Aug 2026',
      ),
      DocumentItem(
        id: 'DOC-5',
        type: 'soil_report',
        title: 'Soil Testing Report',
        marathiTitle: 'मृदा परीक्षण अहवाल',
        isUploaded: true,
        status: 'approved',
        uploadDate: '18 Aug 2026',
      ),
      DocumentItem(
        id: 'DOC-6',
        type: 'organic_cert',
        title: 'Organic Farming Certificate',
        marathiTitle: 'सेंद्रिय शेती प्रमाणपत्र',
        isUploaded: false,
        status: 'not_uploaded',
      ),
      DocumentItem(
        id: 'DOC-7',
        type: 'crop_insurance',
        title: 'Crop Insurance Receipt',
        marathiTitle: 'पीक विमा पावती',
        isUploaded: true,
        status: 'approved',
        uploadDate: '25 Aug 2026',
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
      'name': product.productName,
      'variety': product.variety,
      'category': product.category,
      'sellingPrice': product.pricePerUnit,
      'stock': product.stockQuantity,
      'unit': product.unit,
      'cropName': product.cropLinked,
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
    final idx = orders.indexWhere((o) => o.id == orderId);
    if (idx != -1) {
      orders[idx].status = newStatus;
      notifyListeners();
      ApiService().updateOrderStatus(profile.id, orderId, newStatus).catchError((_) {});
    }
  }

  void updateProfile(FarmerProfile newProfile) {
    profile = newProfile;
    notifyListeners();
  }

  void uploadDocument(String docId) {
    final idx = documents.indexWhere((d) => d.id == docId);
    if (idx != -1) {
      documents[idx] = DocumentItem(
        id: documents[idx].id,
        type: documents[idx].type,
        title: documents[idx].title,
        marathiTitle: documents[idx].marathiTitle,
        isUploaded: true,
        status: 'pending',
        uploadDate: 'Today',
      );
      notifyListeners();
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
