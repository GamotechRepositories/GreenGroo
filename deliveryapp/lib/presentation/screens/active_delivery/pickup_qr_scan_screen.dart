import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../data/services/order_service.dart';

class PickupQrScanScreen extends StatefulWidget {
  const PickupQrScanScreen({
    super.key,
    required this.orderId,
    required this.orderNumber,
  });

  final String orderId;
  final String orderNumber;

  @override
  State<PickupQrScanScreen> createState() => _PickupQrScanScreenState();
}

class _PickupQrScanScreenState extends State<PickupQrScanScreen> {
  MobileScannerController? _controller;
  bool _processing = false;
  bool _handled = false;
  bool _permissionDenied = false;
  bool _starting = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    setState(() {
      _starting = true;
      _permissionDenied = false;
      _errorMessage = null;
    });

    var status = await Permission.camera.status;
    if (!status.isGranted) {
      status = await Permission.camera.request();
    }

    if (!status.isGranted) {
      if (mounted) {
        setState(() {
          _starting = false;
          _permissionDenied = true;
        });
      }
      return;
    }

    final controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
    );

    if (!mounted) {
      await controller.dispose();
      return;
    }
    setState(() {
      _controller = controller;
      _starting = false;
    });
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_processing || _handled || _controller == null) return;

    for (final barcode in capture.barcodes) {
      final value = barcode.rawValue?.trim();
      if (value == null || value.isEmpty || !value.startsWith('PICKUP:')) continue;

      setState(() {
        _processing = true;
        _handled = true;
      });

      await _controller?.stop();

      final success = await OrderService.instance.scanPickupQr(widget.orderId, value);
      if (!mounted) return;

      if (success) {
        Navigator.pop(context, true);
        return;
      }

      setState(() {
        _processing = false;
        _handled = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invalid pickup QR. Scan the code shown on the manager screen.'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }
  }

  Widget _messageCard({
    required IconData icon,
    required String title,
    required String message,
    Widget? action,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 56, color: const Color(0xFF10B981)),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.4),
            ),
            if (action != null) ...[
              const SizedBox(height: 20),
              action,
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text('Scan Pickup QR · #${widget.orderNumber}'),
        actions: [
          if (_controller != null)
            IconButton(
              icon: ValueListenableBuilder(
                valueListenable: _controller!,
                builder: (context, state, child) {
                  final torch = state.torchState;
                  return Icon(
                    torch == TorchState.on ? Icons.flash_on : Icons.flash_off,
                    color: Colors.white,
                  );
                },
              ),
              onPressed: () => _controller?.toggleTorch(),
            ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_controller != null)
            MobileScanner(
              controller: _controller!,
              onDetect: _onDetect,
              errorBuilder: (context, error) {
                return _messageCard(
                  icon: Icons.videocam_off_outlined,
                  title: 'Camera unavailable',
                  message: error.errorDetails?.message ?? 'Unable to start the camera.',
                  action: ElevatedButton(
                    onPressed: _initCamera,
                    child: const Text('Try again'),
                  ),
                );
              },
            )
          else if (_starting)
            const Center(
              child: CircularProgressIndicator(color: Color(0xFF10B981)),
            )
          else if (_permissionDenied)
            _messageCard(
              icon: Icons.no_photography_outlined,
              title: 'Camera permission needed',
              message: 'Allow camera access to scan the Pickup QR from the Dark Store screen.',
              action: Column(
                children: [
                  ElevatedButton(
                    onPressed: _initCamera,
                    child: const Text('Allow camera'),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: openAppSettings,
                    child: const Text('Open app settings'),
                  ),
                ],
              ),
            )
          else
            _messageCard(
              icon: Icons.error_outline,
              title: 'Scanner not ready',
              message: _errorMessage ?? 'Something went wrong while opening the camera.',
              action: ElevatedButton(
                onPressed: _initCamera,
                child: const Text('Try again'),
              ),
            ),
          if (_controller != null)
            IgnorePointer(
              child: Align(
                alignment: Alignment.center,
                child: Container(
                  width: 250,
                  height: 250,
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFF10B981), width: 3),
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ),
            ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 32,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.72),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                _processing
                    ? 'Verifying pickup…'
                    : 'Point the camera at the Pickup QR on the manager incoming order screen.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4),
              ),
            ),
          ),
          if (_processing)
            const ColoredBox(
              color: Color(0x66000000),
              child: Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
            ),
        ],
      ),
    );
  }
}
