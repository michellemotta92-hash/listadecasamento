/**
 * Download remaining product images using Pexels free image API.
 * Searches for relevant product images and downloads them.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const IMAGES_DIR = path.resolve(import.meta.dirname, '..', 'public', 'images', 'products');
const REAL_DATA_PATH = path.resolve(import.meta.dirname, '..', 'src', 'lib', 'real-data.ts');

// Products that still need images (id -> search term in English for better results)
const MISSING: Record<string, string> = {
  '11': 'mattress pillow top bed',
  '17': 'blue queen comforter bedding',
  '18': 'tea cups saucers wooden',
  '21': 'acrylic spice rack organizer',
  '22': 'glass airtight food containers',
  '23': 'small glass jars kitchen',
  '28': 'towel set bathroom',
  '32': 'cutting board kitchen wood',
  '34': 'salad spinner kitchen',
  '35': 'white thermal bottle flask',
  '37': 'bamboo laundry basket',
  '40': 'kitchen jars cork lid spoon',
  '43': 'dish drainer rack beige',
  '46': 'iron clothes pressing',
  '49': 'buffet sideboard furniture',
  '51': 'kitchen trash can',
  '57': 'electric pressure cooker',
  '58': 'air fryer kitchen appliance',
  '61': 'cookware set pots pans',
  '62': 'white blender kitchen',
  '65': 'double door refrigerator',
};

function downloadUrl(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const doReq = (u: string, redir = 0) => {
      if (redir > 5) return resolve(false);
      https.get(u, {
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0.0.0' },
        timeout: 15000,
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doReq(res.headers.location, redir + 1);
        }
        if (res.statusCode !== 200) return resolve(false);
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on('finish', () => { ws.close(); resolve(fs.statSync(dest).size > 1000); });
        ws.on('error', () => resolve(false));
      }).on('error', () => resolve(false));
    };
    doReq(url);
  });
}

function searchPexels(query: string): Promise<string | null> {
  return new Promise((resolve) => {
    // Use Pexels free endpoint (no API key needed for small usage)
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`;
    https.get(url, {
      headers: {
        'Authorization': 'bkHQpGOdBpNJfnMbHYH8YAi2GcMCMXMeBIm0DfGqLZHCr2UPuKC6DU2q',
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', (c: Buffer) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.photos && json.photos.length > 0) {
            // Get medium-sized image
            resolve(json.photos[0].src.medium || json.photos[0].src.small);
          } else {
            resolve(null);
          }
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function searchUnsplash(query: string): Promise<string | null> {
  return new Promise((resolve) => {
    const url = `https://source.unsplash.com/800x800/?${encodeURIComponent(query)}`;
    // Unsplash source redirects to actual image
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(res.headers.location);
      } else if (res.statusCode === 200) {
        // Direct image
        resolve(url);
      } else {
        resolve(null);
      }
      res.resume(); // consume
    }).on('error', () => resolve(null));
  });
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
  console.log('=== Download imagens restantes ===\n');
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const results = new Map<string, string>();
  const entries = Object.entries(MISSING);

  for (const [id, query] of entries) {
    const savePath = path.join(IMAGES_DIR, `${id}.jpg`);
    const localUrl = `/images/products/${id}.jpg`;

    if (fs.existsSync(savePath) && fs.statSync(savePath).size > 5000) {
      console.log(`[${id}] ja existe`);
      results.set(id, localUrl);
      continue;
    }

    process.stdout.write(`[${id}] ${query} ... `);

    // Try Unsplash first (simpler, no API key needed)
    let imageUrl = await searchUnsplash(query);

    if (imageUrl) {
      const ok = await downloadUrl(imageUrl, savePath);
      if (ok) {
        const kb = Math.round(fs.statSync(savePath).size / 1024);
        console.log(`OK via Unsplash (${kb}KB)`);
        results.set(id, localUrl);
        continue;
      }
    }

    // Try Pexels
    imageUrl = await searchPexels(query);
    if (imageUrl) {
      const ok = await downloadUrl(imageUrl, savePath);
      if (ok) {
        const kb = Math.round(fs.statSync(savePath).size / 1024);
        console.log(`OK via Pexels (${kb}KB)`);
        results.set(id, localUrl);
        continue;
      }
    }

    // Fallback: use picsum with a descriptive seed
    const seed = encodeURIComponent(query.replace(/\s+/g, '-'));
    const picsumUrl = `https://picsum.photos/seed/${seed}/800/800`;
    const ok = await downloadUrl(picsumUrl, savePath);
    if (ok) {
      const kb = Math.round(fs.statSync(savePath).size / 1024);
      console.log(`OK via Picsum (${kb}KB)`);
      results.set(id, localUrl);
    } else {
      console.log('FALHA total');
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  if (results.size > 0) {
    updateRealData(results);
    await updateDatabase(results);
  }

  console.log(`\nResumo: ${results.size}/${entries.length} baixadas`);
}

main().catch(console.error);
