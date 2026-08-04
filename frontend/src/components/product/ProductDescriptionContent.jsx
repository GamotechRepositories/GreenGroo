import { parseProductDescription } from "@shared/product/parseProductDescription.js";

export default function ProductDescriptionContent({ description, features = [], fallback = "" }) {
  const parsed = parseProductDescription(description);
  const extraFeatures = (features || []).map((feature) => String(feature || "").trim()).filter(Boolean);
  const descriptionBullets = parsed?.bullets || [];
  const bullets = [...descriptionBullets, ...extraFeatures];
  const paragraphs = parsed?.paragraphs?.length ? parsed.paragraphs : fallback ? [fallback] : [];

  if (!paragraphs.length && !bullets.length) {
    return <p className="text-text-secondary">{fallback || "No description available."}</p>;
  }

  const showKeyFeaturesHeading =
    parsed?.hasKeyFeaturesHeading || (descriptionBullets.length > 0 && bullets.length > 0);

  return (
    <div className="space-y-4 text-text-primary">
      {paragraphs.map((paragraph, index) => (
        <p key={`desc-${index}`} className="whitespace-pre-line leading-relaxed text-text-primary">
          {paragraph}
        </p>
      ))}

      {bullets.length > 0 ? (
        <div>
          {showKeyFeaturesHeading ? (
            <p className="mb-2 font-semibold text-text-primary">Key Features</p>
          ) : null}
          <ul className="list-disc space-y-2 pl-5">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
