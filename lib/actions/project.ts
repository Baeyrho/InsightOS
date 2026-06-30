"use server"

import { auth } from "@/lib/auth"
import { repos } from "@/lib/services/registry"
import { CreateProjectSchema } from "@/lib/validations/project"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const ProjectIdSchema = z.string().min(1, "Project ID is required")

export async function createProject(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const raw = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
  }

  const parsed = CreateProjectSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "))
  }
  
  const project = await repos.project.create(session.user.id, parsed.data)
  
  revalidatePath("/dashboard")
  redirect(`/dashboard/projects/${project.id}`)
}

export async function deleteProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = ProjectIdSchema.safeParse(projectId)
  if (!parsed.success) throw new Error("Invalid project ID")

  await repos.project.softDelete(parsed.data, session.user.id)

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function restoreProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = ProjectIdSchema.safeParse(projectId)
  if (!parsed.success) throw new Error("Invalid project ID")

  await repos.project.restore(parsed.data, session.user.id)

  revalidatePath("/dashboard")
}

export async function archiveProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = ProjectIdSchema.safeParse(projectId)
  if (!parsed.success) throw new Error("Invalid project ID")

  await repos.project.archive(parsed.data, session.user.id)

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/projects/${parsed.data}`)
}

export async function unarchiveProject(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = ProjectIdSchema.safeParse(projectId)
  if (!parsed.success) throw new Error("Invalid project ID")

  await repos.project.unarchive(parsed.data, session.user.id)

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/projects/${parsed.data}`)
}
