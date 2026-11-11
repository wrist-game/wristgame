import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

function FieldShell({ id, label, error, hint, optional, children }: FieldShellProps) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label className="field-label" htmlFor={id}>
        {label}
        {optional && <span className="field__optional"> (optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

type CommonProps = { id: string; label: string; error?: string; hint?: string; optional?: boolean };

export function TextField({ id, label, error, hint, optional, ...input }: CommonProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <input id={id} name={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input} />
    </FieldShell>
  );
}

export function TextAreaField({ id, label, error, hint, optional, ...input }: CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <textarea id={id} name={id} className="input input--area" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input} />
    </FieldShell>
  );
}

export function SelectField({ id, label, error, hint, optional, children, ...input }: CommonProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <select id={id} name={id} className="input input--select" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...input}>
        {children}
      </select>
    </FieldShell>
  );
}
