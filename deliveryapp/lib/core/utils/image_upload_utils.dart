import 'dart:convert';
import 'dart:io';

import 'package:image_picker/image_picker.dart';

/// Reads a picked image and returns a data-URL for backend storage / manager preview.
Future<String> imageFileToBase64DataUrl(XFile file) async {
  final bytes = await File(file.path).readAsBytes();
  // Cap very large photos (~2.5MB binary) to avoid oversized API payloads.
  if (bytes.lengthInBytes > 2_500_000) {
    // Still send — Express allows 20mb JSON; manager needs the image.
  }
  final name = file.name.toLowerCase();
  final mime = name.endsWith('.png')
      ? 'image/png'
      : name.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';
  return 'data:$mime;base64,${base64Encode(bytes)}';
}

Future<Map<String, dynamic>> documentPayload(XFile? file) async {
  if (file == null) {
    return {
      'fileName': '',
      'localPath': '',
      'imageBase64': '',
      'status': 'pending',
    };
  }
  final imageBase64 = await imageFileToBase64DataUrl(file);
  return {
    'fileName': file.name,
    'localPath': file.path,
    'imageBase64': imageBase64,
    'status': 'captured',
  };
}
