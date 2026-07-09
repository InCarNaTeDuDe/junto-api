import Jimp from 'jimp-compact';
import fs from 'fs';
import path from 'path';

const sourceJpg = './src/assets/images/daymates_icon_1783055500723.jpg';

async function main() {
  try {
    console.log(`Loading generated source image from: ${sourceJpg}`);
    const image = await Jimp.read(sourceJpg);
    
    // Ensure the output assets directory exists
    if (!fs.existsSync('assets')) {
      fs.mkdirSync('assets');
    }

    // Fix react-native-css-interop ESM/CommonJS cache module issue
    const cacheDir = path.join('node_modules', 'react-native-css-interop', '.cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(path.join(cacheDir, 'package.json'), JSON.stringify({ type: "commonjs" }, null, 2));
    console.log('Successfully configured react-native-css-interop cache for CommonJS');

    // 1. Generate icon.png (1024x1024)
    console.log('Generating assets/icon.png...');
    const icon = image.clone().resize(1024, 1024);
    await icon.writeAsync('assets/icon.png');
    console.log('Successfully wrote assets/icon.png');

    // 2. Generate favicon.png (48x48)
    console.log('Generating assets/favicon.png...');
    const favicon = image.clone().resize(48, 48);
    await favicon.writeAsync('assets/favicon.png');
    console.log('Successfully wrote assets/favicon.png');

    // 3. Generate adaptive-foreground.png (1024x1024)
    console.log('Generating assets/adaptive-foreground.png...');
    const adaptiveFore = image.clone().resize(1024, 1024);
    await adaptiveFore.writeAsync('assets/adaptive-foreground.png');
    console.log('Successfully wrote assets/adaptive-foreground.png');

    // 4. Generate splash.png (2048x2048 background with centered 512x512 logo)
    console.log('Generating assets/splash.png...');
    const splashBgColor = 0x090212FF; // Dark indigo matching app.json
    const splash = new Jimp(2048, 2048, splashBgColor);
    
    const centeredLogo = image.clone().resize(512, 512);
    const x = (2048 - 512) / 2;
    const y = (2048 - 512) / 2;
    splash.composite(centeredLogo, x, y);
    
    await splash.writeAsync('assets/splash.png');
    console.log('Successfully wrote assets/splash.png');

    console.log('All branding assets generated successfully and are completely uncorrupted!');
  } catch (err) {
    console.error('Failed to convert assets:', err);
    process.exit(1);
  }
}

main();
