/**
 * Download product images from the web using Google Image search.
 * Uses puppeteer to search Google Images and download the first result.
 *
 * Usage: npx tsx scripts/download-images.ts [--start-from=N]
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
const MIN_SIZE = 5000;

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const doReq = (u: string, redir = 0) => {
      if (redir > 5) return resolve(false);
      const mod = u.startsWith('https') ? https : http;
      mod.get(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0',
          'Accept': 'image/*,*/*',
        },
        timeout: 15000,
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doReq(res.headers.location, redir + 1);
        }
        if (res.statusCode !== 200) return resolve(false);
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on('finish', () => {
          ws.close();
          const sz = fs.statSync(dest).size;
          if (sz < MIN_SIZE) { try { fs.unlinkSync(dest); } catch {} resolve(false); return; }
          resolve(true);
        });
        ws.on('error', () => resolve(false));
      }).on('error', () => resolve(false))
        .on('timeout', function(this: http.ClientRequest) { this.destroy(); resolve(false); });
    };
    doReq(url);
  });
}

interface GiftEntry { id: string; name: string; description: string; color: string; }

function extractGifts(): GiftEntry[] {
  const content = fs.readFileSync(REAL_DATA_PATH, 'utf-8');
  const gifts: GiftEntry[] = [];
  const re = /id:\s*'(\d+)'[\s\S]*?name:\s*'([^']*)'[\s\S]*?description:\s*'([^']*)'[\s\S]*?[\s\S]*?color:\s*(?:'([^']*)'|null)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    gifts.push({ id: m[1], name: m[2], description: m[3] || '', color: m[4] || '' });
  }
  return gifts;
}

async function searchAndDownload(page: any, gift: GiftEntry, savePath: string): Promise<boolean> {
  // Build search query - use product name + key details for better results
  const query = `${gift.name} ${gift.color} produto comprar`.trim();
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&tbs=isz:m`;

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2000);

    // Extract image URLs from Google Images results
    const imageUrl = await page.evaluate(() => {
      // Google Images embeds actual image URLs in various ways
      // Method 1: data-src attributes on img tags
      const imgs = Array.from(document.querySelectorAll('img[data-src]'));
      for (const img of imgs) {
        const src = img.getAttribute('data-src') || '';
        if (src.startsWith('http') && !src.includes('google') && !src.includes('gstatic')) {
          return src;
        }
      }

      // Method 2: regular img tags with http src (not base64/google)
      const allImgs = Array.from(document.querySelectorAll('img'));
      for (const img of allImgs) {
        const src = img.getAttribute('src') || '';
        if (src.startsWith('http') && !src.includes('google') && !src.includes('gstatic')
            && !src.includes('data:') && img.naturalWidth > 50) {
          return src;
        }
      }

      // Method 3: Look in links/anchor tags for image URLs
      const links = Array.from(document.querySelectorAll('a[href*="imgurl="]'));
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const m = href.match(/imgurl=([^&]+)/);
        if (m) return decodeURIComponent(m[1]);
      }

      return null;
    });

    if (!imageUrl) {
      // Try clicking first image result and getting the full-size URL
      const clicked = await page.evaluate(() => {
        const firstResult = document.querySelector('[data-ri="0"]') || document.querySelector('.rg_i');
        if (firstResult) {
          (firstResult as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (clicked) {
        await sleep(2000);
        const fullUrl = await page.evaluate(() => {
          // After clicking, the full-size image appears in a side panel
          const fullImg = document.querySelector('img[jsname="kn3ccd"]') ||
                          document.querySelector('img.sFlh5c') ||
                          document.querySelector('img.iPVvYb');
          if (fullImg) {
            const src = fullImg.getAttribute('src') || '';
            if (src.startsWith('http') && !src.includes('google') && !src.includes('gstatic')) {
              return src;
            }
          }
          return null;
        });

        if (fullUrl) {
          return await downloadFile(fullUrl, savePath);
        }
      }

      return false;
    }

    return await downloadFile(imageUrl, savePath);
  } catch {
    return false;
  }
}

function updateRealData(successMap: Map<string, string>) {
  let content = fs.readFileSync(REAL_DATA_PATH, 'utf-8');
  for (const [giftId, localPath] of successMap) {
    const re = new RegExp(`(id:\\s*'${giftId}'[\\s\\S]*?image_url:\\s*')([^']*)(')`, '');
    content = content.replace(re, `$1${localPath}$3`);
  }
  fs.writeFileSync(REAL_DATA_PATH, content, 'utf-8');
  console.log(`Atualizado ${successMap.size} URLs em real-data.ts`);
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
    console.log(`DB: ${e.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const startArg = args.find(a => a.startsWith('--start-from='));
  const startFrom = startArg ? parseInt(startArg.split('=')[1]) : 0;

  console.log('=== Download de imagens via Google Images ===\n');
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const gifts = extractGifts();
  console.log(`${gifts.length} produtos\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const results = new Map<string, string>();
  const failures: string[] = [];

  for (let i = startFrom; i < gifts.length; i++) {
    const gift = gifts[i];
    const savePath = path.join(IMAGES_DIR, `${gift.id}.jpg`);
    const localUrl = `/images/products/${gift.id}.jpg`;

    process.stdout.write(`[${i + 1}/${gifts.length}] ${gift.name} ... `);

    // Skip if valid image exists (>50KB)
    if (fs.existsSync(savePath) && fs.statSync(savePath).size > 50000) {
      // Check it's not the same repeated image
      console.log('ja existe');
      results.set(gift.id, localUrl);
      continue;
    }

    if (fs.existsSync(savePath)) fs.unlinkSync(savePath);

    const ok = await searchAndDownload(page, gift, savePath);
    if (ok) {
      const kb = Math.round(fs.statSync(savePath).size / 1024);
      console.log(`OK (${kb}KB)`);
      results.set(gift.id, localUrl);
    } else {
      console.log('FALHA');
      failures.push(`${gift.id}: ${gift.name}`);
    }

    await sleep(1500 + Math.random() * 1500);
  }

  await browser.close();

  if (results.size > 0) {
    updateRealData(results);
    await updateDatabase(results);
  }

  console.log(`\nResumo: ${results.size}/${gifts.length} OK, ${failures.length} falhas`);
  if (failures.length > 0) {
    console.log('Falharam:');
    failures.forEach(f => console.log(`  - ${f}`));
  }
}

main().catch(console.error);
