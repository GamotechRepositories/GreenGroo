import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class OtpInput extends StatefulWidget {
  const OtpInput({
    super.key,
    required this.value,
    required this.onChanged,
    this.length = 6,
    this.enabled = true,
  });

  final String value;
  final ValueChanged<String> onChanged;
  final int length;
  final bool enabled;

  @override
  State<OtpInput> createState() => _OtpInputState();
}

class _OtpInputState extends State<OtpInput> {
  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(widget.length, (_) => TextEditingController());
    _focusNodes = List.generate(widget.length, (_) => FocusNode());
    _syncFromValue(widget.value);
  }

  @override
  void didUpdateWidget(covariant OtpInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _syncFromValue(widget.value);
    }
    if (oldWidget.enabled != widget.enabled) {
      for (final node in _focusNodes) {
        if (!widget.enabled) node.unfocus();
      }
    }
  }

  void _syncFromValue(String value) {
    final digits = value.replaceAll(RegExp(r'\D'), '');
    for (var i = 0; i < widget.length; i++) {
      final digit = i < digits.length ? digits[i] : '';
      if (_controllers[i].text != digit) {
        _controllers[i].text = digit;
      }
    }
  }

  void _emitValue() {
    final next = _controllers.map((controller) => controller.text).join();
    widget.onChanged(next);
  }

  void _handleChanged(int index, String raw) {
    final digit = raw.replaceAll(RegExp(r'\D'), '');
    if (digit.length > 1) {
      _handlePaste(digit);
      return;
    }

    _controllers[index].text = digit;
    _emitValue();

    if (digit.isNotEmpty && index < widget.length - 1) {
      _focusNodes[index + 1].requestFocus();
    }
  }

  void _handlePaste(String pasted) {
    final cleaned = pasted.replaceAll(RegExp(r'\D'), '');
    final digits = cleaned.length > widget.length
        ? cleaned.substring(0, widget.length)
        : cleaned;
    for (var i = 0; i < widget.length; i++) {
      _controllers[i].text = i < digits.length ? digits[i] : '';
    }
    _emitValue();
    final focusIndex = digits.length.clamp(0, widget.length - 1);
    _focusNodes[focusIndex].requestFocus();
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(widget.length, (index) {
        return Padding(
          padding: EdgeInsets.only(left: index == 0 ? 0 : 6),
          child: SizedBox(
            width: 42,
            height: 48,
            child: TextField(
              controller: _controllers[index],
              focusNode: _focusNodes[index],
              enabled: widget.enabled,
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              maxLength: 1,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
              decoration: InputDecoration(
                counterText: '',
                contentPadding: EdgeInsets.zero,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (value) => _handleChanged(index, value),
            ),
          ),
        );
      }),
    );
  }
}
