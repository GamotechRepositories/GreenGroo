export function NavIconWrap({ children, badge }) {
  const count = Number(badge) || 0;

  return (
    <span className="relative inline-flex shrink-0 overflow-visible">
      {children}
      {count > 0 ? (
        <span className="pointer-events-none absolute -right-2 -top-2 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-primary px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </span>
  );
}
