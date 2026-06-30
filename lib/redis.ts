import { Redis } from "@upstash/redis"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

export const redis = new Redis({
  url: requireEnv("UPSTASH_REDIS_REST_URL"),
  token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
})
