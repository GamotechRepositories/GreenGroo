import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'sound_service.dart';
import 'package:flutter/material.dart';
import '../models/farmer_models.dart';
import '../core/constants/farmer_constants.dart';
import 'api_service.dart';

class FarmerState extends ChangeNotifier {
  static final FarmerState _instance = FarmerState._internal();
  factory FarmerState() => _instance;
  FarmerState._internal() {
    _ensureDocumentChecklist();
    initPreferences();
    if (isLoggedIn) {
      fetchFromBackend();
    }
    _startPeriodicNotificationPolling();
  }

  Timer? _notificationPollingTimer;
  Future<void>? _prefsLoad;
  bool _syncing = false;
  bool _pollInFlight = false;
  bool _ordersChanged = false;
  bool _documentsChanged = false;
  bool _profileChanged = false;
  bool _productsChanged = false;
  bool _cropsChanged = false;
  bool _schemesChanged = false;
  final Set<String> _knownOrderIds = {};
  final Map<String, String> _knownOrderStatusMap = {};
  final Map<String, String> _knownDocumentStatusMap = {};
  void Function(DocumentItem doc)? onDocumentStatusChanged;
  bool _ordersBaselineDone = false;
  bool _documentsBaselineDone = false;
  bool isPreferencesLoaded = false;

