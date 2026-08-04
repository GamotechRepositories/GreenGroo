function Product3DImage({ src, alt = "", size = 56, className = "" }) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size + 5 }}
    >
      <div
        className="absolute bottom-0 left-[14%] right-[14%] h-1 rounded-full bg-black/[0.07]"
        aria-hidden="true"
      />
      <div
        className="relative overflow-hidden rounded-lg bg-gradient-to-br from-white to-[#F2F2F2]"
        style={{ width: size, height: size }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-contain p-1"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default Product3DImage;
