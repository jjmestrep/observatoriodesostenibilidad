/**
 * Scraper configuration for Persefoni (persefoni.com)
 */

module.exports = {
    name: 'Persefoni',
    url: 'https://persefoni.com',

    async extract(page) {
        return await page.evaluate(() => {
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : '';
            };

            const getTexts = (selector) => {
                return Array.from(document.querySelectorAll(selector))
                    .map(el => el.textContent.trim())
                    .filter(t => t.length > 0 && t.length < 200);
            };

            const tagline = getText('h1') || getText('[class*="hero"] h1');

            const headlines = [
                ...getTexts('h1'),
                ...getTexts('h2').slice(0, 5)
            ].filter((v, i, a) => a.indexOf(v) === i);

            const features = [
                ...getTexts('[class*="feature"] h3'),
                ...getTexts('[class*="solution"] h3')
            ].slice(0, 8);

            const pageText = document.body.innerText.toLowerCase();
            const keywords = [];
            const commonKeywords = ['climate management', 'carbon accounting', 'PCAF', 'financial services', 'disclosure'];
            commonKeywords.forEach(kw => {
                if (pageText.includes(kw.toLowerCase())) {
                    keywords.push(kw);
                }
            });

            return {
                tagline: tagline.substring(0, 150),
                valueProposition: headlines.slice(1, 4),
                keyFeatures: features.slice(0, 6),
                pricing: {
                    model: 'custom',
                    plans: ['Enterprise', 'Financial Services'],
                    publicPrices: false
                },
                messaging: {
                    headlines: headlines.slice(0, 5),
                    keywords: keywords.slice(0, 10)
                },
                reviews: {},
                strategy: {
                    targetMarket: 'Financial services and large enterprises',
                    differentiators: []
                }
            };
        });
    }
};
