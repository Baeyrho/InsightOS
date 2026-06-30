"use client"

import React from "react"
import * as Tabs from "@radix-ui/react-tabs"
import { X } from "lucide-react"
import { Button } from "@/components/ui/Button/Button"
import { Input } from "@/components/ui/Input/Input"
import { Card } from "@/components/ui/Card/Card"
import { createArtifact } from "@/lib/actions/artifact"
import { FileUploader } from "./FileUploader"
import styles from "./ResearchIntake.module.css"

export function ResearchIntake({ projectId, onSuccess, onCancel }: { projectId: string; onSuccess?: () => void; onCancel?: () => void }) {
  const [pending, setPending] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const canSubmit = title.trim().length > 0 && content.trim().length > 0

  async function handlePaste(formData: FormData) {
    setPending(true)
    formData.set("projectId", projectId)
    try {
      await createArtifact(formData)
      onSuccess?.()
    } catch {
      setPending(false)
    }
  }

  return (
    <Card className={styles.card}>
      <Tabs.Root defaultValue="upload" className={styles.tabsRoot}>
        <div className={styles.tabsHeader}>
          <Tabs.List className={styles.tabsList} aria-label="Select input method">
            <Tabs.Trigger value="upload" className={styles.tabsTrigger}>
              Upload File
            </Tabs.Trigger>
            <Tabs.Trigger value="paste" className={styles.tabsTrigger}>
              Paste Text
            </Tabs.Trigger>
          </Tabs.List>
          {onCancel && (
            <button type="button" className={styles.closeButton} onClick={onCancel} aria-label="Cancel">
              <X size={18} />
            </button>
          )}
        </div>

        <Tabs.Content value="upload" className={styles.tabsContent}>
          <FileUploader projectId={projectId} onSuccess={onSuccess} />
        </Tabs.Content>

        <Tabs.Content value="paste" className={styles.tabsContent}>
          <form action={handlePaste} className={styles.pasteForm}>
            <Input
              name="title"
              label="Title"
              placeholder="e.g. Customer interview #3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className={styles.fieldGroup}>
              <label htmlFor="paste-content" className={styles.fieldLabel}>
                Content
              </label>
              <textarea
                id="paste-content"
                name="content"
                className={styles.textarea}
                placeholder="Paste research notes or transcripts here\u2026"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              isLoading={pending}
              disabled={!canSubmit}
              className={styles.submitButton}
            >
              Add Research
            </Button>
          </form>
        </Tabs.Content>
      </Tabs.Root>
    </Card>
  )
}
