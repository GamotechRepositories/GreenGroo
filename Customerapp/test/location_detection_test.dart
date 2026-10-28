import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/core/providers/location_provider.dart';
import 'package:customer_app/core/utils/detect_current_location.dart';

void main() {
  group('PhoneLocation and DeliveryLocation tests', () {
    test('PhoneLocation converts correctly to DeliveryLocation', () {
      const phoneLoc = PhoneLocation(
        latitude: 18.5912,
        longitude: 73.7389,
        city: 'Pune',
        state: 'Maharashtra',
        area: 'Hinjawadi Phase 2',
        pincode: '411057',
        address: 'Hinjawadi Phase 2, Pune, Maharashtra, 411057',
        label: 'Hinjawadi Phase 2',
        accuracy: 15.0,
      );

      final deliveryLoc = phoneLoc.toDeliveryLocation();

      expect(deliveryLoc.latitude, 18.5912);
      expect(deliveryLoc.longitude, 73.7389);
      expect(deliveryLoc.city, 'Pune');
      expect(deliveryLoc.state, 'Maharashtra');
      expect(deliveryLoc.area, 'Hinjawadi Phase 2');
      expect(deliveryLoc.pincode, '411057');
      expect(deliveryLoc.address, 'Hinjawadi Phase 2, Pune, Maharashtra, 411057');
      expect(deliveryLoc.hasLocation, isTrue);
      expect(deliveryLoc.displayAddress, 'Hinjawadi Phase 2, Pune, Maharashtra, 411057');
    });

    test('displayLine correctly formats address components without duplicating', () {
      const loc1 = PhoneLocation(
        latitude: 18.5590,
        longitude: 73.7788,
        city: 'Pune',
        state: 'Maharashtra',
        area: 'Baner',
        pincode: '411045',
      );
      expect(loc1.displayLine, 'Baner, Pune, Maharashtra, 411045');

      const loc2 = PhoneLocation(
        latitude: 18.5590,
        longitude: 73.7788,
        address: 'Baner High Street, Baner, Pune',
      );
      expect(loc2.displayLine, 'Baner High Street, Baner, Pune');

      const loc3 = PhoneLocation(
        latitude: 18.5590,
        longitude: 73.7788,
        label: 'My Saved Location',
      );
      expect(loc3.displayLine, 'My Saved Location');
    });

    test('DeliveryLocation query params contain exact coordinates and pincode', () {
      const loc = DeliveryLocation(
        latitude: 18.5721,
        longitude: 73.7749,
        city: 'Pune',
        area: 'Balewadi',
        pincode: '411045',
        address: 'Balewadi High Street, Pune, 411045',
      );

      final params = loc.toQueryParams();
      expect(params['lat'], 18.5721);
      expect(params['lng'], 73.7749);
      expect(params['city'], 'Pune');
      expect(params['area'], 'Balewadi');
      expect(params['pincode'], '411045');
      expect(params['address'], 'Balewadi High Street, Pune, 411045');
    });

    test('PhoneLocationException produces clear human-readable error messages', () {
      final ex = PhoneLocationException(
        'GPS accuracy is insufficient (±300m) for precise delivery. Please move outdoors or select your address manually.',
      );
      expect(
        ex.toString(),
        'GPS accuracy is insufficient (±300m) for precise delivery. Please move outdoors or select your address manually.',
      );
    });
  });
}
