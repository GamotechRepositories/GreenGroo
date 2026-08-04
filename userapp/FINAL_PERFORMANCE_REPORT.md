# Final Performance Report — BulkMobileMart Mobile App

**Date:** June 25, 2026  
**Target devices:** Android 3 GB / 4 GB / 6 GB RAM  
**Validation:** `flutter analyze lib` — 0 errors introduced (3 pre-existing warnings)

---

## Summary

All runtime optimizations from Performance Audit #1 and Level-2 investigation were applied. UI, business logic, API contracts, and features are unchanged. Changes focus on startup sequencing, isolate-based JSON parsing, gated home loading, rebuild isolation, image decode bounds, and raster cost reduction.

| Metric | Before (est.) | After (est.) |
|--------|---------------|--------------|
| Time to `runApp` | 150–800 ms blocked on fonts | **< 50 ms** after `.env` + prefs |
| Home APIs at T+0 | 7 parallel within 500 ms | **2** (hero + categories); rest gated |
| Logged-in APIs at T+0 | 4 + home burst | **Deferred 500–800 ms** |
| UI-isolate JSON parse | All list endpoints | **Moved to `compute()`** |
| Home scroll + bottom nav raster | 18–24 ms/frame | **8–12 ms/frame** |
| Cart add on home | Up to 48 cards rebuild | **1 card** |
| Product detail cart change | Full page rebuild | **Bottom bar only** |
| Category thumb decode | Full CDN resolution | **96×96 logical max** |

---

## Files Modified

### Startup & core

| File | Optimization |
|------|--------------|
| `lib/main.dart` | Removed blocking `await GoogleFonts.pendingFonts`; font load runs post-frame after `runApp` |
| `lib/features/auth/auth_controller.dart` | Session restore delayed 500 ms to avoid competing with hero/categories |
| `lib/widgets/app_shell.dart` | `bootstrapUserSession` delayed 800 ms after first frame |
| `lib/core/network/api_isolate_parsers.dart` | **New** — top-level parsers + `parseOnBackground()` for `compute()` |
| `lib/services/api_service.dart` | Products, categories, brands, orders, cart, wishlist, hero, testimonials, addresses, user parsing off UI isolate |

### Home loading & sections

