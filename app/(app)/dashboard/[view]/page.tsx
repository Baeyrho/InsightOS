import { notFound } from "next/navigation"
import ProjectsView from "@/components/dashboard/views/ProjectsView"
import InsightsView from "@/components/dashboard/views/InsightsView"
import ReportsView from "@/components/dashboard/views/ReportsView"

interface Props {
  params: Promise<{ view: string }>
}

const VIEWS = ["projects", "insights", "reports"] as const

export default async function DashboardViewPage({ params }: Props) {
  const { view } = await params

  if (!VIEWS.includes(view as typeof VIEWS[number])) {
    notFound()
  }

  switch (view) {
    case "projects":
      return <ProjectsView />
    case "insights":
      return <InsightsView />
    case "reports":
      return <ReportsView />
    default:
      notFound()
  }
}
