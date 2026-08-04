# Flutter Performance Audit — BulkMobileMart Mobile App

**Date:** June 25, 2026  
**Target devices:** Android 3 GB / 4 GB / 6 GB RAM  
**Goal:** Stable 60 FPS scrolling, fast startup, low memory, minimal unnecessary rebuilds

---

## Executive Summary

The app already includes several good practices (`AppNetworkImage` with `memCacheWidth`/`memCacheHeight`, image cache limits in `main.dart`, `DeferredHomeSection`, `ref.select()` in cart screen, per-product `cartProductQuantityProvider`). The main lag sources on low-RAM devices were:

1. **Eager construction of all 5 shell tabs** via `PageView(children: …)`  
2. **Cart-driven rebuilds of entire home product rows** (12 cards × 4 sections)  
3. **Expensive `BackdropFilter` blur** on the always-visible bottom nav  
4. **Continuous auto-scroll timers** firing at 20 Hz  
5. **Excessive compositing layers** from stacked `RepaintBoundary` widgets  
6. **O(n²) category icon lookup** in the category grid  
7. **Uncached full-resolution network images** in a few secondary screens  

**Fixes applied in this audit** are marked with ✅ below.

---

## 1. Shell & Navigation

| # | Severity | File | Line(s) | Issue | Why it causes lag | Recommended fix | Status | FPS | Memory | CPU |
|---|----------|------|---------|-------|-------------------|-----------------|--------|-----|--------|-----|
| 1.1 | **Critical** | `widgets/layout/tab_swipe_shell.dart` | 151–158 | `PageView(children: widget.children)` builds **all 5 tab branches immediately** (Home, Categories, Orders, Cart, Account) | On launch, Home + Categories + grids + providers all initialize together; 3–6 GB devices exhaust RAM and GC thrashes | Use `PageView.builder` with `allowImplicitScrolling: false` so only visited/adjacent tabs build | ✅ Fixed | +8–15 | −40–80 MB | −25% startup |
| 1.2 | **High** | `widgets/layout/flipkart_bottom_nav.dart` | 139–141 | `BackdropFilter` blur σ=14 on every frame over scrolling content | Forces backdrop sampling on GPU each frame; worst on Mali/Adreno low-end GPUs | Reduce blur σ, raise bar opacity, wrap in `RepaintBoundary` | ✅ Fixed (σ=6, α=0.90, RepaintBoundary) | +3–8 | −5 MB | −15% raster |
| 1.3 | **Medium** | `widgets/app_shell.dart` | 86–96 | `ref.watch` cart count + account initial at shell level | Any cart/auth change rebuilds header + nav subtree | Already uses `select()` — acceptable; side effects isolated in `_ShellSideEffects` | OK | — | — | — |
| 1.4 | **Low** | `widgets/layout/tab_swipe_shell.dart` | 77–83 | `setState` on every branch stack push/pop | Minor rebuild of `PageView` container | Debounced via `_stackRebuildScheduled` — acceptable | OK | — | — | — |
| 1.5 | **Medium** | `app.dart` | 15 | `ref.watch(routerProvider)` at app root | Router rarely changes; low impact | Keep as-is (GoRouter instance stable) | OK | — | — | — |

---

## 2. Home Screen