| File | Optimization |
|------|--------------|
| `lib/features/home/home_load_gate.dart` | **New** — `HomeLoadPhase` + `GatedHomeSection` |
| `lib/features/home/home_screen.dart` | Scroll-gated phases; brands after first frame; product rows after 48 px scroll; removed timer-based `DeferredHomeSection` |
| `lib/widgets/layout/tab_swipe_shell.dart` | `PageView.builder` lazy tab build (from pass #1, retained) |
| `lib/features/home/widgets/home_product_row.dart` | Per-card `cartProductQuantityProvider` (pass #1, retained) |
| `lib/features/home/widgets/top_brands_section.dart` | `ListView.separated` instead of eager `Row` |
| `lib/features/home/widgets/social_media_carousel_section.dart` | `ListView.separated` instead of eager `Row` |
| `lib/features/home/widgets/why_choose_us_section.dart` | `jumpToPage` when reduce-motion; visibility gate retained |
| `lib/features/home/widgets/home_wholesale_banner.dart` | `cacheWidth` tuned 800→720 |
| `lib/widgets/common/auto_horizontal_scroll.dart` | Timer interval 80→120 ms; no spurious `setState` on resume |

### Navigation & rendering

| File | Optimization |
|------|--------------|
| `lib/widgets/layout/flipkart_bottom_nav.dart` | Removed `BackdropFilter`; opaque `0xF5FFFFFF` frosted fill — same visual weight, ~50% less raster |

### Images

| File | Optimization |
|------|--------------|
| `lib/widgets/category/category_grid_tile.dart` | `cacheWidth/Height: 96` on flat tile images |
| `lib/widgets/category/category_header_section.dart` | `cacheWidth/Height: 96` on 48 px header icon |
| `lib/features/checkout/checkout_screen.dart` | `cacheWidth/Height: 112` on 56 px line items |

### Riverpod / rebuild isolation

| File | Optimization |
|------|--------------|
| `lib/features/product/product_detail_screen.dart` | `productDetailCartQuantityProvider` family; `_ProductDetailBottomBar` only watches cart; debounced recently-viewed invalidation (2 s) |
| `lib/features/orders/delivery_rating_controller.dart` | `deliveryRatingProvider.family(orderId)` |
| `lib/features/orders/widgets/blinkit_order_card.dart` | Per-order rating watch; removed `IntrinsicHeight` |
| `lib/features/orders/widgets/blinkit_order_detail_body.dart` | Per-order rating watch |
| `lib/widgets/product/buy_again_card.dart` | `ref.select` for line quantity only |

### Retained from pass #1 (unchanged this round)

- `lib/main.dart` image cache 60 / 32 MB
- `lib/features/home/widgets/category_nav_section.dart` icon map precompute
- `lib/features/home/widgets/hero_banner_carousel.dart` isolated page dots
- Support/payment/logo `memCacheWidth` bounds

### Removed

| File | Reason |
|------|--------|
| `lib/features/home/widgets/gated_home_section_content.dart` | Superseded by `GatedHomeSection` in `home_load_gate.dart` |

---

## Optimizations by Category

### 1. Startup

**Before:** `GoogleFonts.pendingFonts` blocked `runApp`; 11 HTTP calls could fire in ~1 s on logged-in cold start.  
**After:** App renders immediately; fonts load post-frame; session bootstrap deferred; home loads hero+categories first.

### 2. Home API gating

| Phase | Trigger | APIs watched |
|-------|---------|--------------|
| Critical | Immediate | `heroBannersProvider`, `categoriesProvider` |
| Brands | First frame | `brandsProvider` |
| Scrolled | Scroll > 48 px | deals, justArrived, hotSelling, recentlyViewed, testimonials, social, whyChooseUs, wholesale |

**Why:** Prevents network/parse/rebuild storm during first paint on 3 GB devices.

### 3. JSON parsing (`compute`)

Endpoints moved off UI isolate: products, categories, brands, orders, cart, wishlist, hero banners, testimonials, addresses, user, store settings, single product/order.

**Why:** `Product.fromJson` × 12 on UI thread caused 2–5 ms spikes per response; on clustered responses this exceeded 16 ms.

### 4. Product cards

`HomeProductRow` uses `_HomeDealProductCard` + `cartProductQuantityProvider` — unchanged logic, isolated rebuild.

### 5. Product detail

Gallery, tabs, description no longer rebuild on cart changes. `_ProductDetailBottomBar` + small `Consumer` for pre-cart quantity row handle cart state.

### 6. Bottom navigation

`BackdropFilter` removed; high-alpha white + existing shadow preserves pill appearance without per-frame backdrop sampling.

### 7. Auto-scroll

12.5 Hz → 8.3 Hz; visibility + lifecycle pauses retained; brand/social use lazy lists.

### 8. Orders

`deliveryRatingProvider(orderId)` prevents N-card rebuild on one rating tap. `IntrinsicHeight` replaced with stretch `Row`.

---

## Estimated Improvements

| Area | FPS | Memory | Startup | CPU |
|------|-----|--------|---------|-----|
| Font deferral | — | — | **−200–500 ms** | — |
| Home API gating | +5–10 scroll | **−20–40 MB** first 2 s | **−5 parallel calls** | −30% network contention |
| `compute()` parsing | +3–8 on API wave | — | — | **UI thread −40%** on parse |
| BackdropFilter removal | **+5–10** sustained | −2–4 MB | — | Raster **−50%** |
| Product detail cart split | +8–15 on cart ops | −0.5 MB/transient | — | −20% detail rebuild |
| Category image bounds | +2–4 on category scroll | **−10–25 MB** decode | — | −decode |
| Order rating family | +3–6 on orders tab | — | — | −rebuild |

---

## Remaining Bottlenecks (Low Priority)

1. **`category_nav_section.dart`** — nested horizontal `ListView` + inner `GridView` still lays out 6 cells per horizontal page (acceptable with bounded height).
2. **`why_choose_us_section.dart`** — 550 ms `animateToPage` every 3.2 s when visible (mitigated by visibility + reduce-motion).
3. **`fly_product_animator.dart`** — `Opacity` during 1 s fly animation (short-lived, acceptable).
4. **`product_detail_screen.dart`** — `ListView` with all children (not builder); large but single-product scope.
5. **Login/signup JSON** — still parsed on UI isolate (small payloads).
6. **Pre-existing analyzer warnings** — unused `dio` import in `auth_controller.dart`, optional `key` in `mobile_header.dart` (not introduced by this work).

---

## Validation Checklist

- [x] `flutter analyze lib` — no new errors
- [ ] DevTools Timeline: home scroll raster < 12 ms/frame (manual on device)
- [ ] DevTools: single cart add rebuilds one home card only
- [ ] Cold start: first content < 2 s on 3 GB device
- [ ] Memory: ImageCache stable after home browse

---

## How to Verify on Device

```bash
cd "mobile app"
flutter run --profile
```

1. Open DevTools → Performance → scroll home with bottom nav visible.  
2. Enable **Track Widget Rebuilds** → add to cart from deal row → only one card should flash.  
3. Open product detail → add unrelated item to cart from another tab → gallery should not rebuild.

---

*All changes preserve existing UI layout, navigation, API usage, and business rules.*
