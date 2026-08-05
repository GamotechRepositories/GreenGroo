export function getUserContactEmail(user) {
  return user?.email?.trim()?.toLowerCase() || "";
}
