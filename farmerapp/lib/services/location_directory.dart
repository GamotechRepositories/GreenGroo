import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import 'app_language.dart';

class LocVillage {
  final String name;
  final String pincode;
  const LocVillage(this.name, this.pincode);
}

class LocTaluka {
  final String en;
  final String mr;
  final List<LocVillage> villages;
  const LocTaluka(this.en, this.mr, this.villages);

  String get label => AppLanguage().tr(mr: mr, en: en);

  List<String> get pincodes => villages.map((v) => v.pincode).toSet().toList()..sort();
}

class LocDistrict {
  final String en;
  final String mr;
  final List<LocTaluka> talukas;
  const LocDistrict(this.en, this.mr, this.talukas);

  String get label => AppLanguage().tr(mr: mr, en: en);
}

class LocState {
  final String en;
  final String mr;
  final String file;
  const LocState(this.en, this.mr, this.file);

  String get label => AppLanguage().tr(mr: mr, en: en);
}

/// State → district → taluka → village (post office) → pincode, bundled under
/// `assets/data/locations/` (India Post directory). Each state's file is loaded on demand.
class LocationDirectory {
  static const _base = 'assets/data/locations';
  static Future<List<LocState>>? _states;
  static final Map<String, Future<List<LocDistrict>>> _districts = {};

  static Future<List<LocState>> states() => _states ??= _readStates();

  static Future<List<LocDistrict>> districtsOf(LocState state) =>
      _districts[state.file] ??= _readDistricts(state.file);

  static Future<List<LocState>> _readStates() async {
    final list = jsonDecode(await rootBundle.loadString('$_base/states.json')) as List<dynamic>;
    return list.map((s) => LocState(s['en'] as String, s['mr'] as String, s['f'] as String)).toList();
  }

  static Future<List<LocDistrict>> _readDistricts(String file) async {
    final list = jsonDecode(await rootBundle.loadString('$_base/$file.json')) as List<dynamic>;
    return list.map((d) {
      final talukas = (d['t'] as List<dynamic>).map((t) {
        final villages = (t['v'] as List<dynamic>)
            .map((v) => LocVillage(v[0] as String, v[1] as String))
            .toList();
        return LocTaluka(t['en'] as String, t['mr'] as String, villages);
      }).toList();
      return LocDistrict(d['en'] as String, d['mr'] as String, talukas);
    }).toList();
  }

