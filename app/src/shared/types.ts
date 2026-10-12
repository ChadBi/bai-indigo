export const SCHEMA_VERSION = 1 as const;
export const ENGINE_VERSION = "demo-resist-v1" as const;
export type Fold = "none" | "half" | "quarter";
export type Depth = "light" | "medium" | "deep";
export type DyeStyle = "circle" | "stripe";
export type PatternId = "four" | "flower" | "stripe" | "free";
export type TemplateSelection = PatternId | "custom";
export interface Knot {
  id: string;
  x: number;
  y: number;
  radius: number;
}
export interface DyeParams {
  schemaVersion: typeof SCHEMA_VERSION;
  engineVersion: typeof ENGINE_VERSION;
  seed: number;
  style: DyeStyle;
  fold: Fold;
  depth: Depth;
  knots: Knot[];
}
export interface Draft {
  params: DyeParams;
  updatedAt: string;
  templateId: TemplateSelection;
  defaultRadius: number;
}
export type StudioPhase =
  | "edit"
  | "preparing"
  | "dye"
  | "oxidize"
  | "tied"
  | "unfold"
  | "done";
export type EditSnapshot = Pick<
  Draft,
  "params" | "templateId" | "defaultRadius"
>;
export interface SessionDyeResult {
  readonly params: DyeParams;
  readonly image: Blob;
  readonly thumbnail: Blob;
  readonly createdAt: string;
}
export interface DyeWork {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  params: DyeParams;
  thumbnail: Blob;
  image: Blob;
}
export type ContentKind = "traditional" | "original";
export interface SourceRef {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessedAt: string;
  note?: string;
}
export interface ContentImage {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  license: string;
  sourceRefs: readonly string[];
}
export interface ContentEntry {
  id: string;
  title: string;
  summary: string;
  body: readonly string[];
  images: readonly ContentImage[];
  sourceRefs: readonly string[];
  relatedPatternIds: readonly PatternId[];
  kind: ContentKind;
}
export interface CultureEntry extends ContentEntry {
  category: string;
}
export interface StoryEntry extends ContentEntry {
  category: string;
}
export interface GlossaryEntry {
  id: string;
  term: string;
  explanation: string;
  kind: ContentKind;
  sourceRefs: readonly string[];
}
export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  kind: ContentKind;
  sourceRefs: readonly string[];
}
export interface PatternTemplate {
  id: PatternId;
  title: string;
  summary: string;
  kind: "original";
  sourceRefs: readonly string[];
  params: DyeParams;
  defaultRadius: number;
}
export interface RenderRequest {
  params: DyeParams;
  size: number;
  requestId: number;
}
export type RenderResponse =
  | {
      ok: true;
      requestId: number;
      size: number;
      pixels: Uint8ClampedArray<ArrayBuffer>;
    }
  | { ok: false; requestId: number; message: string };
export interface Renderer {
  render(
    request: RenderRequest,
    signal?: AbortSignal,
  ): Promise<Extract<RenderResponse, { ok: true }>>;
  dispose(): void;
}
export interface DraftRepository {
  readDraft(): Promise<unknown | undefined>;
  writeDraft(draft: Draft): Promise<void>;
  deleteDraft(): Promise<void>;
  close(): void;
}
// Contract only: no works adapter or works UI is implemented in this milestone.
export interface WorksRepository {
  listWorks(): Promise<readonly DyeWork[]>;
  getWork(id: string): Promise<DyeWork | undefined>;
  saveWork(work: DyeWork): Promise<void>;
  deleteWork(id: string): Promise<void>;
}
export interface ContentRepository {
  cultures(): readonly CultureEntry[];
  stories(): readonly StoryEntry[];
  glossary(): readonly GlossaryEntry[];
  faqs(): readonly FaqEntry[];
  patterns(): readonly PatternTemplate[];
  sources(): readonly SourceRef[];
}
