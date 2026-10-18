import { createPwaController } from './game/pwa';
const desktop = location.protocol === 'file:' || location.hostname === 'tauri.localhost' || '__TAURI_INTERNALS__' in window;
export const pwa = createPwaController(import.meta.env.BASE_URL, import.meta.env.PROD, desktop);
