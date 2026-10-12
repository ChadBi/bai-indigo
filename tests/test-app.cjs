const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const output = path.resolve(__dirname, "test-results");
fs.mkdirSync(output, { recursive: true });
const target = process.env.APP_URL || "http://127.0.0.1:5173";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage(),
      errors = [],
      workers = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("worker", (worker) => workers.push(worker.url()));
    await page.goto(target, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () => Number(document.querySelector("canvas")?.dataset.renderId) > 0,
    );
    const canvas = page.getByLabel("当前方案的数字扎染效果");
    const preview = () => canvas.evaluate((element) => element.toDataURL());
    const waitPreview = () =>
      page.waitForFunction(
        () =>
          document.querySelector(".canvas-stage")?.getAttribute("aria-busy") ===
          "false",
      );
    const deepPreview = await preview();
    assert(
      workers.some((url) => url.includes("dye.worker")),
      "A real dye worker should run",
    );
    await page.screenshot({
      path: path.join(output, "app-desktop.png"),
      fullPage: true,
    });

    await page.getByRole("button", { name: "浅染", exact: true }).click();
    await page.getByRole("button", { name: "深染", exact: true }).click();
    await page.getByRole("button", { name: "浅染", exact: true }).click();
    await waitPreview();
    assert.notEqual(await preview(), deepPreview);
    assert.equal(
      await page
        .getByRole("button", { name: "浅染", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.getByRole("button", { name: "四折", exact: true }).click();
    await page.locator("#radius").fill("20");
    await page
      .getByRole("button", { name: "立即保存草稿", exact: true })
      .click();
    await page.getByText("草稿已保存", { exact: true }).waitFor();

    // Worker startup failure must end loading and permit a real retry.
    await page.evaluate(() => {
      const NativeWorker = window.Worker;
      window.testFailWorker = true;
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          if (window.testFailWorker) throw new Error("测试线程启动失败");
          super(...args);
        }
      };
    });
    await page.getByRole("button", { name: "中染", exact: true }).click();
    await page.getByRole("button", { name: "重新生成", exact: true }).waitFor();
    assert.equal(
      await page.locator(".canvas-stage").getAttribute("aria-busy"),
      "false",
    );
    await page.evaluate(() => {
      window.testFailWorker = false;
    });
    await page.getByRole("button", { name: "重新生成", exact: true }).click();
    await waitPreview();
    await page
      .getByRole("button", { name: "立即保存草稿", exact: true })
      .click();
    await page.getByText("草稿已保存", { exact: true }).waitFor();
    const savedPreview = await preview();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("已恢复本地草稿", { exact: true }).waitFor();
    await waitPreview();
    assert.equal(await page.locator("#radius").inputValue(), "20");
    assert.equal(
      await page
        .getByRole("button", { name: "四折", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert(
      (await preview()) === savedPreview,
      "Restored params should reproduce the same preview",
    );

    // Fault injection is limited to this browser test; no debug hook is shipped.
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put;
      window.testFailWrites = true;
      IDBObjectStore.prototype.put = function (...args) {
        if (window.testFailWrites)
          throw new DOMException("test quota failure", "QuotaExceededError");
        return put.apply(this, args);
      };
    });
    await page.getByRole("button", { name: "中染", exact: true }).click();
    await page.getByText(/草稿保存失败/).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "中染", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.evaluate(() => {
      window.testFailWrites = false;
    });
    await page.getByRole("button", { name: "重试保存", exact: true }).click();
    await page.getByText("草稿已保存", { exact: true }).waitFor();

    async function mutateDraft(operation) {
      return page.evaluate(
        (operation) =>
          new Promise((resolve, reject) => {
            const request = indexedDB.open("bai-indigo", 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result,
                tx = db.transaction("drafts", "readwrite"),
                store = tx.objectStore("drafts"),
                read = store.get("current");
              read.onsuccess = () => {
                const draft = read.result;
                if (operation === "corrupt") {
                  draft.params.schemaVersion = 999;
                  store.put(draft, "current");
                }
                tx.oncomplete = () => {
                  db.close();
                  resolve(draft.params.schemaVersion);
                };
              };
              tx.onabort = () => {
                db.close();
                reject(tx.error);
              };
            };
          }),
        operation,
      );
    }
    await mutateDraft("corrupt");
    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "重置本地草稿", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "浅染", exact: true }).click();
    await waitPreview();
    assert.equal(
      await mutateDraft("read"),
      999,
      "Invalid persisted draft must not be overwritten",
    );
    await page
      .getByRole("button", { name: "重置本地草稿", exact: true })
      .click();
    await page.getByText("草稿已保存", { exact: true }).waitFor();
    assert.equal(await mutateDraft("read"), 1);

    // A failed initial read must protect storage until a successful retry.
    await page.addInitScript(() => {
      const open = IDBFactory.prototype.open;
      window.testFailRead = true;
      IDBFactory.prototype.open = function (...args) {
        if (window.testFailRead)
          throw new DOMException("test read failure", "SecurityError");
        return open.apply(this, args);
      };
    });
    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "重试读取草稿", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "浅染", exact: true }).click();
    await page.evaluate(() => {
      window.testFailRead = false;
    });
    await page
      .getByRole("button", { name: "重试读取草稿", exact: true })
      .click();
    await page.getByText("草稿已保存", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "浅染", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );

    for (const [name, heading] of [
      ["染艺寻踪", "染艺寻踪"],
      ["一布一染", "一布一染"],
      ["纹样工坊", "纹样工坊"],
      ["染作生成", "染作生成"],
      ["白乡故事", "白乡故事"],
    ]) {
      await page
        .getByRole("navigation")
        .getByRole("link", { name, exact: true })
        .click();
      await page
        .getByRole("heading", { name: heading, exact: true, level: 1 })
        .waitFor();
    }
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "染艺寻踪", exact: true })
      .click();
    const detailButton = page.getByRole("button", { name: /查看详情/ });
    await detailButton.click();
    await page.getByRole("dialog").waitFor();
    assert.equal(
      await page
        .getByRole("dialog")
        .getByRole("link", { name: "大理周城白族的扎染工艺" })
        .count(),
      1,
    );
    await page.keyboard.press("Escape");
    assert(
      await detailButton.evaluate(
        (element) => element === document.activeElement,
      ),
      "Closing details should restore focus",
    );

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "一布一染", exact: true })
      .click();
    const summary = page.locator("summary").filter({ hasText: "防染" });
    await summary.focus();
    await page.keyboard.press("Enter");
    assert(await summary.evaluate((element) => element.parentElement.open));
    await page.keyboard.press("Space");
    assert.equal(
      await summary.evaluate((element) => element.parentElement.open),
      false,
    );

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "白乡故事", exact: true })
      .click();
    await page.getByRole("button", { name: /查看详情/ }).click();
    await page.getByRole("dialog").getByRole("img").waitFor();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "从相关模板开始", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "掌上扎染", exact: true, level: 1 })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "单花纹", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "纹样工坊", exact: true })
      .click();
    await page
      .getByRole("button", { name: "使用折叠条纹", exact: true })
      .click();
    await waitPreview();
    assert.equal(
      await page
        .getByRole("button", { name: "折叠条纹", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    for (const name of [
      "掌上扎染",
      "纹样工坊",
      "染艺寻踪",
      "一布一染",
      "白乡故事",
      "染作生成",
    ]) {
      await page
        .getByRole("navigation")
        .getByRole("link", { name, exact: true })
        .click();
      await page
        .getByRole("heading", { name, exact: true, level: 1 })
        .waitFor();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${name} should fit mobile`,
      );
    }
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "掌上扎染", exact: true })
      .click();
    await waitPreview();
    await page.screenshot({
      path: path.join(output, "app-mobile.png"),
      fullPage: true,
    });
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      JSON.stringify({
        passed: true,
        checks: [
          "real Worker preview",
          "latest render",
          "worker failure and retry",
          "IndexedDB save and refresh recovery",
          "save failure and retry",
          "invalid draft protection and reset",
          "initial read failure and retry",
          "six routes",
          "details and focus restore",
          "keyboard disclosure",
          "story and pattern navigation",
          "mobile layout",
          "console errors",
        ],
        workerCount: workers.length,
        output,
      }),
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
