import { useAuth } from "../context/AuthContext";
import { useBrandsQuery } from "./queries/useBrandsQuery";
import { brandRequiresLoginForPrice } from "../utils/brandPriceVisibility";

export function useCanViewProductPrice(productOrBrandName) {
  const { user } = useAuth();
  const { data: brands = [] } = useBrandsQuery();

  if (user) return true;

  const brandName =
    typeof productOrBrandName === "string"
      ? productOrBrandName
      : productOrBrandName?.brandName;

  return !brandRequiresLoginForPrice(brands, brandName);
}
