import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

/// Asks the user to pick camera or gallery for image upload flows.
Future<ImageSource?> showImageSourceSheet(
  BuildContext context, {
  bool useRootNavigator = true,
}) {
  return showModalBottomSheet<ImageSource>(
    context: context,
    useRootNavigator: useRootNavigator,
    builder: (context) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.camera_alt_outlined),
            title: const Text('Take photo'),
            onTap: () => Navigator.pop(context, ImageSource.camera),
          ),
          ListTile(
            leading: const Icon(Icons.photo_library_outlined),
            title: const Text('Choose from gallery'),
            onTap: () => Navigator.pop(context, ImageSource.gallery),
          ),
        ],
      ),
    ),
  );
}
