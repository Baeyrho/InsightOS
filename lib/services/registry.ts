import type {
  IUserRepository,
  IProjectRepository,
  ISubscriptionRepository,
  IArtifactRepository,
  IAnalysisJobRepository,
  IInsightRepository,
} from "@/lib/repositories/interfaces"
import { UserRepository } from "@/lib/repositories/prisma/user.repository"
import { ProjectRepository } from "@/lib/repositories/prisma/project.repository"
import { SubscriptionRepository } from "@/lib/repositories/prisma/subscription.repository"
import { ArtifactRepository } from "@/lib/repositories/prisma/artifact.repository"
import { AnalysisJobRepository } from "@/lib/repositories/prisma/analysis-job.repository"
import { InsightRepository } from "@/lib/repositories/prisma/insight.repository"

export class ServiceRegistry {
  private static instance: ServiceRegistry

  readonly user: IUserRepository
  readonly project: IProjectRepository
  readonly subscription: ISubscriptionRepository
  readonly artifact: IArtifactRepository
  readonly analysisJob: IAnalysisJobRepository
  readonly insight: IInsightRepository

  private constructor() {
    this.user = new UserRepository()
    this.project = new ProjectRepository()
    this.subscription = new SubscriptionRepository()
    this.artifact = new ArtifactRepository()
    this.analysisJob = new AnalysisJobRepository()
    this.insight = new InsightRepository()
  }

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry()
    }
    return ServiceRegistry.instance
  }
}

export const repos = ServiceRegistry.getInstance()
