"use server"

import { auth } from "@/lib/auth"
import { repos } from "@/lib/services/registry"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const CreateArtifactSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  projectId: z.string().min(1, "Project ID is required"),
})

const CreateFileArtifactSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().min(1, "File name is required"),
})

const ArtifactIdSchema = z.string().min(1, "Artifact ID is required")

export async function createArtifact(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const raw = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    projectId: formData.get("projectId") as string,
  }

  const parsed = CreateArtifactSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "))
  }

  const project = await repos.project.findByIdSelect(parsed.data.projectId, session.user.id, { id: true })
  if (!project) throw new Error("Project not found")

  await repos.artifact.create({
    title: parsed.data.title,
    type: "PASTE",
    content: parsed.data.content,
    project: { connect: { id: parsed.data.projectId } },
  })

  revalidatePath(`/dashboard/projects/${parsed.data.projectId}`)
}

export async function createFileArtifact(data: {
  projectId: string
  title: string
  fileUrl: string
  fileName: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = CreateFileArtifactSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "))
  }

  const project = await repos.project.findByIdSelect(parsed.data.projectId, session.user.id, { id: true })
  if (!project) throw new Error("Project not found")

  await repos.artifact.create({
    title: parsed.data.title,
    type: "FILE",
    content: null,
    fileUrl: parsed.data.fileUrl,
    fileName: parsed.data.fileName,
    project: { connect: { id: parsed.data.projectId } },
  })

  revalidatePath(`/dashboard/projects/${parsed.data.projectId}`)
}

export async function deleteArtifact(artifactId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = ArtifactIdSchema.safeParse(artifactId)
  if (!parsed.success) throw new Error("Invalid artifact ID")

  const artifact = await repos.artifact.findByIdWithProject(parsed.data, session.user.id)
  if (!artifact) throw new Error("Artifact not found")

  await repos.artifact.delete(parsed.data)

  revalidatePath(`/dashboard/projects/${artifact.projectId}`)
}
