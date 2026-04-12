import { redirect } from "next/navigation";
import { getPrimaryAssessment } from "@/features/crm/queries";

export default async function AssessmentStartPage() {
  const primary = await getPrimaryAssessment();
  if (primary) {
    redirect(`/assessment/${primary.slug}`);
  }

  redirect("/assessment");
}
