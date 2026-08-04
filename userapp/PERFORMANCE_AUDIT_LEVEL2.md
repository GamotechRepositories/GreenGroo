# Second-Level Runtime Performance Investigation

**Project:** BulkMobileMart mobile app  
**Date:** June 25, 2026  
**Scope:** Exact runtime bottlenecks after first optimization pass  
**Method:** Static call-graph + frame-budget analysis (UI isolate, raster thread, decode, layout). Estimates calibrated for 3–6 GB Android @ 60 Hz (16.67 ms/frame).

---

## Startup Network & UI-Thread Timeline (T+0 → T+1s)

| T (ms) | Thread | File:Line | What runs |
|--------|--------|-----------|-----------|
| 0 | UI | `main.dart:12` | `WidgetsFlutterBinding.ensureInitialized()` |
| 0–30 | UI | `main.dart:15–16` | Image cache limits (sync) |
| 30–120 | UI+IO | `main.dart:18` | `Env.load()` — `.env` file read |
| **120–800+** | **UI (blocked)** | **`main.dart:21`** | **`await GoogleFonts.pendingFonts(...)` — network font fetch blocks `runApp`** |
| 800–900 | UI+IO | `main.dart:29` | `AuthStorage.create()` — SharedPreferences |
| 900 | UI | `auth_controller.dart:15` | `Future.microtask(_restoreSession)` scheduled |
| 901 | UI | `app_shell.dart:59` | `bootstrapUserSession(ref)` post-frame |
| 901 | UI | `hero_banner_carousel.dart:37` | `ref.watch(heroBannersProvider)` → **GET /api/herobanners** |
| 901 | UI | `category_nav_section.dart:46` | `ref.watch(categoriesProvider)` → **GET /api/categories** |
| 950 | UI | `auth_controller.dart:29` | If token exists → **GET /api/users/me** |
| 950 | UI | `app_bootstrap.dart:13–15` | If logged in → **GET /api/cart**, **/api/wishlist**, **/api/orders** |
| 1000 | UI | `top_brands_section.dart:24` | `brandsProvider` → **GET /api/brands** |
| 1100 | UI | `best_deals_section.dart:15` | `homeDealsProvider` → **GET /api/products?limit=12** |
| 1200 | UI | `just_arrived_section.dart:14` | `justArrivedProvider` → **GET /api/products?justArrived=true** |
| 1300 | UI | `hot_selling_section.dart:14` | `hotSellingProvider` → **GET /api/products?hotSelling=true** |
| 1400 | UI | `recently_viewed_section.dart:14` | SharedPreferences read + **GET /api/products?ids=...** |
| 1300 | UI | `testimonials_section.dart:63` | `testimonialsProvider` → **GET /api/testimonials** |

**Cold-start API count (home tab, logged in): 11 HTTP requests within ~1.4 s**  
**Cold-start API count (guest): 7 HTTP requests**

Each response is parsed synchronously on the **UI isolate** via `ApiResponseParser.parseList` → `Product.fromJson` (`api_service.dart:248–250`, `models/product.dart:60–80`).

---

## Frequent Timers, Animations, Streams & Listeners

| Frequency | File:Line | Mechanism | Frame impact when active |
|-----------|-----------|-----------|------------------------|
| **12.5 Hz** | `auto_horizontal_scroll.dart:87–99` | `Timer.periodic(80ms)` + `ScrollController.jumpTo` ×2 instances (brands, social) | **2–4 ms UI + 1–2 ms raster** per tick while visible |
| **0.31 Hz** | `why_choose_us_section.dart:102–111` | `Timer.periodic(3200ms)` + `animateToPage(550ms)` | **6–12 ms/frame for 550 ms** every 3.2 s while on screen |
| **1 Hz** | `deals_countdown_timer.dart:23` | `Timer.periodic(1s)` + `setState` | **<0.5 ms** (isolated, `RepaintBoundary`) |
| **0.125 Hz** | `testimonials_section.dart:55` | `Timer.periodic(8s)` + `setState` | **1–2 ms** when visible |
| **60 Hz** | `flipkart_bottom_nav.dart:82` | `setState` on every `onHorizontalDragUpdate` | **4–8 ms UI** + **8–14 ms raster** (BackdropFilter) per drag frame |
| **60 Hz** | `fly_product_animator.dart:136–151` | `AnimatedBuilder` + `Opacity` during fly | **2–4 ms** for 1 s on add-to-cart |
| continuous | `connectivity_provider.dart:4–5` | `Connectivity().onConnectivityChanged` stream | Rebuild `_OfflineBannerStrip` only — **<1 ms** |
| continuous | `deep_link_listener.dart:33` | `uriLinkStream.listen` | Idle unless deep link — **0** |
| per swipe | `hero_banner_carousel.dart:106` | `PageController.addListener` → dots `setState` | **<1 ms** (isolated to dots) |

