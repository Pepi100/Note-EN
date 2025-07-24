// Utility to get the correct base path for different environments
export function getBasePath(): string {
  return process.env.NODE_ENV === "production" ? "/Note-EN" : ""
}

// Get the full URL for assets
export function getAssetPath(path: string): string {
  const basePath = getBasePath()
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${basePath}${normalizedPath}`
}
