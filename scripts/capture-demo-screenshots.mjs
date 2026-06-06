import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureDemoScreenshots } from './demo-screenshot-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const port = Number(process.env.FOLDERTABS_SCREENSHOT_PORT ?? 5174);
const chromePort = Number(process.env.FOLDERTABS_CHROME_PORT ?? 9340);

await captureDemoScreenshots({
  chromePort,
  commandName: 'pnpm screenshots',
  outputDir: path.join(rootDir, 'docs', 'screenshots'),
  port,
  profilePrefix: 'foldertabs-screenshots',
  rootDir,
});
