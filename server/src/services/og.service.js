const ogs = require('open-graph-scraper');

/**
 * Extracts the first URL from a given text.
 * @param {string} text 
 * @returns {string|null} The extracted URL or null if none found.
 */
function extractUrl(text) {
  if (!text) return null;
  // A basic URL regex that matches http/https and excludes quotes
  const urlRegex = /(https?:\/\/[^\s<"']+)/g;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

/**
 * Fetches Open Graph metadata for a given URL.
 * @param {string} url 
 * @returns {Promise<Object|null>}
 */
async function fetchOGData(url) {
  try {
    const options = { url, timeout: 5000 };
    const { result } = await ogs(options);
    
    if (result && result.success) {
      return {
        url: result.requestUrl || url,
        title: result.ogTitle || result.twitterTitle || result.dcTitle,
        description: result.ogDescription || result.twitterDescription || result.dcDescription,
        image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url,
        favicon: result.favicon,
        siteName: result.ogSiteName,
      };
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch OG data for URL ${url}:`, error.message);
    return null;
  }
}

module.exports = {
  extractUrl,
  fetchOGData,
};
