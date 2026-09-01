const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('D:/workspace/demo/writing_assistant/diagnostics/drive/node_modules/playwright');

// Raw captures stay private until a deliberately selected frame is copied into
// public/projects/moling. The showcase intentionally keeps the prose readable.
const outputDir = path.resolve(__dirname, '../.tmp/moling-real-flow-raw');

async function settle(page, text) {
  if (text) await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(1_200);
}

async function shot(page, filename) {
  const target = path.join(outputDir, filename);
  await page.screenshot({ path: target, animations: 'disabled' });
  console.log(`saved ${target}`);
}

async function clickTitle(page, title) {
  const activeNav = page.locator('nav > div[aria-hidden="false"]').first();
  let button = activeNav.locator(`button[title="${title}"]`).first();
  if (!(await button.count())) {
    button = activeNav.locator('button', { hasText: title }).first();
  }
  await button.waitFor({ state: 'visible', timeout: 10_000 });
  await button.click({ force: true, timeout: 8_000 });
  await page.waitForTimeout(900);
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts().flatMap((context) => context.pages()).find((candidate) => !candidate.url().includes('fab-window'));
  if (!page) throw new Error('Moling main WebView page not found');

  await page.setViewportSize({ width: 1600, height: 1000 }).catch(() => {});
  await page.addStyleTag({ content: `
    nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }
    html { background: #f4f1e8 !important; }
  ` });

  const projectName = '旧货·人间烟火重构版';
  const activeNav = page.locator('nav > div[aria-hidden="false"]').first();
  const expand = activeNav.locator('button[title="展开导航"]').first();
  if (await expand.count()) {
    await expand.click();
    await page.waitForTimeout(350);
  }

  await clickTitle(page, '章节');
  if (!(await page.getByText(projectName, { exact: true }).count())) {
    throw new Error(`Project not active: ${projectName}`);
  }

  // Close the current document tab so the first frame is a genuine project
  // overview instead of a duplicate of the finalized chapter editor.
  const titlebarClose = page.locator('button', { hasText: '✕' }).filter({ visible: true });
  const closeButtons = await titlebarClose.all();
  for (const button of closeButtons) {
    const box = await button.boundingBox();
    if (box && box.y < 36) {
      await button.click({ force: true });
      await page.waitForTimeout(500);
      break;
    }
  }
  await settle(page, '已完结 11 / 11 章');
  await shot(page, '01-project-overview.png');

  const chapter11 = page.locator('button', { hasText: '第011章' }).filter({ hasText: '一小包旱烟' }).first();
  await chapter11.click();
  await settle(page, '一小包旱烟');
  await shot(page, '02-chapter-11-editor.png');

  console.log('open chapter outline');
  await page.locator('button[role="tab"]', { hasText: '细纲' }).first().click({ force: true, timeout: 8_000 });
  await page.getByText('✅ 新鲜', { exact: false }).first().waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(900);
  await shot(page, '03-chapter-11-outline.png');

  console.log('open outline workbench');
  await clickTitle(page, '大纲');
  await shot(page, '04-outline-workbench.png');

  console.log('open task center');
  await clickTitle(page, '任务中心');
  await shot(page, '05-task-center.png');

  console.log('open canon center');
  await clickTitle(page, '故事世界');
  await page.waitForTimeout(500);
  await clickTitle(page, '设定中枢');
  await shot(page, '06-canon-center.png');

  console.log('open character deck');
  await clickTitle(page, '角色卡');
  await shot(page, '07-character-deck.png');

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
