'use client';

import '@/styles/sheet.css';
import { useState } from 'react';
import { haptics } from '@/lib/haptics';
import {
  ACCOUNT_FIELDS, KIND_LABEL, formatAccountNumber, sanitizeAccountNumber, validateAccountNumber,
  type AccountKind,
} from '@/lib/accountNumber';
import PlatformIcon from './PlatformIcon';
import SheetPortal from './SheetPortal';

interface FormProps {
  platformSlug: string;
  name: string;
  kind: AccountKind;
  initial?: string;
  title: string;
  submitLabel: string;
  skipLabel: string;
  /** Kosong = tanpa nomor. */
  onSubmit: (accountNumber: string) => void;
  onSkip: () => void;
  onBack?: () => void;
  onClose: () => void;
}

export function SubCardDetailForm({
  platformSlug, name, kind, initial = '', title, submitLabel, skipLabel, onSubmit, onSkip, onBack, onClose,
}: FormProps) {
  const field = ACCOUNT_FIELDS[kind];
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const error = touched ? validateAccountNumber(kind, value) : null;

  function handleSubmit() {
    setTouched(true);
    if (validateAccountNumber(kind, value)) {
      haptics.warning();
      return;
    }
    haptics.success();
    onSubmit(value);
  }

  return (
    <>
      <div className="sheet-header">
        <button className="sheet-close" onClick={onBack ?? onClose} aria-label={onBack ? 'Kembali' : 'Tutup'}>
          <i className={`fa-solid ${onBack ? 'fa-arrow-left' : 'fa-xmark'}`} />
        </button>
        <h2 className="sheet-title">{title}</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="account-hero">
        <PlatformIcon platformSlug={platformSlug} size={44} />
        <div className="account-hero-text">
          <span className="account-hero-name">{name}</span>
          <span className="account-hero-kind">{KIND_LABEL[kind]}</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          {field.label} <span className="label-optional">(opsional)</span>
        </label>
        <div className={`amount-input-wrapper${error ? ' input-error' : ''}`}>
          <i className={`fa-solid ${field.icon} account-input-icon`} />
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="amount-input account-input"
            placeholder={field.placeholder}
            value={formatAccountNumber(value)}
            onChange={(e) => setValue(sanitizeAccountNumber(e.target.value, kind))}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </div>
        {error ? (
          <div className="input-error-msg"><i className="fa-solid fa-circle-exclamation" />{error}</div>
        ) : (
          <p className="account-hint"><i className="fa-solid fa-lock" /> {field.hint}</p>
        )}
      </div>

      <button className="btn-primary" onClick={handleSubmit}>{submitLabel}</button>
      <button className="btn-ghost" onClick={onSkip}>{skipLabel}</button>
    </>
  );
}

interface SheetProps {
  platformSlug: string;
  name: string;
  kind: AccountKind;
  initial?: string;
  onSave: (accountNumber: string) => void;
  onClose: () => void;
}

export default function SubCardDetailSheet({ platformSlug, name, kind, initial, onSave, onClose }: SheetProps) {
  const submit = (accountNumber: string) => { onSave(accountNumber); onClose(); };
  return (
    <SheetPortal>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-body">
          <SubCardDetailForm
            platformSlug={platformSlug}
            name={name}
            kind={kind}
            initial={initial}
            title={`Detail ${ACCOUNT_FIELDS[kind].label}`}
            submitLabel="Simpan"
            skipLabel="Batal"
            onSubmit={submit}
            onSkip={onClose}
            onClose={onClose}
          />
        </div>
      </div>
    </SheetPortal>
  );
}
