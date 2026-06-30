import { hash, compare } from "bcryptjs"
import { z } from "zod"

export const BCRYPT_SALT_ROUNDS = 14

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a digit")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character")

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}