  static String _norm(String s) => s
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]'), '')
      .replaceAll('er', 'ar')
      .replaceAll('w', 'v')
      .replaceAll('ee', 'i')
      .replaceAll('oo', 'u')
      .replaceAll('ahmed', 'ahilya');

  /// Look up all Maharashtra districts and talukas
  static Future<List<LocDistrict>> getMaharashtraDistricts() async {
    final statesList = await states();
    final mh = statesList.where((s) => s.en.toLowerCase().contains('maharashtra')).firstOrNull;
    if (mh != null) {
      return districtsOf(mh);
    }
    return const [];
  }

  /// Look up district, taluka, and primary post office by 6-digit Indian pincode.
  /// Note: A single pincode can serve multiple villages; callers should allow farmers to confirm their village.
  static Future<Map<String, String>?> findLocationByPincode(String pincode) async {
    final cleanPin = pincode.trim().replaceAll(' ', '');
    if (cleanPin.length != 6) return null;
    try {
      final statesList = await states();
      // Search Maharashtra first as primary agricultural state
      final mh = statesList.where((s) => s.en.toLowerCase().contains('maharashtra')).firstOrNull;
      final targetStates = [
        ?mh,
        ...statesList.where((s) => !s.en.toLowerCase().contains('maharashtra')),
      ];

      for (final state in targetStates) {
        final dists = await districtsOf(state);
        for (final d in dists) {
          for (final t in d.talukas) {
            for (final v in t.villages) {
              if (v.pincode == cleanPin) {
                return {
                  'district': d.en,
                  'districtMr': d.mr,
                  'taluka': t.en,
                  'talukaMr': t.mr,
                  'village': v.name,
                  'pincode': cleanPin,
                  'state': state.en,
                };
              }
            }
          }
        }
      }
    } catch (_) {}
    return null;
  }

  /// Look up all official villages for a given taluka (with English, Marathi, and phonetic variation support)
  static Future<List<LocVillage>> getVillagesForTaluka(String talukaName, {String? districtName}) async {
    final cleanTaluka = talukaName
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'\s+(taluka|tahsil|tehsil)$', caseSensitive: false), '');
    if (cleanTaluka.isEmpty) return const [];
    final normTaluka = _norm(cleanTaluka);

    final cleanDist = districtName
        ?.trim()
        .toLowerCase()
        .replaceAll(RegExp(r'\s+(district|dist)$', caseSensitive: false), '');
    final normDist = cleanDist != null && cleanDist.isNotEmpty ? _norm(cleanDist) : null;

    try {
      final dists = await getMaharashtraDistricts();
      List<LocVillage>? fallback;

      for (final d in dists) {
        final dEn = d.en.toLowerCase();
        final dNorm = _norm(d.en);
        final isDistMatch = normDist == null ||
            dEn == cleanDist ||
            dNorm == normDist ||
            dEn.contains(cleanDist!) ||
            cleanDist.contains(dEn) ||
            d.mr.contains(cleanDist);

        for (final t in d.talukas) {
          final tEn = t.en.toLowerCase();
          final tNorm = _norm(t.en);
          final tMr = t.mr;

          // Exact or phonetic match
          if (tEn == cleanTaluka || tMr == cleanTaluka || tNorm == normTaluka) {
            if (isDistMatch) return t.villages;
            fallback ??= t.villages;
          }

          // Substring / prefix match
          if (tEn.contains(cleanTaluka) || cleanTaluka.contains(tEn) || tMr.contains(cleanTaluka)) {
            if (isDistMatch) return t.villages;
            fallback ??= t.villages;
          }
        }
      }
      if (fallback != null) return fallback;
    } catch (_) {}
    return const [];
  }

  /// Match a village name against a taluka's village list
  static Future<LocVillage?> findMatchingVillage(String talukaName, String rawVillage, {String? districtName}) async {
    final cleanRaw = rawVillage.trim().toLowerCase();
    if (cleanRaw.isEmpty) return null;
    final normRaw = _norm(cleanRaw);

    final list = await getVillagesForTaluka(talukaName, districtName: districtName);

    // 1. Exact match
    for (final v in list) {
      if (v.name.toLowerCase() == cleanRaw) return v;
    }

    // 2. Normalized match (handles spelling variations like Sawargaon <-> Savargaon)
    for (final v in list) {
      final normV = _norm(v.name);
      if (normV == normRaw || normV.contains(normRaw) || normRaw.contains(normV)) {
        return v;
      }
    }

    // 3. Substring match
    for (final v in list) {
      final vName = v.name.toLowerCase();
      if (vName.contains(cleanRaw) || cleanRaw.contains(vName)) {
        return v;
      }
    }
    return null;
  }

  /// Search villages across a taluka, district, or all of Maharashtra
  static Future<List<Map<String, String>>> searchVillages(
    String query, {
    String? talukaName,
    String? districtName,
    int limit = 50,
  }) async {
    final cleanQuery = query.trim().toLowerCase();
    if (cleanQuery.isEmpty) return const [];
    final normTaluka = (talukaName != null && talukaName.trim().isNotEmpty) ? _norm(talukaName) : null;
    final normDist = (districtName != null && districtName.trim().isNotEmpty) ? _norm(districtName) : null;

    final results = <Map<String, String>>[];
    try {
      final dists = await getMaharashtraDistricts();
      for (final d in dists) {
        if (normDist != null) {
          final dNorm = _norm(d.en);
          if (dNorm != normDist && !dNorm.contains(normDist) && !normDist.contains(dNorm)) {
            continue;
          }
        }
        for (final t in d.talukas) {
          if (normTaluka != null) {
            final tNorm = _norm(t.en);
            if (tNorm != normTaluka && !tNorm.contains(normTaluka) && !normTaluka.contains(tNorm)) {
              continue;
            }
          }
          for (final v in t.villages) {
            final vLower = v.name.toLowerCase();
            if (vLower.contains(cleanQuery) || v.pincode.startsWith(cleanQuery)) {
              results.add({
                'village': v.name,
                'pincode': v.pincode,
                'taluka': t.en,
                'talukaMr': t.mr,
                'district': d.en,
                'districtMr': d.mr,
              });
              if (results.length >= limit) return results;
            }
          }
        }
      }
    } catch (_) {}
    return results;
  }
}
