import type {
  CultureEntry,
  StoryEntry,
  GlossaryEntry,
  FaqEntry,
  SourceRef,
} from "../shared/types";
import sampleDye from "../assets/sample-dye-export.png";

export const sources: readonly SourceRef[] = [
  {
    id: "ihchina-zhoucheng",
    title: "大理周城白族的扎染工艺",
    publisher: "中国非物质文化遗产网",
    url: "https://www.ihchina.cn/news_1_details/11139.html",
    accessedAt: "2026-10-12",
    note: "文化样例摘述工艺与配色；未使用文章图片。",
  },
];
export const cultures: readonly CultureEntry[] = [
  {
    id: "zhoucheng-resist",
    title: "周城：蓝与白之间",
    category: "工艺与地域",
    kind: "traditional",
    summary: "从扎花到浸染，认识白族扎染的留白。",
    body: [
      "周城位于云南大理，是白族扎染的重要传承地。当地扎染以蓝、白为主要色彩。",
      "扎花使部分布料不易着色。浸染后拆开线结，花纹与底色之间常出现渐变的色晕。",
      "本平台的圆点与条纹属于原创体验方案，不能据此认定为传统纹样或推断其寓意。",
    ],
    images: [],
    sourceRefs: ["ihchina-zhoucheng"],
    relatedPatternIds: [],
  },
];
export const stories: readonly StoryEntry[] = [
  {
    id: "one-knot",
    title: "一处扎结，一片留白",
    category: "创作手记",
    kind: "original",
    summary: "移动位置，改变大小，观察一方数字布面的变化。",
    body: [
      "从中央的一处扎结开始，留白向四周展开。调大半径，再选择对折，比较留白的位置与节奏。",
      "这是一篇原创数字创作说明。下图由项目 Demo 生成，展示艺术化算法效果，不是传统实物或田野采访记录。",
    ],
    images: [
      {
        src: sampleDye,
        alt: "Demo 生成的蓝白数字扎染纹样",
        caption: "原创数字体验作品 · Demo 导出",
        credit: "Bai Indigo 项目组",
        license: "项目自有数字作品，用于本项目展示",
        sourceRefs: [],
      },
    ],
    sourceRefs: [],
    relatedPatternIds: ["flower"],
  },
];
export const glossary: readonly GlossaryEntry[] = [
  {
    id: "resist",
    term: "防染",
    explanation: "通过扎缠等方式，让部分布料不易着色，展开后形成留白与色晕。",
    kind: "traditional",
    sourceRefs: ["ihchina-zhoucheng"],
  },
];
export const faqs: readonly FaqEntry[] = [
  {
    id: "digital-pattern",
    question: "这里的模板是传统纹样吗？",
    answer:
      "四方纹、单花纹、折叠条纹与自由扎结都是原创体验方案。数字效果是工艺原理的艺术化近似。",
    kind: "original",
    sourceRefs: [],
  },
];
