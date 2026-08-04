import { Link } from "react-router-dom";
import { useBrandsQuery } from "../../hooks/queries/useBrandsQuery";
import SectionHeader from "./SectionHeader";
import HorizontalScrollRow from "../home/HorizontalScrollRow";

function BrandCard({ brand }) {
  return (
    <Link
      to={`/product?brandName=${encodeURIComponent(brand.brandName)}`}
      className="flex h-[100px] w-[120px] shrink-0 snap-start items-center justify-center rounded-xl border border-border-light bg-white px-4 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:h-[112px] sm:w-[132px] md:h-[124px] md:w-[144px]"
    >
      <img
        src={brand.brandImage}
        alt={brand.brandName}
        className="max-h-14 max-w-full object-contain sm:max-h-16 md:max-h-[72px]"
        loading="lazy"
      />
    </Link>
  );
}

function TopBrands() {
  const { data: brands = [], isLoading: loading } = useBrandsQuery();

  if (loading || brands.length === 0) {
    return null;
  }

  return (
    <section className="bg-white px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
      <SectionHeader title="Top Brands" viewAllTo="/product" />
      <HorizontalScrollRow autoScroll gapClassName="gap-3 sm:gap-4">
        {brands.map((brand) => (
          <BrandCard key={brand._id} brand={brand} />
        ))}
      </HorizontalScrollRow>
    </section>
  );
}

export default TopBrands;
