export const resolveImageUrl = (imageKey) => {
  if (!imageKey || typeof imageKey !== "string") return null;

  let cleanKey = imageKey;
  if (cleanKey.startsWith("http://") || cleanKey.startsWith("https://")) {
    const s3Regex = /^https?:\/\/[^\/]+\.s3\.[^\/]+\.amazonaws\.com\/(.+)$/;
    const match = cleanKey.match(s3Regex);
    if (match) {
      cleanKey = match[1];
    } else if (cleanKey.includes(process.env.CLOUDFRONT_DOMAIN || "d1347kdapa3s7q.cloudfront.net")) {
        return cleanKey;
    } else {
      return cleanKey;
    }
  }

  const domain = process.env.CLOUDFRONT_DOMAIN || "d1347kdapa3s7q.cloudfront.net";
  const cleanDomain = domain.replace(/\/+$/, "").replace(/^https?:\/\//, "");
  cleanKey = cleanKey.replace(/^\/+/, "");

  return `https://${cleanDomain}/${cleanKey}`;
};

export const resolveImageArray = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map(resolveImageUrl).filter(Boolean);
};

export const transformProductResponse = (product) => {
  if (!product) return product;
  const isMongoose = typeof product.toObject === 'function';
  const data = isMongoose ? product.toObject() : { ...product };

  if (data.productImages) {
    data.productImages = resolveImageArray(data.productImages);
  }
  if (data.farmerImage) {
    data.farmerImage = resolveImageUrl(data.farmerImage);
  }
  if (data.farmImage) {
    data.farmImage = resolveImageUrl(data.farmImage);
  }
  if (data.farmerDetails) {
    if (data.farmerDetails.farmerImage) {
      data.farmerDetails.farmerImage = resolveImageUrl(data.farmerDetails.farmerImage);
    }
    if (data.farmerDetails.farmImage) {
      data.farmerDetails.farmImage = resolveImageUrl(data.farmerDetails.farmImage);
    }
  }
  return data;
};

export const transformCategoryResponse = (category) => {
  if (!category) return category;
  const isMongoose = typeof category.toObject === 'function';
  const data = isMongoose ? category.toObject() : { ...category };
  if (data.image) {
    data.image = resolveImageUrl(data.image);
  }
  if (data.imageUrl) {
    data.imageUrl = resolveImageUrl(data.imageUrl);
  }
  if (data.categoryImage) {
    data.categoryImage = resolveImageUrl(data.categoryImage);
  }
  if (data.coverImage) {
    data.coverImage = resolveImageUrl(data.coverImage);
  }
  return data;
};

export const transformBannerResponse = (banner) => {
  if (!banner) return banner;
  const isMongoose = typeof banner.toObject === 'function';
  const data = isMongoose ? banner.toObject() : { ...banner };
  if (data.image) {
    data.image = resolveImageUrl(data.image);
  }
  return data;
};

export const transformBrandResponse = (brand) => {
  if (!brand) return brand;
  const isMongoose = typeof brand.toObject === 'function';
  const data = isMongoose ? brand.toObject() : { ...brand };
  if (data.logo) {
    data.logo = resolveImageUrl(data.logo);
  }
  if (data.brandImage) {
    data.brandImage = resolveImageUrl(data.brandImage);
  }
  return data;
};
