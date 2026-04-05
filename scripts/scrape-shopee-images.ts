/**
 * Shopee Image Scraper - ParaSempre
 *
 * Extracts PRODUCT images (not seller avatars) from Shopee's __STORE__.
 * Uses puppeteer-extra with stealth to bypass bot detection.
 *
 * Usage: npx tsx scripts/scrape-shopee-images.ts [--start-from=N] [--force]
 *   --force: re-download even if file exists (useful to fix wrong images)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'products');
const REAL_DATA_PATH = path.join(PROJECT_ROOT, 'src', 'lib', 'real-data.ts');
const SHOPEE_CDN = 'https://down-br.img.susercontent.com/file/';

// Seller avatar images are typically small (~44KB PNG 244x244). Skip these.
const MIN_VALID_SIZE = 50000; // 50KB minimum for a real product image

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function parseShopeeIds(url: string) {
  const m = url.match(/-i\.(\d+)\.(\d+)/);
  return m ? { shopId: m[1], itemId: m[2] } : null;
}

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const doReq = (u: string, redir = 0) => {
      if (redir > 5) return resolve(false);
      const mod = u.startsWith('https') ? https : http;
      mod.get(u, {
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0.0.0', 'Referer': 'https://shopee.com.br/' },
        timeout: 20000,
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doReq(res.headers.location, redir + 1);
        }
        if (res.statusCode !== 200) return resolve(false);
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on('finish', () => { ws.close(); resolve(fs.statSync(dest).size > 500); });
        ws.on('error', () => resolve(false));
      }).on('error', () => resolve(false))
        .on('timeout', function(this: http.ClientRequest) { this.destroy(); resolve(false); });
    };
    doReq(url);
  });
}

interface GiftEntry { id: string; name: string; storeLink: string; }

function extractGifts(): GiftEntry[] {
  const content = fs.readFileSync(REAL_DATA_PATH, 'utf-8');
  const gifts: GiftEntry[] = [];
  const re = /id:\s*'(\d+)'[\s\S]*?name:\s*'([^']*)'[\s\S]*?store_link:\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    if (m[3].includes('shopee.com.br')) gifts.push({ id: m[1], name: m[2], storeLink: m[3] });
  }
  return gifts;
}

async function scrapeAll(gifts: GiftEntry[], startFrom: number, force: boolean) {
  console.log('Abrindo navegador (stealth)...\n');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
  });

  const results = new Map<string, string>();
  const failures: string[] = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const t = req.resourceType();
      if (['stylesheet', 'font', 'media', 'websocket'].includes(t)) req.abort();
      else req.continue();
    });

    for (let i = startFrom; i < gifts.length; i++) {
      const gift = gifts[i];
      const savePath = path.join(IMAGES_DIR, `${gift.id}.jpg`);
      const localUrl = `/images/products/${gift.id}.jpg`;

      process.stdout.write(`[${i + 1}/${gifts.length}] ${gift.name} ... `);

      // Skip if already valid (not forced and file is big enough = real product image)
      if (!force && fs.existsSync(savePath) && fs.statSync(savePath).size > MIN_VALID_SIZE) {
        console.log('ja existe (valida)');
        results.set(gift.id, localUrl);
        continue;
      }

      // Delete old invalid image if exists
      if (fs.existsSync(savePath)) fs.unlinkSync(savePath);

      let imageHash: string | null = null;

      try {
        await page.goto(gift.storeLink, { waitUntil: 'networkidle2', timeout: 25000 });
        await sleep(4000);

        // === PRIORITY 1: Get product "images" array (NOT singular "image" which is seller avatar) ===
        imageHash = await page.evaluate(() => {
          try {
            const store = (window as any).__STORE__;
            if (!store) return null;
            const str = JSON.stringify(store);

            // PRODUCT images array - this is what we want
            // Pattern: "images":["hash1","hash2",...]
            const imagesMatch = str.match(/"images"\s*:\s*\["([a-zA-Z0-9_-]{20,})"/);
            if (imagesMatch) return imagesMatch[1];

            // Alternative pattern: itemid followed by image data
            // Look for the pattern near "item_basic" or "product"
            const itemBasic = str.match(/"item_basic"\s*:\s*\{[^}]*"image"\s*:\s*"([a-zA-Z0-9_-]{30,})"/);
            if (itemBasic) return itemBasic[1];

            return null;
          } catch { return null; }
        });

        if (imageHash) {
          process.stdout.write('(STORE images) ');
        }

        // === PRIORITY 2: Search HTML for product images array ===
        if (!imageHash) {
          const html = await page.content();

          // Look for "images":["hash"] pattern (product images, not avatar)
          const m = html.match(/"images"\s*:\s*\[\s*"([a-zA-Z0-9_-]{30,})"/);
          if (m) {
            imageHash = m[1];
            process.stdout.write('(HTML images[]) ');
          }

          // Look for Shopee CDN URLs with long hashes (product images tend to have longer hashes)
          if (!imageHash) {
            const cdnMatches = html.match(/susercontent\.com\/file\/(br-[a-zA-Z0-9_-]{30,}|[a-f0-9]{32})/g);
            if (cdnMatches) {
              // Get unique hashes, prefer longer ones (product images)
              const hashes = [...new Set(cdnMatches.map(m => m.replace('susercontent.com/file/', '')))];
              // Filter out short hashes (likely avatars) - product hashes are usually 32+ chars
              const productHashes = hashes.filter(h => h.length >= 32);
              if (productHashes.length > 0) {
                imageHash = productHashes[0];
                process.stdout.write('(HTML CDN) ');
              }
            }
          }
        }

        // === PRIORITY 3: Find large susercontent images in DOM ===
        if (!imageHash) {
          const imgSrc = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            // Sort by size, pick largest susercontent image
            const shopeeImgs = imgs
              .filter(img => (img.src || '').includes('susercontent.com/file/') && img.naturalWidth > 100)
              .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));

            if (shopeeImgs.length > 0) {
              const m = shopeeImgs[0].src.match(/\/file\/([a-zA-Z0-9_-]+)/);
              return m ? m[1] : null;
            }
            return null;
          });
          if (imgSrc) {
            imageHash = imgSrc;
            process.stdout.write('(DOM large) ');
          }
        }

      } catch (err: any) {
        console.log(`ERRO: ${err.message?.substring(0, 60)}`);
        failures.push(`${gift.id}: ${gift.name}`);
        await sleep(2000);
        continue;
      }

      if (imageHash) {
        const imageUrl = `${SHOPEE_CDN}${imageHash}`;
        const ok = await downloadFile(imageUrl, savePath);
        if (ok) {
          const size = fs.statSync(savePath).size;
          const kb = Math.round(size / 1024);
          if (size < MIN_VALID_SIZE) {
            console.log(`baixo (${kb}KB - possível avatar, mantendo)`);
          } else {
            console.log(`OK (${kb}KB)`);
          }
          results.set(gift.id, localUrl);
        } else {
          console.log('download falhou');
          failures.push(`${gift.id}: ${gift.name}`);
        }
      } else {
        console.log('sem imagem');
        failures.push(`${gift.id}: ${gift.name}`);
      }

      await sleep(2000 + Math.random() * 2000);
    }
  } finally {
    await browser.close();
  }
  return { results, failures };
}

function updateRealData(successMap: Map<string, string>) {
  let content = fs.readFileSync(REAL_DATA_PATH, 'utf-8');
  for (const [giftId, localPath] of successMap) {
    const re = new RegExp(`(id:\\s*'${giftId}'[\\s\\S]*?image_url:\\s*')([^']*)(')`, '');
    content = content.replace(re, `$1${localPath}$3`);
  }
  fs.writeFileSync(REAL_DATA_PATH, content, 'utf-8');
  console.log(`\nAtualizado ${successMap.size} URLs em real-data.ts`);
}

async function updateDatabase(successMap: Map<string, string>) {
  try {
    const pg = await import('pg');
    const pool = new pg.default.Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:zlWdDNNYCQzDvqbNlfzhLwkSJZjtRYdG@junction.proxy.rlwy.net:55979/railway',
      ssl: false,
    });
    const { rows } = await pool.query('SELECT id FROM gift_items ORDER BY created_at ASC');
    for (const [giftId, localPath] of successMap) {
      const idx = parseInt(giftId) - 1;
      if (idx >= 0 && idx < rows.length) {
        await pool.query('UPDATE gift_items SET image_url = $1, updated_at = NOW() WHERE id = $2', [localPath, rows[idx].id]);
      }
    }
    await pool.end();
    console.log(`Atualizado ${successMap.size} URLs no PostgreSQL`);
  } catch (e: any) {
    console.log(`DB aviso: ${e.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const startArg = args.find(a => a.startsWith('--start-from='));
  const startFrom = startArg ? parseInt(startArg.split('=')[1]) : 0;
  const force = args.includes('--force');

  console.log('╔══════════════════════════════════════╗');
  console.log('║   Shopee Image Scraper - ParaSempre  ║');
  console.log('╚══════════════════════════════════════╝\n');
  if (force) console.log('Modo FORCE: re-baixando todas as imagens\n');

  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const gifts = extractGifts();
  console.log(`${gifts.length} presentes com link Shopee\n`);

  const { results, failures } = await scrapeAll(gifts, startFrom, force);

  if (results.size > 0) {
    updateRealData(results);
    await updateDatabase(results);
  }

  console.log(`\n══ RESUMO: ${results.size}/${gifts.length} sucesso, ${failures.length} falhas ══`);
  if (failures.length > 0) {
    console.log('Falharam:');
    failures.forEach(f => console.log(`  - ${f}`));
  }
}

main().catch(console.error);
