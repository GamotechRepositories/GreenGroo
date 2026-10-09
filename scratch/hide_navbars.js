const fs = require('fs');

function updateMobileLayout() {
  const file = 'frontend/src/layouts/MobileLayout.jsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    'const isShop = pathname === "/product";',
    'const isShop = pathname === "/product";\n  const hideNavs = pathname === "/cart" || pathname === "/checkout";'
  );

  content = content.replace('<TopNav />', '{!hideNavs && <TopNav />}');
  content = content.replace('isProductDetail ? null :', 'isProductDetail || hideNavs ? null :');
  content = content.replace('<BottomNav />', '{!hideNavs && <BottomNav />}');

  fs.writeFileSync(file, content);
  console.log('MobileLayout updated');
}

function updateDesktopLayout() {
  const file = 'frontend/src/components/layout/Layout.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Add useLocation import if not present
  if (!content.includes('useLocation')) {
    content = content.replace(
      'import { useEffect, useRef, useState } from "react";',
      'import { useEffect, useRef, useState } from "react";\nimport { useLocation } from "react-router-dom";'
    );
  }

  // Add hideNavs logic
  content = content.replace(
    'const lastScrollY = useRef(0);',
    'const lastScrollY = useRef(0);\n  const { pathname } = useLocation();\n  const hideNavs = pathname === "/cart" || pathname === "/checkout";'
  );

  // Hide header and placeholder block
  const headerBlock = `<header
        ref={headerRef}
        className={\`fixed top-0 left-0 right-0 z-50 w-full max-w-[100vw] transition-transform duration-300 ease-in-out \${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }\`}
      >
        <Navbar />
      </header>`;
      
  const hiddenHeaderBlock = `{!hideNavs && (
      <header
        ref={headerRef}
        className={\`fixed top-0 left-0 right-0 z-50 w-full max-w-[100vw] transition-transform duration-300 ease-in-out \${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }\`}
      >
        <Navbar />
      </header>
      )}`;

  content = content.replace(headerBlock, hiddenHeaderBlock);
  content = content.replace(
    '<div style={{ height: headerHeight }} aria-hidden="true" />',
    '{!hideNavs && <div style={{ height: headerHeight }} aria-hidden="true" />}'
  );

  // The user only asked to "not show the navbar and bottom navbar". 
  // Desktop doesn't have a bottom navbar, but does have a Footer. I will leave Footer as is, or hide it too if it functions as bottom nav.
  // Actually, usually on checkout, we also hide the Footer to remove distractions. Let's hide the Footer as well.
  content = content.replace(
    '<Footer />',
    '{!hideNavs && <Footer />}'
  );

  fs.writeFileSync(file, content);
  console.log('Desktop Layout updated');
}

updateMobileLayout();
updateDesktopLayout();