| # | Severity | File | Line(s) | Issue | Why it causes lag | Recommended fix | Status | FPS | Memory | CPU |
|---|----------|------|---------|-------|-------------------|-----------------|--------|-----|--------|-----|
| 2.1 | **Critical** | `features/home/widgets/home_product_row.dart` | 114 | `ref.watch(cartControllerProvider.select(items))` on **entire row** | Any cart change rebuilds up to 12 `DealProductCard`s × 4 sections = 48 cards | Per-card `cartProductQuantityProvider(product.id)` | ✅ Fixed | +10–20 scroll | −10 MB | −30% on cart ops |
| 2.2 | **High** | `features/home/home_screen.dart` | 86–171 | 9× nested `RepaintBoundary` + `DeferredHomeSection` | Extra compositing layers; staggered `setState` up to 750 ms causes layout waves during first scroll | Keep RepaintBoundary only on cart/animated sections; shorten defer delays | ✅ Fixed | +2–5 | −8 MB layers | −10% first 2s |
| 2.3 | **Medium** | `features/home/widgets/deferred_home_section.dart` | 27–35 | `Future.delayed` up to 750 ms per section | Sequential section mounts during user scroll | Cap delays at ~500 ms; batch tiers | ✅ Fixed | +2 | — | −5% |
| 2.4 | **Medium** | `features/home/widgets/hero_banner_carousel.dart` | 65 | `setState` on `onPageChanged` rebuilt full carousel + banners | Decodes/repaints banner slides when only dots change | Isolate `_BannerPageDots` with `PageController` listener | ✅ Fixed | +1–3 | — | −5% |
| 2.5 | **Medium** | `features/home/widgets/category_nav_section.dart` | 146–147 | `categories.indexWhere` inside `itemBuilder` | O(n) per grid cell per slide | Precompute `iconByCategoryId` map | ✅ Fixed | +1–2 | — | −CPU layout |
| 2.6 | **Medium** | `features/home/widgets/category_nav_section.dart` | 125–164 | Nested horizontal `ListView` + inner `GridView` | Double scrollable; builds full grid per horizontal page | Acceptable with `PageScrollPhysics` + bounded height; already uses builders | OK | — | — | — |
| 2.7 | **Medium** | `features/home/widgets/top_brands_section.dart` | 44–63 | `AutoHorizontalScroll` + eager `Row` of all brands | All brand tiles built at once; continuous scroll timer | Consider `ListView.builder` if brand count grows | Partial | — | — | Timer optimized |
| 2.8 | **Low** | `features/home/widgets/why_choose_us_section.dart` | 102–111 | `Timer.periodic` + `animateToPage` every 3.2 s | Animation + repaint when visible | Already gated by `isWidgetRoughlyVisible` + lifecycle | OK | — | — | — |
| 2.9 | **Low** | `features/home/widgets/testimonials_section.dart` | 55–57 | 8 s `setState` rotation | Small subtree only | OK | — | — | — |
| 2.10 | **Low** | `features/home/widgets/deals_countdown_timer.dart` | 23–31 | 1 Hz `setState` | Tiny widget with `RepaintBoundary` | OK | — | — | — |

---

## 3. Product Cards & Images

| # | Severity | File | Line(s) | Issue | Why it causes lag | Recommended fix | Status | FPS | Memory | CPU |
|---|----------|------|---------|-------|-------------------|-----------------|--------|-----|--------|-----|
| 3.1 | **Low** | `widgets/product/deal_product_card.dart` | 197–205 | Product images use `cacheWidth: 152` | Good — decodes ~152 px not full 2K | OK | — | — | — |
| 3.2 | **Low** | `widgets/product/mobile_product_card.dart` | 44–51 | Thumbnail `cacheWidth: 168` | Good | OK | — | — | — |
| 3.3 | **Low** | `widgets/product/wishlist_button.dart` | 21–23 | Per-card `wishlistIdsProvider.select` | Isolated rebuild — good pattern | OK | — | — | — |
| 3.4 | **Medium** | `widgets/common/app_network_image.dart` | 50–65 | Central image helper with mem/disk cache caps | Good architecture | OK | — | — | — |
| 3.5 | **Medium** | `features/support/support_screen.dart` | 338–343 | `CachedNetworkImage` without mem cache | Full-res decode for 120 px preview | Add `memCacheWidth`/`memCacheHeight` | ✅ Fixed | +1 | −2–5 MB | −decode |
| 3.6 | **Medium** | `features/checkout/payment_modal.dart` | 746–751, 872–877 | QR/screenshot without mem cache | Same as above | Add mem cache dimensions | ✅ Fixed | +1 | −3 MB | −decode |
| 3.7 | **Low** | `widgets/common/app_logo.dart` | 19–24 | Fallback network logo uncached | Rare path; header visible always | Add mem cache | ✅ Fixed | — | −1 MB | — |
| 3.8 | **Low** | `main.dart` | 15–16 | Image cache 80 / 48 MB | High for 3 GB devices | Tighten to 60 / 32 MB | ✅ Fixed | +1–2 | −15–20 MB | −GC |

---

## 4. Scrolling & Lists

| # | Severity | File | Line(s) | Issue | Why it causes lag | Recommended fix | Status | FPS | Memory | CPU |
|---|----------|------|---------|-------|-------------------|-----------------|--------|-----|--------|-----|
| 4.1 | **Low** | `features/product/product_list_screen.dart` | 400–428 | `SliverGrid` + `SliverChildBuilderDelegate` | Correct lazy pattern | OK | — | — | — |
| 4.2 | **Low** | `features/product/product_list_screen.dart` | 419 | `cartProductQuantityProvider` per grid cell | Correct isolated watch | OK | — | — | — |
| 4.3 | **Medium** | `features/categories/categories_screen.dart` | 337–348 | Grid uses `_CategoryDealCard` with per-product provider | Good | OK | — | — | — |
| 4.4 | **Medium** | `widgets/category/category_grid_tile.dart` | 545–547 | `CategoryGrid` uses `shrinkWrap: true` | OK when height-bounded parent; avoid in unbounded parents | OK in current usage | — | — | — |
| 4.5 | **Low** | `widgets/common/skeleton_loaders.dart` | 57, 174, 253 | `shrinkWrap: true` on skeleton lists | Only shown during loading | OK | — | — | — |
| 4.6 | **High** | `widgets/common/auto_horizontal_scroll.dart` | 87–100 | `Timer.periodic` every **50 ms** + `jumpTo` | ~20 layout/scroll updates/sec per carousel (brands + social) | Increase interval to 80 ms; remove useless `setState` on resume | ✅ Fixed | +3–6 | — | −35% timer CPU |
| 4.7 | **Medium** | `features/product/product_detail_screen.dart` | 184 | `ListView` with all children (not builder) | Long detail page builds all sections at once | Acceptable for single product; consider `ListView.builder` if page grows | Open | — | — | — |

