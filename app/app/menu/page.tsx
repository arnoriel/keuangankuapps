'use client';

import '@/styles/menu.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getUserName, setUserName as persistUserName } from '@/lib/storage';
import { isBiometricActive, isBiometricCapable, removeWebAuthn } from '@/lib/security';
import ChangePinSheet from '@/components/ChangePinSheet';
import BiometricSheet from '@/components/BiometricSheet';
import HelpSheet from '@/components/HelpSheet';
import ExportSheet from '@/components/ExportSheet';

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function MenuPage() {
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricCapable, setBiometricCapable] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [showBiometricSheet, setShowBiometricSheet] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setName(getUserName());
    isBiometricActive().then(setBiometricOn);
    isBiometricCapable().then(setBiometricCapable);
  }, []);

  useEffect(() => {
    if (editingName) inputRef.current?.focus();
  }, [editingName]);

  const refreshBiometricState = useCallback(() => {
    isBiometricActive().then(setBiometricOn);
  }, []);

  // ── Autosave nama (debounced) ──
  function handleNameChange(value: string) {
    setName(value);
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed) {
        persistUserName(trimmed);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } else {
        setSaveStatus('idle');
      }
    }, 600);
  }

  function handleNameBlur() {
    setEditingName(false);
    const trimmed = name.trim();
    if (!trimmed) {
      // Jangan biarkan nama kosong tersimpan — kembalikan ke nama lama
      setName(getUserName());
    }
  }

  function handleBiometricToggleClick() {
    if (biometricOn) {
      // Matikan biometrik
      removeWebAuthn();
      setBiometricOn(false);
    } else {
      setShowBiometricSheet(true);
    }
  }

  return (
    <>
      {/* HEADER — nama profile di tengah atas, bisa ditekan untuk edit */}
      <header className="menu-header">
        <div className="menu-profile">
          <div className="menu-avatar">
            <i className="fa-solid fa-user" />
          </div>

          {editingName ? (
            <div className="menu-name-edit-wrap">
              <input
                ref={inputRef}
                className="menu-name-input"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                maxLength={30}
                placeholder="Nama kamu"
              />
            </div>
          ) : (
            <button
              className="menu-name-display"
              onClick={() => setEditingName(true)}
              aria-label="Edit nama profile"
            >
              <span>{name || 'Tanpa Nama'}</span>
              <i className="fa-solid fa-pen menu-name-edit-icon" />
            </button>
          )}

          <div className={`menu-save-status ${saveStatus !== 'idle' ? 'visible' : ''}`}>
            {saveStatus === 'saving' && (
              <><i className="fa-solid fa-circle-notch fa-spin" /> Menyimpan...</>
            )}
            {saveStatus === 'saved' && (
              <><i className="fa-solid fa-check" /> Tersimpan</>
            )}
          </div>
        </div>
      </header>

      {/* LIST OPTIONS */}
      <section className="menu-section">
        <div className="menu-section-label">Keamanan</div>

        <div className="menu-list">
          <button className="menu-item" onClick={() => setShowChangePin(true)}>
            <div className="menu-item-icon menu-item-icon-brand">
              <i className="fa-solid fa-lock" />
            </div>
            <div className="menu-item-body">
              <div className="menu-item-title">Ubah PIN</div>
              <div className="menu-item-sub">Ganti PIN keamanan 6 digit kamu</div>
            </div>
            <i className="fa-solid fa-chevron-right menu-item-chevron" />
          </button>

          <div className="menu-divider" />

          <button
            className="menu-item"
            onClick={handleBiometricToggleClick}
            disabled={!biometricOn && !biometricCapable}
          >
            <div className={`menu-item-icon ${biometricOn ? 'menu-item-icon-green' : 'menu-item-icon-brand'}`}>
              <i className="fa-solid fa-fingerprint" />
            </div>
            <div className="menu-item-body">
              <div className="menu-item-title">
                {biometricOn ? 'Biometrik Aktif' : 'Tambahkan Biometrik'}
              </div>
              <div className="menu-item-sub">
                {biometricOn
                  ? 'Sidik jari / Face ID aktif untuk membuka app'
                  : biometricCapable
                  ? 'Buka app lebih cepat dengan sidik jari / Face ID'
                  : 'Tidak didukung di perangkat/browser ini'}
              </div>
            </div>
            {biometricOn ? (
              <span className="menu-item-toggle menu-item-toggle-on">
                <span className="menu-item-toggle-dot" />
              </span>
            ) : (
              <i className="fa-solid fa-chevron-right menu-item-chevron" />
            )}
          </button>
        </div>

        <div className="menu-section-label">Lainnya</div>

        <div className="menu-list">
          <button className="menu-item" onClick={() => setShowExport(true)}>
            <div className="menu-item-icon menu-item-icon-green">
              <i className="fa-solid fa-file-export" />
            </div>
            <div className="menu-item-body">
              <div className="menu-item-title">Export Laporan Keuangan</div>
              <div className="menu-item-sub">Unduh laporan lengkap dalam bentuk PDF</div>
            </div>
            <i className="fa-solid fa-chevron-right menu-item-chevron" />
          </button>

          <div className="menu-divider" />

          <button className="menu-item" onClick={() => setShowHelp(true)}>
            <div className="menu-item-icon menu-item-icon-amber">
              <i className="fa-solid fa-circle-question" />
            </div>
            <div className="menu-item-body">
              <div className="menu-item-title">Bantuan</div>
              <div className="menu-item-sub">Cara memakai aplikasi Keuanganku</div>
            </div>
            <i className="fa-solid fa-chevron-right menu-item-chevron" />
          </button>
        </div>
      </section>

      <div className="menu-version">Keuanganku v1.0</div>

      <div style={{ height: 24 }} />

      {showChangePin && (
        <ChangePinSheet onClose={() => setShowChangePin(false)} />
      )}

      {showBiometricSheet && (
        <BiometricSheet
          onClose={() => setShowBiometricSheet(false)}
          onActivated={() => {
            setShowBiometricSheet(false);
            refreshBiometricState();
          }}
        />
      )}

      {showHelp && (
        <HelpSheet onClose={() => setShowHelp(false)} />
      )}

      {showExport && (
        <ExportSheet onClose={() => setShowExport(false)} />
      )}
    </>
  );
}