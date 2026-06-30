import { z } from "zod"
import { PasswordSchema } from "@/lib/password"

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
})

export const RegisterSchema = z.object({
  name: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  password: PasswordSchema,
})

export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
})

export const PasswordResetSchema = z.object({
  password: PasswordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type ForgotPasswordRequestInput = z.infer<typeof ForgotPasswordRequestSchema>
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>
