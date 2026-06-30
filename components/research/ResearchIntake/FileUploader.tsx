"use client"

import React from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/Button/Button"
import { genUploader } from "uploadthing/client"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { createFileArtifact } from "@/lib/actions/artifact"
import styles from "./ResearchIntake.module.css"

const uploader = genUploader<OurFileRouter>({
  url: "/api/uploadthing",
})

export function FileUploader({ projectId, onSuccess }: { projectId: string; onSuccess?: () => void }) {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const [result] = await uploader.uploadFiles("researchUpload", {
        files: [file],
      })
      const fileUrl = (result as any).ufsUrl ?? (result as any).url
      if (!fileUrl) {
        throw new Error("Upload succeeded but no file URL was returned")
      }
      await createFileArtifact({
        projectId,
        title: file.name,
        fileUrl,
        fileName: file.name,
      })
      setUploading(false)
      onSuccess?.()
    } catch (err) {
      let message = "Upload failed"
      if (err instanceof Error) {
        message = err.message
      } else if (typeof err === "string") {
        message = err
      } else if (err && typeof err === "object") {
        const obj = err as Record<string, unknown>
        message = (typeof obj.message === "string" ? obj.message : obj.code ? String(obj.code) : JSON.stringify(err)) || "Upload failed"
      }
      console.error("[upload]", err)
      setError(message)
      setUploading(false)
    }
  }

  function resetError() {
    setError(null)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const dropzoneClasses = [
    styles.dropzone,
    isDragOver && styles.dropzoneActive,
    uploading && styles.dropzoneDisabled,
    error && styles.dropzoneError,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div
      className={dropzoneClasses}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => {
        if (!uploading) {
          resetError()
          inputRef.current?.click()
        }
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Upload a PDF, DOCX, TXT, CSV, or MD file"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.csv,.md"
        className={styles.fileInput}
        onChange={handleInputChange}
        disabled={uploading}
      />
      <Upload className={styles.dropzoneIcon} size={24} aria-hidden="true" />
      {error ? (
        <p className={styles.dropzoneErrorText}>{error}</p>
      ) : (
        <>
          <p className={styles.dropzoneText}>Drag and drop, or click to upload</p>
          <p className={styles.dropzoneHint}>PDF, DOCX, TXT, CSV, or MD &middot; up to 10MB</p>
        </>
      )}
      <Button
        variant={error ? "primary" : "outline"}
        size="sm"
        isLoading={uploading}
        onClick={(e) => {
          e.stopPropagation()
          resetError()
          inputRef.current?.click()
        }}
      >
        {uploading ? "Uploading..." : error ? "Try again" : "Select Files"}
      </Button>
    </div>
  )
}
