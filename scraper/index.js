/**
 * ESG Observatory - Web Scraper
 *
 * Scrapes competitor websites to extract messaging, features, and pricing information.
 * Uses Puppeteer for JavaScript-rendered pages.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import site configurations
const dcycle = require('./sites/dcycle');
const sweep = require('./sites/sweep');
const greenly = require('./sites/greenly');
const osapiens = require('./sites/osapiens');
const watershed = require('./sites/watershed');
const aplanet = require('./sites/aplanet');
const plana = require('./sites/plana');
const persefoni = require('./sites/persefoni');
const workiva = require('./sites/workiva');
const manglai = require('./sites/manglai');

const sites = [
    dcycle,
    sweep,
    greenly,
    osapiens,
    watershed,
    aplanet,
    plana,
    persefoni,
    workiva,
    manglai
];

const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'competitors.json');

// Rate limiting - wait between requests
const DELAY_BETWEEN_SITES = 3000; // 3 seconds

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeSite(browser, siteConfig) {
    const page = await browser.newPage();

    // Set user agent to avoid being blocked
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        console.log(`Scraping ${siteConfig.name}...`);

        // Navigate to main page
        await page.goto(siteConfig.url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for content to load
        await delay(2000);

        // Extract data using site-specific selectors
        const data = await siteConfig.extract(page);

        // Add metadata
        return {
            name: siteConfig.name,
            url: siteConfig.url,
            lastScraped: new Date().toISOString(),
            ...data
        };

    } catch (error) {
        console.error(`Error scraping ${siteConfig.name}:`, error.message);

        // Return existing data with error flag
        return {
            name: siteConfig.name,
            url: siteConfig.url,
            lastScraped: new Date().toISOString(),
            error: error.message,
            tagline: '',
            valueProposition: [],
            keyFeatures: [],
            pricing: { model: 'unknown', plans: [], publicPrices: false },
            messaging: { headlines: [], keywords: [] },
            reviews: {},
            strategy: { targetMarket: '', differentiators: [] }
        };

    } finally {
        await page.close();
    }
}

async function loadExistingData() {
    try {
        const data = fs.readFileSync(OUTPUT_PATH, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function mergeData(newData, existingData) {
    // Create map of existing data
    const existingMap = new Map(existingData.map(d => [d.name, d]));

    // Merge new data, preserving existing if scrape failed
    return newData.map(item => {
        if (item.error && existingMap.has(item.name)) {
            const existing = existingMap.get(item.name);
            return {
                ...existing,
                lastScraped: item.lastScraped,
                scrapeError: item.error
            };
        }
        return item;
    });
}

async function main() {
    // Check for single site argument
    const singleSite = process.argv.find(arg => arg.startsWith('--site='));
    const targetSites = singleSite
        ? sites.filter(s => s.name.toLowerCase() === singleSite.split('=')[1].toLowerCase())
        : sites;

    if (targetSites.length === 0) {
        console.error('No matching sites found');
        process.exit(1);
    }

    console.log(`Starting scrape for ${targetSites.length} site(s)...`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    const results = [];

    for (const site of targetSites) {
        const data = await scrapeSite(browser, site);
        results.push(data);

        // Rate limiting
        if (site !== targetSites[targetSites.length - 1]) {
            console.log(`Waiting ${DELAY_BETWEEN_SITES / 1000}s before next site...`);
            await delay(DELAY_BETWEEN_SITES);
        }
    }

    await browser.close();

    // Load existing data and merge
    const existingData = await loadExistingData();
    const mergedData = await mergeData(results, existingData);

    // If we only scraped some sites, merge with existing data
    if (singleSite) {
        const finalData = existingData.map(existing => {
            const updated = mergedData.find(m => m.name === existing.name);
            return updated || existing;
        });
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalData, null, 2));
    } else {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mergedData, null, 2));
    }

    console.log(`Scraping complete. Data saved to ${OUTPUT_PATH}`);

    // Report results
    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;
    console.log(`Results: ${successful} successful, ${failed} failed`);
}

main().catch(console.error);
