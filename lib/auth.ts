import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { verifyPassword } from "@/lib/password"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          try {
            const user = await prisma.user.findUnique({ where: { email } })
            if (!user || !user.passwordHash) return null

            const passwordsMatch = await verifyPassword(password, user.passwordHash)
            if (passwordsMatch) return user
          } catch {
            return null
          }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
  },
})

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session
}
