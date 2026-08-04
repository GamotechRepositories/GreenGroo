import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../../config/env.dart';

String proxyImageUrl(String imageUrl) {
  final encoded = Uri.encodeComponent(imageUrl.trim());
  return '${Env.apiUrl}/api/proxy/image?url=$encoded';
}

/// Top-level for [compute] — dotenv is unavailable in isolates, so proxy uses
/// the production API base when a direct CDN fetch fails.
Future<Uint8List?> downloadNetworkImageBytes(String imageUrl) async {
  final url = imageUrl.trim();
  if (url.isEmpty) return null;

  final encoded = Uri.encodeComponent(url);
  final sources = <String>[
    url,
    '${Env.productionApiUrl}/api/proxy/image?url=$encoded',
  ];

  final dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
      responseType: ResponseType.bytes,
      validateStatus: (status) => status != null && status >= 200 && status < 300,
    ),
  );

  for (final source in sources) {
    try {
      final response = await dio.get<List<int>>(source);
      final data = response.data;
      if (data != null && data.isNotEmpty) {
        return Uint8List.fromList(data);
      }
    } catch (_) {
      // Try proxy/direct fallback.
    }
  }

  return null;
}
