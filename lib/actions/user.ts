'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateProfileSchema } from '@/lib/validations/user';
import { revalidatePath } from 'next/cache';
import { repos } from '@/lib/services/registry';

export type UpdateProfileResult =
  | { success: true }
  | { success: false; fieldErrors?: Record<string, string[]>; error?: string };

export async function updateProfile(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  const parsed = UpdateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { success: false, fieldErrors };
  }

  const { name, email } = parsed.data;

  const existing = await repos.user.findByEmail(email);
  if (existing && existing.id !== session.user.id) {
    return {
      success: false,
      fieldErrors: { email: ['That email address is already in use.'] },
    };
  }

  const retired = await prisma.retiredEmail.findUnique({ where: { email } });
  if (retired) {
    return {
      success: false,
      fieldErrors: { email: ['That email address is not available.'] },
    };
  }

  const currentUser = await repos.user.findByIdSelect(session.user.id, { email: true });
  const currentEmail = currentUser?.email;
  const isEmailChanging = !!currentEmail && currentEmail !== email;

  if (isEmailChanging) {
    await prisma.retiredEmail.create({ data: { email: currentEmail, userId: session.user.id } });
    await repos.user.update(session.user.id, { name: name ?? undefined, email });
  } else {
    await repos.user.update(session.user.id, { name: name ?? undefined, email });
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { success: true };
}
