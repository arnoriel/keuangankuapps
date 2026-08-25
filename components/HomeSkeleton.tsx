import '@/styles/skeleton.css';

/**
 * Skeleton shimmer untuk Home page — dipakai saat data dari
 * localStorage belum selesai di-load (WalletContext belum ready).
 * Bentuk & ukuran dibuat meniru layout asli persis, biar transisi
 * skeleton -> konten kerasa smooth (tidak ada layout shift).
 */
export default function HomeSkeleton() {
  return (
    <div className="skel-wrap" aria-hidden="true" aria-busy="true">
      {/* HEADER */}
      <header className="page-header">
        <div style={{ width: '100%' }}>
          <div className="skel-bar skel-bar-sm" style={{ width: 90 }} />
          <div className="skel-bar skel-bar-lg" style={{ width: 160, marginTop: 8 }} />
          <div className="skel-bar skel-bar-xs" style={{ width: 120, marginTop: 8 }} />
        </div>
      </header>

      {/* SALDO CARD */}
      <section className="saldo-carousel-wrap">
        <div style={{ padding: '14px 20px 24px' }}>
          <div className="skel-card" />
        </div>
        <div className="saldo-dots" style={{ marginTop: -12 }}>
          <span className="skel-dot" />
          <span className="skel-dot" />
          <span className="skel-dot" />
        </div>
        <div className="transfer-fab-row">
          <div className="skel-bar skel-pill" style={{ width: 150, height: 44 }} />
        </div>
      </section>

      {/* RECENT TRANSACTIONS */}
      <section className="recent-section">
        <div className="section-header">
          <div className="skel-bar skel-bar-sm" style={{ width: 130 }} />
          <div className="skel-bar skel-bar-sm" style={{ width: 70 }} />
        </div>
        <div className="tx-list">
          {[0, 1, 2, 3].map((i) => (
            <div className="skel-tx-item" key={i}>
              <div className="skel-tx-icon" />
              <div style={{ flex: 1 }}>
                <div className="skel-bar skel-bar-sm" style={{ width: '55%' }} />
                <div className="skel-bar skel-bar-xs" style={{ width: '35%', marginTop: 6 }} />
              </div>
              <div className="skel-bar skel-bar-sm" style={{ width: 70 }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
