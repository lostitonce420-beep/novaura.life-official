const { search } = require('duck-duck-scrape');

async function webSearch(query, options = {}) {
  try {
    const results = await search(query, {
      safeSearch: options.safeSearch ?? 0,
      iterations: options.iterations ?? 1,
    });
    
    return results.map(r => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));
  } catch (err) {
    console.error('Search failed:', err.message);
    return [];
  }
}

module.exports = { webSearch };
