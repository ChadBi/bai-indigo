<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from "vue";
import { useRouter } from "vue-router";
import { useWorksStore } from "../../stores/works";
import { useStudioStore } from "../../stores/studio";
import type { DyeWork } from "../../shared/types";
import { downloadResult } from "../../services/images";
import { normalizeWorkName } from "../../shared/validation";
import { workSummary, workTime } from "./work-format";
import BaseButton from "../../shared/components/BaseButton.vue";
import EmptyState from "../../shared/components/EmptyState.vue";
import DetailDialog from "../../shared/components/DetailDialog.vue";
import BlobImage from "../../shared/components/BlobImage.vue";
const works = useWorksStore(),
  studio = useStudioStore(),
  router = useRouter();
const root = ref<HTMLElement>(),
  heading = ref<HTMLElement>();
const selected = shallowRef<DyeWork>(),
  mode = ref<"view" | "rename" | "delete" | "replace" | "discard" | null>(null);
const dialogTrigger = shallowRef<HTMLElement>();
const name = ref(""),
  actionError = ref(""),
  pageMessage = ref(""),
  actionBusy = ref(false),
  opening = ref<string | null>(null);
let generation = 0,
  disposed = false;
const failed = computed(() => works.pending);
const title = computed(() =>
  mode.value === "rename"
    ? "重命名作品"
    : mode.value === "delete"
      ? "删除作品"
      : mode.value === "replace"
        ? "替换当前草稿"
        : mode.value === "discard"
          ? "移除待保存结果"
          : (selected.value?.name ?? "作品详情"),
);
onMounted(() => {
  void works.load();
});
onBeforeUnmount(() => {
  disposed = true;
  generation++;
});
function close() {
  if (actionBusy.value) return;
  generation++;
  mode.value = null;
  selected.value = undefined;
  actionError.value = "";
}
async function open(id: string, next: "view" | "rename" | "delete") {
  const trigger = document.activeElement as HTMLElement;
  const token = ++generation;
  opening.value = id;
  pageMessage.value = "";
  try {
    const work = await works.get(id);
    if (disposed || token !== generation) return;
    selected.value = work;
    dialogTrigger.value = trigger;
    name.value = work.name;
    actionError.value = "";
    mode.value = next;
  } catch (error) {
    if (!disposed && token === generation)
      pageMessage.value =
        error instanceof Error ? error.message : "打开作品失败，请重试。";
  } finally {
    if (token === generation) opening.value = null;
  }
}
async function rename() {
  if (!selected.value) return;
  actionError.value = "";
  try {
    const value = normalizeWorkName(name.value);
    actionBusy.value = true;
    await works.rename(selected.value.id, value);
    actionBusy.value = false;
    close();
    pageMessage.value = "作品名称已更新。";
  } catch (error) {
    actionBusy.value = false;
    actionError.value =
      error instanceof Error
        ? `重命名失败：${error.message}`
        : "重命名失败，请重试。";
  }
}
async function focusAfterRemoval(neighbors: string[]) {
  await nextTick();
  const cards = [
    ...(root.value?.querySelectorAll<HTMLElement>("[data-work-id]") ?? []),
  ];
  const next =
    neighbors
      .map((id) => cards.find((card) => card.dataset.workId === id))
      .find(Boolean) ?? cards[0];
  const button = next?.querySelector<HTMLButtonElement>("button");
  if (button) button.focus();
  else heading.value?.focus();
}
async function remove() {
  if (!selected.value) return;
  const id = selected.value.id,
    index = works.items.findIndex((work) => work.id === id);
  const neighbors = [
    works.items[index + 1]?.id,
    works.items[index - 1]?.id,
  ].filter((value): value is string => !!value);
  actionBusy.value = true;
  actionError.value = "";
  try {
    await works.remove(id);
    actionBusy.value = false;
    close();
    pageMessage.value = "作品已从当前浏览器中删除。";
    await focusAfterRemoval(neighbors);
  } catch {
    actionBusy.value = false;
    actionError.value = "删除失败，原记录保留。请重试。";
  }
}
async function edit(confirmed = false) {
  if (!selected.value) return;
  actionBusy.value = true;
  actionError.value = "";
  try {
    const work = await works.get(selected.value.id);
    if (!studio.initialized) throw new Error("正在读取当前草稿，请稍后重试。");
    if (studio.recovery !== "none")
      throw new Error(
        "请先在掌上扎染处理当前草稿的读取或版本问题，再继续编辑。",
      );
    if (!confirmed && studio.differsFromWork(work)) {
      selected.value = work;
      mode.value = "replace";
      actionBusy.value = false;
      return;
    }
    await studio.loadWorkForEditing(work);
    actionBusy.value = false;
    close();
    await router.push("/studio");
  } catch (error) {
    actionBusy.value = false;
    actionError.value =
      error instanceof Error ? error.message : "载入作品失败，请重试。";
  }
}
function discard(work: DyeWork) {
  dialogTrigger.value = document.activeElement as HTMLElement;
  selected.value = work;
  actionError.value = "";
  mode.value = "discard";
}
async function retry(id: string) {
  await works.retry(id);
  if (!disposed && works.statuses[id] === "saved")
    await focusAfterRemoval([id]);
}
async function confirmDiscard() {
  if (!selected.value) return;
  const id = selected.value.id;
  works.discard(id);
  close();
  pageMessage.value = "待保存结果已移除。";
  await focusAfterRemoval([]);
}
</script>
<template>
  <section ref="root" class="works-page">
    <section class="page-heading">
      <span class="eyebrow">YOUR INDIGO WORKS</span>
      <h1 ref="heading" tabindex="-1">我的作品</h1>
      <p>每次拆线完成后，染作会自动保存在当前浏览器。</p>
    </section>
    <div class="works-toolbar">
      <span>{{ works.items.length }} 件已保存作品</span
      ><BaseButton
        variant="secondary"
        :disabled="works.loading"
        @click="works.load"
        >刷新作品列表</BaseButton
      >
    </div>
    <p v-if="pageMessage" role="status">{{ pageMessage }}</p>
    <p v-if="works.error" role="alert" class="error-text">
      {{ works.error }}
      <BaseButton variant="secondary" @click="works.load"
        >重试读取作品</BaseButton
      >
    </p>
    <p v-if="works.invalidCount" role="status" class="error-text">
      有
      {{ works.invalidCount }}
      条本地记录无法读取，已保留原数据，其他作品可正常使用。
    </p>
    <p v-if="works.loading" role="status">正在读取我的作品…</p>
    <section
      v-if="failed.length"
      class="pending-section"
      aria-labelledby="pending-title"
    >
      <h2 id="pending-title">待保存的染作</h2>
      <p>这些结果暂存在内存中，刷新会丢失。可重试保存或先下载 PNG。</p>
      <div class="work-grid">
        <article
          v-for="work in failed"
          :key="work.id"
          class="work-card pending-work"
          :data-work-id="work.id"
        >
          <BlobImage :blob="work.thumbnail" :alt="work.name + '的缩略图'" />
          <div class="work-card-body">
            <span
              class="work-badge"
              :class="{ 'error-text': works.statuses[work.id] === 'error' }"
              >{{
                works.statuses[work.id] === "saving" ? "正在保存…" : "保存失败"
              }}</span
            >
            <h2>{{ work.name }}</h2>
            <p>{{ workSummary(work) }}</p>
            <div class="work-card-actions">
              <BaseButton
                variant="secondary"
                :disabled="works.statuses[work.id] === 'saving'"
                @click="retry(work.id)"
                >重试保存作品</BaseButton
              ><BaseButton variant="text" @click="downloadResult(work)"
                >下载 PNG</BaseButton
              ><BaseButton
                variant="text"
                :disabled="works.statuses[work.id] === 'saving'"
                @click="discard(work)"
                >移除待保存结果</BaseButton
              >
            </div>
          </div>
        </article>
      </div>
    </section>
    <div class="work-grid">
      <article
        v-for="work in works.items"
        :key="work.id"
        class="work-card"
        :data-work-id="work.id"
      >
        <BlobImage :blob="work.thumbnail" :alt="work.name + '的缩略图'" />
        <div class="work-card-body">
          <h2>{{ work.name }}</h2>
          <time :datetime="work.createdAt">{{ workTime(work.createdAt) }}</time>
          <p>{{ workSummary(work) }}</p>
          <div class="work-card-actions">
            <BaseButton
              variant="secondary"
              :disabled="!!opening || works.busy[work.id]"
              @click="open(work.id, 'view')"
              >打开作品</BaseButton
            ><BaseButton
              variant="text"
              :disabled="!!opening || works.busy[work.id]"
              @click="open(work.id, 'rename')"
              >重命名</BaseButton
            ><BaseButton
              variant="text"
              :disabled="!!opening || works.busy[work.id]"
              @click="open(work.id, 'delete')"
              >删除作品</BaseButton
            >
          </div>
        </div>
      </article>
    </div>
    <EmptyState
      v-if="
        works.loaded && !works.loading && !works.error && !works.items.length
      "
      title="还没有保存的作品"
      description="去扎一束线，完成制作后，成品就会出现在这里。"
      ><RouterLink class="button button--primary" to="/studio"
        >开始创作 ↗</RouterLink
      ></EmptyState
    >
    <p class="local-note">
      作品保存在当前浏览器的此网站数据中。清除网站数据会删除本地作品；已下载的
      PNG 保留在设备上。
    </p>
    <DetailDialog
      v-if="mode && selected"
      :title="title"
      :return-focus="dialogTrigger"
      @close="close"
      ><template v-if="mode === 'view'"
        ><div class="work-detail-image">
          <BlobImage
            :blob="selected.image"
            :alt="selected.name + '的成品图像'"
          />
        </div>
        <p>{{ workSummary(selected) }}</p>
        <p class="work-detail-meta">
          创建：{{ workTime(selected.createdAt) }}<br />更新：{{
            workTime(selected.updatedAt)
          }}
        </p>
        <div class="dialog-actions">
          <BaseButton variant="secondary" @click="downloadResult(selected)"
            >下载作品 PNG</BaseButton
          ><BaseButton
            :disabled="actionBusy || !studio.initialized"
            @click="edit()"
            >继续编辑</BaseButton
          >
        </div></template
      >
      <form v-else-if="mode === 'rename'" @submit.prevent="rename">
        <label class="work-name-label" for="work-name">作品名称</label
        ><input
          id="work-name"
          v-model="name"
          type="text"
          maxlength="80"
          :disabled="actionBusy"
          aria-describedby="work-name-help"
        />
        <p id="work-name-help" class="local-note">
          1—40 个字符，当前 {{ [...name.trim()].length }} 个。
        </p>
        <div class="dialog-actions">
          <BaseButton type="submit" :disabled="actionBusy">{{
            actionBusy ? "正在保存名称…" : "保存名称"
          }}</BaseButton
          ><BaseButton variant="secondary" :disabled="actionBusy" @click="close"
            >取消</BaseButton
          >
        </div>
      </form>
      <template v-else-if="mode === 'delete'"
        ><p>
          从此浏览器的“我的作品”中删除《{{ selected.name }}》？已下载的 PNG
          保留在设备上。
        </p>
        <div class="dialog-actions">
          <BaseButton :disabled="actionBusy" @click="remove">{{
            actionBusy ? "正在删除…" : "确认删除"
          }}</BaseButton
          ><BaseButton variant="secondary" :disabled="actionBusy" @click="close"
            >取消</BaseButton
          >
        </div></template
      ><template v-else-if="mode === 'replace'"
        ><p>
          继续编辑《{{
            selected.name
          }}》将替换当前草稿。已保存作品保持不变，完成后另存一份新作品。
        </p>
        <div class="dialog-actions">
          <BaseButton :disabled="actionBusy" @click="edit(true)"
            >替换草稿并编辑</BaseButton
          ><BaseButton variant="secondary" :disabled="actionBusy" @click="close"
            >取消</BaseButton
          >
        </div></template
      ><template v-else
        ><p>
          移除《{{
            selected.name
          }}》后，将不再重试保存这份结果。请先下载需要保留的 PNG。
        </p>
        <div class="dialog-actions">
          <BaseButton @click="confirmDiscard">确认移除</BaseButton
          ><BaseButton variant="secondary" @click="close">取消</BaseButton>
        </div></template
      >
      <p v-if="actionError" role="alert" class="error-text dialog-error">
        {{ actionError }}
      </p></DetailDialog
    >
  </section>
</template>
