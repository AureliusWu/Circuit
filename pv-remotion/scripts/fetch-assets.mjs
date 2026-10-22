import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';

const root = new URL('../public/', import.meta.url);

const assets = [
  ['rain/shared-umbrella.png', 'https://raw.githubusercontent.com/AureliusWu/Rain/main/game/cg/shared-umbrella.png'],
  ['rain/old-photo.png', 'https://raw.githubusercontent.com/AureliusWu/Rain/main/game/cg/old-photo.png'],
  ['rain/unsent-letter.png', 'https://raw.githubusercontent.com/AureliusWu/Rain/main/game/cg/unsent_letter.png'],
  ['rain/quiet-farewell.png', 'https://raw.githubusercontent.com/AureliusWu/Rain/main/game/cg/quiet-farewell.png'],
  ['rain/reunion.png', 'https://raw.githubusercontent.com/AureliusWu/Rain/main/game/cg/reunion.png'],
  ['healing/bus-stop.webp', 'https://raw.githubusercontent.com/AureliusWu/Healing/main/public/art/bus-stop.webp'],
  ['healing/campus.webp', 'https://raw.githubusercontent.com/AureliusWu/Healing/main/public/art/campus.webp'],
  ['healing/confirmed-proof.webp', 'https://raw.githubusercontent.com/AureliusWu/Healing/main/public/art/cg-confirmed-proof.webp'],
  ['healing/window-open.webp', 'https://raw.githubusercontent.com/AureliusWu/Healing/main/public/art/cg-window-open.webp'],
  ['healing/unsigned-letter.webp', 'https://raw.githubusercontent.com/AureliusWu/Healing/main/public/art/cg-unsigned-letter.webp'],
  ['netlove/balcony.webp', 'https://raw.githubusercontent.com/AureliusWu/NetLove/main/public/art/balcony.webp'],
  ['netlove/four-bowls.webp', 'https://raw.githubusercontent.com/AureliusWu/NetLove/main/public/art/cg-four-bowls.webp'],
  ['netlove/meeting.webp', 'https://raw.githubusercontent.com/AureliusWu/NetLove/main/public/art/cg-tinghe-meeting.webp'],
  ['netlove/envelope.webp', 'https://raw.githubusercontent.com/AureliusWu/NetLove/main/public/art/cg-xumi-envelope.webp'],
  ['netlove/riverbank.webp', 'https://raw.githubusercontent.com/AureliusWu/NetLove/main/public/art/riverbank.webp'],
  ['circuit/do-not-close.webp', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/art/cg-do-not-close.webp'],
  ['circuit/five-tickets.webp', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/art/cg-five-tickets.webp'],
  ['circuit/missing-stairs.webp', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/art/cg-missing-stairs.webp'],
  ['circuit/wet-boots.webp', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/art/cg-wet-boots.webp'],
  ['circuit/control-room.webp', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/art/control-room.webp'],
  ['audio/ticket-window.ogg', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/audio/bgm/ticket-window.ogg'],
  ['audio/phone-alert.mp3', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/audio/sfx/phone-alert.mp3'],
  ['audio/paper-turn.mp3', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/audio/sfx/paper-turn.mp3'],
  ['audio/intercom-click.mp3', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/audio/sfx/intercom-click.mp3'],
  ['audio/return-bell.mp3', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/audio/sfx/return-bell.mp3'],
  ['voice/rain-reunion.ogg', 'https://raw.githubusercontent.com/AureliusWu/Rain/main/game/audio/voice/heroine_s02_reunion_l008_v1.ogg'],
  ['voice/rain-letter.ogg', 'https://raw.githubusercontent.com/AureliusWu/Rain/main/game/audio/voice/heroine_s03_letter_l011_v1.ogg'],
  ['voice/healing-arrival.ogg', 'https://raw.githubusercontent.com/AureliusWu/Healing/main/public/audio/voice/full-20261021/healing-arrival--004.ogg'],
  ['voice/healing-ask.ogg', 'https://raw.githubusercontent.com/AureliusWu/Healing/main/public/audio/voice/full-20261021/healing-c2-ask--003.ogg'],
  ['voice/netlove-call.ogg', 'https://raw.githubusercontent.com/AureliusWu/NetLove/main/public/voice/c2-call-004.ogg'],
  ['voice/netlove-tinghe.ogg', 'https://raw.githubusercontent.com/AureliusWu/NetLove/main/public/voice/c5-tinghe-016.ogg'],
  ['voice/circuit-ji.mp3', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/audio/voice/c00-ji.mp3'],
  ['voice/circuit-ticket.mp3', 'https://raw.githubusercontent.com/AureliusWu/Circuit/main/public/audio/voice/h13-ticket.mp3'],
];

const download = async ([relative, url]) => {
  const target = join(root.pathname, relative);
  await mkdir(dirname(target), {recursive: true});
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const response = await fetch(url, {headers: {'User-Agent': 'four-games-pv-v2-render'}, signal: controller.signal});
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = Buffer.from(await response.arrayBuffer());
      await writeFile(target, data);
      console.log(`${relative} ${data.length} bytes`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`attempt ${attempt} failed for ${relative}: ${error}`);
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }
  throw new Error(`Failed to download ${relative}: ${lastError}`);
};

let cursor = 0;
const workers = Array.from({length: 6}, async () => {
  while (true) {
    const index = cursor++;
    if (index >= assets.length) return;
    await download(assets[index]);
  }
});

await Promise.all(workers);
