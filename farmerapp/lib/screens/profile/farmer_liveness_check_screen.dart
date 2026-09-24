import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

import '../../core/constants/app_colors.dart';
import '../../core/utils/camera_image_utils.dart';

enum FarmerLivenessChallenge {
  centerFace,
  blink,
  lookLeft,
  lookRight,
  lookUp,
  lookDown,
}

extension FarmerLivenessChallengeX on FarmerLivenessChallenge {
  String get englishTitle => switch (this) {
        FarmerLivenessChallenge.centerFace => 'Center your face',
        FarmerLivenessChallenge.blink => 'Blink your eyes',
        FarmerLivenessChallenge.lookLeft => 'Turn head left',
        FarmerLivenessChallenge.lookRight => 'Turn head right',
        FarmerLivenessChallenge.lookUp => 'Look up',
        FarmerLivenessChallenge.lookDown => 'Look down',
      };

  String get marathiTitle => switch (this) {
        FarmerLivenessChallenge.centerFace => 'चेहरा मध्यभागी स्थिर ठेवा',
        FarmerLivenessChallenge.blink => 'डोळ्यांची उघडझाप करा',
        FarmerLivenessChallenge.lookLeft => 'मान हळूच डावीकडे वळवा',
        FarmerLivenessChallenge.lookRight => 'मान हळूच उजवीकडे वळवा',
        FarmerLivenessChallenge.lookUp => 'मान थोडी वर करा व कॅमेऱ्यात पहा',
        FarmerLivenessChallenge.lookDown => 'मान थोडी खाली करा',
      };

  IconData get hintIcon => switch (this) {
        FarmerLivenessChallenge.centerFace => Icons.face_retouching_natural_rounded,
        FarmerLivenessChallenge.blink => Icons.visibility_rounded,
        FarmerLivenessChallenge.lookLeft => Icons.arrow_back_rounded,
        FarmerLivenessChallenge.lookRight => Icons.arrow_forward_rounded,
        FarmerLivenessChallenge.lookUp => Icons.arrow_upward_rounded,
        FarmerLivenessChallenge.lookDown => Icons.arrow_downward_rounded,
      };
}

class FarmerLivenessCheckScreen extends StatefulWidget {
  const FarmerLivenessCheckScreen({
    super.key,
    required this.farmerName,
    required this.onCompleted,
  });

  final String farmerName;
  final VoidCallback onCompleted;

  @override
  State<FarmerLivenessCheckScreen> createState() => _FarmerLivenessCheckScreenState();
}

class _FarmerLivenessCheckScreenState extends State<FarmerLivenessCheckScreen> {
  static const _challenges = FarmerLivenessChallenge.values;

  CameraController? _camera;
  FaceDetector? _faceDetector;
  bool _isProcessing = false;
  bool _cameraReady = false;
  String? _cameraError;

  int _currentStep = 0;
  bool _allComplete = false;
  bool _blinkPrimed = false;
  bool _blinkDetected = false;
  DateTime? _holdStartedAt;
  DateTime? _lastFaceSeenAt;
  DateTime? _lastPassingAt;

  bool _isTransitioningStep = false;

  // Real-time detection feedback state
  bool _faceInFrame = false;
  bool _currentChallengePassing = false;
  double _actionHoldProgress = 0.0;
  int _secondsRecorded = 0;
  Timer? _recordTimer;

  Duration _getChallengeDuration(FarmerLivenessChallenge challenge) {
    return switch (challenge) {
      FarmerLivenessChallenge.centerFace => const Duration(milliseconds: 1200),
      FarmerLivenessChallenge.blink => const Duration(milliseconds: 1000),
      FarmerLivenessChallenge.lookLeft => const Duration(milliseconds: 900),
      FarmerLivenessChallenge.lookRight => const Duration(milliseconds: 900),
      FarmerLivenessChallenge.lookUp => const Duration(milliseconds: 700),
      FarmerLivenessChallenge.lookDown => const Duration(milliseconds: 700),
    };
  }

  @override
  void initState() {
    super.initState();
    _initCameraAndDetector();
  }

