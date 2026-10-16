import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../constants/app_colors.dart';

/// 6 Separate Box OTP Input Widget.
/// - Shows 6 square boxes with faint placeholder digits (e.g. 1 2 3 4 5 6) when empty.
/// - Directly clickable: clicking anywhere opens the keyboard and focuses properly.
/// - When typed, real digits replace the placeholder in bold dark color.
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
  late FocusNode _focusNode;

  // Placeholder digits shown when boxes are empty
  final List<String> _placeholderDigits = const ['1', '2', '3', '4', '5', '6'];

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChanged);
    widget.controller.addListener(_onControllerChanged);
    if (widget.autofocus) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _focusAndOpenKeyboard();
      });
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChanged);
    widget.controller.removeListener(_onControllerChanged);
    _focusNode.dispose();
    super.dispose();
  }

  void _onFocusChanged() {
    if (mounted) setState(() {});
  }

  void _onControllerChanged() {
    if (mounted) setState(() {});
    widget.onChanged?.call(widget.controller.text);
    if (widget.controller.text.length == 6) {
      widget.onCompleted?.call(widget.controller.text);
    }
  }

  void _focusAndOpenKeyboard() {
    FocusScope.of(context).requestFocus(_focusNode);
    SystemChannels.textInput.invokeMethod('TextInput.show');
  }

  @override
  Widget build(BuildContext context) {
    final text = widget.controller.text;
    final isFocused = _focusNode.hasFocus;

    return SizedBox(
      height: 56,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // 6 Visual Boxes with Placeholders underneath
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(6, (index) {
              final hasChar = text.length > index;
              final char = hasChar ? text[index] : _placeholderDigits[index];
              final isCurrentActive = isFocused && (text.length == index || (index == 5 && text.length == 6));

              return Container(
                width: 46,
                height: 54,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isCurrentActive
                        ? AppColors.primary
                        : (hasChar ? AppColors.primary.withValues(alpha: 0.6) : const Color(0xFFCBD5E1)),
                    width: isCurrentActive ? 2.0 : 1.2,
                  ),
                  boxShadow: isCurrentActive
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.18),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          )
                        ]
                      : null,
                ),
                child: Text(
                  char,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: hasChar ? FontWeight.bold : FontWeight.w500,
                    color: hasChar ? AppColors.text : const Color(0xFF94A3B8), // Faint grey placeholder
                  ),
                ),
              );
            }),
          ),

          // Real transparent TextField ON TOP so every touch directly hits native input
          Positioned.fill(
            child: TextField(
              controller: widget.controller,
              focusNode: _focusNode,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              autofocus: widget.autofocus,
              enableSuggestions: false,
              autocorrect: false,
              cursorColor: Colors.transparent,
              cursorWidth: 0,
              showCursor: false,
              style: const TextStyle(
                color: Colors.transparent,
                fontSize: 1,
              ),
              decoration: const InputDecoration(
                border: InputBorder.none,
                counterText: '',
                contentPadding: EdgeInsets.zero,
                fillColor: Colors.transparent,
                filled: true,
              ),
              onTap: _focusAndOpenKeyboard,
            ),
          ),
        ],
      ),
    );
  }
}
