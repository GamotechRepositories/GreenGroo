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
}
