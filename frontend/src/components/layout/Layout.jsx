import { useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout({ children }) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => setHeaderHeight(header.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 0) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current + 5) {
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current - 5) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 w-full max-w-[100vw] transition-transform duration-300 ease-in-out ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <Navbar />
      </header>
      <div style={{ height: headerHeight }} aria-hidden="true" />
      <main className="flex-1 bg-black">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
