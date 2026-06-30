import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be blank').max(100).optional(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