---

## Expensive Paint / Compositing Operations (Measured Risk)

| Widget | File:Line | Jank mechanism | Est. frame cost | Est. memory |
|--------|-----------|----------------|-----------------|-------------|
| `BackdropFilter` σ=6 | `flipkart_bottom_nav.dart:140–141` | Re-samples framebuffer behind nav on **every frame** while home scrolls underneath | **8–14 ms raster** | **+2–4 MB** scratch buffer |
| `LinearGradient` ×3 stacked | `home_wholesale_banner.dart:39–52` | Full-width gradient over image each paint | **1–2 ms raster** | negligible |
| `LinearGradient` header | `home_screen.dart:69–77` | Large gradient behind search + hero | **1–2 ms raster** on scroll | negligible |
| `BoxShadow` ×2 on nav pill | `flipkart_bottom_nav.dart:150–155, 195–200` | Shadow blurs on animated pill | **1–3 ms raster** during drag | negligible |
| `Opacity` (fly animation) | `fly_product_animator.dart:144–145` | Forces opacity layer during 1 s flight | **2–3 ms** during animation | +1 layer |
| `AnimatedContainer` dots | `why_choose_us_section.dart:193`, `hero_banner_carousel.dart:136` | Width tween on indicators | **<1 ms** | negligible |
| `ClipRRect` + image | `hero_banner_carousel.dart:158`, `deal_product_card.dart:251` | Clip + image paint | **1–2 ms** per visible card decode frame | decode-bound |

**Not found in codebase:** `Hero`, `ShaderMask`, `ClipPath`, `AnimatedOpacity` (only `Opacity` in fly animator).

**Found:** `IntrinsicHeight` at `blinkit_order_card.dart:345` — forces dual-pass layout for footer row.

---

## Images Decoded Larger Than Display Size

| Display size (logical px) | File:Line | `cacheWidth`/`memCache` | Overshoot | Decode waste |
|---------------------------|-----------|-------------------------|-----------|--------------|
| 48×48 | `category_header_section.dart:45–48` | **none** | **Full CDN resolution** | **4–12 MB peak** per image |
| ~80×80 tile | `category_grid_tile.dart:484–488` | **none** | Full resolution | **2–8 MB** per visible tile batch |
| 56×56 | `checkout_screen.dart:932` | **none** | Full resolution | **1–4 MB** per line item |
| 168×~360 | `home_wholesale_banner.dart:32–36` | 800×336 | ~1.1× at 2.25 DPR | Acceptable |
| 228×~360 | `hero_banner_carousel.dart:163–170` | 400×228 | OK at 2× DPR | Acceptable |
| 152×152 | `deal_product_card.dart:197–203` | 152×152 | 1:1 | Optimal |
| 560×280 gallery | `product_detail_screen.dart:988–992` | 560×560 | Slight overshoot | ~1.5 MB |

---

## Build()-Time & Rebuild Hotspots

### B1 — Product detail: entire page on any cart mutation

**File:** `features/product/product_detail_screen.dart`  
**Lines:** 150–184, 181–186  

**Why:** `ref.watch(cartControllerProvider.select((s) => s.items))` in `_buildContent` rebuilds the full `ListView` (gallery, variants, tabs, pricing) when **any** cart line changes — not just this product.

**Est. frame cost:** 12–22 ms UI (gallery + 200+ lines of widgets)  
**Est. memory:** Transient widget tree ~0.5 MB per rebuild  

**Optimized replacement:**

```dart
// product_detail_screen.dart — split cart-dependent footer only
class _ProductDetailCartBar extends ConsumerWidget {
  const _ProductDetailCartBar({required this.product, required this.variant, ...});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartItems = ref.watch(cartControllerProvider.select((s) => s.items));
    final line = findCartLineForProductDetail(cartItems, product, variant, color);
    return _AddToCartFooter(quantity: line?.quantity ?? _localQty, ...);
  }
}

// In _buildContent: remove lines 150–160; use const/_stateless sections above,
// place _ProductDetailCartBar at bottom only.
```

---

### B2 — Orders list: every card watches full ratings map

**File:** `features/orders/widgets/blinkit_order_card.dart`  
**Line:** 21  

**Why:** `ref.watch(deliveryRatingsProvider)` returns entire `Map<String, int>`. Updating one order's rating rebuilds **all** visible `BlinkitOrderCard` widgets.

