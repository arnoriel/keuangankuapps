'use client';

import '@/styles/sheet.css';
import '@/styles/theme-customizer.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  THEME_PRESETS, THEME_GROUPS, VAR_LABELS,
  getActiveThemeId, getCustomVars, saveCustomVars, setActiveThemeId,
  applyVarsToElement, applyActiveTheme,
  type ThemeId, type ThemeVars, type ThemeVarKey,
} from '@/lib/theme';

interface ThemeCustomizerSheetProps {
  onClose: () => void;
}

type View = 'list' | 'custom';

export default function ThemeCustomizerSheet({ onClose }: ThemeCustomizerSheetProps) {
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<ThemeId>('default');
  const [customVars, setCustomVars] = useState<ThemeVars>(getCustomVars());
  const [savedFlash, setSavedFlash] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const originalTheme = useRef<{ id: ThemeId; vars: ThemeVars }>({ id: 'default', vars: getCustomVars() });

  useEffect(() => {
    const activeId = getActiveThemeId();
    setSelected(activeId);
    originalTheme.current = { id: activeId, vars: getCustomVars() };
  }, []);

  // Preview varies by which preset/custom is highlighted — applies live to
  // an isolated preview card element only (not the whole app) unless
  // user explicitly saves.
  const previewVars = useMemo<ThemeVars>(() => {
    if (selected === 'custom') return customVars;
    const preset = THEME_PRESETS.find((p) => p.id === selected);
    return preset ? preset.vars : THEME_PRESETS[0].vars;
  }, [selected, customVars]);

  useEffect(() => {
    if (previewRef.current) applyVarsToElement(previewRef.current, previewVars);
  }, [previewVars]);

  function handleSelectPreset(id: ThemeId) {
    setSelected(id);
  }

  function handleSave() {
    setActiveThemeId(selected);
    if (selected === 'custom') saveCustomVars(customVars);
    applyActiveTheme();
    setSavedFlash(true);
    setTimeout(() => {
      setSavedFlash(false);
      onClose();
    }, 700);
  }

  function handleClose() {
    // Revert any live full-app changes (in case custom edit mode touched root)
    applyActiveTheme();
    onClose();
  }

  function handleCustomVarChange(key: ThemeVarKey, value: string) {
    setCustomVars((prev) => ({ ...prev, [key]: value }));
  }

  function handleResetCustom() {
    const base = THEME_PRESETS.find((p) => p.id === 'default')!.vars;
    setCustomVars({ ...base });
  }

  const currentPreset = THEME_PRESETS.find((p) => p.id === selected);

  return (
    <div className="overlay" onClick={handleClose}>
      <div className="sheet theme-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <span className="sheet-title">
              {view === 'list' ? 'Ganti Tema' : 'Kustom Warna'}
            </span>
            {view === 'custom' ? (
              <button className="sheet-close" onClick={() => setView('list')} aria-label="Kembali">
                <i className="fa-solid fa-arrow-left" />
              </button>
            ) : (
              <button className="sheet-close" onClick={handleClose} aria-label="Tutup">
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          {/* ── LIVE PREVIEW CARD (selalu tampil, ikut theme yg lagi disorot) ── */}
          <div ref={previewRef} className="theme-preview-frame">
            <div className="theme-preview-page">
              <div className="theme-preview-wallet">
                <div className="theme-preview-wallet-top">
                  <span>Saldo Pegangan</span>
                  <i className="fa-solid fa-eye" />
                </div>
                <div className="theme-preview-wallet-amount">Rp 1.250.000</div>
              </div>

              <div className="theme-preview-row">
                <div className="theme-preview-chip theme-preview-chip-green">
                  <i className="fa-solid fa-arrow-down" /> Masuk
                </div>
                <div className="theme-preview-chip theme-preview-chip-red">
                  <i className="fa-solid fa-arrow-up" /> Keluar
                </div>
              </div>

              <div className="theme-preview-card">
                <div className="theme-preview-item-icon">
                  <i className="fa-solid fa-cart-shopping" />
                </div>
                <div className="theme-preview-item-body">
                  <div className="theme-preview-item-title">Belanja Bulanan</div>
                  <div className="theme-preview-item-sub">Hari ini, 14:30</div>
                </div>
                <div className="theme-preview-item-amount">-Rp 150.000</div>
              </div>

              <button className="theme-preview-btn">Tambah Transaksi</button>
            </div>
          </div>

          {view === 'list' && (
            <>
              <div className="theme-option-list">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className={`theme-option ${selected === preset.id ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset.id)}
                  >
                    <div className="theme-option-swatches">
                      <span style={{ background: preset.vars.brand }} />
                      <span style={{ background: preset.vars.green }} />
                      <span style={{ background: preset.vars.red }} />
                      <span style={{ background: preset.vars.orange }} />
                    </div>
                    <div className="theme-option-body">
                      <div className="theme-option-name">Use {preset.name} Theme</div>
                      <div className="theme-option-desc">{preset.description}</div>
                    </div>
                    {selected === preset.id && (
                      <i className="fa-solid fa-circle-check theme-option-check" />
                    )}
                  </button>
                ))}

                <button
                  className={`theme-option ${selected === 'custom' ? 'active' : ''}`}
                  onClick={() => { setSelected('custom'); setView('custom'); }}
                >
                  <div className="theme-option-swatches theme-option-swatches-custom">
                    <i className="fa-solid fa-palette" />
                  </div>
                  <div className="theme-option-body">
                    <div className="theme-option-name">Customize Theme</div>
                    <div className="theme-option-desc">Atur sendiri setiap warna komponen</div>
                  </div>
                  <i className="fa-solid fa-chevron-right theme-option-chevron" />
                </button>
              </div>

              <button className="btn-primary" onClick={handleSave}>
                {savedFlash ? (
                  <><i className="fa-solid fa-check" /> Tema Diterapkan</>
                ) : (
                  'Terapkan Tema'
                )}
              </button>
            </>
          )}

          {view === 'custom' && (
            <>
              <div className="theme-custom-groups">
                {THEME_GROUPS.map((group) => (
                  <div key={group.label} className="theme-custom-group">
                    <div className="theme-custom-group-label">{group.label}</div>
                    <div className="theme-custom-group-grid">
                      {group.keys.map((key) => (
                        <label key={key} className="theme-color-row">
                          <span className="theme-color-row-label">{VAR_LABELS[key]}</span>
                          <span className="theme-color-swatch-wrap">
                            <input
                              type="color"
                              value={customVars[key]}
                              onChange={(e) => handleCustomVarChange(key, e.target.value)}
                              className="theme-color-input"
                            />
                            <span
                              className="theme-color-swatch"
                              style={{ background: customVars[key] }}
                            />
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-ghost theme-reset-btn" onClick={handleResetCustom}>
                <i className="fa-solid fa-rotate-left" /> Reset ke Default
              </button>

              <button className="btn-primary" onClick={handleSave}>
                {savedFlash ? (
                  <><i className="fa-solid fa-check" /> Tema Diterapkan</>
                ) : (
                  'Simpan & Terapkan'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}