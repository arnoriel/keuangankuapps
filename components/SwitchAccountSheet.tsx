'use client';

import '@/styles/sheet.css';
import '@/styles/menu.css';
import '@/styles/accounts.css';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getAccountTotal, validateAccountName, MAX_ACCOUNTS, type AccountNameError } from '@/lib/storage';
import { formatRupiah, parseAmountInput } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

interface Props {
  onClose: () => void;
  /** Dipanggil setelah akun berhasil dipindah / dibuat (nama profil di Menu perlu di-refresh). */
  onChanged?: () => void;
}

type View = 'list' | 'name' | 'pegangan' | 'tabungan';

const NAME_ERRORS: Record<Exclude<AccountNameError, null>, string> = {
  empty: 'Nama akun tidak boleh kosong',
  duplicate: 'Nama akun sudah dipakai',
  limit: `Maksimal ${MAX_ACCOUNTS} akun`,
};

/** Input nominal Rupiah dengan format ribuan (pola sama seperti TransferModal). */
function RupiahField({ value, onChange, onEnter }: { value: string; onChange: (v: string) => void; onEnter: () => void }) {
  return (
    <div className="amount-input-wrapper">
      <span className="amount-prefix">Rp</span>
      <input
        className="amount-input"
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={value}
        autoFocus
        onChange={(e) => {
          const n = parseAmountInput(e.target.value);
          onChange(n > 0 ? n.toLocaleString('id-ID') : '');
        }}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
      />
    </div>
  );
}

export default function SwitchAccountSheet({ onClose, onChanged }: Props) {
  const { accounts, activeAccountId, switchAccount, addAccount, removeAccount } = useWallet();
  const [view, setView] = useState<View>('list');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [pegangan, setPegangan] = useState('');
  const [tabungan, setTabungan] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canAdd = accounts.length < MAX_ACCOUNTS;

  function handleSwitch(id: string) {
    if (id !== activeAccountId) {
      haptics.light();
      switchAccount(id);
      onChanged?.();
    }
    onClose();
  }

  function handleDelete(id: string) {
    haptics.warning();
    removeAccount(id);
    setConfirmDeleteId(null);
    onChanged?.();
  }

  function resetWizard() {
    setName(''); setNameError(''); setPegangan(''); setTabungan('');
  }

  function backToList() {
    resetWizard();
    setView('list');
  }

  function handleNameNext() {
    const err = validateAccountName(name);
    if (err) { setNameError(NAME_ERRORS[err]); haptics.warning(); return; }
    setNameError('');
    setView('pegangan');
  }

  function handleCreate() {
    const ok = addAccount(name, parseAmountInput(pegangan), parseAmountInput(tabungan));
    if (!ok) { setNameError('Gagal membuat akun, coba nama lain'); setView('name'); return; }
    haptics.success();
    onChanged?.();
    onClose();
  }

  const steps: View[] = ['name', 'pegangan', 'tabungan'];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <span className="sheet-title">{view === 'list' ? 'Pindah Akun' : 'Akun Baru'}</span>
            <button className="sheet-close" onClick={onClose} aria-label="Tutup">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {view === 'list' && (
            <>
              <p className="sheet-subtitle">Pilih akun yang ingin kamu lihat. PIN tetap sama untuk semua akun.</p>

              <div className="acc-list">
                {accounts.map((acc) => {
                  const active = acc.id === activeAccountId;
                  const confirming = confirmDeleteId === acc.id;
                  return (
                    <div key={acc.id} className={`acc-item ${active ? 'acc-item-active' : ''}`}>
                      {confirming ? (
                        <div className="acc-confirm">
                          <div className="acc-confirm-text">
                            Hapus akun <strong>{acc.name}</strong> beserta seluruh datanya? Tidak bisa dibatalkan.
                          </div>
                          <div className="acc-confirm-actions">
                            <button className="acc-btn-ghost" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                            <button className="acc-btn-danger" onClick={() => handleDelete(acc.id)}>Hapus</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button className="acc-main" onClick={() => handleSwitch(acc.id)}>
                            <div className="acc-avatar">
                              <i className={`fa-solid ${acc.isMain ? 'fa-user' : 'fa-user-group'}`} />
                            </div>
                            <div className="acc-body">
                              <div className="acc-name">{acc.name || 'Tanpa Nama'}</div>
                              <div className="acc-sub">
                                {acc.isMain ? 'Akun utama · ' : ''}Total {formatRupiah(getAccountTotal(acc.id))}
                              </div>
                            </div>
                            {active && <span className="acc-badge"><i className="fa-solid fa-check" /> Aktif</span>}
                          </button>
                          {!acc.isMain && (
                            <button
                              className="acc-delete"
                              onClick={() => setConfirmDeleteId(acc.id)}
                              aria-label={`Hapus akun ${acc.name}`}
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                className="btn-primary"
                style={{ marginTop: 18 }}
                disabled={!canAdd}
                onClick={() => setView('name')}
              >
                <i className="fa-solid fa-plus" /> Tambah Akun Baru
              </button>
              {!canAdd && <p className="input-error-msg">{NAME_ERRORS.limit}</p>}
            </>
          )}

          {view !== 'list' && (
            <>
              <div className="acc-steps">
                {steps.map((s) => (
                  <span key={s} className={`acc-step ${s === view ? 'acc-step-active' : ''}`} />
                ))}
              </div>

              {view === 'name' && (
                <>
                  <p className="sheet-subtitle">Siapa pemilik akun ini? (mis. nama adik atau anak)</p>
                  <div className="form-group">
                    <label className="form-label">Nama akun</label>
                    <input
                      className="text-input"
                      type="text"
                      placeholder="Masukkan nama"
                      value={name}
                      maxLength={30}
                      autoFocus
                      onChange={(e) => { setName(e.target.value); setNameError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
                    />
                    {nameError && <p className="input-error-msg">{nameError}</p>}
                  </div>
                  <button className="btn-primary" onClick={handleNameNext}>Lanjut →</button>
                  <button className="btn-ghost" onClick={backToList}>Batal</button>
                </>
              )}

              {view === 'pegangan' && (
                <>
                  <p className="sheet-subtitle">Saldo pegangan {name.trim()} 💵 — boleh dikosongkan.</p>
                  <div className="form-group">
                    <RupiahField value={pegangan} onChange={setPegangan} onEnter={() => setView('tabungan')} />
                  </div>
                  <button className="btn-primary" onClick={() => setView('tabungan')}>Lanjut →</button>
                  <button className="btn-ghost" onClick={() => setView('name')}>← Kembali</button>
                </>
              )}

              {view === 'tabungan' && (
                <>
                  <p className="sheet-subtitle">Saldo tabungan {name.trim()} 🏦 — boleh dikosongkan.</p>
                  <div className="form-group">
                    <RupiahField value={tabungan} onChange={setTabungan} onEnter={handleCreate} />
                  </div>
                  <button className="btn-primary" onClick={handleCreate}>Buat Akun</button>
                  <button className="btn-ghost" onClick={() => setView('pegangan')}>← Kembali</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
