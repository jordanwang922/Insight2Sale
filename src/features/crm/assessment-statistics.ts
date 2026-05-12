import { parseJson } from "@/lib/utils";

type AssessmentStatisticFieldKey =
  | "residenceCity"
  | "memberStatus"
  | "gender"
  | "ageRange"
  | "education"
  | "childrenCount"
  | "childAgeRanges"
  | "decisionMakerCount"
  | "primaryCaretaker"
  | "parentingRole"
  | "occupationCategory";

type IntakeData = Partial<Record<AssessmentStatisticFieldKey, string>>;

export interface AssessmentStatisticSubmission {
  intakeData: string;
  customer: Partial<Record<AssessmentStatisticFieldKey, string | null>>;
}

export interface AssessmentStatisticSlice {
  label: string;
  count: number;
}

export interface AssessmentStatisticGroup {
  key: AssessmentStatisticFieldKey;
  title: string;
  total: number;
  slices: AssessmentStatisticSlice[];
}

export const assessmentStatisticFields: Array<{
  key: AssessmentStatisticFieldKey;
  title: string;
  multi?: boolean;
}> = [
  { key: "residenceCity", title: "长期居住城市" },
  { key: "memberStatus", title: "会员情况" },
  { key: "gender", title: "性别" },
  { key: "ageRange", title: "年龄段" },
  { key: "education", title: "学历" },
  { key: "childrenCount", title: "孩子数量" },
  { key: "childAgeRanges", title: "孩子年龄段", multi: true },
  { key: "decisionMakerCount", title: "育儿决策人数" },
  { key: "primaryCaretaker", title: "日常照顾者" },
  { key: "parentingRole", title: "养育角色" },
  { key: "occupationCategory", title: "职业类别" },
];

function normalizeValue(value: unknown) {
  return String(value ?? "").trim() || "未填写";
}

function readFieldValues(
  submission: AssessmentStatisticSubmission,
  key: AssessmentStatisticFieldKey,
  multi = false,
) {
  const intake = parseJson<IntakeData>(submission.intakeData, {});
  const raw = intake[key] ?? submission.customer[key] ?? "";

  if (!multi) return [normalizeValue(raw)];

  const parsed = parseJson<string[] | string>(String(raw || "[]"), []);
  if (Array.isArray(parsed)) {
    return parsed.length ? parsed.map(normalizeValue) : ["未填写"];
  }

  return [normalizeValue(parsed)];
}

function sortSlices(slices: AssessmentStatisticSlice[]) {
  return [...slices].sort((a, b) => {
    if (a.label === "未填写") return 1;
    if (b.label === "未填写") return -1;
    return b.count - a.count || a.label.localeCompare(b.label, "zh-CN");
  });
}

export function buildAssessmentStatistics(
  submissions: AssessmentStatisticSubmission[],
): AssessmentStatisticGroup[] {
  return assessmentStatisticFields.map((field) => {
    const counts = new Map<string, number>();

    for (const submission of submissions) {
      for (const value of readFieldValues(submission, field.key, field.multi)) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }

    const slices = sortSlices(
      Array.from(counts, ([label, count]) => ({
        label,
        count,
      })),
    );

    return {
      key: field.key,
      title: field.title,
      total: slices.reduce((sum, item) => sum + item.count, 0),
      slices,
    };
  });
}
