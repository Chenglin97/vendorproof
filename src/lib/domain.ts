// Shared domain helpers. Single source of truth so vendor-source recognition,
// Exa scoping, and impostor filtering all agree (previously duplicated in three
// files with subtly different rules).

/** Normalize a domain or URL to a bare, lowercased registrable host. */
export function rootDomain(input: string): string {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/[:?#].*$/, "")
    .trim();
}

/** Extract a bare host from a full URL (lowercased, www-stripped). */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return rootDomain(url);
  }
}

/** True when `host` is the vendor's own domain or a subdomain of it. */
export function isVendorDomain(host: string, root: string): boolean {
  if (!host || !root) return false;
  const h = host.toLowerCase();
  return h === root || h.endsWith("." + root);
}
