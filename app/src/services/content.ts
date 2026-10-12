import type { ContentRepository } from "../shared/types";
import { cultures, stories, glossary, faqs, sources } from "../content/entries";
import { patterns } from "../content/patterns";

export const contentRepository: ContentRepository = {
  cultures: () => cultures,
  stories: () => stories,
  glossary: () => glossary,
  faqs: () => faqs,
  patterns: () => patterns,
  sources: () => sources,
};
