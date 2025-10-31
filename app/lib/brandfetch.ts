/**
 * Extract domain from website URL
 * https://www.sequoiacap.com -> sequoiacap.com
 */
function extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      // Remove 'www.' prefix if present
      return domain.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
  
  /**
   * Generate Brandfetch CDN logo URL for a given website
   * This URL can be used directly in img tags and will be stored in the database
   */
  export function generateLogoUrl(websiteUrl: string): string {
    const clientId = process.env.BRANDFETCH_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('BRANDFETCH_CLIENT_ID not set');
    }
  
    const domain = extractDomain(websiteUrl);
    
    // Use the CDN endpoint (not API endpoint)
    return `https://cdn.brandfetch.io/${domain}?c=${clientId}&type=icon`;
    }