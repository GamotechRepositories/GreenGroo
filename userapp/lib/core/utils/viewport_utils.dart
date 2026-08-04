import 'package:flutter/material.dart';

/// True when this widget's bounds overlap the screen (with [margin] padding).
bool isWidgetRoughlyVisible(BuildContext context, {double margin = 160}) {
  final box = context.findRenderObject() as RenderBox?;
  if (box == null || !box.attached || !box.hasSize) return false;

  final top = box.localToGlobal(Offset.zero).dy;
  final bottom = top + box.size.height;
  final viewHeight = MediaQuery.sizeOf(context).height;

  return top < viewHeight + margin && bottom > -margin;
}