---

## 5. Riverpod & API

| # | Severity | File | Line(s) | Issue | Why it causes lag | Recommended fix | Status | FPS | Memory | CPU |
|---|----------|------|---------|-------|-------------------|-----------------|--------|-----|--------|-----|
| 5.1 | **Medium** | `features/home/home_providers.dart` | 10–76 | 7 independent `FutureProvider`s fire on first home visit | Parallel API burst on cold start | Already deferred via `DeferredHomeSection`; consider `keepAlive` + stale-while-revalidate | Partial | — | — | Network |
| 5.2 | **Low** | `core/refresh/app_refresh.dart` | 5–22 | Pull-to-refresh awaits 7 futures | Intentional full refresh | OK | — | — | — |
| 5.3 | **Medium** | `features/product/product_detail_screen.dart` | 119–127 | `ref.invalidate(recentlyViewedProductsProvider)` on every product view | Home section refetches when returning | Debounce or local cache update | Open | — | — | Network |
| 5.4 | **Low** | `features/cart/cart_controller.dart` | 88–98 | `cartProductQuantityProvider` family | Good pattern — use everywhere | ✅ Extended to home rows | — | — | — |
| 5.5 | **Medium** | `features/product/product_detail_screen.dart` | 150–152 | Watches full `cart items` list | Entire detail rebuilds on unrelated cart changes | Narrow selector to current product+variant | Open | +2–4 | — | −15% cart |

---

## 6. Animations & Compositing

| # | Severity | File | Line(s) | Issue | Why it causes lag | Recommended fix | Status | FPS | Memory | CPU |
|---|----------|------|---------|-------|-------------------|-----------------|--------|-----|--------|-----|
| 6.1 | **High** | `widgets/layout/flipkart_bottom_nav.dart` | 139 | `BackdropFilter` | See 1.2 | ✅ Fixed | — | — | — |
| 6.2 | **Low** | `widgets/cart/fly_product_animator.dart` | 74, 144 | `AnimationController` + `Opacity` during fly animation | Short-lived; disposed properly | OK | — | — | — |
| 6.3 | **Low** | `features/orders/widgets/blinkit_order_card.dart` | 345 | `IntrinsicHeight` | Forces extra layout passes | Use fixed heights where possible | Open | +1 | — | −layout |
| 6.4 | **Low** | `features/home/widgets/why_choose_us_section.dart` | 193–205 | `AnimatedContainer` dots | Small footprint | OK | — | — | — |

---

## 7. Memory & Disposal

| # | Severity | File | Line(s) | Issue | Why it causes lag | Recommended fix | Status |
|---|----------|------|---------|-------|-------------------|-----------------|--------|
| 7.1 | **Low** | `features/home/home_screen.dart` | 47–52 | ScrollController, FocusNode disposed | Good | OK |
| 7.2 | **Low** | `features/home/widgets/hero_banner_carousel.dart` | 23–26 | PageController disposed | Good | OK |
| 7.3 | **Low** | `features/home/widgets/testimonials_section.dart` | 46–48 | Timer cancelled | Good | OK |
| 7.4 | **Low** | `widgets/common/auto_horizontal_scroll.dart` | 72–77 | Timer + ScrollController disposed | Good | OK |
| 7.5 | **Low** | `features/cart/cart_controller.dart` | 107 | `_toastClearTimer` cancelled on dispose | Good | OK |
| 7.6 | **Low** | `widgets/layout/mobile_search_bar.dart` | 33 | Creates FocusNode if not passed — disposed in state | Good | OK |

No critical controller leaks found.

---

## 8. Layout & Build Hygiene

