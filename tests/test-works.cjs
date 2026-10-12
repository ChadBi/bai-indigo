const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const output = path.resolve(__dirname, "test-results");
fs.mkdirSync(output, { recursive: true });
const target = process.env.APP_URL || "http://127.0.0.1:5173";
async function database(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("bai-indigo", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction(["works", "drafts"], "readonly"),
            works = tx.objectStore("works").getAll(),
            draft = tx.objectStore("drafts").get("current");
          tx.oncomplete = async () => {
            db.close();
            try {
              const items = await Promise.all(
                works.result.map(async (work) => ({
                  id: work.id,
                  name: work.name,
                  params: work.params,
                  editor: work.editor,
                  createdAt: work.createdAt,
                  updatedAt: work.updatedAt,
                  imageHash:
                    work.image instanceof Blob
                      ? [
                          ...new Uint8Array(
                            await crypto.subtle.digest(
                              "SHA-256",
                              await work.image.arrayBuffer(),
                            ),
                          ),
                        ]
                          .map((v) => v.toString(16).padStart(2, "0"))
                          .join("")
                      : null,
                })),
              );
              resolve({ items, draft: draft.result });
            } catch (error) {
              reject(error);
            }
          };
          tx.onabort = () => reject(tx.error);
        };
      }),
  );
}
async function ready(page) {
  await page.waitForFunction(
    () =>
      document.querySelector(".dye-preview")?.getAttribute("aria-busy") ===
        "false" &&
      Number(document.querySelector(".dye-preview canvas")?.dataset.renderId) >
        0,
  );
}
async function navigate(page, name) {
  await page
    .getByRole("navigation")
    .getByRole("link", { name, exact: true })
    .click();
  await page
    .getByRole("heading", {
      name: name === "染作生成" ? "我的作品" : name,
      level: 1,
      exact: true,
    })
    .waitFor();
}
async function finish(page, saved = true) {
  await page.getByRole("button", { name: "开始浸染 ↗", exact: true }).click();
  await page
    .getByRole("button", { name: "拆线，展开纹样 ↗", exact: true })
    .click();
  await page.getByRole("button", { name: "再染一次 ↻", exact: true }).waitFor();
  await ready(page);
  if (saved)
    await page.getByText("作品已保存到我的作品", { exact: true }).waitFor();
  else
    await page
      .locator(".work-save-status")
      .filter({ hasText: "作品保存失败" })
      .waitFor();
}
function card(page, id) {
  return page.locator(`.work-card[data-work-id="${id}"]`);
}
async function download(page, button, filename) {
  const pending = page.waitForEvent("download");
  await button.click();
  const file = await pending;
  const outputPath = path.join(output, filename);
  await file.saveAs(outputPath);
  const png = fs.readFileSync(outputPath);
  assert.equal(png.readUInt32BE(16), 1024);
  assert.equal(png.readUInt32BE(20), 1024);
  return outputPath;
}

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
        reducedMotion: "reduce",
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(target, { waitUntil: "networkidle" });
    await ready(page);
    await navigate(page, "染作生成");
    await page
      .getByRole("heading", { name: "还没有保存的作品", exact: true })
      .waitFor();
    await navigate(page, "掌上扎染");
    await page.getByRole("button", { name: "单花纹", exact: true }).click();
    await page.locator("#knot-selection").selectOption({ index: 1 });
    await page.locator("#radius").fill("18");
    await finish(page);
    let data = await database(page);
    assert.equal(data.items.length, 1);
    const original = data.items[0];
    assert.equal(original.editor.defaultRadius, 0.23);
    assert.equal(original.editor.templateId, "flower");
    assert.equal(original.params.knots[0].radius, 0.18);
    assert.match(original.name, /^染作 \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    await page.reload({ waitUntil: "networkidle" });
    await ready(page);
    await navigate(page, "染作生成");
    assert.equal(await page.locator(".work-card").count(), 1);
    await card(page, original.id)
      .getByRole("button", { name: "重命名", exact: true })
      .click();
    await page.locator("#work-name").fill("");
    await page.getByRole("button", { name: "保存名称", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "1—40" }).waitFor();
    await page.locator("#work-name").fill("  蓝白之间  ");
    await page.getByRole("button", { name: "保存名称", exact: true }).click();
    await card(page, original.id)
      .getByRole("heading", { name: "蓝白之间", exact: true })
      .waitFor();
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put,
        add = IDBObjectStore.prototype.add,
        remove = IDBObjectStore.prototype.delete,
        cursor = IDBObjectStore.prototype.openCursor;
      window.failWorkRename = false;
      window.failWorkSave = false;
      window.failWorkDelete = false;
      window.failWorkRead = false;
      IDBObjectStore.prototype.put = function (...args) {
        if (this.name === "works" && window.failWorkRename)
          throw new DOMException("test rename", "QuotaExceededError");
        return put.apply(this, args);
      };
      IDBObjectStore.prototype.add = function (...args) {
        if (this.name === "works" && window.failWorkSave)
          throw new DOMException("test save", "QuotaExceededError");
        return add.apply(this, args);
      };
      IDBObjectStore.prototype.delete = function (...args) {
        if (this.name === "works" && window.failWorkDelete)
          throw new DOMException("test delete", "SecurityError");
        return remove.apply(this, args);
      };
      IDBObjectStore.prototype.openCursor = function (...args) {
        if (this.name === "works" && window.failWorkRead)
          throw new DOMException("test read", "SecurityError");
        return cursor.apply(this, args);
      };
    });
    await card(page, original.id)
      .getByRole("button", { name: "重命名", exact: true })
      .click();
    await page.locator("#work-name").fill("青蓝方巾");
    await page.evaluate(() => {
      window.failWorkRename = true;
    });
    await page.getByRole("button", { name: "保存名称", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "重命名失败" }).waitFor();
    assert.equal(await page.locator("#work-name").inputValue(), "青蓝方巾");
    assert.equal((await database(page)).items[0].name, "蓝白之间");
    await page.evaluate(() => {
      window.failWorkRename = false;
    });
    await page.getByRole("button", { name: "保存名称", exact: true }).click();
    await card(page, original.id)
      .getByRole("heading", { name: "青蓝方巾", exact: true })
      .waitFor();
    data = await database(page);
    assert.equal(data.items[0].imageHash, original.imageHash);
    assert.deepEqual(data.items[0].params, original.params);
    const beforeView = data.draft;
    await card(page, original.id)
      .getByRole("button", { name: "打开作品", exact: true })
      .click();
    await page.getByRole("dialog").getByRole("img").waitFor();
    const downloaded = await download(
      page,
      page.getByRole("button", { name: "下载作品 PNG", exact: true }),
      "works-download.png",
    );
    await page.getByRole("button", { name: "关闭详情", exact: true }).click();
    assert.deepEqual((await database(page)).draft.params, beforeView.params);
    assert.equal((await database(page)).items.length, 1);
    await navigate(page, "掌上扎染");
    await page.getByRole("button", { name: "四方纹", exact: true }).click();
    await page.getByRole("button", { name: "四折", exact: true }).click();
    await page.getByRole("button", { name: "浅染", exact: true }).click();
    await finish(page);
    data = await database(page);
    assert.equal(data.items.length, 2);
    const second = data.items.find((work) => work.id !== original.id);
    assert(second);
    await page.reload({ waitUntil: "networkidle" });
    await ready(page);
    await navigate(page, "染作生成");
    assert.equal(await page.locator(".work-card").count(), 2);
    await card(page, original.id)
      .getByRole("button", { name: "打开作品", exact: true })
      .click();
    await page.getByRole("button", { name: "继续编辑", exact: true }).click();
    await page
      .getByRole("button", { name: "替换草稿并编辑", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "取消", exact: true }).click();
    assert.deepEqual((await database(page)).draft.params, second.params);
    // Protect an invalid existing draft while leaving saved works available.
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const open = indexedDB.open("bai-indigo", 1);
          open.onsuccess = () => {
            const db = open.result,
              tx = db.transaction("drafts", "readwrite"),
              store = tx.objectStore("drafts"),
              read = store.get("current");
            read.onsuccess = () => {
              const value = read.result;
              value.params.schemaVersion = 999;
              store.put(value, "current");
            };
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
          };
        }),
    );
    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByRole("heading", { name: "我的作品", exact: true, level: 1 })
      .waitFor();
    await card(page, original.id)
      .getByRole("button", { name: "打开作品", exact: true })
      .click();
    await page.getByRole("button", { name: "继续编辑", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "处理当前草稿" }).waitFor();
    assert.equal((await database(page)).draft.params.schemaVersion, 999);
    await page.getByRole("button", { name: "关闭详情", exact: true }).click();
    await navigate(page, "掌上扎染");
    await page
      .getByRole("button", { name: "重置本地草稿", exact: true })
      .click();
    await page.getByText("草稿已保存", { exact: true }).waitFor();
    assert.equal((await database(page)).items.length, 2);
    await navigate(page, "染作生成");
    await card(page, original.id)
      .getByRole("button", { name: "打开作品", exact: true })
      .click();
    await page.getByRole("button", { name: "继续编辑", exact: true }).click();
    await page
      .getByRole("button", { name: "替换草稿并编辑", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "掌上扎染", exact: true, level: 1 })
      .waitFor();
    await ready(page);
    data = await database(page);
    assert.deepEqual(data.draft.params, original.params);
    assert.equal(data.draft.defaultRadius, 0.23);
    assert.equal(data.draft.templateId, "flower");
    assert.equal(await page.locator("#radius").inputValue(), "23");
    assert(
      await page
        .getByRole("button", { name: "撤销", exact: true })
        .isDisabled(),
    );
    await page.locator("#knot-selection").selectOption({ index: 1 });
    await page.locator("#radius").fill("20");
    await finish(page);
    data = await database(page);
    assert.equal(data.items.length, 3);
    assert.equal(
      data.items.find((work) => work.id === original.id).imageHash,
      original.imageHash,
    );
    assert.equal(
      data.items.find((work) => work.id === original.id).name,
      "青蓝方巾",
    );
    assert(
      await page
        .getByRole("button", { name: "对比两次染作", exact: true })
        .isDisabled(),
    );
    await page.getByRole("button", { name: "再染一次 ↻", exact: true }).click();
    await page.getByRole("button", { name: "对折", exact: true }).click();
    // Reload reset the earlier fault injection; install save failure again.
    await page.evaluate(() => {
      const add = IDBObjectStore.prototype.add;
      window.failWorkSave = true;
      IDBObjectStore.prototype.add = function (...args) {
        if (this.name === "works" && window.failWorkSave)
          throw new DOMException("test save", "QuotaExceededError");
        return add.apply(this, args);
      };
    });
    await finish(page, false);
    assert.equal((await database(page)).items.length, 3);
    await navigate(page, "染作生成");
    await page
      .getByRole("heading", { name: "待保存的染作", exact: true })
      .waitFor();
    const pendingId = await page
      .locator(".pending-work")
      .getAttribute("data-work-id");
    await page
      .getByRole("button", { name: "重试保存作品", exact: true })
      .click();
    await page.getByText("保存失败", { exact: true }).waitFor();
    assert.equal((await database(page)).items.length, 3);
    await download(
      page,
      page
        .locator(".pending-work")
        .getByRole("button", { name: "下载 PNG", exact: true }),
      "works-pending.png",
    );
    await page.evaluate(() => {
      window.failWorkSave = false;
    });
    await page
      .getByRole("button", { name: "重试保存作品", exact: true })
      .click();
    await page.waitForFunction(() => !document.querySelector(".pending-work"));
    data = await database(page);
    assert.equal(data.items.length, 4);
    assert(data.items.some((work) => work.id === pendingId));
    await page
      .getByRole("button", { name: "刷新作品列表", exact: true })
      .click();
    await page.getByText("4 件已保存作品", { exact: true }).waitFor();
    await navigate(page, "掌上扎染");
    await page.getByRole("button", { name: "再染一次 ↻", exact: true }).click();
    await page.getByRole("button", { name: "浅染", exact: true }).click();
    await page.evaluate(() => {
      window.failWorkSave = true;
    });
    await finish(page, false);
    await navigate(page, "染作生成");
    await page
      .getByRole("button", { name: "移除待保存结果", exact: true })
      .click();
    await page.getByRole("button", { name: "取消", exact: true }).click();
    assert.equal(await page.locator(".pending-work").count(), 1);
    await page
      .getByRole("button", { name: "移除待保存结果", exact: true })
      .click();
    await page.getByRole("button", { name: "确认移除", exact: true }).click();
    assert.equal(await page.locator(".pending-work").count(), 0);
    assert.equal((await database(page)).items.length, 4);
    await card(page, original.id)
      .getByRole("button", { name: "删除作品", exact: true })
      .click();
    await page.getByRole("button", { name: "取消", exact: true }).click();
    assert.equal((await database(page)).items.length, 4);
    await page.evaluate(() => {
      const remove = IDBObjectStore.prototype.delete;
      window.failWorkDelete = true;
      IDBObjectStore.prototype.delete = function (...args) {
        if (this.name === "works" && window.failWorkDelete)
          throw new Error("test delete");
        return remove.apply(this, args);
      };
    });
    await card(page, original.id)
      .getByRole("button", { name: "删除作品", exact: true })
      .click();
    await page.getByRole("button", { name: "确认删除", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "删除失败" }).waitFor();
    assert.equal((await database(page)).items.length, 4);
    await page.evaluate(() => {
      window.failWorkDelete = false;
    });
    await page.getByRole("button", { name: "确认删除", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector("dialog"));
    data = await database(page);
    assert.equal(data.items.length, 3);
    assert(!data.items.some((work) => work.id === original.id));
    assert(fs.existsSync(downloaded));
    assert(
      await page
        .locator(".work-card button")
        .evaluateAll((buttons) =>
          buttons.some((button) => button === document.activeElement),
        ),
    );
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const open = indexedDB.open("bai-indigo", 1);
          open.onsuccess = () => {
            const db = open.result,
              tx = db.transaction("works", "readwrite"),
              store = tx.objectStore("works"),
              read = store.openCursor();
            read.onsuccess = () => {
              const value = read.result.value;
              value.id = "broken";
              value.params.engineVersion = "future";
              store.put(value);
            };
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
          };
        }),
    );
    await page
      .getByRole("button", { name: "刷新作品列表", exact: true })
      .click();
    await page.getByText(/1 条本地记录无法读取/).waitFor();
    assert.equal(await page.locator(".work-card").count(), 3);
    assert.equal((await database(page)).items.length, 4);
    await page.evaluate(() => {
      const cursor = IDBObjectStore.prototype.openCursor;
      window.failWorkRead = true;
      IDBObjectStore.prototype.openCursor = function (...args) {
        if (this.name === "works" && window.failWorkRead)
          throw new Error("test read");
        return cursor.apply(this, args);
      };
    });
    await page
      .getByRole("button", { name: "刷新作品列表", exact: true })
      .click();
    await page
      .getByRole("button", { name: "重试读取作品", exact: true })
      .waitFor();
    assert.equal(await page.locator(".work-card").count(), 3);
    await page.evaluate(() => {
      window.failWorkRead = false;
    });
    await page
      .getByRole("button", { name: "重试读取作品", exact: true })
      .click();
    await page.waitForFunction(
      () => !document.querySelector('.works-page [role="alert"]'),
    );
    const thumbnailId = data.items.find((work) => work.id !== "broken").id;
    await page.evaluate(
      (id) =>
        new Promise((resolve) => {
          const open = indexedDB.open("bai-indigo", 1);
          open.onsuccess = () => {
            const db = open.result,
              tx = db.transaction("works", "readwrite"),
              store = tx.objectStore("works"),
              read = store.get(id);
            read.onsuccess = () => {
              const value = read.result;
              window.savedTestThumbnail = value.thumbnail;
              value.thumbnail = new Blob(["not a PNG"], { type: "image/png" });
              store.put(value);
            };
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
          };
        }),
      thumbnailId,
    );
    await page
      .getByRole("button", { name: "刷新作品列表", exact: true })
      .click();
    await card(page, thumbnailId).scrollIntoViewIfNeeded();
    await card(page, thumbnailId)
      .getByText(/图片暂时无法显示/)
      .waitFor();
    await page.evaluate(
      (id) =>
        new Promise((resolve) => {
          const open = indexedDB.open("bai-indigo", 1);
          open.onsuccess = () => {
            const db = open.result,
              tx = db.transaction("works", "readwrite"),
              store = tx.objectStore("works"),
              read = store.get(id);
            read.onsuccess = () => {
              const value = read.result;
              value.thumbnail = window.savedTestThumbnail;
              store.put(value);
            };
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
          };
        }),
      thumbnailId,
    );
    await page
      .getByRole("button", { name: "刷新作品列表", exact: true })
      .click();
    await card(page, thumbnailId).getByRole("img").waitFor();
    await page.screenshot({
      path: path.join(output, "works-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.screenshot({
      path: path.join(output, "works-mobile.png"),
      fullPage: true,
    });
    const remaining = card(
      page,
      data.items.find((work) => work.id !== "broken" && work.id !== original.id)
        .id,
    );
    await remaining
      .getByRole("button", { name: "打开作品", exact: true })
      .click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("dialog"));
    assert(
      await remaining
        .getByRole("button", { name: "打开作品", exact: true })
        .evaluate((button) => button === document.activeElement),
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    await context.close();
    console.log(
      JSON.stringify({
        passed: true,
        checks: [
          "empty state",
          "automatic persistent save",
          "exact editor metadata",
          "refresh keeps multiple works",
          "rename validation/failure/retry",
          "stored PNG download",
          "view does not change draft",
          "draft replacement cancel",
          "invalid draft protection",
          "continue editing restores metadata",
          "new copy preserves original",
          "failed results across routes and stable-id retry",
          "pending discard",
          "delete confirm/cancel/failure/retry and focus",
          "corrupt record isolation",
          "read failure retry",
          "image failure fallback",
          "desktop/mobile layout",
          "Escape and focus",
          "console errors",
        ],
        output,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
