import 'package:flutter/material.dart';

import '../widgets/layout/tab_swipe_shell.dart';

/// Root navigator for full-screen routes and global overlays (auth sheet, etc.).
final rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

final _shellNavigatorHomeKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final _shellNavigatorProductKey = GlobalKey<NavigatorState>(debugLabel: 'product');
final _shellNavigatorOrdersKey = GlobalKey<NavigatorState>(debugLabel: 'orders');
final _shellNavigatorCartKey = GlobalKey<NavigatorState>(debugLabel: 'cart');
final _shellNavigatorProfileKey = GlobalKey<NavigatorState>(debugLabel: 'profile');

final shellBranchNavigatorKeys = <GlobalKey<NavigatorState>>[
  _shellNavigatorHomeKey,
  _shellNavigatorProductKey,
  _shellNavigatorOrdersKey,
  _shellNavigatorCartKey,
  _shellNavigatorProfileKey,
];

final shellBranchNavigatorObservers = List.generate(
  5,
  (_) => ShellBranchNavigatorObserver(),
);
