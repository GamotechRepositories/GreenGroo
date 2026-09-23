import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String _baseUrl = 'https://api.greengrocc.com';
  String? _token;

  String get baseUrl => _baseUrl;
  String? get token => _token;

  Future<void> init() async {
    // 1. Try reading .env asset
    try {
      final envString = await rootBundle.loadString('.env');
      for (final line in envString.split('\n')) {
        final trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.contains('=')) continue;
        final parts = trimmed.split('=');
        final key = parts[0].trim();
        final value = parts.sublist(1).join('=').trim();

        if (key == 'VITE_API_URL' || key == 'API_BASE_URL' || key == 'API_URL') {
          if (value.isNotEmpty) {
            _baseUrl = value.replaceAll(RegExp(r'/+$'), ''); // strip trailing slashes
          }
        }
      }
    } catch (_) {
      // .env not bundled or error reading
    }

    // 2. Load stored token
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('farmer_jwt_token');
      final customUrl = prefs.getString('custom_api_url');
      if (customUrl != null && customUrl.isNotEmpty) {
        _baseUrl = customUrl.replaceAll(RegExp(r'/+$'), '');
      }
    } catch (_) {}
  }

  void setBaseUrl(String url) async {
    _baseUrl = url.replaceAll(RegExp(r'/+$'), '');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('custom_api_url', _baseUrl);
  }

  void setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString('farmer_jwt_token', token);
    } else {
      await prefs.remove('farmer_jwt_token');
    }
  }

  Map<String, String> get _headers {
    final map = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_token != null && _token!.isNotEmpty) {
      map['Authorization'] = 'Bearer $_token';
    }
    return map;
  }

  Future<dynamic> get(String endpoint) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final response = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final response = await http
        .post(uri, headers: _headers, body: jsonEncode(body))
        .timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  Future<dynamic> put(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final response = await http
        .put(uri, headers: _headers, body: jsonEncode(body))
        .timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      try {
        return jsonDecode(response.body);
      } catch (_) {
        return response.body;
      }
    } else {
      String msg = 'Request failed (${response.statusCode})';
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map && decoded.containsKey('message')) {
          msg = decoded['message'];
        }
      } catch (_) {}
      throw Exception(msg);
    }
  }

  Future<bool> checkHealth() async {
    try {
      final res = await http.get(Uri.parse('$_baseUrl/health')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) return true;
    } catch (_) {}

    // Fallback attempt: if on USB with adb reverse
    try {
      final localRes = await http.get(Uri.parse('http://localhost:5001/health')).timeout(const Duration(seconds: 3));
      if (localRes.statusCode == 200) {
        _baseUrl = 'http://localhost:5001';
        return true;
      }
    } catch (_) {}

    return false;
  }

  // Auth
  Future<Map<String, dynamic>> loginFarmer(String mobile, String password) async {
    final res = await post('/api/farmers/login', {'mobile': mobile, 'password': password});
    if (res is Map<String, dynamic>) {
      String? token;
      if (res['token'] != null) {
        token = res['token'].toString();
      } else if (res['data'] is Map && res['data']['token'] != null) {
        token = res['data']['token'].toString();
      }
      if (token != null) {
        setToken(token);
      }
      return res;
    }
    throw Exception('Invalid login response from server');
  }

  Future<Map<String, dynamic>> registerFarmer(Map<String, dynamic> payload) async {
    final res = await post('/api/farmers/register', payload);
    if (res is Map<String, dynamic>) {
      String? token;
      if (res['token'] != null) {
        token = res['token'].toString();
      } else if (res['data'] is Map && res['data']['token'] != null) {
        token = res['data']['token'].toString();
      }
      if (token != null) {
        setToken(token);
      }
      return res;
    }
    throw Exception('Registration response invalid');
  }

  // Data endpoints matching backend farmer-manager-service
  Future<dynamic> fetchFarmerProfile(String farmerId) async {
    try {
      return await get('/api/farmers/$farmerId');
    } catch (_) {
      return await get('/api/farmers/me');
    }
  }

  Future<dynamic> fetchDashboard(String farmerId) async => get('/api/farmers/$farmerId/dashboard');
  Future<dynamic> fetchCrops() async {
    try {
      return await get('/api/farmer/crops');
    } catch (_) {
      return await get('/api/farmers/crops');
    }
  }
  Future<dynamic> fetchCropsCatalog() async {
    try {
      return await get('/api/farmer/crops/catalog');
    } catch (_) {
      return [];
    }
  }
  Future<dynamic> fetchCropPlans() async => get('/api/farmer/crop-plans');
  Future<dynamic> fetchProducts(String farmerId) async {
    try {
      final res = await get('/api/farmer/products');
      if (res is List && res.isNotEmpty) return res;
      if (res is Map && res['products'] is List && (res['products'] as List).isNotEmpty) return res['products'];
      if (res is Map && res['data'] is List && (res['data'] as List).isNotEmpty) return res['data'];
    } catch (_) {}
    try {
      final res2 = await get('/api/farmers/$farmerId/products');
      if (res2 is List && res2.isNotEmpty) return res2;
      if (res2 is Map && res2['products'] is List && (res2['products'] as List).isNotEmpty) return res2['products'];
      if (res2 is Map && res2['data'] is List && (res2['data'] as List).isNotEmpty) return res2['data'];
    } catch (_) {}
    return [];
  }
  Future<dynamic> fetchOrders(String farmerId) async {
    try {
      final res = await get('/api/farmer/orders');
      if (res is List && res.isNotEmpty) return res;
      if (res is Map && res['orders'] is List && (res['orders'] as List).isNotEmpty) return res['orders'];
      if (res is Map && res['data'] is List && (res['data'] as List).isNotEmpty) return res['data'];
    } catch (_) {}
    try {
      final res2 = await get('/api/farmers/$farmerId/orders');
      if (res2 is List && res2.isNotEmpty) return res2;
      if (res2 is Map && res2['orders'] is List && (res2['orders'] as List).isNotEmpty) return res2['orders'];
      if (res2 is Map && res2['data'] is List && (res2['data'] as List).isNotEmpty) return res2['data'];
    } catch (_) {}
    return [];
  }
  Future<dynamic> fetchDocuments(String farmerId) async => get('/api/farmers/$farmerId/documents');

  Future<dynamic> fetchLiveGovtSchemes() async {
    try {
      final res = await get('/api/admin-ops/govt-schemes/live');
      if (res is Map && res['data'] is List) return res['data'];
      if (res is List) return res;
    } catch (_) {}
    return [];
  }

  Future<dynamic> uploadDocument(String farmerId, Map<String, dynamic> body) async {
    try {
      return await post('/api/farmers/$farmerId/documents', body);
    } catch (_) {
      try {
        return await post('/api/farmer/documents', body);
      } catch (_) {
        return await post('/api/vendor/farmers/$farmerId/documents', body);
      }
    }
  }

  Future<dynamic> createProduct(String farmerId, Map<String, dynamic> body) async {
    return post('/api/farmers/$farmerId/products', body);
  }

  Future<dynamic> updateProduct(String productId, Map<String, dynamic> body) async {
    try {
      return await put('/api/farmer/products/$productId', body);
    } catch (_) {
      return await put('/api/farmers/products/$productId', body);
    }
  }

  Future<dynamic> deleteProduct(String productId) async {
    try {
      return await delete('/api/farmer/products/$productId');
    } catch (_) {
      return await delete('/api/farmers/products/$productId');
    }
  }

  Future<dynamic> updateProductPrice(String productId, Map<String, dynamic> body) async {
    try {
      return await patch('/api/farmer/products/$productId/price', body);
    } catch (_) {
      return await patch('/api/farmers/products/$productId/price', body);
    }
  }

  Future<dynamic> updateProductStock(String productId, Map<String, dynamic> body) async {
    try {
      return await patch('/api/farmer/products/$productId/stock', body);
    } catch (_) {
      return await patch('/api/farmers/products/$productId/stock', body);
    }
  }

  Future<dynamic> createCrop(Map<String, dynamic> body) async {
    return post('/api/farmer/crops', body);
  }

  Future<dynamic> updateOrderStatus(String farmerId, String orderId, String status) async {
    return patch('/api/farmers/$farmerId/orders/$orderId/status', {'status': status});
  }

  Future<dynamic> acceptOrder(String orderId) async {
    try {
      return await patch('/api/farmer/orders/$orderId/accept', {});
    } catch (_) {
      return await patch('/api/farmers/orders/$orderId/accept', {});
    }
  }

  Future<dynamic> rejectOrder(String orderId, Map<String, dynamic> body) async {
    try {
      return await patch('/api/farmer/orders/$orderId/reject', body);
    } catch (_) {
      return await patch('/api/farmers/orders/$orderId/reject', body);
    }
  }

  Future<dynamic> prepareOrder(String orderId, Map<String, dynamic> body) async {
    try {
      return await patch('/api/farmer/orders/$orderId/prepare', body);
    } catch (_) {
      return await patch('/api/farmers/orders/$orderId/prepare', body);
    }
  }

  Future<dynamic> packOrder(String orderId, Map<String, dynamic> body) async {
    try {
      return await patch('/api/farmer/orders/$orderId/packing', body);
    } catch (_) {
      return await patch('/api/farmers/orders/$orderId/packing', body);
    }
  }

  Future<dynamic> readyOrder(String orderId) async {
    try {
      return await patch('/api/farmer/orders/$orderId/ready-for-pickup', {});
    } catch (_) {
      return await patch('/api/farmers/orders/$orderId/ready-for-pickup', {});
    }
  }

  Future<dynamic> updateCrop(String cropId, Map<String, dynamic> body) async {
    try {
      return await put('/api/farmer/crops/$cropId', body);
    } catch (_) {
      return await put('/api/farmers/crops/$cropId', body);
    }
  }

  Future<dynamic> deleteCrop(String cropId) async {
    try {
      return await delete('/api/farmer/crops/$cropId');
    } catch (_) {
      return await delete('/api/farmers/crops/$cropId');
    }
  }

  Future<dynamic> delete(String endpoint) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final response = await http
        .delete(uri, headers: _headers)
        .timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }

  Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    final uri = Uri.parse('$_baseUrl$endpoint');
    final response = await http
        .patch(uri, headers: _headers, body: jsonEncode(body))
        .timeout(const Duration(seconds: 10));
    return _handleResponse(response);
  }
}

