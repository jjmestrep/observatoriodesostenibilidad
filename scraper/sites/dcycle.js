/**
 * Scraper configuration for Dcycle (dcycle.io)
 */

module.exports = {
    name: 'Dcycle',
    url: 'https://dcycle.io',

    async extract(page) {
        return await page.evaluate(() => {
            // Helper function to extract text from selectors
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : '';
            };

            const getTexts = (selector) => {
                return Array.from(document.querySelectorAll(selector))
                    .map(el => el.textContent.trim())
                    .filter(t => t.length > 0 && t.length < 200);
            };

            // Extract tagline from hero section
            const tagline = getText('h1') ||
                getText('[class*="hero"] h1') ||
                getText('[class*="headline"]');

            // Extract headlines and value props
            const headlines = [
                ...getTexts('h1'),
                ...getTexts('h2').slice(0, 5)
            ].filter((v, i, a) => a.indexOf(v) === i);

            // Extract features from various sections
            const features = [
                ...getTexts('[class*="feature"] h3'),
                ...getTexts('[class*="benefit"] h3'),
                ...getTexts('[class*="card"] h3')
            ].slice(0, 8);

            // Extract keywords from meta tags and content
            const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || '';
            const keywords = metaKeywords.split(',').map(k => k.trim()).filter(k => k);

            // Add common keywords based on content
            const pageText = document.body.innerText.toLowerCase();
            const commonKeywords = ['sustainability', 'carbon', 'ESG', 'compliance', 'reporting', 'footprint', 'emissions'];
            commonKeywords.forEach(kw => {
                if (pageText.includes(kw.toLowerCase()) && !keywords.includes(kw)) {
                    keywords.push(kw);
                }
            });

            return {
                tagline: tagline.substring(0, 150),
                valueProposition: headlines.slice(1, 4),
                keyFeatures: features.slice(0, 6),
                pricing: {
                    model: 'tiered',
                    plans: [],
                    publicPrices: false
                },
                messaging: {
                    headlines: headlines.slice(0, 5),
                    keywords: keywords.slice(0, 10)
                },
                reviews: {},
                strategy: {
                    targetMarket: 'Mid-market European companies',
                    differentiators: []
                }
            };
        });
    }
};
