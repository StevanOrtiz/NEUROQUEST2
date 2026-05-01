import { ImpactReportContent } from "@/components/dashboard/impact-report-content"
import { getDashboardUser } from "@/lib/auth/dashboard-user"

export default async function ImpactPage() {
  const { supabase, user } = await getDashboardUser()

  const { data } = await supabase
    .from("user_usage_reports")
    .select("report_type,streak_day,created_at,metrics,comparisons")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  const reports = (data ?? []) as any[]
  const baseline = reports.find((report) => report.report_type === "baseline") ?? null
  const day3 = reports.find((report) => report.report_type === "day3") ?? null

  return <ImpactReportContent baseline={baseline} day3={day3} />
}
