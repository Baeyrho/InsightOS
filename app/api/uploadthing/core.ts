import { createUploadthing, type FileRouter } from "uploadthing/next"
import { auth } from "@/lib/auth"

const f = createUploadthing()

export const ourFileRouter = {
  researchUpload: f({
    pdf: { maxFileSize: "32MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "32MB" },
    text: { maxFileSize: "4MB" },
    "text/csv": { maxFileSize: "4MB" },
    "application/vnd.ms-excel": { maxFileSize: "4MB" },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user?.id) throw new Error("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
