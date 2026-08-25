import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductMediaFields from "../components/products/ProductMediaFields";
import LoadingState from "../components/ui/LoadingState";
import { getMyProduct, updateMyProduct } from "../api/farmerApi";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL } from "../utils/excelStyles";

function emptyMedia(product) {
  return {
    mainPhoto: product?.media?.mainPhoto || product?.image || "",
    farmPhotos: product?.media?.farmPhotos?.length ? product.media.farmPhotos : [""],
    cropPhotos: product?.media?.cropPhotos?.length ? product.media.cropPhotos : [""],
    harvestPhotos: product?.media?.harvestPhotos?.length ? product.media.harvestPhotos : [""],
    videos: product?.media?.videos?.length ? product.media.videos : [""],
  };
}

function ProductMediaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [media, setMedia] = useState(emptyMedia());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyProduct(id);
        setProduct(data);
        setMedia(emptyMedia(data));
      } catch (err) {
        toast.error(err.message || "Product not found");
        navigate("/farmer/products");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <LoadingState rows={8} />;
  if (!product) return null;

  const locked = product.status === "Pending Approval";

  const onSave = async () => {
    if (locked) return;
    setSaving(true);
    try {
      await updateMyProduct(id, {
        productName: product.productName || product.name,
        cropId: product.cropId,
        cropName: product.cropName,
        variety: product.variety,
        unit: product.unit,
        grades: product.grades,
        availableQuantity: product.availableQuantity,
        pricePerKg: product.pricePerKg,
        minimumOrderQuantity: product.minimumOrderQuantity,
        harvestDate: product.harvestDate,
        farmingType: product.farmingType,
        availableFrom: product.availableFrom,
        availableUntil: product.availableUntil,
        lowStockLimit: product.lowStockLimit,
        media: {
          mainPhoto: media.mainPhoto || "",
          farmPhotos: (media.farmPhotos || []).filter(Boolean),
          cropPhotos: (media.cropPhotos || []).filter(Boolean),
          harvestPhotos: (media.harvestPhotos || []).filter(Boolean),
          videos: (media.videos || []).filter(Boolean),
        },
      });
      toast.success("Photos saved");
      navigate(`/farmer/products/${id}`);
    } catch (err) {
      toast.error(err.message || "Failed to save photos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Product Photos & Media</h1>
        <p className={EXCEL_PAGE_SUB}>
          {product.productName || product.name}{" "}
          <Link to={`/farmer/products/${id}`} className="font-semibold text-[#217346] hover:underline">
            Back to details
          </Link>
        </p>
      </div>
      <div className={`${EXCEL_PANEL} p-3`}>
        <ProductMediaFields media={media} onChange={setMedia} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={saving || locked} className={EXCEL_BTN_PRIMARY} onClick={onSave}>
            {saving ? "Saving…" : "Save"}
          </button>
          <Link to={`/farmer/products/${id}`} className={EXCEL_BTN}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductMediaPage;
