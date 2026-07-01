import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "insightos",
  isDev: process.env.NODE_ENV === "development",
})
