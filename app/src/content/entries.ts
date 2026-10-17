import type {
  CultureEntry,
  StoryEntry,
  GlossaryEntry,
  FaqEntry,
  SourceRef,
} from "../shared/types";
import sampleDye from "../assets/sample-dye-export.png";
import butterflyField from "../assets/butterfly-field.jpg.jpg";
import cctvBaiDyeing from "../assets/cctv-bai-indigo-2025.png";
import butterflySpring from "../assets/hudiequan.jpg";
import wangfuyun from "../assets/wangfuyun.jpg";
import baiDyeingShowcase from "../assets/zhanshi.jpg";

export const sources: readonly SourceRef[] = [
  {
    id: "ihchina-zhoucheng",
    title: "大理周城白族的扎染工艺",
    publisher: "中国非物质文化遗产网",
    url: "https://www.ihchina.cn/news_1_details/11139.html",
    accessedAt: "2026-10-12",
    note: "文化样例摘述工艺与配色；未使用文章图片。",
  },
  {
    id: "journal-butterfly",
    title: "大理白族扎染蝴蝶纹饰的图像学研究（论文选摘）",
    publisher: "《艺术设计研究》（北京服装学院主办）",
    url: "https://mp.weixin.qq.com/s/qW3ra9fuW_WX2WOGaGsK_A",
    accessedAt: "2026-10-15",
    note: "论文摘要：蝴蝶纹分类与寓意，作者陈雷、柏贵喜。",
  },
    {
    id: "cctv-bai-indigo-2025",
    title: "白族扎染：指尖流转蓝白韵",
    publisher: "新华网（央视网才艺专栏刊载）",
    url: "https://caiyi.cctv.com/2025/11/26/ARTI6s5jtKJrnsiYYWzFJycu251126.shtml",
    accessedAt: "2026-10-17",
    note: "页面发布日期：2025年11月26日；原标题：白族扎染：指尖流转蓝白韵。",
  },
  {
  id: "cctv-yuan-xiaoxin-2023",
  title: "高质量发展调研行丨返乡“新农人”袁孝鑫：创办扎染工坊 传承非遗文化",
  publisher: "新华网（央视网民声频道刊载）",
  url: "https://people.cctv.com/2023/10/11/ARTIYULNMlIf8GuPeb4IXClT231011.shtml",
  accessedAt: "2026-10-17",
  note: "原标题：高质量发展调研行丨返乡“新农人”袁孝鑫：创办扎染工坊 传承非遗文化；发布日期：2023年10月11日。",
},
{
  id: "ihchina-bai-dyeing-renewal",
  title: "两代白族扎染传承人的“赋新”之路",
  publisher: "中国非物质文化遗产网·中国非物质文化遗产数字博物馆",
  url: "https://www.ihchina.cn/project_details/21344.html",
  accessedAt: "2026-10-17",
  note: "页面未显示发布日期。",
},
{
  id: "baike-butterfly-spring",
  title: "大理蝴蝶泉景区官网｜国家4A级景区",
  publisher: "大理蝴蝶泉景区",
  url: "https://www.ynhdq.com/",
  accessedAt: "2026-10-17",
  note: "官网首页介绍恋人跳入无底潭、化作彩蝶的传说；未见发布日期。",
},
{
  id: "baike-wangfuyun",
  title: "望夫云（云南大理神话故事）",
  publisher: "百度百科",
  url: "https://baike.baidu.com/item/%E6%9C%9B%E5%A4%AB%E4%BA%91/2183257",
  accessedAt: "2026-10-17",
  note: "页面访问返回 403；发布日期未核实，故事内容依据用户提供的词条文字整理。",
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
  {
    id: "butterfly-pattern",
    title: "蝴蝶纹：扎染中的经典纹样",
    category: "纹样与寓意",
    kind: "traditional",
    summary:
      "蝴蝶纹是白族扎染最具代表性的纹样，承载忠贞爱情与吉祥美好的寓意。",
    body: [
      "蝴蝶纹是白族扎染纹饰中最具代表性的纹样。研究者通过田野调查与图像学分析，将其分为单一式、复合式与几何变异式三类。",
      "技法、结构与色彩等要素决定了蝴蝶纹的艺术风格；白族人赋予蝴蝶纹忠贞爱情和吉祥美好的象征寓意，并通过不同组合形式加以表达。",
      "白族民众信仰观念的嵌入、村落文化氛围的熏染与多元文化的交融，是蝴蝶纹得以长久流传的关键因素。",
    ],
    images: [
      {
        src: butterflyField,
        alt: "深蓝底白色蝴蝶纹样的白族扎染织物",
        caption: "白族扎染蝴蝶纹样（论文作者田野调查拍摄）",
        credit: "陈雷、柏贵喜（田野调查）",
        license: "论文作者田野调查拍摄",
        sourceRefs: ["journal-butterfly"],
      },
    ],
    sourceRefs: ["journal-butterfly"],
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
    {
    id: "zhoucheng-dyeing-fingertips",
    title: "白族扎染：指尖流转蓝白韵",
    category: "工艺与地域",
    kind: "traditional",
    summary: "报道介绍周城白族扎染的地域背景、主要工序及其蓝底白花的工艺特点。",
    body: [
      "报道介绍，周城位于大理市喜洲镇，是白族扎染的重要传承地。当地扎染是传统手工印染工艺，距今已有上千年历史。",
      "白族扎染于2006年列入第一批国家级非物质文化遗产名录。它以板蓝根为主要染料，工序包括绘图、制版、印花、扎花、染色、漂洗、拆花和晾晒，其中扎花与浸染是核心步骤。",
    ],
    images: [
      {
        src: cctvBaiDyeing,
        alt: "白族扎染技艺传承人段银妹与手工艺人段利兰在周城璞真染坊拆花",
        caption: "段银妹与段利兰在周城村璞真染坊拆花（2025年11月21日摄）",
        credit: "新华社记者 胡超",
        license: "已获授权用于本项目展示",
        sourceRefs: ["cctv-bai-indigo-2025"],
      },
    ],
    sourceRefs: ["cctv-bai-indigo-2025"],
    relatedPatternIds: [],
  },
  {
  id: "yuan-xiaoxin-dyeing-workshop",
  title: "返乡“新农人”袁孝鑫：创办扎染工坊 传承非遗文化",
  category: "人物与传承",
  kind: "traditional",
  summary: "报道讲述袁孝鑫返乡创办植物扎染工坊，并在发展工坊的过程中传承扎染技艺。",
  body: [
    "袁孝鑫从重庆城区回到巫山县竹贤乡下庄村，于2022年初创办“下庄布谷”植物扎染工坊。她通过网上学习并持续练习，逐渐提升自己的扎染技艺。",
    "她于2022年底成为巫山县第六批县级非物质文化遗产代表性传承人。同时，她在工坊尝试不同染料和图案，并让游客亲自体验制作扎染工艺品。",
  ],
  images: [
    {
      src: "https://p2.img.cctvpic.com/photoworkspace/contentimg/2023/10/11/2023101100202382316.jpg",
      alt: "袁孝鑫在重庆市巫山县竹贤乡下庄村展示扎染产品",
      caption: "10月10日，袁孝鑫在下庄村展示扎染产品",
      credit: "新华社记者 黄伟",
      license: "已获授权用于本项目展示",
      sourceRefs: ["cctv-yuan-xiaoxin-2023"],
    },
  ],
  sourceRefs: ["cctv-yuan-xiaoxin-2023"],
  relatedPatternIds: [],
},
{
  id: "bai-dyeing-renewal-generations",
  title: "两代白族扎染传承人的“赋新”之路",
  category: "人物与传承",
  kind: "traditional",
  summary: "报道介绍周城段氏扎染传承人通过创新针法、天然染料、产品开发和体验活动，让白族扎染延续发展的实践。",
  body: [
    "报道记录了周城段氏扎染传承人的创新实践：段银开在传统针法基础上继续探索扎法，段树坤尝试开发天然染料，并改进染色方法。",
    "段氏夫妇还开发扎染产品、创建扎染博物馆，并与高校、旅行社等合作开展体验和培训。更让人高兴的是，如今有年轻一代回到周城，继续尝试将传统技艺与现代设计结合。",
  ],
 images: [
  {
    src: baiDyeingShowcase,
    alt: "两人展示蓝白扎染织物",
    caption: "段银开(左)和段树坤(右)展示新染出的裙子",
    credit: "中新社记者 刘冉阳",
    license: "已获授权用于本项目展示",
    sourceRefs: ["ihchina-bai-dyeing-renewal"],
  },
],
  sourceRefs: ["ihchina-bai-dyeing-renewal"],
  relatedPatternIds: [],
},
{
  id: "butterfly-spring-bai-legend",
  title: "白族传说：雯姑与霞朗化蝶",
  category: "白族传说",
  kind: "traditional",
  summary: "词条记载了白族恋人殉情化蝶、无底潭被称为蝴蝶泉的传说，并提及农历四月十五日的蝴蝶会。",
  body: [
    "词条记载了一个版本：白族姑娘雯姑与猎人霞朗相爱，雯姑被王子抢走后获霞朗营救，两人逃至无底潭边遭追兵围困，最终牵手跳潭殉情，化作一对形影不离的彩蝶，后人遂将无底潭改名蝴蝶泉并定下蝴蝶会。",
    " 传说的另一个版本为白族青年啊龙救出了被恶霸抢走的恋人啊花，两人遭追兵逼至无路可退，为追求自由爱情双双跳入“无底潭”，随后化作一双彩蝶飞出水面引来万蝶相聚。从此无底潭被称为蝴蝶泉，殉情之日也被定为蝴蝶会。",
  ],
  images: [
    {
      src: butterflySpring,
      alt: "蝴蝶泉泉水、树木与石栏景观",
      caption: "蝴蝶泉景观",
      credit: "未知拍摄者",
      license: "已获授权用于本项目展示",
      sourceRefs: [],
    },
  ],
  sourceRefs: ["baike-butterfly-spring"],
  relatedPatternIds: [],
},
{
  id: "wangfuyun-bai-legend",
  title: "白族传说：阿凤公主化作望夫云",
  category: "白族传说",
  kind: "traditional",
  summary: "望夫云传说讲述阿凤公主与苍山猎人的爱情，以及公主化作云彩、洱海因而起风的故事。",
  body: [
    "南诏阿凤公主与猎人相爱遭阻，猎人被害化作海底石骡，公主忧愤而死化作“望夫云”，每当狂风大作吹开海水时，便是她试图与爱人相见。",
  ],
  images: [
    {
      src: wangfuyun,
      alt: "望夫云相关图片",
      caption: "望夫云相关图片（用户提供）",
      credit: "未知拍摄者",
      license: "已获授权用于本项目展示",
      sourceRefs: ["baike-wangfuyun"],
    },
  ],
  sourceRefs: ["baike-wangfuyun"],
  relatedPatternIds: [],
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