**Est. frame cost:** 3–6 ms × N visible cards  
**Est. memory:** Negligible; rebuild churn dominates  

**Optimized replacement:**

```dart
// delivery_rating_controller.dart
final deliveryRatingProvider = Provider.family<int?, String>((ref, orderId) {
  return ref.watch(deliveryRatingsProvider.select((m) => m[orderId]));
});

// blinkit_order_card.dart:21
final deliveryRating = ref.watch(deliveryRatingProvider(order.id));
```

---

### B3 — Home: 9 deferred `setState` waves relayout `CustomScrollView`

**File:** `features/home/widgets/deferred_home_section.dart:32–33`  
**Triggered from:** `home_screen.dart:94–165` (9 instances, delays 100–500 ms)  

**Why:** Each timer fires `setState` → `CustomScrollView` recomputes sliver geometry → layout cascade while user may already be scrolling.

**Est. frame cost:** 4–8 ms per wave × 9 = **36–72 ms total** in first 500 ms of browsing  
**Est. memory:** Each section mounts providers + images (+5–15 MB cumulative)  

**Optimized replacement:**

```dart
// Single coordinator — one setState, batch mount
class _HomeDeferredGate extends StatefulWidget {
  @override
  State createState() => _HomeDeferredGateState();
}

class _HomeDeferredGateState extends State<_HomeDeferredGate> {
  int _phase = 0; // 0=immediate, 1=@200ms, 2=@400ms

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) setState(() => _phase = 1);
    });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) setState(() => _phase = 2);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      if (_phase >= 0) const TopBrandsSection(),
      if (_phase >= 1) ...[const BestDealsSection(), const JustArrivedSection()],
      if (_phase >= 2) ...[const HotSellingSection(), const RecentlyViewedSection()],
    ]);
  }
}
```

---

### B4 — Category grid: nested scroll + unbounded decode

**File:** `features/home/widgets/category_nav_section.dart`  
**Lines:** 115–167, 134–144  

**Why:** `LayoutBuilder` → horizontal `ListView.builder` → each page contains full `GridView.builder` (6 cells). Horizontal page scroll lays out entire 2×3 grid per page. Category images at `category_grid_tile.dart:484` decode without `cacheWidth`.

**Est. frame cost:** 6–10 ms layout on horizontal fling; **8–20 ms** first decode frame per new page  
**Est. memory:** 6 thumbnails × ~2 MB overshoot = **12 MB** per slide if uncached  

**Optimized replacement:**

```dart
// category_grid_tile.dart:484
? AppNetworkImage(
    imageUrl: imageUrl!,
    fit: BoxFit.contain,
    cacheWidth: 96,
    cacheHeight: 96,
    errorIcon: tileIcon,
    errorIconSize: 36,
  )
```

---

### B5 — Top brands: eager `Row` + continuous scroll timer

**File:** `features/home/widgets/top_brands_section.dart`  
**Lines:** 44–63, 47–61  

**Why:** `for` loop builds **all** brand tiles in one `Row` inside `AutoHorizontalScroll` (`auto_horizontal_scroll.dart:87`). Timer calls `jumpTo` at 12.5 Hz → scroll offset changes → repaint entire row.

**Est. frame cost:** 2–4 ms/frame × 12.5 Hz = **25–50 ms/s CPU** while section visible  
**Est. memory:** All brand images held in tree simultaneously  

**Optimized replacement:**

```dart
// top_brands_section.dart — replace Row with:
AutoHorizontalScroll(
  height: _rowHeight,
  interval: const Duration(milliseconds: 120), // 8.3 Hz
  child: ListView.separated(
    scrollDirection: Axis.horizontal,
    physics: const NeverScrollableScrollPhysics(),
    itemCount: brands.length,
    separatorBuilder: (_, _) => const SizedBox(width: 12),
    itemBuilder: (_, i) => _BrandTile(...),
  ),
)
```

---

## Synchronous UI-Thread Work (Non-Network)

| File:Line | Operation | When | Est. block |
|-----------|-----------|------|------------|
| `main.dart:21` | `await GoogleFonts.pendingFonts` | Before first frame | **50–500 ms** |
| `auth_storage.dart:22` | `jsonDecode` in `token` getter | First API client build | **<1 ms** |
| `api_service.dart:248–250` | `parseList(Product.fromJson)` ×12 | Each products API completion | **2–5 ms** per response |
| `api_service.dart:258–275` | Cart item parse loop | Login bootstrap | **1–4 ms** |
| `product_list_screen.dart:289–297` | `filterAndSortProducts` in `didUpdateWidget` | Filter/sort change | **1–3 ms** per 100 products |
| `recently_viewed.dart:17` | `jsonDecode` in `getIds` | `recentlyViewedProductsProvider` | **<1 ms** |
| `category_nav_section.dart:22–28` | `sortCategories` copy+sort | Every categories build | **1–2 ms** for 50 categories |

