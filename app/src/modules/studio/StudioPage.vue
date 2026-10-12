<script setup lang="ts">
import { useStudioStore } from "../../stores/studio";
import { contentRepository } from "../../services/content";
import type { Fold, Depth } from "../../shared/types";
import BaseButton from "../../shared/components/BaseButton.vue";
import DyeCanvas from "./DyeCanvas.vue";
const studio = useStudioStore(),
  patterns = contentRepository.patterns();
const folds: readonly { id: Fold; name: string }[] = [
  { id: "none", name: "不折叠" },
  { id: "half", name: "对折" },
  { id: "quarter", name: "四折" },
];
const depths: readonly { id: Depth; name: string }[] = [
  { id: "light", name: "浅染" },
  { id: "medium", name: "中染" },
  { id: "deep", name: "深染" },
];
</script>
<template>
  <section class="page-heading studio-heading">
    <div>
      <span class="eyebrow">A THREAD, A BLUE, A WHITE</span>
      <h1>掌上扎染</h1>
      <p>在一方白布上，让靛蓝留下自己的纹路。</p>
    </div>
    <span class="edition">Bai Indigo<br />数字扎染工坊</span>
  </section>
  <div class="studio-layout">
    <aside class="studio-controls" aria-label="创作参数">
      <fieldset :disabled="!studio.initialized">
        <legend class="sr-only">创作参数</legend>
        <div class="control-section">
          <h2><span>01</span> 从一种纹样开始</h2>
          <div class="preset-grid">
            <button
              v-for="pattern in patterns"
              :key="pattern.id"
              class="preset"
              :aria-pressed="studio.templateId === pattern.id"
              @click="studio.selectPattern(pattern.id)"
            >
              <span
                class="pattern-mark"
                :class="`pattern-mark--${pattern.id}`"
                aria-hidden="true"
                >{{
                  pattern.id === "four"
                    ? "⠿"
                    : pattern.id === "flower"
                      ? "◎"
                      : pattern.id === "stripe"
                        ? "☰"
                        : "＋"
                }}</span
              >{{ pattern.title }}
            </button>
          </div>
          <p class="control-note">原创体验模板</p>
        </div>
        <div class="control-section">
          <h2><span>02</span> 折叠方式</h2>
          <div class="segmented">
            <button
              v-for="fold in folds"
              :key="fold.id"
              :aria-pressed="studio.params.fold === fold.id"
              @click="studio.setFold(fold.id)"
            >
              {{ fold.name }}
            </button>
          </div>
        </div>
        <div class="control-section">
          <h2><span>03</span> 留白大小</h2>
          <label class="range-label" for="radius"
            >全部扎结半径
            <output
              >{{ Math.round(studio.defaultRadius * 100) }}%</output
            ></label
          ><input
            id="radius"
            type="range"
            min="6"
            max="24"
            :value="studio.defaultRadius * 100"
            @input="
              studio.setRadius(
                Number(($event.target as HTMLInputElement).value) / 100,
              )
            "
          />
          <div class="range-ends"><span>细密</span><span>舒展</span></div>
        </div>
        <div class="control-section">
          <h2><span>04</span> 靛蓝深浅</h2>
          <div class="dye-options">
            <button
              v-for="depth in depths"
              :key="depth.id"
              :aria-pressed="studio.params.depth === depth.id"
              @click="studio.setDepth(depth.id)"
            >
              <i class="swatch" :class="`swatch--${depth.id}`" />{{
                depth.name
              }}
            </button>
          </div>
        </div>
      </fieldset>
      <div class="draft-actions">
        <p
          role="status"
          :class="{ 'error-text': studio.saveState === 'error' }"
        >
          {{ studio.storageMessage }}
        </p>
        <template v-if="studio.recovery === 'invalid'"
          ><p>重置将删除原草稿，并恢复四方纹方案。</p>
          <BaseButton variant="secondary" @click="studio.resetDraft"
            >重置本地草稿</BaseButton
          ></template
        ><BaseButton
          v-else-if="studio.recovery === 'read-error'"
          variant="secondary"
          @click="studio.initialize"
          >重试读取草稿</BaseButton
        ><BaseButton
          v-else
          variant="secondary"
          :disabled="!studio.initialized || studio.saveState === 'saving'"
          @click="studio.saveNow"
          >{{
            studio.saveState === "error" ? "重试保存" : "立即保存草稿"
          }}</BaseButton
        >
      </div>
    </aside>
    <DyeCanvas />
    <aside class="studio-explanation">
      <span class="eyebrow">THE ART OF RESIST DYEING</span>
      <h2>线扎住的，<br />是留白。</h2>
      <p>位置、大小与折叠共同决定留白的布局。调整参数，观察蓝白之间的变化。</p>
      <div class="explanation-rule" />
      <p>
        圆点与条纹为原创体验方案。画面是算法近似，不是布料与染料的物理预测。
      </p>
      <RouterLink to="/learning">认识防染原理 ↗</RouterLink>
      <div class="milestone-note">
        <span>工程首版</span>
        <p>
          已支持参数预览与草稿恢复。布面编辑、浸染与拆线过程将在后续版本加入。
        </p>
      </div>
    </aside>
  </div>
  <p class="local-note">草稿仅保存在当前浏览器；清除网站数据会删除本地记录。</p>
</template>
