import {setTimeout as delay} from 'node:timers/promises';

// The deadline covers response headers AND the complete body, including stalls.
export async function fetchAssetBytes(url, {timeoutMs = 25000, attempts = 3, retryDelayMs = 800} = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: {'User-Agent': 'four-games-pv-v2-render'},
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < attempts) await delay(retryDelayMs * attempt);
  }
  throw new Error(`Failed to download ${url}: ${lastError}`, {cause: lastError});
}
