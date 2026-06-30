import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest"
import { analyzeArtifact } from "@/inngest/functions/analyze"
import { sendRenewalReminders } from "@/inngest/functions/renewal-reminder"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    analyzeArtifact,
    sendRenewalReminders,
  ],
})
