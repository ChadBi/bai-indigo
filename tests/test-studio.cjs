const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const output = path.resolve(__dirname, "test-results");
fs.mkdirSync(output, { recursive: true });
const target = process.env.APP_URL || "http://127.0.0.1:5173";
const canvasSelector = ".editor-stage canvas";

async function readDraft(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("bai-indigo", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("drafts", "readonly"),
            read = tx.objectStore("drafts").get("current");
          tx.oncomplete = () => {
            db.close();
            resolve(read.result);
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
}
async function save(page) {
  await page.getByRole("button", { name: "立即保存草稿", exact: true }).click();
  await page.getByText("草稿已保存", { exact: true }).waitFor();
  return readDraft(page);
}
async function ready(page) {
  await page.waitForFunction(
    () =>
      Number(document.querySelector(".dye-preview canvas")?.dataset.renderId) >
        0 &&
      document.querySelector(".dye-preview")?.getAttribute("aria-busy") ===
        "false",
  );
}
async function phase(page, value) {
  await page.waitForFunction(
    (value) =>
      document.querySelector(".editor-stage canvas")?.dataset.phase === value,
    value,
  );
}
async function knots(page) {
  return page
    .locator("#knot-selection option")
    .count()
    .then((count) => count - 1);
}
async function drag(page, x, y, nextX, nextY) {
  const canvas = page.locator(canvasSelector);
  await canvas.scrollIntoViewIfNeeded();
  const b = await canvas.boundingBox();
  await page.mouse.move(b.x + b.width * x, b.y + b.height * y);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * nextX, b.y + b.height * nextY, {
    steps: 8,
  });
  await page.mouse.up();
}
async function complete(page, { skip = true } = {}) {
  await page.getByRole("button", { name: "开始浸染 ↗", exact: true }).click();
  assert(await page.locator("#radius").isDisabled());
  assert(
    await page
      .getByRole("button", { name: "添加扎结", exact: true })
      .isDisabled(),
  );
  if (skip) {
    await page.getByRole("button", { name: "跳过动画", exact: true }).click();
  } else {
    await page
      .getByRole("button", { name: "正在氧化显色…", exact: true })
      .waitFor();
  }
  await phase(page, "tied");
  await page
    .getByRole("button", { name: "拆线，展开纹样 ↗", exact: true })
    .click();
  await phase(page, "done");
  await ready(page);
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
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(target, { waitUntil: "networkidle" });
    await ready(page);
    const editor = page.locator(canvasSelector);
    await editor.scrollIntoViewIfNeeded();
    let b = await editor.boundingBox();
    await page.mouse.click(b.x + b.width * 0.52, b.y + b.height * 0.15);
    assert.equal(await knots(page), 5);
    await drag(page, 0.52, 0.15, 0.6, 0.18);
    await page.locator("#radius").fill("20");
    let draft = await save(page);
    assert.equal(draft.params.knots.length, 5);
    assert(Math.abs(draft.params.knots[4].x - 0.6) < 0.01);
    assert.equal(draft.params.knots[4].radius, 0.2);
    assert.equal(draft.params.knots[0].radius, 0.13);
    await page.reload({ waitUntil: "networkidle" });
    await ready(page);
    assert.equal(await knots(page), 5);
    draft = await readDraft(page);
    assert.equal(draft.params.knots[4].radius, 0.2);
    assert.equal(await page.locator("#knot-selection").inputValue(), "");

    await page.getByRole("button", { name: "四方纹", exact: true }).click();
    await page.getByRole("button", { name: "四折", exact: true }).click();
    await drag(page, 0.73, 0.28, 0.82, 0.18);
    draft = await save(page);
    assert.equal(draft.params.knots.length, 4);
    assert(Math.abs(draft.params.knots[0].x - 0.18) < 0.01);
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    draft = await save(page);
    assert.equal(draft.params.knots[0].x, 0.27);
    await editor.scrollIntoViewIfNeeded();
    b = await editor.boundingBox();
    await page.evaluate(() =>
      document.querySelector(".editor-stage canvas").addEventListener(
        "pointerdown",
        (e) => {
          window.testPointerId = e.pointerId;
        },
        { once: true },
      ),
    );
    await page.mouse.move(b.x + b.width * 0.27, b.y + b.height * 0.28);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.2, {
      steps: 4,
    });
    await page.evaluate(() =>
      document.querySelector(".editor-stage canvas").dispatchEvent(
        new PointerEvent("pointercancel", {
          bubbles: true,
          pointerId: window.testPointerId,
        }),
      ),
    );
    await page.mouse.up();
    draft = await save(page);
    assert.equal(draft.params.knots[0].x, 0.27);

    await page.getByRole("button", { name: "自由扎结", exact: true }).click();
    await page
      .getByRole("button", { name: "开始浸染 ↗", exact: true })
      .click();
    await page.getByText(/先在布面添加扎结/).waitFor();
    await page.getByRole("button", { name: "添加扎结", exact: true }).click();
    await editor.focus();
    await page.keyboard.press("ArrowRight");
    draft = await save(page);
    assert.equal(draft.params.knots[0].x, 0.512);
    await editor.focus();
    await page.keyboard.press("Delete");
    assert.equal(await knots(page), 0);
    await page.keyboard.press("Control+z");
    assert.equal(await knots(page), 1);
    await page.locator("#knot-selection").selectOption({ index: 1 });
    await page.locator("#radius").fill("18");
    await page.getByRole("button", { name: "清空", exact: true }).click();
    assert.equal(await knots(page), 0);
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    assert.equal(await knots(page), 1);
    while ((await knots(page)) < 12)
      await page.getByRole("button", { name: "添加扎结", exact: true }).click();
    await page.getByRole("button", { name: "添加扎结", exact: true }).click();
    await page.getByText(/最多放置 12 个/).waitFor();
    assert.equal(await knots(page), 12);
    await page.getByRole("button", { name: "撤销", exact: true }).click();
    assert.equal(await knots(page), 11);
    await page.getByRole("button", { name: "四方纹", exact: true }).click();
    await save(page);
    await ready(page);

    await page.evaluate(() => {
      const NativeWorker = window.Worker;
      window.testFailFinal = true;
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          if (window.testFailFinal) throw new Error("测试成品计算失败");
          super(...args);
        }
      };
    });
    await page
      .getByRole("button", { name: "开始浸染 ↗", exact: true })
      .click();
    await page
      .locator('.studio-notice[role="alert"]')
      .filter({ hasText: "测试成品计算失败" })
      .waitFor();
    await phase(page, "edit");
    assert(
      await page
        .getByRole("button", { name: "下载 PNG", exact: true })
        .isDisabled(),
    );
    await page.evaluate(() => {
      window.testFailFinal = false;
      const toBlob = HTMLCanvasElement.prototype.toBlob;
      window.testFailEncode = true;
      HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
        if (window.testFailEncode && this.width === 1024) {
          setTimeout(() => callback(null), 0);
          return;
        }
        return toBlob.call(this, callback, ...args);
      };
    });
    await page
      .getByRole("button", { name: "开始浸染 ↗", exact: true })
      .click();
    await page
      .locator('.studio-notice[role="alert"]')
      .filter({ hasText: "PNG 编码失败" })
      .waitFor();
    await phase(page, "edit");
    await page.evaluate(() => {
      window.testFailEncode = false;
    });
    await complete(page);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "下载 PNG", exact: true }).click();
    const download = await downloadPromise;
    const exported = path.join(output, "app-export.png");
    await download.saveAs(exported);
    const png = fs.readFileSync(exported);
    assert.equal(png.readUInt32BE(16), 1024);
    assert.equal(png.readUInt32BE(20), 1024);
    const match = await page.evaluate(async (base64) => {
      const blob = await (
          await fetch("data:image/png;base64," + base64)
        ).blob(),
        bitmap = await createImageBitmap(blob);
      const compare = (size) => {
        const copy = document.createElement("canvas");
        copy.width = copy.height = size;
        copy.getContext("2d").drawImage(bitmap, 0, 0, size, size);
        const expected = copy
            .getContext("2d")
            .getImageData(0, 0, size, size).data,
          canvas = document.querySelector(
            size === 600 ? ".editor-stage canvas" : ".dye-preview canvas",
          );
        const actual = canvas
          .getContext("2d")
          .getImageData(0, 0, size, size).data;
        return expected.every((value, index) => value === actual[index]);
      };
      const result = compare(600) && compare(260);
      bitmap.close();
      return result;
    }, png.toString("base64"));
    assert(match, "Downloaded pixels must match completed canvas and preview");
    await page.screenshot({
      path: path.join(output, "studio-finished.png"),
      fullPage: true,
    });
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "一布一染", exact: true })
      .click();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "掌上扎染", exact: true })
      .click();
    await phase(page, "done");
    await ready(page);
    assert(
      await page
        .getByRole("button", { name: "下载 PNG", exact: true })
        .isEnabled(),
    );

    await page.getByRole("button", { name: "再染一次 ↻", exact: true }).click();
    await page.getByRole("button", { name: "浅染", exact: true }).click();
    await complete(page, { skip: false });
    const compareButton = page.getByRole("button", {
      name: "对比两次染作",
      exact: true,
    });
    await compareButton.click();
    await page.getByRole("dialog").waitFor();
    assert(await page.getByRole("dialog").getByText(/深染/).isVisible());
    assert(await page.getByRole("dialog").getByText(/浅染/).isVisible());
    await page.keyboard.press("Escape");
    assert(await compareButton.evaluate((el) => el === document.activeElement));
    await page.screenshot({
      path: path.join(output, "studio-desktop.png"),
      fullPage: true,
    });

    await page.getByRole("button", { name: "再染一次 ↻", exact: true }).click();
    await page
      .getByRole("button", { name: "开始浸染 ↗", exact: true })
      .click();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "染艺寻踪", exact: true })
      .click();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "掌上扎染", exact: true })
      .click();
    await phase(page, "edit");
    assert(
      await page
        .getByRole("button", { name: "下载 PNG", exact: true })
        .isDisabled(),
    );
    await page
      .getByRole("button", { name: "开始浸染 ↗", exact: true })
      .click();
    await page.reload({ waitUntil: "networkidle" });
    await phase(page, "edit");
    await ready(page);
    assert(
      await page
        .getByRole("button", { name: "对比两次染作", exact: true })
        .isDisabled(),
    );
    assert.equal(errors.length, 0, errors.join("\n"));

    const reduced = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        reducedMotion: "reduce",
      }),
      reducedPage = await reduced.newPage();
    reducedPage.on("pageerror", (e) => errors.push(String(e)));
    reducedPage.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await reducedPage.goto(target, { waitUntil: "networkidle" });
    await ready(reducedPage);
    await reducedPage
      .getByRole("button", { name: "开始浸染 ↗", exact: true })
      .click();
    await phase(reducedPage, "tied");
    assert.equal(
      await reducedPage
        .getByRole("button", { name: "跳过动画", exact: true })
        .count(),
      0,
    );
    assert(
      await reducedPage
        .getByRole("button", { name: "下载 PNG", exact: true })
        .isDisabled(),
    );
    await reducedPage
      .getByRole("button", { name: "拆线，展开纹样 ↗", exact: true })
      .click();
    await phase(reducedPage, "done");
    await reduced.close();

    const mobile = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      }),
      phone = await mobile.newPage();
    phone.on("pageerror", (e) => errors.push(String(e)));
    phone.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await phone.goto(target, { waitUntil: "networkidle" });
    await ready(phone);
    const mobileCanvas = phone.locator(canvasSelector);
    await mobileCanvas.scrollIntoViewIfNeeded();
    const mb = await mobileCanvas.boundingBox();
    const cdp = await mobile.newCDPSession(phone),
      point = (x, y) => ({
        x: mb.x + mb.width * x,
        y: mb.y + mb.height * y,
        id: 0,
      });
    const yBefore = await phone.evaluate(() => scrollY);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point(0.5, 0.15)],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point(0.6, 0.22)],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    assert.equal(await knots(phone), 5);
    assert.equal(
      await phone.evaluate(() => scrollY),
      yBefore,
      "Canvas drag must not scroll the page",
    );
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point(0.6, 0.22)],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point(0.7, 0.3)],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    draft = await save(phone);
    assert(
      Math.abs(draft.params.knots[4].x - 0.6) < 0.01,
      "Touch cancellation should restore the committed position",
    );
    await phone.evaluate(() => scrollTo(0, 0));
    await phone
      .getByRole("heading", { name: "掌上扎染", exact: true, level: 1 })
      .waitFor();
    const heading = await phone
      .getByRole("heading", { name: "掌上扎染", exact: true, level: 1 })
      .boundingBox();
    const outsideY = heading.y + heading.height + 15;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 20, y: outsideY, id: 0 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 20, y: outsideY - 70, id: 0 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await phone.waitForFunction(() => scrollY > 0);
    assert(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await phone.screenshot({
      path: path.join(output, "studio-mobile.png"),
      fullPage: true,
    });
    await phone.emulateMedia({ reducedMotion: "reduce" });
    for (let i = 0; i < 2; i++) {
      if (i) {
        await phone
          .getByRole("button", { name: "再染一次 ↻", exact: true })
          .click();
        await phone.getByRole("button", { name: "浅染", exact: true }).click();
      }
      await phone
        .getByRole("button", { name: "开始浸染 ↗", exact: true })
        .click();
      await phase(phone, "tied");
      await phone
        .getByRole("button", { name: "拆线，展开纹样 ↗", exact: true })
        .click();
      await phase(phone, "done");
      await ready(phone);
    }
    await phone
      .getByRole("button", { name: "对比两次染作", exact: true })
      .click();
    await phone.getByRole("dialog").waitFor();
    const comparisonImages = phone.getByRole("dialog").getByRole("img"),
      firstImage = await comparisonImages.nth(0).boundingBox(),
      secondImage = await comparisonImages.nth(1).boundingBox();
    assert(
      secondImage.y >= firstImage.y + firstImage.height,
      "Mobile comparisons must be stacked",
    );
    await phone.screenshot({
      path: path.join(output, "studio-comparison-mobile.png"),
    });
    await phone.getByRole("button", { name: "关闭详情", exact: true }).click();
    assert.equal(errors.length, 0, errors.join("\n"));
    await cdp.detach();
    await mobile.close();
    await context.close();
    console.log(
      JSON.stringify({
        passed: true,
        checks: [
          "add/drag/select/radius",
          "edit refresh recovery",
          "reflected drag",
          "pointer cancel",
          "keyboard and undo",
          "knot cap",
          "compute/encode failure retry",
          "process lock and skip",
          "full process",
          "1024 PNG matches result and preview",
          "two-result comparison and focus",
          "route cancellation and done preservation",
          "refresh cancels process",
          "reduced motion",
          "simulated touch drag/cancel/outside scrolling",
          "desktop/mobile layout",
          "mobile comparison layout",
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
