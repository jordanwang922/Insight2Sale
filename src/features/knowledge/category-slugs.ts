import type { KnowledgeCategory } from "@/features/knowledge/categories";
import { knowledgeCategories } from "@/features/knowledge/categories";

/** URL 段，与中文分类一一对应 */
export const CATEGORY_SLUGS: Record<KnowledgeCategory, string> = {
  课程体系库: "course-system",
  测评解读库: "assessment-interpretation",
  专家话术库: "expert-scripts",
  案例库: "cases",
  禁用表达库: "forbidden-expressions",
  关键词与风格库: "keywords-style",
};

const slugToCategory = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([cat, slug]) => [slug, cat]),
) as Record<string, KnowledgeCategory>;

export function categoryFromSlug(slug: string): KnowledgeCategory | null {
  return slugToCategory[slug] ?? null;
}

export function slugFromCategory(category: string): string | null {
  if (!knowledgeCategories.includes(category as KnowledgeCategory)) {
    return null;
  }
  return CATEGORY_SLUGS[category as KnowledgeCategory];
}