| # | Severity | File | Line(s) | Issue | Why it causes lag | Recommended fix | Status |
|---|----------|------|---------|-------|-------------------|-----------------|--------|
| 8.1 | **Medium** | `widgets/layout/mobile_header.dart` | 336–408 | Menu `ListView` with `...categories.map` eager children | Opening menu builds all category tiles | `ListView.builder` | ✅ Fixed |
| 8.2 | **Low** | `features/home/widgets/top_brands_section.dart` | 47–61 | `for` loop building all brand tiles in `Row` | Eager if many brands | `ListView.separated` if count > 15 | Open |
| 8.3 | **Low** | `config/theme.dart` | 56 | `GoogleFonts.plusJakartaSansTextTheme` | Font work at theme build | Prefetched in `main.dart` | OK |
| 8.4 | **Low** | `features/product/product_list_screen.dart` | 667 | `ProductSortOption.values.map(...).toList()` | Small list | OK |

---

## 9. Rendering Budget Estimates (16 ms frame)

| Screen / action | UI thread | Raster | Image decode | Risk |
|-----------------|-----------|--------|--------------|------|
| Cold start (before fix) | 25–40 ms | 20–30 ms | High (all tabs + home APIs) | **Critical** |
| Cold start (after fix) | 12–18 ms | 10–14 ms | Medium (home only) | Medium |
| Home scroll | 8–14 ms | 10–18 ms | Medium (carousel + rows) | Medium |
| Cart add on home (before) | 18–30 ms | 12–20 ms | Low | **High** |
| Cart add on home (after) | 6–10 ms | 4–8 ms | Low | Low |
| Bottom nav (before blur fix) | 4–6 ms | **14–22 ms** | — | **High** |
| Bottom nav (after) | 4–6 ms | 6–10 ms | — | Low |
| Product grid scroll | 8–12 ms | 10–14 ms | Per visible cell | Medium |
| Auto brand scroll (before) | 6–10 ms | 8–12 ms | — | Medium |
| Auto brand scroll (after) | 4–6 ms | 5–8 ms | — | Low |

---

## 10. Optimizations Applied (Summary)

| Change | File(s) | Performance benefit |
|--------|---------|---------------------|
| `PageView.builder` lazy tabs | `tab_swipe_shell.dart` | Avoids building 5 tabs at startup; largest win for 3–4 GB RAM |
| Per-card cart provider on home rows | `home_product_row.dart` | Cart updates repaint 1 card instead of 48 |
| Lighter bottom nav blur + RepaintBoundary | `flipkart_bottom_nav.dart` | Cuts GPU backdrop sampling cost ~50% |
| Slower auto-scroll tick (80 ms) | `auto_horizontal_scroll.dart` | ~37% fewer scroll timer callbacks |
| Category icon map precompute | `category_nav_section.dart` | Removes O(n²) index scans in grid |
| Isolated banner page dots | `hero_banner_carousel.dart` | Page swipes don't rebuild banner images |
| Trimmed RepaintBoundary + shorter defer | `home_screen.dart` | Fewer layers; faster time-to-interactive |
| Tighter image cache (60 / 32 MB) | `main.dart` | Reduces OOM/GC on 3 GB devices |
| Mem cache on misc `CachedNetworkImage` | `support_screen.dart`, `payment_modal.dart`, `app_logo.dart` | Prevents full-res decode |
| Lazy menu categories list | `mobile_header.dart` | Menu opens faster with many categories |

---

## 11. Recommended Follow-ups (Not Applied — Higher Risk or UX Trade-off)

1. **Product detail cart selector** — narrow `ref.watch` to current variant line only (`product_detail_screen.dart:150`).  
2. **Replace `BackdropFilter` entirely** with opaque frosted color on very low-end devices via `MediaQuery`/`device_info` gate — largest GPU win if visual trade-off accepted.  
3. **Convert `TopBrandsSection` Row to `ListView.builder`** when brand count exceeds ~10.  
4. **Debounce `recentlyViewedProductsProvider` invalidation** after product views.  
5. **Profile `PageView` address carousel** — isolate dot `setState` similar to hero banner.  
6. **Run DevTools Timeline + Memory** on a physical 3 GB device to validate frame budget post-fix.

---

## 12. Validation Checklist

- [ ] Cold start on 3 GB device: home visible &lt; 2 s, no multi-second freeze  
- [ ] Home scroll: no sustained jank &gt; 32 ms/frame  
- [ ] Add to cart from home deal row: single card animates, row doesn't flash  
- [ ] Tab switch: unvisited tabs lazy-build on first visit  
- [ ] Bottom nav: no shimmer/lag while scrolling home behind glass bar  
- [ ] Memory stable &lt; 200 MB on home after 2 min browsing  

---

*Audit performed via static analysis of `lib/` (149 Dart files). Estimates are relative ranges based on typical Flutter profiling on low-tier Android hardware; validate with DevTools on target devices.*
