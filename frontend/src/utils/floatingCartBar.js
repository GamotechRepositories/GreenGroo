/** Pages that render the floating cart bar (see MobileLayout). */
export function showsFloatingCartBar(pathname) {
  return ["/", "/login", "/signup", "/categories"].includes(pathname);
}
