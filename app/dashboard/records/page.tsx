import { RecordsContent } from "@/components/records/records-content"
import { getRecordsLeaderboards } from "@/lib/records/get-records-leaderboards"

export const revalidate = 10800

export default async function RecordsPage() {
  const leaderboards = await getRecordsLeaderboards()

  return <RecordsContent leaderboards={leaderboards} />
}