  void _startPeriodicNotificationPolling() {
    _notificationPollingTimer?.cancel();
    _notificationPollingTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      if (isLoggedIn) _refreshInBackground();
    });
  }

  bool get _liveDataChanged =>
      _profileChanged || _productsChanged || _cropsChanged || _ordersChanged || _documentsChanged || _schemesChanged;

  /// Keeps farmer data current without a manual Sync tap.
  Future<void> _refreshInBackground() async {
    if (!isLoggedIn || _syncing || _pollInFlight) return;
    _pollInFlight = true;
    var connectionChanged = false;
    try {
      if (!isConnectedToBackend) {
        final healthy = await ApiService().checkHealth();
        if (healthy != isConnectedToBackend) {
          isConnectedToBackend = healthy;
          backendUrl = ApiService().baseUrl;
          connectionMessage = healthy ? 'Connected: $backendUrl' : 'Disconnected (Using Offline Cache)';
          connectionChanged = true;
        }
        if (!healthy) {
          if (connectionChanged) notifyListeners();
          return;
        }
      }
      final stillLoading = !dashboardReady || !documentsReady || !schemesReady;
      await Future.wait([
        _markReady(_fetchProfileSafe(), () => profileReady = true),
        _markReady(_fetchProductsSafe(), () => productsReady = true),
        _markReady(_fetchOrdersSafe(), () => ordersReady = true),
        _markReady(_fetchCropsSafe(), () => cropsReady = true),
        _markReady(_fetchDocumentsSafe(), () => documentsReady = true),
        _markReady(_fetchSchemesSafe(), () => schemesReady = true),
      ]);
      if (connectionChanged || _liveDataChanged || stillLoading) notifyListeners();
    } catch (_) {
    } finally {
      _pollInFlight = false;
    }
  }

  bool isLoggedIn = false;
  bool isConnectedToBackend = false;
  String backendUrl = '';
  bool isLoadingFromBackend = false;
  bool profileReady = false;
  bool productsReady = false;
  bool ordersReady = false;
  bool cropsReady = false;
  bool documentsReady = false;
  bool schemesReady = false;
  String connectionMessage = 'Connecting...';

  bool get dashboardReady => profileReady && productsReady && ordersReady && cropsReady;

  Future<T> _markReady<T>(Future<T> future, void Function() mark) {
    return future.whenComplete(mark);
  }

  void _markAllSectionsReady() {
    profileReady = true;
    productsReady = true;
    ordersReady = true;
    cropsReady = true;
    documentsReady = true;
    schemesReady = true;
  }

  void logout() {
    isLoggedIn = false;
    ApiService().setToken(null);
    _persistProfile();
    notifyListeners();
  }

  void login() {
    isLoggedIn = true;
    _persistProfile();
    fetchFromBackend();
    notifyListeners();
  }

  Future<void> fetchFromBackend() async {
    if (_syncing) return;
    _syncing = true;
    isLoadingFromBackend = true;
    notifyListeners();

    try {
      final healthy = await ApiService().checkHealth();
      isConnectedToBackend = healthy;
      backendUrl = ApiService().baseUrl;

      if (healthy) {
        connectionMessage = 'Connected: $backendUrl';

        await _markReady(_fetchProfileSafe(), () => profileReady = true);
        notifyListeners();
        await Future.wait([
          _markReady(_fetchProductsSafe(), () => productsReady = true),
          _markReady(_fetchOrdersSafe(), () => ordersReady = true),
          _markReady(_fetchCropsSafe(), () => cropsReady = true),
        ]);
        notifyListeners();
        await Future.wait([
          _markReady(_fetchDocumentsSafe(), () => documentsReady = true),
          _markReady(_fetchSchemesSafe(), () => schemesReady = true),
        ]);
      } else {
        connectionMessage = 'Disconnected (Using Offline Cache)';
        _markAllSectionsReady();
      }
    } catch (e) {
      isConnectedToBackend = false;
      connectionMessage = 'Offline ($e)';
      _markAllSectionsReady();
    } finally {
      _syncing = false;
      isLoadingFromBackend = false;
      notifyListeners();
    }
  }

  String _profileKey(FarmerProfile p) =>
      '${p.id}|${p.fullName}|${p.mobile}|${p.email}|${p.farmName}|${p.totalAcres}|${p.kycStatus}|${p.bankVerificationStatus}|${p.village}|${p.taluka}|${p.district}|${p.soilType}|${p.irrigationType}|${p.profilePhoto}|${p.farmPhoto}';

  Future<void> _fetchProfileSafe() async {
    _profileChanged = false;
    try {
      final pRes = await ApiService().fetchFarmerProfile(profile.id);
      if (pRes is Map<String, dynamic>) {
        final fMap = (pRes['farmer'] is Map) ? pRes['farmer'] as Map<String, dynamic> : pRes;
        var next = FarmerProfile.fromJson(fMap);
        // Preserve local photos if backend returns empty
        if (next.profilePhoto.isEmpty && profile.profilePhoto.isNotEmpty) {
          next = next.copyWith(profilePhoto: profile.profilePhoto);
        }
        if (next.farmPhoto.isEmpty && profile.farmPhoto.isNotEmpty) {
          next = next.copyWith(farmPhoto: profile.farmPhoto, farmPhotos: profile.farmPhotos);
        }
        if (_profileKey(next) != _profileKey(profile)) {
          profile = next;
          _profileChanged = true;
          _persistProfile();
        }
      }
    } catch (_) {}
  }

  bool _sameProducts(List<ProductItem> next) {
    if (next.length != products.length) return false;
    for (var i = 0; i < next.length; i++) {
      final a = products[i];
      final b = next[i];
      if (a.id != b.id ||
          a.productName != b.productName ||
          a.status != b.status ||
          a.stockQuantity != b.stockQuantity ||
          a.pricePerUnit != b.pricePerUnit ||
          a.variety != b.variety) {
        return false;
      }
    }
    return true;
  }

  Future<void> _fetchProductsSafe() async {
    _productsChanged = false;
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
        if (fetched.isNotEmpty && !_sameProducts(fetched)) {
          products = fetched;
          _productsChanged = true;
        }
      }
    } catch (_) {}
  }

  bool _sameOrders(List<FarmerOrderItem> next) {
    if (next.length != orders.length) return false;
    for (var i = 0; i < next.length; i++) {
      final a = orders[i];
      final b = next[i];
      if (a.id != b.id ||
          a.status != b.status ||
          a.paymentStatus != b.paymentStatus ||
          a.qualityStatus != b.qualityStatus ||
          a.totalAmount != b.totalAmount ||
          a.quantity != b.quantity ||
          a.receivedQuantity != b.receivedQuantity ||
          a.rejectedQuantity != b.rejectedQuantity ||
          a.gradeAQty != b.gradeAQty ||
          a.gradeBQty != b.gradeBQty ||
          a.gradeCQty != b.gradeCQty ||
          a.transactionId != b.transactionId ||
          a.rejectionReason != b.rejectionReason) {
        return false;
      }
    }
    return true;
  }

  Future<void> _fetchOrdersSafe() async {
    _ordersChanged = false;
    try {
      final ordRes = await ApiService().fetchOrders(profile.id);
      if (ordRes is List) {
        final fetchedOrders = <FarmerOrderItem>[];
        for (final raw in ordRes) {
          if (raw is! Map) continue;
          try {
            fetchedOrders.add(FarmerOrderItem.fromJson(Map<String, dynamic>.from(raw)));
          } catch (_) {}
        }
        if (_sameOrders(fetchedOrders)) {
          _ordersBaselineDone = true;
          return;
        }

        bool hasBrandNewUnannouncedOrder = false;
        final knownBefore = _knownOrderIds.length;
        final playedBefore = playedSoundNotificationIds.length;
        
        for (final order in fetchedOrders) {
          final soundKey = 'order_${order.id}_${order.status.toLowerCase()}';
          
          if (_ordersBaselineDone) {
            // Only trigger sound if this exact order status has NEVER played sound before
            if (!_knownOrderIds.contains(order.id) && !playedSoundNotificationIds.contains(soundKey)) {
              hasBrandNewUnannouncedOrder = true;
              playedSoundNotificationIds.add(soundKey);
            } else if (_knownOrderStatusMap[order.id] != null &&
                       _knownOrderStatusMap[order.id]!.toLowerCase() != order.status.toLowerCase() &&
                       !playedSoundNotificationIds.contains(soundKey)) {
              hasBrandNewUnannouncedOrder = true;
              playedSoundNotificationIds.add(soundKey);
            }
          } else {
            // First time sync at startup: register all without playing sound
            playedSoundNotificationIds.add(soundKey);
          }
          
          _knownOrderIds.add(order.id);
          _knownOrderStatusMap[order.id] = order.status;
        }
        
        orders = fetchedOrders;
        _ordersChanged = true;
        if (_knownOrderIds.length != knownBefore || playedSoundNotificationIds.length != playedBefore) {
          _persistNotificationPreferences();
        }

        // Play notification sound ONLY once for genuinely new incoming orders
        if (hasBrandNewUnannouncedOrder) {
          debugPrint('🔔 Genuinely NEW incoming order arrived! Playing notification sound once.');
          NotificationSoundService().playNotificationSound();
        }

        _ordersBaselineDone = true;
      }
    } catch (_) {}
  }

  bool _sameCrops(List<CropItem> next) {
    if (next.length != crops.length) return false;
    for (var i = 0; i < next.length; i++) {
      final a = crops[i];
      final b = next[i];
      if (a.id != b.id || a.cropName != b.cropName || a.status != b.status || a.progress != b.progress || a.stageIndex != b.stageIndex) {
        return false;
      }
    }
    return true;
  }

  Future<void> _fetchCropsSafe() async {
    _cropsChanged = false;
    try {
      final cropRes = await ApiService().fetchCrops();
      if (cropRes is List && cropRes.isNotEmpty) {
        final fetched = cropRes.map((c) => CropItem.fromJson(c as Map<String, dynamic>)).toList();
        if (!_sameCrops(fetched)) {
          crops = fetched;
          _cropsChanged = true;
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchDocumentsSafe() async {
    _documentsChanged = false;
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
          _ensureDocumentChecklist();
        }

        bool hasBrandNewDocUpdate = false;
        DocumentItem? latestUpdatedDoc;

        final previousDocs = documents;
        final nextDocs = previousDocs.map((localDoc) {
          final backendDoc = docMap[localDoc.type.toLowerCase()];
          if (backendDoc != null) {
            final st = (backendDoc['status'] ?? 'Not Uploaded').toString();
            final fUrl = (backendDoc['fileUrl'] ?? '').toString();
            final rReason = (backendDoc['rejectionReason'] ?? '').toString();
            final effectiveUrl = fUrl.isNotEmpty ? fUrl : localDoc.fileUrl;
            final hasFile = effectiveUrl.isNotEmpty || (backendDoc['fileName'] ?? '').toString().isNotEmpty || localDoc.isUploaded;
            final normalizedStatus = st == 'Approved'
                ? 'approved'
                : (st == 'Rejected' ? 'rejected' : (hasFile ? (localDoc.status.isNotEmpty && localDoc.status != 'not_uploaded' ? localDoc.status : 'pending') : 'not_uploaded'));

            final soundKey = 'doc_${localDoc.id}_$normalizedStatus';

            if (_documentsBaselineDone) {
              final prevStatus = _knownDocumentStatusMap[localDoc.id];
              if (prevStatus != null &&
                  prevStatus != normalizedStatus &&
                  (normalizedStatus == 'approved' || normalizedStatus == 'rejected')) {
                if (!playedSoundNotificationIds.contains(soundKey)) {
                  hasBrandNewDocUpdate = true;
                  playedSoundNotificationIds.add(soundKey);
                  latestUpdatedDoc = DocumentItem(
                    id: localDoc.id,
                    type: localDoc.type,
                    title: localDoc.title,
                    marathiTitle: localDoc.marathiTitle,
                    isUploaded: hasFile,
                    status: normalizedStatus,
                    uploadDate: 'Just now',
                    fileUrl: effectiveUrl,
                    rejectionReason: rReason,
                  );
                }
              }
            } else {
              playedSoundNotificationIds.add(soundKey);
            }

            _knownDocumentStatusMap[localDoc.id] = normalizedStatus;

            return DocumentItem(
              id: localDoc.id,
              type: localDoc.type,
              title: localDoc.title,
              marathiTitle: localDoc.marathiTitle,
              isUploaded: hasFile,
              status: normalizedStatus,
              uploadDate: backendDoc['uploadedAt'] != null ? 'Uploaded' : localDoc.uploadDate,
              fileUrl: effectiveUrl,
              rejectionReason: rReason,
            );
          }
          return localDoc;
        }).toList();

        var docsChanged = nextDocs.length != previousDocs.length;
        if (!docsChanged) {
          for (var i = 0; i < nextDocs.length; i++) {
            final before = previousDocs[i];
            final after = nextDocs[i];
            if (before.status != after.status ||
                before.isUploaded != after.isUploaded ||
                before.fileUrl != after.fileUrl ||
                before.rejectionReason != after.rejectionReason ||
                before.uploadDate != after.uploadDate) {
              docsChanged = true;
              break;
            }
          }
        }
        if (docsChanged) {
          documents = nextDocs;
          _documentsChanged = true;
          _persistDocuments();
        }
        _documentsBaselineDone = true;
        if (hasBrandNewDocUpdate) {
          _persistNotificationPreferences();
          NotificationSoundService().playNotificationSound();
          if (latestUpdatedDoc != null) {
            onDocumentStatusChanged?.call(latestUpdatedDoc!);
          }
          _documentsChanged = true;
        }
      }
    } catch (_) {}
  }

  bool _sameSchemes(List<GovtScheme> next) {
    if (next.length != schemes.length) return false;
    for (var i = 0; i < next.length; i++) {
      final a = schemes[i];
      final b = next[i];
      if (a.id != b.id || a.title != b.title || a.status != b.status || a.deadline != b.deadline) return false;
    }
    return true;
  }

  Future<void> _fetchSchemesSafe() async {
    _schemesChanged = false;
    try {
      final schemeRes = await ApiService().fetchLiveGovtSchemes();
      if (schemeRes is List) {
        final fetched = schemeRes
            .whereType<Map>()
            .map((row) {
              try {
                return GovtScheme.fromApiJson(Map<String, dynamic>.from(row));
              } catch (_) {
                return null;
              }
            })
            .whereType<GovtScheme>()
            .where((scheme) => scheme.id.isNotEmpty)
            .toList();
        if (!_sameSchemes(fetched)) {
          schemes = fetched;
          _schemesChanged = true;
        }
      }
    } catch (_) {}
  }

  // Farmer Profile
  FarmerProfile profile = FarmerProfile(
    id: '',
    fullName: '',
    mobile: '',
    email: '',
    farmName: '',
    totalAcres: 0,
    village: '',
    taluka: '',
    district: '',
    state: '',
    pincode: '',
    soilType: '',
    irrigationType: '',
    waterSource: '',
    farmingMethod: '',
    kycStatus: 'PENDING',
    bankVerificationStatus: 'PENDING',
    locationConfirmed: false,
    mainCrops: '',
    farmAddress: '',
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

  // Notifications Tracking with Persistent Storage
  final Set<String> readNotificationIds = {};
  final Set<String> deletedNotificationIds = {};
  final Set<String> playedSoundNotificationIds = {};

  Future<void> initPreferences() {
    return _prefsLoad ??= _loadAllPreferences();
  }

  Future<void> _loadAllPreferences() async {
    await Future.wait([
      _loadNotificationPreferences(),
      _loadProfilePreferences(),
      _loadDocumentsPreferences(),
    ]);
  }

  Future<void> _loadProfilePreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final pStr = prefs.getString('farmer_profile_data');
      if (pStr != null && pStr.isNotEmpty) {
        final decoded = jsonDecode(pStr);
        if (decoded is Map<String, dynamic>) {
          profile = FarmerProfile.fromJson(decoded);
          if (profile.id.isNotEmpty || profile.fullName.isNotEmpty) {
            profileReady = true;
          }
        }
      }
      final savedLogin = prefs.getBool('farmer_is_logged_in');
      if (savedLogin != null) {
        isLoggedIn = savedLogin;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading profile preferences: $e');
    }
  }

  Future<void> _persistProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('farmer_profile_data', jsonEncode(profile.toJson()));
      await prefs.setBool('farmer_is_logged_in', isLoggedIn);
    } catch (e) {
      debugPrint('Error saving profile preferences: $e');
    }
  }

  Future<void> _loadDocumentsPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final dStr = prefs.getString('farmer_documents_data');
      if (dStr != null && dStr.isNotEmpty) {
        final decoded = jsonDecode(dStr);
        if (decoded is List) {
          final savedDocs = decoded
              .whereType<Map>()
              .map((m) => DocumentItem.fromJson(Map<String, dynamic>.from(m)))
              .toList();
          if (savedDocs.isNotEmpty) {
            _mergeLoadedDocuments(savedDocs);
            documentsReady = true;
          }
        }
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading documents preferences: $e');
    }
  }

  void _mergeLoadedDocuments(List<DocumentItem> loaded) {
    _ensureDocumentChecklist();
    final map = {for (final d in loaded) d.type.toLowerCase(): d};
    documents = documents.map((base) {
      final found = map[base.type.toLowerCase()];
      if (found != null) {
        return DocumentItem(
          id: base.id,
          type: base.type,
          title: base.title,
          marathiTitle: base.marathiTitle,
          isUploaded: found.isUploaded,
          status: found.status,
          uploadDate: found.uploadDate,
          fileUrl: found.fileUrl,
          rejectionReason: found.rejectionReason,
        );
      }
      return base;
    }).toList();
  }

  Future<void> _persistDocuments() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final listJson = documents.map((d) => d.toJson()).toList();
      await prefs.setString('farmer_documents_data', jsonEncode(listJson));
    } catch (e) {
      debugPrint('Error saving documents preferences: $e');
    }
  }

  Future<void> _loadNotificationPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final del = prefs.getStringList('farmer_deleted_notifications');
      if (del != null && del.isNotEmpty) {
        deletedNotificationIds.addAll(del);
      }
      final read = prefs.getStringList('farmer_read_notifications');
      if (read != null && read.isNotEmpty) {
        readNotificationIds.addAll(read);
      }
      final played = prefs.getStringList('farmer_played_sound_notifications');
      if (played != null && played.isNotEmpty) {
        playedSoundNotificationIds.addAll(played);
      }
      final known = prefs.getStringList('farmer_known_orders');
      if (known != null && known.isNotEmpty) {
        _knownOrderIds.addAll(known);
      }
      isPreferencesLoaded = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading notification preferences: $e');
    }
  }

  Future<void> _persistNotificationPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('farmer_deleted_notifications', deletedNotificationIds.toList());
      await prefs.setStringList('farmer_read_notifications', readNotificationIds.toList());
      await prefs.setStringList('farmer_played_sound_notifications', playedSoundNotificationIds.toList());
      await prefs.setStringList('farmer_known_orders', _knownOrderIds.toList());
    } catch (e) {
      debugPrint('Error saving notification preferences: $e');
    }
  }

  void markNotificationAsRead(String id) {
    if (!readNotificationIds.contains(id)) {
      readNotificationIds.add(id);
      _persistNotificationPreferences();
      notifyListeners();
    }
  }

  void markAllNotificationsAsRead(Iterable<String> ids) {
    readNotificationIds.addAll(ids);
    _persistNotificationPreferences();
    notifyListeners();
  }

  void deleteNotification(String id) {
    deletedNotificationIds.add(id);
    readNotificationIds.remove(id);
    _persistNotificationPreferences();
    notifyListeners();
  }

  void clearAllNotifications(Iterable<String> ids) {
    deletedNotificationIds.addAll(ids);
    _persistNotificationPreferences();
    notifyListeners();
  }

  int get unreadNotificationCount {
    int count = 0;
    for (final order in orders) {
      final notifId = 'order_${order.id}';
      final paymentNotifId = 'payment_${order.id}';

      final st = order.status.toLowerCase();
      final isCompleted = st == 'completed' || st == 'order_completed';
      final isReady = st.contains('ready');
      final isNew = st == 'new' || st == 'pending';

      if (isNew) {
        if (!deletedNotificationIds.contains(notifId) && !readNotificationIds.contains(notifId)) {
          count++;
        }
      } else if (isReady) {
        if (!deletedNotificationIds.contains(notifId) && !readNotificationIds.contains(notifId)) {
          count++;
        }
      } else if (isCompleted) {
        if (!deletedNotificationIds.contains(paymentNotifId) && !readNotificationIds.contains(paymentNotifId)) {
          count++;
        }
      }
    }

    for (final doc in documents) {
      final st = doc.status.toLowerCase();
      if (st == 'approved' || st == 'rejected') {
        final notifId = 'doc_${doc.id}_$st';
        if (!deletedNotificationIds.contains(notifId) && !readNotificationIds.contains(notifId)) {
          count++;
        }
      }
    }
    return count;
  }



  /// Empty KYC slots only. Status and files are filled from the backend.
  void _ensureDocumentChecklist() {
    if (documents.isNotEmpty) return;
    documents = [
      DocumentItem(id: 'DOC-1', type: 'aadhaar', title: 'Aadhaar Card', marathiTitle: 'आधार कार्ड', isUploaded: false, status: 'not_uploaded'),
      DocumentItem(id: 'DOC-2', type: 'farmer_id', title: 'Farmer ID', marathiTitle: 'शेतकरी ओळखपत्र', isUploaded: false, status: 'not_uploaded'),
      DocumentItem(id: 'DOC-3', type: 'land_712', title: '7/12 Extract', marathiTitle: '७/१२ उतारा', isUploaded: false, status: 'not_uploaded'),
      DocumentItem(id: 'DOC-4', type: 'land_8a', title: '8A Extract', marathiTitle: '८-अ उतारा', isUploaded: false, status: 'not_uploaded'),
      DocumentItem(id: 'DOC-5', type: 'bank', title: 'Bank Passbook', marathiTitle: 'बँक पासबुक', isUploaded: false, status: 'not_uploaded'),
      DocumentItem(id: 'DOC-6', type: 'farmer_photo', title: 'Farmer Photo', marathiTitle: 'शेतकरी फोटो', isUploaded: false, status: 'not_uploaded'),
      DocumentItem(id: 'DOC-7', type: 'address_proof', title: 'Address Proof', marathiTitle: 'रहिवासी दाखला', isUploaded: false, status: 'not_uploaded'),
      DocumentItem(id: 'DOC-8', type: 'pan', title: 'PAN Card', marathiTitle: 'पॅन कार्ड', isUploaded: false, status: 'not_uploaded'),
      DocumentItem(id: 'DOC-9', type: 'video_kyc', title: 'Live Video KYC', marathiTitle: 'थेट व्हिडिओ केवायसी', isUploaded: false, status: 'not_uploaded'),
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
    profileReady = true;
    _persistProfile();
    notifyListeners();

    // Sync to backend asynchronously
    final pId = newProfile.id.isNotEmpty ? newProfile.id : 'me';
    ApiService().updateFarmerProfile(pId, {
      'name': newProfile.fullName,
      'fullName': newProfile.fullName,
      'mobile': newProfile.mobile,
      'email': newProfile.email,
      'preferredLanguage': newProfile.preferredLanguage,
      'village': newProfile.village,
      'taluka': newProfile.taluka,
      'district': newProfile.district,
      'pincode': newProfile.pincode,
      'profileImage': newProfile.profilePhoto,
      'profilePhoto': newProfile.profilePhoto,
    }).catchError((err) {
      debugPrint('Failed to sync profile to backend: $err');
    });

    if (newProfile.farmName.isNotEmpty || newProfile.totalAcres > 0) {
      ApiService().updateFarmerFarm({
        'farmName': newProfile.farmName,
        'totalFarmArea': newProfile.totalAcres,
        'cultivatedArea': newProfile.cultivatedArea,
        'totalFarmAreaUnit': newProfile.totalFarmAreaUnit,
        'cultivatedAreaUnit': newProfile.cultivatedAreaUnit,
        'soilType': newProfile.soilType,
        'irrigationType': newProfile.irrigationType,
        'waterSource': newProfile.waterSource,
        'farmingMethod': newProfile.farmingMethod,
        'farmingType': newProfile.farmingType,
        'mainCrops': newProfile.mainCrops,
        'farmPhoto': newProfile.farmPhoto,
        'farmPhotos': newProfile.farmPhotos,
      }).catchError((_) {});
    }

    if (newProfile.farmAddress.isNotEmpty || newProfile.latitude != null) {
      ApiService().updateFarmerFarmLocation({
        'village': newProfile.village,
        'taluka': newProfile.taluka,
        'district': newProfile.district,
        'pincode': newProfile.pincode,
        'farmAddress': newProfile.farmAddress,
        'latitude': newProfile.latitude,
        'longitude': newProfile.longitude,
        'confirmed': newProfile.locationConfirmed,
      }).catchError((_) {});
    }
  }

  void uploadDocument(String docId, {String? fileUrl, String status = 'pending', String rejectionReason = ''}) {
    final idx = documents.indexWhere((d) => d.id == docId);
    if (idx != -1) {
      final doc = documents[idx];
      final updatedUrl = (fileUrl != null && fileUrl.isNotEmpty) ? fileUrl : doc.fileUrl;
      documents[idx] = DocumentItem(
        id: doc.id,
        type: doc.type,
        title: doc.title,
        marathiTitle: doc.marathiTitle,
        isUploaded: updatedUrl.isNotEmpty,
        status: status,
        uploadDate: 'Today',
        fileUrl: updatedUrl,
        rejectionReason: rejectionReason,
      );
      documentsReady = true;
      _persistDocuments();
      notifyListeners();

      // Persist to backend database so it shows in vendor portal immediately
      if (updatedUrl.isNotEmpty) {
        final isPdf = updatedUrl.startsWith('data:application/pdf') || updatedUrl.toLowerCase().endsWith('.pdf');
        final isVideo = updatedUrl.startsWith('data:video') || updatedUrl.toLowerCase().endsWith('.mp4');
        final ext = isPdf ? 'pdf' : (isVideo ? 'mp4' : 'jpg');
        final sanitizedTitle = doc.title.replaceAll(RegExp(r'[^\w\s-]'), '').replaceAll(' ', '_');
        final fileName = '${sanitizedTitle}_${DateTime.now().millisecondsSinceEpoch}.$ext';
        final targetFarmerId = profile.id.isNotEmpty ? profile.id : 'me';

        ApiService().uploadDocument(targetFarmerId, {
          'type': doc.type,
          'name': '${doc.title} (${doc.marathiTitle})',
          'fileName': fileName,
          'fileUrl': updatedUrl,
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
      .fold(0.0, (sum, o) => sum + o.totalAmount);

  double get pendingEarnings => orders
      .where((o) => o.status != 'Completed' && o.status != 'Rejected')
      .fold(0.0, (sum, o) => sum + o.totalAmount);

  double get totalStockKg => products.fold(0.0, (sum, p) => sum + (p.unit == 'Quintal' ? p.stockQuantity * 100 : p.stockQuantity));

}
