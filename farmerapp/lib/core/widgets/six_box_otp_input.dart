import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../constants/app_colors.dart';

/// Rock-solid 6-Box OTP Input Widget.
/// - 6 individual physical TextFields with auto-advance and backspace navigation.
/// - Direct tap selection, auto-overwriting, paste support for full 6-digit OTP codes.
/// - Clean empty boxes with active green border and blinking cursor (no confusing fake digit placeholders).
/// - Synchronized bidirectionally with parent TextEditingController.
class SixBoxOtpInput extends StatefulWidget {
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onCompleted;
  final bool autofocus;

  const SixBoxOtpInput({
    super.key,
    required this.controller,
    this.onChanged,
    this.onCompleted,
    this.autofocus = true,
  });

  @override
  State<SixBoxOtpInput> createState() => _SixBoxOtpInputState();
}

class _SixBoxOtpInputState extends State<SixBoxOtpInput> {
  late final List<TextEditingController> _boxControllers;
  late final List<FocusNode> _focusNodes;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _boxControllers = List.generate(6, (i) => TextEditingController());
    _focusNodes = List.generate(6, (i) {
      return FocusNode(
        onKeyEvent: (node, event) {
          if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
            if (_boxControllers[i].text.isEmpty && i > 0) {
              _boxControllers[i - 1].clear();
              _focusNodes[i - 1].requestFocus();
              _syncToParent();
              return KeyEventResult.handled;
            }
          }
          return KeyEventResult.ignored;
        },
      );
    });

    _syncFromParent();
    widget.controller.addListener(_onParentControllerChanged);

    if (widget.autofocus) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        int firstEmpty = 0;
        for (int i = 0; i < 6; i++) {
          if (_boxControllers[i].text.isEmpty) {
            firstEmpty = i;
            break;
          }
        }
        _focusNodes[firstEmpty].requestFocus();
      });
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onParentControllerChanged);
    for (final c in _boxControllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _onParentControllerChanged() {
    if (_isSyncing) return;
    _syncFromParent();
  }

  void _syncFromParent() {
    final parentText = widget.controller.text;
    _isSyncing = true;
    for (int i = 0; i < 6; i++) {
      final char = i < parentText.length ? parentText[i] : '';
      if (_boxControllers[i].text != char) {
        _boxControllers[i].text = char;
      }
    }
    _isSyncing = false;
    if (mounted) setState(() {});
  }

  void _syncToParent() {
    _isSyncing = true;
    final combined = _boxControllers.map((c) => c.text).join();
    if (widget.controller.text != combined) {
      widget.controller.text = combined;
    }
    _isSyncing = false;
    widget.onChanged?.call(combined);
    if (combined.length == 6) {
      widget.onCompleted?.call(combined);
    }
    if (mounted) setState(() {});
  }

  void _onBoxChanged(int index, String value) {
    if (value.length > 1) {
      // Pasted content or rapid multi-character input
      final digits = value.replaceAll(RegExp(r'\D'), '');
      if (digits.isNotEmpty) {
        for (int i = 0; i < digits.length && (index + i) < 6; i++) {
          _boxControllers[index + i].text = digits[i];
        }
        final nextIndex = (index + digits.length).clamp(0, 5);
        _focusNodes[nextIndex].requestFocus();
        _syncToParent();
        return;
      }
    }

    if (value.isNotEmpty) {
      // Keep only the most recently typed character
      final lastChar = value[value.length - 1];
      if (_boxControllers[index].text != lastChar) {
        _boxControllers[index].text = lastChar;
      }
      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      }
    }
    _syncToParent();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final totalWidth = constraints.maxWidth;
        // Dynamically compute box size to guarantee no horizontal overflow on any device
        final boxWidth = ((totalWidth - (5 * 8)) / 6).clamp(38.0, 48.0);
        final boxHeight = (boxWidth * 1.18).clamp(46.0, 56.0);

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(6, (index) {
            final hasFocus = _focusNodes[index].hasFocus;
            final hasChar = _boxControllers[index].text.isNotEmpty;

            return Container(
              width: boxWidth,
              height: boxHeight,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: hasFocus ? Colors.white : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: hasFocus
                      ? AppColors.primary
                      : (hasChar
                          ? AppColors.primary.withValues(alpha: 0.6)
                          : const Color(0xFFCBD5E1)),
                  width: hasFocus ? 2.0 : 1.2,
                ),
                boxShadow: hasFocus
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.18),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        )
                      ]
                    : null,
              ),
              child: TextField(
                controller: _boxControllers[index],
                focusNode: _focusNodes[index],
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                showCursor: true,
                cursorColor: AppColors.primary,
                cursorWidth: 2,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6), // Allows paste on any box
                ],
                style: const TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                  color: AppColors.text,
                ),
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  counterText: '',
                  contentPadding: EdgeInsets.zero,
                  isDense: true,
                ),
                onTap: () {
                  _boxControllers[index].selection = TextSelection(
                    baseOffset: 0,
                    extentOffset: _boxControllers[index].text.length,
                  );
                },
                onChanged: (val) => _onBoxChanged(index, val),
              ),
            );
          }),
        );
      },
    );
  }
}
