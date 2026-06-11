import { useGalleryStore, PerformanceMode } from '../../stores/galleryStore';

const PERFORMANCE_MODES: { value: PerformanceMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'high', label: 'High' },
  { value: 'low', label: 'Low' },
];

export const MenuPanel = () => {
  const isMenuOpen = useGalleryStore((s) => s.isMenuOpen);
  const setMenuOpen = useGalleryStore((s) => s.setMenuOpen);
  const toggleSearch = useGalleryStore((s) => s.toggleSearch);
  const setListViewOpen = useGalleryStore((s) => s.setListViewOpen);
  const setLeaderboardOpen = useGalleryStore((s) => s.setLeaderboardOpen);
  const teleportToTop = useGalleryStore((s) => s.teleportToTop);
  const showMinimap = useGalleryStore((s) => s.showMinimap);
  const toggleMinimap = useGalleryStore((s) => s.toggleMinimap);
  const showControls = useGalleryStore((s) => s.showControls);
  const toggleControls = useGalleryStore((s) => s.toggleControls);
  const performanceMode = useGalleryStore((s) => s.performanceMode);
  const setPerformanceMode = useGalleryStore((s) => s.setPerformanceMode);
  const effectiveQuality = useGalleryStore((s) => s.effectiveQuality);
  const tokens = useGalleryStore((s) => s.tokens);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <aside
        role="dialog"
        aria-label="Menu"
        aria-hidden={!isMenuOpen}
        className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-cyber-primary border-l border-neon-cyan/30 shadow-2xl flex flex-col transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neon-cyan/20">
          <h2 className="text-lg font-bold text-neon-cyan">MENU</h2>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-cyber-secondary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Navigation */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Navigate</h3>
            <div className="space-y-2">
              <MenuButton
                label="Search tokens"
                shortcut="/"
                onClick={() => {
                  setMenuOpen(false);
                  toggleSearch();
                }}
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                }
              />
              <MenuButton
                label="Token list (2D view)"
                onClick={() => setListViewOpen(true)}
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                }
              />
              <MenuButton
                label="24h leaderboard"
                shortcut="L"
                onClick={() => setLeaderboardOpen(true)}
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                }
              />
              <MenuButton
                label="Back to top of spiral"
                onClick={() => {
                  teleportToTop();
                  setMenuOpen(false);
                }}
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                }
              />
            </div>
          </section>

          {/* Settings */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Settings</h3>
            <div className="space-y-1">
              <MenuToggle label="Minimap" shortcut="M" checked={showMinimap} onChange={toggleMinimap} />
              <MenuToggle label="Controls guide" checked={showControls} onChange={toggleControls} />
            </div>
          </section>

          {/* Performance */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">
              Performance
              {performanceMode === 'auto' && (
                <span className="ml-2 normal-case text-gray-500">
                  (running: {effectiveQuality})
                </span>
              )}
            </h3>
            <div
              role="radiogroup"
              aria-label="Performance mode"
              className="grid grid-cols-3 gap-2"
            >
              {PERFORMANCE_MODES.map((mode) => (
                <button
                  key={mode.value}
                  role="radio"
                  aria-checked={performanceMode === mode.value}
                  onClick={() => setPerformanceMode(mode.value)}
                  className={`px-2 py-1.5 rounded-lg text-sm border transition-colors ${
                    performanceMode === mode.value
                      ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                      : 'bg-cyber-secondary/60 border-transparent text-gray-300 hover:border-neon-cyan/40'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Auto lowers glow effects and resolution when FPS drops below 40.
            </p>
          </section>

          {/* About */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">About</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Spiral Meme Gallery — explore the top {tokens.length || 100} meme tokens in an
              immersive 3D spiral. Part of the CryptoMeme.org MemePedia vision.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Market data by{' '}
              <a
                href="https://www.coingecko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:underline"
              >
                CoinGecko
              </a>
              {' '}· v0.0.1
            </p>
          </section>
        </div>
      </aside>
    </>
  );
};

const MenuButton = ({
  label,
  shortcut,
  onClick,
  icon,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  icon: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-cyber-secondary/60 hover:bg-cyber-secondary border border-transparent hover:border-neon-cyan/40 text-left text-white transition-colors"
  >
    <svg className="w-5 h-5 text-neon-cyan shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icon}
    </svg>
    <span className="flex-1 text-sm">{label}</span>
    {shortcut && (
      <kbd className="px-1.5 py-0.5 bg-cyber-primary border border-neon-cyan/40 rounded text-neon-cyan text-xs font-mono">
        {shortcut}
      </kbd>
    )}
  </button>
);

const MenuToggle = ({
  label,
  shortcut,
  checked,
  onChange,
}: {
  label: string;
  shortcut?: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-cyber-secondary/60 text-left transition-colors"
  >
    <span className="text-sm text-white">
      {label}
      {shortcut && <span className="ml-2 text-xs text-gray-400 font-mono">({shortcut})</span>}
    </span>
    <span
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-neon-cyan/70' : 'bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </span>
  </button>
);
