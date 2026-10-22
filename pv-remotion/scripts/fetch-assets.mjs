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
];

for (const [relative, url] of assets) {
  const target = join(root.pathname, relative);
  await mkdir(dirname(target), {recursive: true});
  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    response = await fetch(url, {headers: {'User-Agent': 'four-games-pv-render'}});
    if (response.ok) break;
    if (attempt === 3) throw new Error(`Failed ${response.status}: ${url}`);
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(target, data);
  console.log(`${relative} ${data.length} bytes`);
}