  Future<void> _initCameraAndDetector() async {
    setState(() {
      _cameraError = null;
      _cameraReady = false;
    });

    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        if (!mounted) return;
        setState(() {
          _cameraError = 'कोणताही कॅमेरा आढळला नाही (No camera found on device)';
        });
        return;
      }

      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      final controller = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid ? ImageFormatGroup.nv21 : ImageFormatGroup.bgra8888,
      );

      _faceDetector = FaceDetector(
        options: FaceDetectorOptions(
          enableClassification: true,
          enableTracking: true,
          performanceMode: FaceDetectorMode.fast,
          minFaceSize: 0.15,
        ),
      );

      await controller.initialize();
      if (!mounted) {
        await controller.dispose();
        return;
      }

      setState(() {
        _camera = controller;
        _cameraReady = true;
      });

      _recordTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (mounted && !_allComplete) {
          setState(() => _secondsRecorded++);
        }
      });

      await controller.startImageStream(_onCameraFrame);
    } catch (e) {
      debugPrint('Error starting camera or face detector: $e');
      if (!mounted) return;
      setState(() {
        _cameraError = 'कॅमेरा सुरू करताना त्रुटी आली: $e';
      });
    }
  }

  Future<void> _onCameraFrame(CameraImage image) async {
    if (_isProcessing || _allComplete || _camera == null || _faceDetector == null || !_cameraReady || _isTransitioningStep) {
      return;
    }

    _isProcessing = true;
    try {
      final input = cameraImageToInputImage(image, _camera!.description);
      if (input == null) return;

      final faces = await _faceDetector!.processImage(input);
      if (!mounted || !_cameraReady || _isTransitioningStep) return;

      if (faces.isEmpty) {
        final now = DateTime.now();
        // Allow brief 450ms grace period so single dropped frames during movement don't reset progress
        if (_lastFaceSeenAt != null && now.difference(_lastFaceSeenAt!).inMilliseconds < 450) {
          return;
        }
        _holdStartedAt = null;
        _lastPassingAt = null;
        if (_faceInFrame || _currentChallengePassing) {
          setState(() {
            _faceInFrame = false;
            _currentChallengePassing = false;
            _actionHoldProgress = 0.0;
          });
        }
        return;
      }

      _lastFaceSeenAt = DateTime.now();
      final face = faces.first;
      final challenge = _challenges[_currentStep];
      final passed = _evaluateChallenge(challenge, face);
      final duration = _getChallengeDuration(challenge).inMilliseconds;

      if (passed) {
        _lastPassingAt = DateTime.now();
        if (challenge == FarmerLivenessChallenge.blink) {
          if (!_blinkDetected) {
            _blinkDetected = true;
            _holdStartedAt = DateTime.now();
          }
          final elapsed = DateTime.now().difference(_holdStartedAt!).inMilliseconds;
          final progress = (elapsed / duration).clamp(0.0, 1.0);

          setState(() {
            _faceInFrame = true;
            _currentChallengePassing = true;
            _actionHoldProgress = progress;
          });

          if (elapsed >= duration) {
            _advanceStep();
          }
        } else {
          _holdStartedAt ??= DateTime.now();
          final elapsed = DateTime.now().difference(_holdStartedAt!).inMilliseconds;
          final progress = (elapsed / duration).clamp(0.0, 1.0);

          setState(() {
            _faceInFrame = true;
            _currentChallengePassing = true;
            _actionHoldProgress = progress;
          });

          if (elapsed >= duration) {
            _advanceStep();
          }
        }
      } else {
        if (challenge != FarmerLivenessChallenge.blink || !_blinkDetected) {
          final now = DateTime.now();
          // Allow 350ms grace period for transient angle dips during movement
          final inGracePeriod = _lastPassingAt != null && now.difference(_lastPassingAt!).inMilliseconds < 350;

          if (!inGracePeriod) {
            _holdStartedAt = null;
            if (challenge == FarmerLivenessChallenge.blink && _eyesOpen(face)) {
              _blinkPrimed = true;
            }

            if (!_faceInFrame || _currentChallengePassing) {
              setState(() {
                _faceInFrame = true;
                _currentChallengePassing = false;
                _actionHoldProgress = 0.0;
              });
            }
          }
        }
      }
    } catch (_) {
      // Skip frame on transient ML Kit errors
    } finally {
      _isProcessing = false;
    }
  }

  bool _eyesOpen(Face face) {
    final left = face.leftEyeOpenProbability;
    final right = face.rightEyeOpenProbability;
    if (left == null || right == null) return false;
    return left > 0.55 && right > 0.55;
  }

  bool _eyesClosed(Face face) {
    final left = face.leftEyeOpenProbability;
    final right = face.rightEyeOpenProbability;
    if (left == null || right == null) return false;
    return left < 0.35 && right < 0.35;
  }

  bool _evaluateChallenge(FarmerLivenessChallenge challenge, Face face) {
    final yaw = face.headEulerAngleY ?? 0;
    final pitch = face.headEulerAngleX ?? 0;

    return switch (challenge) {
      FarmerLivenessChallenge.centerFace =>
        yaw.abs() < 10 && pitch.abs() < 8,
      FarmerLivenessChallenge.blink =>
        _blinkPrimed && _eyesClosed(face),
      FarmerLivenessChallenge.lookLeft => yaw > 10.0,
      FarmerLivenessChallenge.lookRight => yaw < -10.0,
      FarmerLivenessChallenge.lookUp =>
        yaw.abs() < 12 && pitch > 10.0,
      FarmerLivenessChallenge.lookDown =>
        yaw.abs() < 12 && pitch < -9.0,
    };
  }

  void _advanceStep() {
    if (_isTransitioningStep) return;
    _isTransitioningStep = true;
    _holdStartedAt = null;
    _lastPassingAt = null;

    if (_currentStep >= _challenges.length - 1) {
      setState(() {
        _allComplete = true;
        _actionHoldProgress = 1.0;
        _isTransitioningStep = false;
      });
      _stopCamera();
      return;
    }

    // Brief comfortable pause showing 100% completion before moving to next challenge
    Future.delayed(const Duration(milliseconds: 400), () {
      if (!mounted) return;
      setState(() {
        _currentStep++;
        _blinkPrimed = false;
        _blinkDetected = false;
        _currentChallengePassing = false;
        _actionHoldProgress = 0.0;
        _isTransitioningStep = false;
      });
    });
  }

  Future<void> _stopCamera() async {
    final camera = _camera;
    _recordTimer?.cancel();
    if (mounted) {
      setState(() {
        _cameraReady = false;
        _camera = null;
      });
    }
    if (camera == null) return;
    if (camera.value.isStreamingImages) {
      try {
        await camera.stopImageStream();
      } catch (_) {}
    }
    try {
      await camera.dispose();
    } catch (_) {}
  }

  @override
  void dispose() {
    _recordTimer?.cancel();
    _faceDetector?.close();
    unawaited(_stopCamera());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final challenge = _allComplete ? null : _challenges[_currentStep.clamp(0, _challenges.length - 1)];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          _allComplete ? 'Verification Complete' : 'AI Face Verification (केवायसी)',
          style: GoogleFonts.inter(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  _allComplete ? 'Verification Complete ✓' : 'Live Face Verification',
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  _allComplete
                      ? 'सर्व स्टेप्स अचूक ओळखल्या गेल्या आणि केवायसी यशस्वी झाली!'
                      : 'खालील ॲनिमेटेड फेस पाहून तशी कृती करा, कॅमेरा आपोआप ओळखेल.',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Segmented step indicator matching deliveryapp
              _StepIndicator(
                total: _challenges.length,
                current: _allComplete ? _challenges.length : _currentStep,
                complete: _allComplete,
              ),

              const Spacer(),

              // Circular Camera Preview with safe disposed check
              _CameraPreview(
                size: size.width * 0.68,
                camera: _camera,
                ready: _cameraReady,
                error: _cameraError,
                complete: _allComplete,
                faceInFrame: _faceInFrame,
                challengePassing: _currentChallengePassing,
                actionHoldProgress: _actionHoldProgress,
              ),

              const SizedBox(height: 14),

              if (_cameraError != null)
                Text(
                  _cameraError!,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.error,
                  ),
                )
              else if (_allComplete) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 24),
                    const SizedBox(width: 8),
                    Text(
                      'All actions verified successfully (सर्व कृती अचूक ✓)',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Farmer Name:', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                          Text(widget.farmerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('AI Face Match:', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                          Text('100% Detected ✓', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Time Elapsed:', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                          Text('${_secondsRecorded}s', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ),
              ] else if (challenge != null)
                // Enhanced instruction card with ANIMATED DEMO FACE
                _ChallengeHintWithAnimatedFace(
                  challenge: challenge,
                  currentStep: _currentStep + 1,
                  totalSteps: _challenges.length,
                  faceInFrame: _faceInFrame,
                  challengePassing: _currentChallengePassing,
                  actionHoldProgress: _actionHoldProgress,
                ),

              const Spacer(),

              if (_allComplete)
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.check_circle_outline, size: 20),
                    label: const Text(
                      'Save & Continue (केवायसी जतन करा ✓)',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () {
                      widget.onCompleted();
                      Navigator.pop(context);
                    },
                  ),
                )
              else if (_cameraError != null)
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.refresh_rounded, size: 20),
                    label: const Text(
                      'पुन्हा प्रयत्न करा (Try Again)',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () {
                      setState(() {
                        _cameraError = null;
                        _currentStep = 0;
                        _allComplete = false;
                        _secondsRecorded = 0;
                        _holdStartedAt = null;
                        _lastPassingAt = null;
                        _lastFaceSeenAt = null;
                        _blinkPrimed = false;
                        _blinkDetected = false;
                        _currentChallengePassing = false;
                        _actionHoldProgress = 0.0;
                        _isTransitioningStep = false;
                      });
                      _initCameraAndDetector();
                    },
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                  decoration: BoxDecoration(
                    color: _currentChallengePassing
                        ? const Color(0xFFDCFCE7)
                        : (_faceInFrame ? const Color(0xFFE0F2FE) : const Color(0xFFFEF3C7)),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _currentChallengePassing
                          ? const Color(0xFF86EFAC)
                          : (_faceInFrame ? const Color(0xFFBAE6FD) : const Color(0xFFFDE68A)),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _currentChallengePassing
                            ? Icons.check_circle
                            : (_faceInFrame ? Icons.center_focus_strong : Icons.warning_amber_rounded),
                        size: 18,
                        color: _currentChallengePassing
                            ? const Color(0xFF15803D)
                            : (_faceInFrame ? const Color(0xFF0369A1) : const Color(0xFF92400E)),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _currentChallengePassing
                            ? 'कृती अचूक! स्थिर रहा... (Hold position ✓)'
                            : (_faceInFrame
                                ? 'कृती करा, कॅमेरा ऑटो-डिटेक्ट करत आहे'
                                : 'कृपया चेहरा वर्तुळाच्या मध्यभागी आणा'),
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.bold,
                          color: _currentChallengePassing
                              ? const Color(0xFF15803D)
                              : (_faceInFrame ? const Color(0xFF0369A1) : const Color(0xFF92400E)),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({
    required this.total,
    required this.current,
    required this.complete,
  });

  final int total;
  final int current;
  final bool complete;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(total, (index) {
        final done = complete || index < current;
        final active = !complete && index == current;
        return Expanded(
          child: Container(
            height: 4.5,
            margin: EdgeInsets.only(right: index < total - 1 ? 6 : 0),
            decoration: BoxDecoration(
              color: done
                  ? AppColors.primary
                  : active
                      ? AppColors.secondary
                      : const Color(0xFFD1D5DB),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        );
      }),
    );
  }
}

class _CameraPreview extends StatelessWidget {
  const _CameraPreview({
    required this.size,
    required this.camera,
    required this.ready,
    required this.error,
    required this.complete,
    required this.faceInFrame,
    required this.challengePassing,
    required this.actionHoldProgress,
  });

  final double size;
  final CameraController? camera;
  final bool ready;
  final String? error;
  final bool complete;
  final bool faceInFrame;
  final bool challengePassing;
  final double actionHoldProgress;

  @override
  Widget build(BuildContext context) {
    final borderColor = complete
        ? AppColors.success
        : (challengePassing
            ? const Color(0xFF16A34A)
            : (faceInFrame ? AppColors.primary : const Color(0xFFF59E0B)));

    final isCameraValid = ready && camera != null && camera!.value.isInitialized;

    return SizedBox(
      width: size + 20,
      height: size + 20,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Circular Hold Progress Indicator around the preview
          if (!complete && isCameraValid && error == null && challengePassing)
            SizedBox(
              width: size + 16,
              height: size + 16,
              child: CircularProgressIndicator(
                value: actionHoldProgress,
                strokeWidth: 4.5,
                backgroundColor: const Color(0xFFE2E8F0),
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF16A34A)),
              ),
            ),

          // Main Circular Camera Preview
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primaryLight,
              border: Border.all(
                color: borderColor,
                width: 3.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: borderColor.withValues(alpha: 0.2),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: complete
                ? const ColoredBox(
                    color: AppColors.primaryLight,
                    child: Icon(
                      Icons.verified_rounded,
                      size: 76,
                      color: AppColors.success,
                    ),
                  )
                : error != null
                    ? const Icon(Icons.videocam_off_rounded, size: 56, color: AppColors.error)
                    : !isCameraValid
                        ? const Center(child: CircularProgressIndicator())
                        : Stack(
                            fit: StackFit.expand,
                            alignment: Alignment.center,
                            children: [
                              ClipOval(
                                child: FittedBox(
                                  fit: BoxFit.cover,
                                  child: SizedBox(
                                    width: camera!.value.previewSize?.height ?? size,
                                    height: camera!.value.previewSize?.width ?? size,
                                    child: CameraPreview(camera!),
                                  ),
                                ),
                              ),

                              // Top Live Face Tracking badge
                              Positioned(
                                top: 16,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.65),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          color: faceInFrame ? const Color(0xFF10B981) : Colors.amber,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        faceInFrame ? 'AI TRACKING ACTIVE' : 'ALIGN FACE',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          fontFamily: 'monospace',
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                              // Bottom Real-time action detection status badge
                              Positioned(
                                bottom: 16,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.75),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: challengePassing ? const Color(0xFF16A34A) : Colors.white30,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        challengePassing
                                            ? Icons.check_circle
                                            : (faceInFrame ? Icons.face : Icons.warning_amber_rounded),
                                        size: 13,
                                        color: challengePassing
                                            ? const Color(0xFF16A34A)
                                            : (faceInFrame ? const Color(0xFF38BDF8) : Colors.amber),
                                      ),
                                      const SizedBox(width: 5),
                                      Text(
                                        challengePassing
                                            ? 'Verifying... ${(actionHoldProgress * 100).toInt()}%'
                                            : (faceInFrame ? 'Face In Frame' : 'No Face In Circle'),
                                        style: TextStyle(
                                          color: challengePassing ? const Color(0xFF86EFAC) : Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// INSTRUCTION CARD WITH LIVE ANIMATED FACE DEMO
// ---------------------------------------------------------------------------
class _ChallengeHintWithAnimatedFace extends StatelessWidget {
  const _ChallengeHintWithAnimatedFace({
    required this.challenge,
    required this.currentStep,
    required this.totalSteps,
    required this.faceInFrame,
    required this.challengePassing,
    required this.actionHoldProgress,
  });

  final FarmerLivenessChallenge challenge;
  final int currentStep;
  final int totalSteps;
  final bool faceInFrame;
  final bool challengePassing;
  final double actionHoldProgress;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: challengePassing ? const Color(0xFFF0FDF4) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: challengePassing ? const Color(0xFF86EFAC) : const Color(0xFFD1D5DB),
          width: challengePassing ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Live Animated Face Demonstration Box
              _AnimatedInstructionFace(challenge: challenge),
              const SizedBox(width: 14),

              // Step Title & Instructions
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primaryDark,
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: Text(
                            'STEP $currentStep OF $totalSteps',
                            style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 6),
                        if (challengePassing)
                          const Text(
                            '✓ Detecting',
                            style: TextStyle(color: Color(0xFF16A34A), fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      challenge.englishTitle,
                      style: GoogleFonts.inter(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w700,
                        color: challengePassing ? const Color(0xFF15803D) : AppColors.primaryDark,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      challenge.marathiTitle,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: challengePassing ? const Color(0xFF15803D) : const Color(0xFF1B5E20),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Action verification progress bar
          if (challengePassing) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: actionHoldProgress,
                backgroundColor: const Color(0xFFC8E6C9),
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF16A34A)),
                minHeight: 5,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// DIRECTION INSTRUCTION ANIMATION GUIDE (दिशानिर्देश ॲनिमेशन)
// ---------------------------------------------------------------------------
class _AnimatedInstructionFace extends StatefulWidget {
  const _AnimatedInstructionFace({required this.challenge});

  final FarmerLivenessChallenge challenge;

  @override
  State<_AnimatedInstructionFace> createState() => _AnimatedInstructionFaceState();
}

class _AnimatedInstructionFaceState extends State<_AnimatedInstructionFace>
    with SingleTickerProviderStateMixin {
  late AnimationController _anim;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant _AnimatedInstructionFace oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.challenge != widget.challenge) {
      _anim.reset();
      _anim.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (context, _) {
        final val = CurvedAnimation(parent: _anim, curve: Curves.easeInOut).value;

        return SizedBox(
          width: 76,
          height: 76,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Outer pulsating beacon ring
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: const Color(0xFF16A34A).withValues(alpha: 0.2 + 0.35 * val),
                    width: 2.0,
                  ),
                ),
              ),

              // Main Circular Direction Canvas
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFE8F5E9), Color(0xFFDCFCE7)],
                  ),
                  border: Border.all(color: const Color(0xFF16A34A), width: 2.2),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF16A34A).withValues(alpha: 0.22),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Background scanning circle
                      Container(
                        width: 50 + (10 * val),
                        height: 50 + (10 * val),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF16A34A).withValues(alpha: 0.12),
                            width: 1,
                          ),
                        ),
                      ),

                      // Core Animated Direction Content
                      _buildDirectionContent(widget.challenge, val),
                    ],
                  ),
                ),
              ),

              // Bottom Direction Pill Badge
              Positioned(
                bottom: 0,
                child: _buildDirectionBadge(widget.challenge, val),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDirectionContent(FarmerLivenessChallenge challenge, double val) {
    switch (challenge) {
      case FarmerLivenessChallenge.centerFace:
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Transform.scale(
              scale: 0.95 + 0.12 * val,
              child: const Icon(
                Icons.center_focus_strong_rounded,
                size: 34,
                color: Color(0xFF15803D),
              ),
            ),
            const SizedBox(height: 6),
          ],
        );

      case FarmerLivenessChallenge.blink:
        final isClosed = val > 0.45 && val < 0.85;
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: Icon(
                isClosed ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                key: ValueKey<bool>(isClosed),
                size: 34,
                color: const Color(0xFF15803D),
              ),
            ),
            const SizedBox(height: 6),
          ],
        );

      case FarmerLivenessChallenge.lookLeft:
        final offset = -8.0 * val;
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Animated Chevrons pointing left
                Transform.translate(
                  offset: Offset(offset, 0),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.keyboard_double_arrow_left_rounded, size: 28, color: Color(0xFF15803D)),
                      Icon(Icons.arrow_back_rounded, size: 24, color: Color(0xFF16A34A)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
          ],
        );

      case FarmerLivenessChallenge.lookRight:
        final offset = 8.0 * val;
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Animated Chevrons pointing right
                Transform.translate(
                  offset: Offset(offset, 0),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.arrow_forward_rounded, size: 24, color: Color(0xFF16A34A)),
                      Icon(Icons.keyboard_double_arrow_right_rounded, size: 28, color: Color(0xFF15803D)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
          ],
        );

      case FarmerLivenessChallenge.lookUp:
        final offset = -7.0 * val;
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Transform.translate(
              offset: Offset(0, offset),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.keyboard_double_arrow_up_rounded, size: 26, color: Color(0xFF15803D)),
                  Icon(Icons.arrow_upward_rounded, size: 20, color: Color(0xFF16A34A)),
                ],
              ),
            ),
            const SizedBox(height: 4),
          ],
        );

      case FarmerLivenessChallenge.lookDown:
        final offset = 7.0 * val;
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Transform.translate(
              offset: Offset(0, offset),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.arrow_downward_rounded, size: 20, color: Color(0xFF16A34A)),
                  Icon(Icons.keyboard_double_arrow_down_rounded, size: 26, color: Color(0xFF15803D)),
                ],
              ),
            ),
            const SizedBox(height: 4),
          ],
        );
    }
  }

  Widget _buildDirectionBadge(FarmerLivenessChallenge challenge, double val) {
    final (icon, text) = switch (challenge) {
      FarmerLivenessChallenge.centerFace => (Icons.adjust_rounded, 'CENTER'),
      FarmerLivenessChallenge.blink => (Icons.remove_red_eye_rounded, 'BLINK'),
      FarmerLivenessChallenge.lookLeft => (Icons.arrow_back_rounded, 'TURN LEFT'),
      FarmerLivenessChallenge.lookRight => (Icons.arrow_forward_rounded, 'TURN RIGHT'),
      FarmerLivenessChallenge.lookUp => (Icons.arrow_upward_rounded, 'LOOK UP'),
      FarmerLivenessChallenge.lookDown => (Icons.arrow_downward_rounded, 'LOOK DOWN'),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFF15803D),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: Colors.white),
          const SizedBox(width: 3),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 8.5,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
