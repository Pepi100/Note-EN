// Utility to get the correct base path for different environments
export function getBasePath(): string {
  if (process.env.NODE_ENV === "production") {
    // Detect if we’re on GitHub Pages
    if (typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
      return "/Note-EN";
    }
    // On Vercel or any other root-hosted site
    return "";
  }
  // Development (localhost)
  return "";
}


// Get the full URL for assets
export function getAssetPath(path: string): string {
  const basePath = getBasePath()
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${basePath}${normalizedPath}`
}
