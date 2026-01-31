'use client';

import { getApiClient } from '@/lib/api-client';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';

export function FormRegister() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmitAsync: async ({ value }) => {
        const email = value.email as string;
        const password = value.password as string;
        const client = getApiClient();
        const res = await client.register(email, password);
        if ('error' in res) {
          console.error('Register error:', res.error);
          if (!res.details) {
            setError(res.error);
          } else {
            return {
              fields: res.details.reduce((acc, curr) => {
                const fieldName = curr.path[0] as string;
                acc[fieldName] = curr.message;
                return acc;
              }, {} as Record<string, string>)
            };
          }
        } else {
          setSuccess(true);
        }
      },
    },
    onSubmit: () => {}
  });

  if (success) {
    return <div>Inscription réussie ! Vérifiez votre email.</div>;
  }

  return <form onSubmit={(e) => {
    e.preventDefault();
    form.handleSubmit(e);
  }}>
    <form.Field name="email">
      {(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const errors = field.state.meta.errors;

        return <div className="border">
          <label htmlFor={field.name} className="border">{field.name}</label>
          <input
            type="text"
            className="border"
            name={field.name}
            id={field.name}
            value={field.state.value}
            aria-invalid={isInvalid}
            onChange={(e) => field.setValue(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={field.name}
          />
          {isInvalid && (
            <div className="border text-red-500">
              {errors.join(', ')}
            </div>
          )}
        </div>
      }}
    </form.Field>
    <form.Field name="password">
      {(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const errors = field.state.meta.errors;

        return <div className="border">
          <label htmlFor={field.name} className="border">{field.name}</label>
          <input
            type="password"
            className="border"
            name={field.name}
            id={field.name}
            value={field.state.value}
            aria-invalid={isInvalid}
            onChange={(e) => field.setValue(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={field.name}
          />
          {isInvalid && (
            <div className="border text-red-500">
              {errors.join(', ')}
            </div>
          )}
        </div>
      }}
    </form.Field>
    {error && <div className="border text-red-500">{error}</div>}
    <button type="submit">Register</button>
  </form>;
}