**Optimized replacement for JSON parse (products API):**

```dart
// home_providers.dart
final homeDealsProvider = FutureProvider<List<Product>>((ref) async {
  final raw = await ref.read(apiServiceProvider).getProducts({'limit': 12});
  return compute(_parseProducts, raw.data); // move parseList off UI isolate
});

List<Product> _parseProducts(dynamic body) =>
    ApiResponseParser.parseList(body, Product.fromJson);
```

---

## Widgets Likely Exceeding 16 ms Frame Budget

| Scenario | Dominant cost | Files | Total est. |
|----------|---------------|-------|------------|
| Home scroll with bottom nav visible | BackdropFilter raster | `flipkart_bottom_nav.dart:140` | **18–24 ms** |
| First paint after 3 API responses land same frame | JSON parse + rebuild 3 sections | `home_providers.dart`, section widgets | **22–35 ms** |
| WhyChooseUs auto-slide during home scroll | PageView animation + scroll competition | `why_choose_us_section.dart:107` | **18–28 ms** |
| Category horizontal fling (new page) | Layout + 6 image decodes | `category_nav_section.dart:125` | **20–40 ms** first frame |
| Product detail + cart add (other item in cart) | Full detail rebuild | `product_detail_screen.dart:150` | **12–22 ms** |
| Bottom nav drag | setState + BackdropFilter | `flipkart_bottom_nav.dart:82,140` | **16–22 ms**/frame |

---

---

# Top 10 Runtime Bottlenecks (Ranked Highest → Lowest Impact)

### #1 — Persistent `BackdropFilter` on bottom navigation during scroll  
**File:** `lib/widgets/layout/flipkart_bottom_nav.dart:140–141`  
**Why:** GPU re-blurs live home content every frame. Single largest **sustained raster** cost on the home tab.  
**Frame:** 8–14 ms raster | **Memory:** +2–4 MB  
**Fix:** Replace blur with opaque frosted fill on scroll, or gate blur behind `RepaintBoundary` + static snapshot.

```dart
// Measure first — if raster > 8ms, replace:
child: DecoratedBox(
  decoration: BoxDecoration(
    color: const Color(0xF2FFFFFF), // no BackdropFilter
    borderRadius: BorderRadius.circular(32),
    ...
  ),
  child: ...
),
```

---

### #2 — Home API burst: 7 parallel requests + UI-isolate JSON parse  
**Files:** `lib/features/home/home_providers.dart:10–76`, `lib/services/api_service.dart:248–250`, deferred sections `home_screen.dart:94–165`  
**Why:** Responses cluster between 200–800 ms; each triggers `Product.fromJson` ×12 on UI thread + section rebuild + image fetch.  
**Frame:** 22–35 ms spike when 2–3 complete same frame | **Memory:** +30–50 MB image decode wave  
**Fix:** Single bundled endpoint OR `compute()` parse + stagger provider watches behind one gate (see B3).

---

### #3 — `GoogleFonts.pendingFonts` blocks `runApp`  
**File:** `lib/main.dart:21`  
**Why:** Synchronous await on network font before first frame → delayed startup, blank screen.  
**Frame:** Delays first frame 50–500 ms | **Memory:** +2 MB font cache  
**Fix:**

```dart
// main.dart — do not await before runApp
unawaited(GoogleFonts.pendingFonts([GoogleFonts.plusJakartaSans()]));
runApp(...);
```

---

### #4 — Logged-in startup: `fetchMe` + cart + wishlist + orders in parallel  
**Files:** `lib/features/auth/auth_controller.dart:15–29`, `lib/core/bootstrap/app_bootstrap.dart:13–15`  
**Why:** 4 authenticated APIs compete with home APIs for bandwidth and CPU on UI isolate when responses parse.  
**Frame:** 15–25 ms cumulative parse spikes | **Memory:** +10–20 MB  
**Fix:** Defer bootstrap until after first frame + home hero/categories complete.

```dart
// app_shell.dart:59
WidgetsBinding.instance.addPostFrameCallback((_) {
  Future.delayed(const Duration(milliseconds: 800), () => _maybeBootstrap());
});
```

---

