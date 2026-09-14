class ParsedProductDescription {
  const ParsedProductDescription({
    required this.paragraphs,
    required this.bullets,
    required this.hasKeyFeaturesHeading,
  });

  final List<String> paragraphs;
  final List<String> bullets;
  final bool hasKeyFeaturesHeading;
}

String _stripShortDescriptionLabel(String text) {
  return text.replaceFirst(RegExp(r'^Short Description\s*', caseSensitive: false), '').trim();
}

List<String> _splitAsteriskBullets(String text) {
  return text
      .split(RegExp(r'\s*\*\s*'))
      .map((part) => part.trim())
      .where((part) => part.isNotEmpty)
      .toList();
}

ParsedProductDescription? parseProductDescription(String description) {
  final raw = description.trim();
  if (raw.isEmpty) return null;

  final normalized = _stripShortDescriptionLabel(raw);
  final keyFeaturesMatch = RegExp(r'\bKey Features\b', caseSensitive: false).firstMatch(normalized);

  var intro = normalized;
  var featureSource = '';
  var hasKeyFeaturesHeading = false;

  if (keyFeaturesMatch != null) {
    hasKeyFeaturesHeading = true;
    intro = normalized.substring(0, keyFeaturesMatch.start).trim();
    featureSource = normalized.substring(keyFeaturesMatch.end).trim();
  }

  var bullets = featureSource.isNotEmpty ? _splitAsteriskBullets(featureSource) : <String>[];

  if (bullets.isEmpty && normalized.contains('*')) {
    final parts = _splitAsteriskBullets(normalized);
    if (parts.length > 1) {
      intro = parts.first;
      bullets = parts.sublist(1);
    }
  }

  final paragraphs = intro
      .split(RegExp(r'\n{2,}|\n'))
      .map((part) => part.trim())
      .where((part) => part.isNotEmpty)
      .toList();

  return ParsedProductDescription(
    paragraphs: paragraphs,
    bullets: bullets,
    hasKeyFeaturesHeading: hasKeyFeaturesHeading && bullets.isNotEmpty,
  );
}
