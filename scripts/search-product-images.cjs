/**
 * Product Image Search & Download Script
 *
 * Searches for product images using Bing Image Search and downloads them.
 * Uses the product name + store context for accurate results.
 *
 * Usage: node scripts/search-product-images.js [--start=N] [--only=N,N,N] [--force]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'products');
const REAL_DATA_PATH = path.join(PROJECT_ROOT, 'src', 'lib', 'real-data.ts');

// Minimum valid image size (skip tiny placeholders)
const MIN_VALID_SIZE = 10000; // 10KB

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Extract products from real-data.ts
function extractProducts() {
  const content = fs.readFileSync(REAL_DATA_PATH, 'utf-8');
  const products = [];
  const re = /id:\s*'(\d+)'[\s\S]*?name:\s*'([^']*)'[\s\S]*?description:\s*'([^']*)'[\s\S]*?store_link:\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    products.push({ id: m[1], name: m[2], description: m[3], storeLink: m[4] });
  }
  return products;
}

// Build a search query for the product
function buildSearchQuery(product) {
  // Use name + description for better results, add "produto" for Brazilian context
  const cleanName = product.name.replace(/[^\w\sáàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇ]/g, ' ').trim();
  return `${cleanName} produto`;
}

// Fetch URL content as buffer
function fetchBuffer(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const doFetch = (u, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : http;
      const req = mod.get(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
        timeout,
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doFetch(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    };
    doFetch(url);
  });
}

// Fetch URL content as text
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const doFetch = (u, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : http;
      const req = mod.get(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
        timeout: 15000,
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let loc = res.headers.location;
          if (loc.startsWith('/')) {
            const parsed = new URL(u);
            loc = `${parsed.protocol}//${parsed.host}${loc}`;
          }
          return doFetch(loc, redirects + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    };
    doFetch(url);
  });
}

// Search Bing Images and return image URLs
async function searchBingImages(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://www.bing.com/images/search?q=${encoded}&first=1&count=10&qft=+filterui:photo-photo`;

  try {
    const html = await fetchText(url);
    // Extract image URLs from Bing results - look for murl parameter
    const urls = [];
    const re = /murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const imgUrl = m[1].replace(/&amp;/g, '&');
      // Filter out tiny icons and non-image URLs
      if (imgUrl.match(/\.(jpg|jpeg|png|webp)/i) && !imgUrl.includes('favicon')) {
        urls.push(imgUrl);
      }
    }
    return urls.slice(0, 5); // Return top 5
  } catch (e) {
    console.log(`  Bing search failed: ${e.message}`);
    return [];
  }
}

// Search Google Images and return image URLs (backup)
async function searchGoogleImages(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://www.google.com/search?q=${encoded}&tbm=isch&hl=pt-BR`;

  try {
    const html = await fetchText(url);
    const urls = [];
    // Look for image URLs in Google's response
    const re = /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)",\d+,\d+\]/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      urls.push(m[1]);
    }
    return urls.slice(0, 5);
  } catch (e) {
    console.log(`  Google search failed: ${e.message}`);
    return [];
  }
}

// Try to download an image, return true if successful
async function downloadImage(imageUrl, savePath) {
  try {
    const buffer = await fetchBuffer(imageUrl);
    if (buffer.length < MIN_VALID_SIZE) return false;
    fs.writeFileSync(savePath, buffer);
    return true;
  } catch (e) {
    return false;
  }
}

// Try Shopee API first for Shopee products
async function tryShopeeApi(storeLink) {
  const m = storeLink.match(/-i\.(\d+)\.(\d+)/);
  if (!m) return null;
  const [, shopId, itemId] = m;

  try {
    const apiUrl = `https://shopee.com.br/api/v4/item/get?shopid=${shopId}&itemid=${itemId}`;
    const text = await fetchText(apiUrl);
    const data = JSON.parse(text);
    if (data?.data?.images?.[0]) {
      return `https://down-br.img.susercontent.com/file/${data.data.images[0]}`;
    }
    if (data?.data?.image) {
      return `https://down-br.img.susercontent.com/file/${data.data.image}`;
    }
  } catch (e) {
    // API might be blocked, continue with search
  }
  return null;
}

// Try Mercado Livre page scraping
async function tryMercadoLivre(storeLink) {
  try {
    const html = await fetchText(storeLink);
    // Look for main product image
    const m = html.match(/<img[^>]*class="[^"]*ui-pdp-image[^"]*"[^>]*src="(https:\/\/[^"]+)"/);
    if (m) return m[1];
    // Alternative: og:image meta tag
    const og = html.match(/<meta[^>]*property="og:image"[^>]*content="(https:\/\/[^"]+)"/);
    if (og) return og[1];
  } catch (e) {
    // Continue with search
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const startArg = args.find(a => a.startsWith('--start='));
  const startFrom = startArg ? parseInt(startArg.split('=')[1]) - 1 : 0;
  const onlyArg = args.find(a => a.startsWith('--only='));
  const onlyIds = onlyArg ? onlyArg.split('=')[1].split(',') : null;
  const force = args.includes('--force');

  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  Product Image Search - Lista de Presente ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const products = extractProducts();
  console.log(`Total: ${products.length} produtos\n`);

  const DUPLICATE_SIZE = 266218; // Known bad image size
  let success = 0, skipped = 0, failed = 0;
  const failures = [];

  for (let i = startFrom; i < products.length; i++) {
    const p = products[i];
    if (onlyIds && !onlyIds.includes(p.id)) continue;

    const savePath = path.join(IMAGES_DIR, `${p.id}.jpg`);
    process.stdout.write(`[${p.id}/${products.length}] ${p.name} ... `);

    // Check if already has a valid (non-duplicate) image
    if (!force && fs.existsSync(savePath)) {
      const size = fs.statSync(savePath).size;
      if (size > MIN_VALID_SIZE && size !== DUPLICATE_SIZE) {
        console.log(`OK (já existe ${Math.round(size/1024)}KB)`);
        skipped++;
        continue;
      }
    }

    let downloaded = false;

    // Strategy 1: Try Shopee API for Shopee products
    if (p.storeLink.includes('shopee.com.br')) {
      const shopeeUrl = await tryShopeeApi(p.storeLink);
      if (shopeeUrl) {
        downloaded = await downloadImage(shopeeUrl, savePath);
        if (downloaded) process.stdout.write('(Shopee API) ');
      }
    }

    // Strategy 2: Try Mercado Livre scraping
    if (!downloaded && p.storeLink.includes('mercadolivre.com.br')) {
      const mlUrl = await tryMercadoLivre(p.storeLink);
      if (mlUrl) {
        downloaded = await downloadImage(mlUrl, savePath);
        if (downloaded) process.stdout.write('(ML scrape) ');
      }
    }

    // Strategy 3: Bing Image Search
    if (!downloaded) {
      const query = buildSearchQuery(p);
      const bingUrls = await searchBingImages(query);
      for (const imgUrl of bingUrls) {
        downloaded = await downloadImage(imgUrl, savePath);
        if (downloaded) {
          process.stdout.write('(Bing) ');
          break;
        }
      }
    }

    // Strategy 4: Google Image Search (backup)
    if (!downloaded) {
      const query = buildSearchQuery(p);
      const googleUrls = await searchGoogleImages(query);
      for (const imgUrl of googleUrls) {
        downloaded = await downloadImage(imgUrl, savePath);
        if (downloaded) {
          process.stdout.write('(Google) ');
          break;
        }
      }
    }

    if (downloaded) {
      const size = fs.statSync(savePath).size;
      console.log(`✓ ${Math.round(size/1024)}KB`);
      success++;
    } else {
      console.log('✗ sem imagem');
      failures.push(`${p.id}: ${p.name}`);
      failed++;
    }

    // Rate limiting
    await sleep(1500 + Math.random() * 1000);
  }

  console.log(`\n══════════════════════════════════════`);
  console.log(`Sucesso: ${success} | Já existiam: ${skipped} | Falhas: ${failed}`);
  if (failures.length > 0) {
    console.log(`\nFalharam:`);
    failures.forEach(f => console.log(`  - ${f}`));
  }
}

main().catch(console.error);