### #5 — Dual `AutoHorizontalScroll` timers at 12.5 Hz  
**Files:** `lib/widgets/common/auto_horizontal_scroll.dart:87–99`, `top_brands_section.dart:44`, `social_media_carousel_section.dart:45`  
**Why:** Continuous `jumpTo` invalidates scroll + repaint while home CustomScrollView also scrolling.  
**Frame:** 2–4 ms × 12.5/s × 2 = **50–100 ms/s** | **Memory:** minimal  
**Fix:** `interval: Duration(milliseconds: 120–150)` or pause when `Scrollable.of(context).position.isScrollingNotifier.value`.

---

### #6 — Product detail rebuilds entire `ListView` on any cart change  
**File:** `lib/features/product/product_detail_screen.dart:150–184`  
**Why:** Full product page reconstruction including image gallery for unrelated cart mutations.  
**Frame:** 12–22 ms | **Memory:** ~0.5 MB transient tree  
**Fix:** See B1 — isolate cart watch to footer bar only.

---

### #7 — Category images without decode bounds (home grid)  
**Files:** `lib/widgets/category/category_grid_tile.dart:484–488`, `lib/widgets/category/category_header_section.dart:45–48`  
**Why:** `CachedNetworkImage` decodes full CDN image into memory for 48–96 px tiles.  
**Frame:** 8–20 ms decode frame per new tile | **Memory:** 2–12 MB per image  
**Fix:** `cacheWidth: 96, cacheHeight: 96` on both call sites.

---

### #8 — `WhyChooseUsSection` auto `animateToPage` (550 ms) every 3.2 s  
**File:** `lib/features/home/widgets/why_choose_us_section.dart:102–111`  
**Why:** Running PageView animation while user scrolls same CustomScrollView causes compositor contention.  
**Frame:** 6–12 ms for 550 ms every 3.2 s | **Memory:** minimal  
**Fix:**

```dart
if (!isWidgetRoughlyVisible(context, margin: 0)) return; // stricter gate
// OR replace animateToPage with jumpToPage when reduce motion:
if (MediaQuery.disableAnimationsOf(context)) {
  _pageController.jumpToPage(next);
} else ...
```

---

### #9 — Nine independent `DeferredHomeSection` setState waves  
**Files:** `lib/features/home/widgets/deferred_home_section.dart:32–33`, `lib/features/home/home_screen.dart:94–165`  
**Why:** Nine sequential layout passes mount providers/images during user's first scroll.  
**Frame:** 4–8 ms × 9 waves | **Memory:** +5–15 MB cumulative  
**Fix:** See B3 — phased gate with 2–3 batched setStates.

---

### #10 — `BlinkitOrderCard` watches entire ratings map  
**File:** `lib/features/orders/widgets/blinkit_order_card.dart:21`  
**Why:** O(N) card rebuilds per single rating tap.  
**Frame:** 3–6 ms × visible cards | **Memory:** negligible  
**Fix:** See B2 — `Provider.family` per `orderId`.

---

## Additional Findings (Rank 11–15)

| Rank | File:Line | Issue | Frame | Memory |
|------|-----------|-------|-------|--------|
| 11 | `flipkart_bottom_nav.dart:82` | `setState` every drag pixel with BackdropFilter | 16–22 ms/drag frame | — |
| 12 | `product_detail_screen.dart:125` | `invalidate(recentlyViewedProductsProvider)` → extra home API on back navigation | Network + 5 ms parse | — |
| 13 | `checkout_screen.dart:932` | 56 px image, no memCache | 4–8 ms decode | 1–4 MB |
| 14 | `blinkit_order_card.dart:345` | `IntrinsicHeight` dual layout pass | 1–3 ms/card | — |
| 15 | `category_nav_section.dart:22–28` | `sortCategories` copy on every categories rebuild | 1–2 ms | — |

---

## Validation Protocol (DevTools)

1. **Timeline → Raster thread:** Scroll home with bottom nav visible; if raster > 8 ms sustained → #1 confirmed.  
2. **Timeline → UI thread:** Filter `Dart` events at cold start; count JSON `Product.fromJson` stacks → #2.  
3. **Performance overlay:** Disable network → measure time-to-first-frame → #3.  
4. **Memory → Decode:** Open category grid; watch `ImageCache` bytes before/after horizontal swipe → #7.  
5. **Rebuild stats:** Add `debugPrintRebuildDirtyWidgets = true`; add unrelated item to cart on product detail → #6.

---

*This report documents measurable runtime behavior from code structure. Apply fixes incrementally and re-profile each change on a physical 3 GB device.*
