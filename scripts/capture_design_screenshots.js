const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '..', 'TODOs', 'screenshots4design');

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

(async () => {
  console.log('Lancement du navigateur Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log('Navigation vers http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Capture Landing Page
  console.log('Capture de la Landing Page...');
  await page.screenshot({ path: path.join(DEST_DIR, '01_landing_page.png'), fullPage: true });

  // Recherche du CTA pour entrer dans la Sandbox (ex: "Essayer", "Démo", "Tester")
  console.log('Recherche du CTA pour activer la sandbox...');
  try {
    // Essayer de cliquer sur un bouton de la sandbox ou le sélecteur de rôle
    // Le LandingPage.jsx ou SandboxRoleSelector peut avoir un texte spécifique
    const cta = await page.locator('button:has-text("Tester"), button:has-text("Démo"), button:has-text("Essayer"), a:has-text("Tester")').first();
    if (await cta.isVisible()) {
      await cta.click();
      await page.waitForTimeout(2000);
      console.log('CTA cliqué.');
    } else {
      console.log('Aucun CTA explicite trouvé, on passe par les cookies ou on cherche le sélecteur de rôle.');
      // Injection manuelle d'un mock_role 'admin' en cookie si l'interface ne répond pas
      await context.addCookies([{ name: 'mock_role', value: 'admin', url: 'http://localhost:3000' }]);
      await page.reload({ waitUntil: 'networkidle' });
    }
  } catch (err) {
    console.log('Erreur lors du clic sur le CTA:', err.message);
  }

  // Activer le rôle admin si le sélecteur flottant est là
  try {
    const adminRoleBtn = await page.locator('button:has-text("Admin")').first();
    if (await adminRoleBtn.isVisible()) {
      await adminRoleBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch(e) {}

  // Attendre le chargement du dashboard
  await page.waitForTimeout(2000);

  const routes = [
    { name: '02_dashboard', url: '/' },
    { name: '03_classes', url: '/classes' },
    { name: '04_eleves', url: '/eleves' },
    { name: '05_enseignants', url: '/enseignants' },
    { name: '06_calendar', url: '/calendar' },
    { name: '07_blog', url: '/blog' },
    { name: '08_groups', url: '/groups' },
    { name: '09_scheduling', url: '/scheduling' },
    { name: '10_games', url: '/games' }
  ];

  for (const route of routes) {
    console.log(`Navigation vers ${route.url}...`);
    await page.goto(`http://localhost:3000${route.url}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // laisser le temps aux animations/data fetch
    console.log(`Capture de ${route.name}.png...`);
    await page.screenshot({ path: path.join(DEST_DIR, `${route.name}.png`), fullPage: true });
  }

  console.log('Terminé !');
  await browser.close();
})();
