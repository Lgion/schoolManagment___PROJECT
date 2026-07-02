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

  // Activer sandbox
  const cta = await page.locator('button:has-text("Tester"), button:has-text("Démo"), button:has-text("Essayer"), a:has-text("Tester")').first();
  if (await cta.isVisible()) {
    await cta.click();
    await page.waitForTimeout(2000);
  } else {
    await context.addCookies([{ name: 'mock_role', value: 'admin', url: 'http://localhost:3000' }]);
    await page.reload({ waitUntil: 'networkidle' });
  }

  try {
    const adminRoleBtn = await page.locator('button:has-text("Admin")').first();
    if (await adminRoleBtn.isVisible()) {
      await adminRoleBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch(e) {}

  // Helpers
  async function captureDetailAndEdit(listUrl, linkSelector, detailName, editName) {
    console.log(`Navigation vers ${listUrl}...`);
    await page.goto(`http://localhost:3000${listUrl}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Si c'est un <Link href="..."> ça génère un <a>, on essaie de cliquer
    const link = await page.locator(linkSelector).first();
    if (await link.isVisible()) {
      // scroll to it if needed
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await page.waitForTimeout(2000);
      console.log(`Capture de ${detailName}...`);
      await page.screenshot({ path: path.join(DEST_DIR, detailName), fullPage: true });

      // On cherche un bouton Éditer (parfois c'est du texte, parfois une icône)
      const editBtn = await page.locator('button:has-text("Éditer"), button:has-text("Editer"), .person-detail__editbtn').first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForTimeout(1500);
        console.log(`Capture de ${editName}...`);
        await page.screenshot({ path: path.join(DEST_DIR, editName), fullPage: true });
        
        // fermer la modale (on tente 'Fermer', ou '.modal-close', ou Esc)
        const closeBtn = await page.locator('button:has-text("Fermer"), button:has-text("Fermer Édition"), .modal-close').first();
        if (await closeBtn.isVisible()) {
            await closeBtn.click();
        } else {
            await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(500);
      } else {
          console.log(`Bouton éditer introuvable pour ${detailName}`);
      }
    } else {
      console.log(`Lien introuvable pour ${listUrl}`);
    }
  }

  // 11_classe, 14_classe_edit
  await captureDetailAndEdit('/classes', 'a[href^="/classes/"]', '11_classe.png', '14_classe_edit.png');
  
  // 12_eleve, 15_eleve_edit
  await captureDetailAndEdit('/eleves', 'a[href^="/eleves/"]', '12_eleve.png', '15_eleve_edit.png');
  
  // 13_enseignant, 16_enseignant_edit
  await captureDetailAndEdit('/enseignants', 'a[href^="/enseignants/"]', '13_enseignant.png', '16_enseignant_edit.png');

  // 17_administration
  console.log('Navigation vers /administration...');
  await page.goto('http://localhost:3000/administration', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('Capture de 17_administration.png...');
  await page.screenshot({ path: path.join(DEST_DIR, '17_administration.png'), fullPage: true });

  // 18_post (blog detail)
  console.log('Navigation vers /blog...');
  await page.goto('http://localhost:3000/blog', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // Un article de blog peut pointer vers /blog/[id]
  const blogLink = await page.locator('a[href^="/blog/"]').first();
  if (await blogLink.isVisible()) {
    await blogLink.scrollIntoViewIfNeeded();
    await blogLink.click();
    await page.waitForTimeout(1500);
    console.log('Capture de 18_post.png...');
    await page.screenshot({ path: path.join(DEST_DIR, '18_post.png'), fullPage: true });
  } else {
      console.log("Aucun lien vers un article de blog trouvé.");
  }

  console.log('Terminé !');
  await browser.close();
})();
