import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/farmer_constants.dart';

class AppLanguage extends ChangeNotifier {
  static final AppLanguage _instance = AppLanguage._internal();
  factory AppLanguage() => _instance;
  AppLanguage._internal();

  static const String _prefLangKey = 'app_language_code';
  static const String _prefSelectedOnceKey = 'language_selected_once';

  String _currentLanguage = 'mr'; // 'mr' for Marathi, 'en' for English
  bool _hasSelectedOnce = false;
  bool _isInitialized = false;

  String get currentLanguage => _currentLanguage;
  bool get isMarathi => _currentLanguage == 'mr';
  bool get isEnglish => _currentLanguage == 'en';
  bool get hasSelectedOnce => _hasSelectedOnce;
  bool get isInitialized => _isInitialized;

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _currentLanguage = prefs.getString(_prefLangKey) ?? 'mr';
      _hasSelectedOnce = prefs.getBool(_prefSelectedOnceKey) ?? false;
      _isInitialized = true;
      notifyListeners();
    } catch (_) {
      _currentLanguage = 'mr';
      _isInitialized = true;
    }
  }

  Future<void> setLanguage(String langCode) async {
    if (langCode != 'mr' && langCode != 'en') return;
    _currentLanguage = langCode;
    _hasSelectedOnce = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefLangKey, langCode);
      await prefs.setBool(_prefSelectedOnceKey, true);
    } catch (_) {}
  }

  /// Returns translated string based on active language
  String tr({required String mr, required String en}) {
    return isMarathi ? mr : en;
  }

  static final RegExp _devanagari = RegExp(r'[\u0900-\u097F]');

  /// Display text for data values that are stored with both languages
  /// (e.g. 'Black Soil (काळी माती)', 'मराठी (Marathi)') or as plain English codes
  /// (e.g. 'Acre', 'Kg', 'Ready for Harvest'). The stored value itself must stay unchanged.
  String pick(String value) {
    final v = value.trim();
    if (v.isEmpty) return value;
    final split = splitBilingual(v);
    if (split != null) return isMarathi ? split.mr : split.en;
    if (isMarathi) {
      final key = v.toLowerCase().replaceAll('_', ' ');
      return _enToMr[v] ?? _enToMrLower[key] ?? _optionPairs.enToMr[key] ?? value;
    }
    return _mrToEn[v] ?? _optionPairs.mrToEn[v] ?? value;
  }

  /// Plain-English / plain-Marathi halves of the bilingual option lists in [FarmerConstants],
  /// so 'Tomato' or 'Drip' shows in Marathi even when stored without the Marathi part.
  static final ({Map<String, String> enToMr, Map<String, String> mrToEn}) _optionPairs = () {
    final enToMr = <String, String>{};
    final mrToEn = <String, String>{};
    for (final list in [
      FarmerConstants.cropOptions,
      FarmerConstants.soilTypes,
      FarmerConstants.irrigationTypes,
      FarmerConstants.waterSources,
      FarmerConstants.farmingMethods,
      FarmerConstants.farmingTypes,
    ]) {
      for (final option in list) {
        final split = splitBilingual(option);
        if (split == null) continue;
        enToMr.putIfAbsent(split.en.toLowerCase(), () => split.mr);
        mrToEn.putIfAbsent(split.mr, () => split.en);
      }
    }
    return (enToMr: enToMr, mrToEn: mrToEn);
  }();

  static const _monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  static const _monthsMr = ['जाने', 'फेब्रु', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];

  /// Short month name (1 = January) in the current language.
  String monthShort(int month) => (isMarathi ? _monthsMr : _monthsEn)[(month - 1) % 12];

  static final Map<String, String> _enToMrLower = {for (final e in _enToMr.entries) e.key.toLowerCase(): e.value};

  /// Splits 'English (मराठी)', 'मराठी (English)', 'मराठी / English' or 'मराठी\nEnglish'.
  static ({String mr, String en})? splitBilingual(String value) {
    final v = value.trim();
    final paren = RegExp(r'^(.*?)\s*\(([^()]*)\)\s*([^A-Za-z\u0900-\u097F()]*)$').firstMatch(v);
    if (paren != null) {
      final outer = paren.group(1)!.trim();
      final inner = paren.group(2)!.trim();
      final tail = paren.group(3)!.trim();
      final outerDev = _devanagari.hasMatch(outer);
      final innerDev = _devanagari.hasMatch(inner);
      final innerLatin = RegExp(r'[A-Za-z]{2,}').hasMatch(inner);
      final outerLatin = RegExp(r'[A-Za-z]{2,}').hasMatch(outer);
      if (outer.isNotEmpty && inner.isNotEmpty && outerDev != innerDev && (innerLatin || outerLatin)) {
        final suffix = tail.isEmpty ? '' : ' $tail';
        return outerDev
            ? (mr: '$outer$suffix', en: '$inner$suffix')
            : (mr: '$inner$suffix', en: '$outer$suffix');
      }
    }
    for (final sep in const [' / ', '\n']) {
      final parts = v.split(sep);
      if (parts.length != 2) continue;
      final a = parts[0].trim();
      final b = parts[1].trim();
      final aDev = _devanagari.hasMatch(a);
      final bDev = _devanagari.hasMatch(b);
      if (a.isNotEmpty && b.isNotEmpty && aDev != bDev) {
        return aDev ? (mr: a, en: b) : (mr: b, en: a);
      }
    }
    return null;
  }

  static final Map<String, String> _mrToEn = {for (final e in _enToMr.entries) e.value: e.key};

  static const Map<String, String> _enToMr = {
    // Gender & language
    'Male': 'पुरुष',
    'Female': 'स्त्री',
    'Other': 'इतर',
    'English': 'इंग्रजी',
    'Marathi': 'मराठी',
    'Hindi': 'हिंदी',
    // Units
    'Acre': 'एकर',
    'Acres': 'एकर',
    'Hectare': 'हेक्टर',
    'Guntha': 'गुंठा',
    'Kg': 'किलो',
    'kg': 'किलो',
    'Quintal': 'क्विंटल',
    'Ton': 'टन',
    'Piece': 'नग',
    'Box': 'बॉक्स',
    'Crate': 'क्रेट',
    'Dozen': 'डझन',
    // Packaging & product listing values
    'Gunny Bag': 'गोणी',
    'Pouch': 'पाउच',
    'Carton': 'कार्टन',
    'Bag': 'पिशवी',
    'All': 'सर्व',
    'Paused': 'थांबवले',
    'Published': 'प्रकाशित',
    'Standard': 'मानक',
    'Vegetables': 'भाजीपाला',
    'IPM': 'एकात्मिक कीड व्यवस्थापन',
    'Conventional': 'पारंपारिक',
    'Organic': 'सेंद्रिय',
    'Natural': 'नैसर्गिक',
    'Mixed': 'मिश्र',
    // Government scheme categories
    'All Schemes': 'सर्व योजना',
    'Financial Benefit': 'आर्थिक लाभ',
    'Irrigation & Drip': 'सिंचन व ठिबक',
    'Solar & Energy': 'सौर व ऊर्जा',
    'Crop Insurance': 'पीक विमा',
    'Machinery & Equipment': 'यंत्रसामग्री व उपकरणे',
    'Dairy & Livestock': 'दुग्ध व पशुधन',
    'Government Scheme': 'शासकीय योजना',
    // Crop-stage upload document types
    'Report': 'अहवाल',
    // Order rejection reasons (sent to backend in English)
    'Stock Unavailable': 'स्टॉक उपलब्ध नाही',
    'Quality Issue': 'गुणवत्ता समस्या',
    'Pickup Issue': 'पिकअप समस्या',
    'Quantity Mismatch': 'प्रमाण जुळत नाही',
    // Weekdays
    'Monday': 'सोमवार',
    'Tuesday': 'मंगळवार',
    'Wednesday': 'बुधवार',
    'Thursday': 'गुरुवार',
    'Friday': 'शुक्रवार',
    'Saturday': 'शनिवार',
    'Sunday': 'रविवार',
    // Farm profile options stored in English only
    'Hydroponic': 'हायड्रोपोनिक',
    'KCC / Krishi Loan Account': 'केसीसी / कृषी कर्ज खाते',
    'Under Review': 'पडताळणी चालू',
    'Submitted': 'सादर केले',
    // Grades & product statuses
    'Grade A': 'ग्रेड A',
    'Grade B': 'ग्रेड B',
    'Grade C': 'ग्रेड C',
    'Active': 'सक्रिय',
    'Pending Approval': 'मंजुरी प्रलंबित',
    'Draft': 'मसुदा',
    'Low Stock': 'कमी साठा',
    'Out of Stock': 'साठा संपला',
    'Pending': 'प्रलंबित',
    'Approved': 'मंजूर',
    'Rejected': 'नाकारले',
    'Verified': 'पडताळले',
    'Uploaded': 'अपलोड केले',
    'Not Uploaded': 'अपलोड नाही',
    // Order tabs & statuses
    'New Orders': 'नवीन ऑर्डर',
    'New': 'नवीन',
    'Accepted': 'स्वीकारले',
    'Preparing': 'तयारी सुरू',
    'Ready for Pickup': 'पिकअपसाठी तयार',
    'Ready': 'तयार',
    'Completed': 'पूर्ण',
    'Cancelled': 'रद्द',
    'Delivered': 'पोहोचवले',
    'Picked Up': 'पिकअप झाले',
    'In Transit': 'वाहतुकीत',
    'Driver Assigned': 'ड्रायव्हर नेमला',
    // Crop planning stages
    'Planning Created': 'नियोजन तयार केले',
    'Land Preparation': 'मशागत / जमीन तयार करणे',
    'Soil Testing': 'माती परीक्षण',
    'Land Preparation Completed': 'मशागत पूर्ण',
    'Seed Selection': 'बियाणे निवड',
    'Seed Treatment': 'बीजप्रक्रिया',
    'Sowing / Plantation': 'पेरणी / लागवड',
    'Germination Started': 'उगवण सुरू',
    'First Fertilizer Application': 'पहिली खत मात्रा',
    'Irrigation': 'पाणी व्यवस्थापन',
    'Crop Growth': 'पीक वाढ',
    'Spray / Pest Control': 'कीड नियंत्रण फवारणी',
    'Weeding / Intercultivation': 'तणनियंत्रण / खुरपणी / कोळपणी',
    'Second Fertilizer Application': 'दुसरी खत मात्रा',
    'Spray / Disease Control': 'रोग नियंत्रण फवारणी',
    'Second Irrigation': 'दुसरे पाणी',
    'Crop Monitoring': 'पीक पाहणी',
    'Nutrient / Micronutrient Spray': 'सूक्ष्म अन्नद्रव्य फवारणी',
    'Flowering / Fruiting': 'फुलोरा / फळधारणा',
    'Final Fertilizer / Required Treatment': 'शेवटची खत मात्रा / आवश्यक उपचार',
    'Pre-Harvest Stage': 'कापणीपूर्व टप्पा',
    'Ready for Harvest': 'काढणीस तयार',
    'Harvested': 'काढणी झाली',
    'Growing': 'वाढ सुरू',
    'Planned': 'नियोजित',
    // Crop varieties
    'Hybrid': 'संकरित',
    'Local': 'स्थानिक',
    'Desi': 'देशी',
    'Improved': 'सुधारित',
    // Documents
    'Aadhaar Card': 'आधार कार्ड',
    'Farmer ID': 'शेतकरी ओळखपत्र',
    '7/12 Extract': '७/१२ उतारा',
    '8A Extract': '८-अ उतारा',
    'Bank Passbook': 'बँक पासबुक',
    'Farmer Photo': 'शेतकरी फोटो',
    'Address Proof': 'रहिवासी दाखला',
    'PAN Card': 'पॅन कार्ड',
    'Live Video KYC': 'लाइव्ह व्हिडिओ केवायसी',
  };

  /// Show language selection popup dialog
  static Future<void> showSelectionDialog(
    BuildContext context, {
    bool dismissible = true,
    VoidCallback? onSelected,
  }) async {
    String tempLang = AppLanguage().currentLanguage;

    await showDialog(
      context: context,
      barrierDismissible: dismissible,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 8,
              backgroundColor: Colors.white,
              insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header Icon
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.language_rounded, color: AppColors.primary, size: 30),
                    ),
                    const SizedBox(height: 14),

                    // Title
                    const Text(
                      'भाषा निवडा / Select Language',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'तुम्हाला ॲप कोणत्या भाषेत वापरायचे आहे?\nWhich language would you like to use?',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.3),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),

                    // Marathi Option Card
                    _buildLanguageCard(
                      title: 'मराठी (Marathi)',
                      subtitle: 'पिके, बाजारभाव, योजना आणि सर्व हिशोब मराठीत',
                      flagEmoji: '🇮🇳',
                      isSelected: tempLang == 'mr',
                      onTap: () => setModalState(() => tempLang = 'mr'),
                    ),
                    const SizedBox(height: 12),

                    // English Option Card
                    _buildLanguageCard(
                      title: 'English',
                      subtitle: 'Crops, market prices, schemes and statements in English',
                      flagEmoji: '🌐',
                      isSelected: tempLang == 'en',
                      onTap: () => setModalState(() => tempLang = 'en'),
                    ),
                    const SizedBox(height: 22),

                    // Confirm / Continue Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          await AppLanguage().setLanguage(tempLang);
                          if (dialogCtx.mounted) {
                            Navigator.pop(dialogCtx);
                          }
                          onSelected?.call();
                        },
                        child: Text(
                          tempLang == 'mr' ? 'पुढे चालू ठेवा (Continue)' : 'Continue',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  static Widget _buildLanguageCard({
    required String title,
    required String subtitle,
    required String flagEmoji,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
            width: isSelected ? 2.0 : 1.2,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : const Color(0xFFF8FAFC),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.primary.withValues(alpha: 0.3) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Text(flagEmoji, style: const TextStyle(fontSize: 20)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? AppColors.primaryDark : const Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      color: isSelected ? const Color(0xFF15803D) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.primary : Colors.transparent,
                border: Border.all(
                  color: isSelected ? AppColors.primary : const Color(0xFFCBD5E1),
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
