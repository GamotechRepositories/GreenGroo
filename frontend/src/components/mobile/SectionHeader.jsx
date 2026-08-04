import { Link } from "react-router-dom";

function SectionHeader({ title, viewAllTo = "/product", className = "mb-3 sm:mb-4" }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h2 className="text-base font-bold text-text-primary sm:text-lg md:text-xl">
        {title}
      </h2>
      <Link
        to={viewAllTo}
        className="text-sm font-semibold text-primary transition hover:underline sm:text-base"
      >
        View All
      </Link>
    </div>
  );
}

export default SectionHeader;
