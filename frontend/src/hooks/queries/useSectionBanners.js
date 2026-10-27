import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBanners } from "../../api/api";
import { queryKeys } from "./queryKeys";
import { storeToSection } from "../../utils/storeSection";

/** Banner API sections; `storeToSection` returns category aliases (greengrocc/supermall). */
export function bannerSectionFor(storeOrSlug) {
  const section = storeToSection(storeOrSlug);
  if (section === "ready2cook") return "ready2cook";
  if (section === "supermall") return "instantorder";
  return "preorder";
}

function toSlide(banner) {
  return {
    id: banner._id,
    image: banner.imageUrl,
    alt: banner.alt || banner.title || "",
    link: banner.linkUrl || "/product",
    tag: banner.tag,
    title: banner.title,
    subtitle: banner.subtitle,
    offer: banner.offerText,
    category: banner.category || "",
    videoUrl: banner.videoUrl || "",
    bgColor: banner.bgColor || "",
  };
}

/** Admin-managed banners (admin → Banners) for one section + placement, split by device. */
export function useSectionBanners(storeOrSlug, placement) {
  const section = bannerSectionFor(storeOrSlug);
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.banners.list(section, placement),
    queryFn: async () => {
      const { data: res } = await getBanners({ section, placement });
      return Array.isArray(res?.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const byDevice = (device) => data.filter((b) => b.device === device && b.imageUrl).map(toSlide);
    return { desktop: byDevice("desktop"), mobile: byDevice("mobile"), isLoading };
  }, [data, isLoading]);
}

export default useSectionBanners;
