'use client';

import React from 'react';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { updateProfile } from '@/lib/actions/user';
import type { UpdateProfileResult } from '@/lib/actions/user';
import styles from './ProfileForm.module.css';

interface ProfileFormProps {
  initialName: string;
  initialEmail: string;
}

export function ProfileForm({ initialName, initialEmail }: ProfileFormProps) {
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setStatus('saving');
    setStatusMessage('');

    const formData = new FormData(e.currentTarget);
    const result: UpdateProfileResult = await updateProfile(formData);

    if (result.success) {
      setStatus('success');
      setStatusMessage('Profile updated successfully.');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        setStatusMessage('Please fix the highlighted fields.');
      } else {
        setStatusMessage(result.error ?? 'Something went wrong.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.fields}>
        <Input
          name="name"
          label="Name"
          defaultValue={initialName}
          placeholder="Your name"
          error={fieldErrors.name?.[0]}
        />
        <Input
          name="email"
          label="Email"
          type="email"
          defaultValue={initialEmail}
          placeholder="your@email.com"
          error={fieldErrors.email?.[0]}
        />
      </div>
      <div className={styles.actions}>
        {status === 'success' && (
          <span className={`${styles.statusMessage} ${styles.success}`}>
            ✓ {statusMessage}
          </span>
        )}
        {status === 'error' && (
          <span className={`${styles.statusMessage} ${styles.errorStatus}`}>
            {statusMessage}
          </span>
        )}
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
