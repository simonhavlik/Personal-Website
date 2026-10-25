import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import timelineData from '../../data/timeline.json';
import {
  Apple, Wifi, BatteryFull, Search, SlidersHorizontal, Folder, Compass,
  Mail as MailIcon, FileText, Presentation, Terminal, Trash2, Sparkles, Mic,
  Gamepad2, Settings as SettingsIcon, Bluetooth, Share2, Volume2, VolumeX, Sun,
  LayoutGrid, Globe,
} from 'lucide-react';
import { MacWindow } from './desktop/MacWindow';
import { place, clampRect, maximizeRect, type Rect, type Bounds } from './desktop/geometry';
import {
  TerminalApp, MailApp, SafariApp, FinderApp, ViewerApp, SkillsApp, SiriApp,
  SettingsApp, TrashApp, MinecraftApp, type Theme, type SettingsPane,
} from './desktop/apps';
import { useTyping, TOTAL_CHARS } from './desktop/terminal';

const DesktopWallpaper = lazy(() => import('./desktop/DesktopWallpaper'));
import DesktopToast from './desktop/DesktopToast';
import { docs, projects, WALLPAPERS, CV_DOC_ID, type DesktopDoc } from './desktop/data';

const Meter = ({ value, tone = 'bg-emerald-400' }: { value: number; tone?: string }) => (
  <span className="ml-auto block h-1.5 w-20 overflow-hidden rounded-full bg-white/20">
    <span
      className={`block h-full rounded-full ${tone} transition-[width] duration-700 ease-out`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </span>
);

const Widget = ({ children }: { children: ReactNode }) => (
  <div className="w-44 rounded-2xl border border-white/15 bg-black/25 p-3 text-white shadow-[0_16px_36px_-18px_rgba(0,0,0,0.8)] backdrop-blur-xl">
    {children}
  </div>
);

const FigmaLogo = () => (
  <svg viewBox="0 0 38 57" className="h-[22px] w-auto" aria-hidden="true">
    <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0Z" />
    <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0Z" />
    <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19Z" />
    <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5Z" />
    <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5Z" />
  </svg>
);

type WinId =
  | 'terminal' | 'mail' | 'safari' | 'finder' | 'viewer'
  | 'skills' | 'siri' | 'settings' | 'trash' | 'minecraft';

interface Win extends Rect {
  open: boolean;
  z: number;
  minimized: boolean;
  maximized: boolean;
  prevRect?: Rect;
}

interface RawEvent {
  id: number;
  title: string;
  subtitle: string;
  date: string;
  location: string;
  description: string;
}

const events = (timelineData as { events: RawEvent[] }).events;

const initialWins = (b: Bounds): Record<WinId, Win> => {
  const base: Record<WinId, Rect & { open: boolean; z: number }> = {
    terminal: { ...place(b, Math.min(880, b.w - 80), Math.min(520, b.h - 200), 0, -8), open: true, z: 10 },
    mail: { ...place(b, 680, 520, b.w * 0.22, b.h * 0.02), open: false, z: 11 },
    safari: { ...place(b, Math.min(960, b.w - 80), 600, b.w * 0.12, b.h * 0.02), open: false, z: 12 },
    finder: { ...place(b, 800, 580, -b.w * 0.2, b.h * 0.05), open: false, z: 13 },
    viewer: { ...place(b, 800, 580, b.w * 0.1, b.h * 0.04), open: false, z: 14 },
    skills: { ...place(b, 820, 560, -b.w * 0.1, b.h * 0.03), open: false, z: 15 },
    siri: { ...place(b, 520, 460, b.w * 0.16, -b.h * 0.02), open: false, z: 16 },
    settings: { ...place(b, 720, 520, b.w * 0.14, b.h * 0.04), open: false, z: 17 },
    trash: { ...place(b, 700, 460, -b.w * 0.14, b.h * 0.05), open: false, z: 18 },
    minecraft: { ...place(b, Math.min(900, b.w - 80), 600, b.w * 0.08, b.h * 0.03), open: false, z: 19 },
  };
  return Object.fromEntries(
    Object.entries(base).map(([id, w]) => [id, { ...w, minimized: false, maximized: false }])
  ) as Record<WinId, Win>;
};

const APP_NAME: Record<WinId, string> = {
  terminal: 'Terminal',
  mail: 'Mail',
  safari: 'Safari',
  finder: 'Finder',
  viewer: 'Pages',
  skills: 'Skills',
  siri: 'Siri',
  settings: 'System Settings',
  trash: 'Trash',
  minecraft: 'Minecraft',
};

const MenuRow = ({
  label,
  onSelect,
  disabled,
}: {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    disabled={disabled}
    onPointerDown={(e) => e.stopPropagation()}
    onClick={onSelect}
    className={`block w-full whitespace-nowrap rounded px-3 py-1 text-left text-[13px] ${
      disabled ? 'cursor-default opacity-40' : 'hover:bg-blue-500 hover:text-white'
    }`}
  >
    {label}
  </button>
);

const JourneyDesktop = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<Bounds>({ w: 1440, h: 900 });
  const [wins, setWins] = useState<Record<WinId, Win>>(() => initialWins({ w: 1440, h: 900 }));
  const [viewerDocId, setViewerDocId] = useState<number>(docs[0].id);
  const [started, setStarted] = useState(false);
  const [wallpaperReady, setWallpaperReady] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);
  const [clock, setClock] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [wallpaperIndex, setWallpaperIndex] = useState(0);
  const [brightness, setBrightness] = useState(1);
  const [sound, setSound] = useState(0.6);
  const [prefersDark, setPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [settingsPane, setSettingsPane] = useState<SettingsPane>('appearance');
  const [settingsKey, setSettingsKey] = useState(0);
  const [safariTab, setSafariTab] = useState(
    (projects.find((p) => p.liveUrl.includes('optimizer')) ?? projects[0]).shortTitle,
  );
  const [safariKey, setSafariKey] = useState(0);
  const [launchpad, setLaunchpad] = useState(false);
  const [lpQuery, setLpQuery] = useState('');
  const [cpu, setCpu] = useState(38);
  const [gpu, setGpu] = useState(61);
  const count = useTyping(started);

  const viewerDoc = docs.find((doc) => doc.id === viewerDocId) ?? docs[0];
  const resolvedTheme = theme === 'auto' ? (prefersDark ? 'dark' : 'light') : theme;
  const isDark = resolvedTheme === 'dark';
  // On phones there's no room for floating windows — everything goes full screen.
  const compact = bounds.w < 700;
  const winRect = (w: Win) => (compact ? maximizeRect(bounds) : clampRect(w, bounds));

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  const toggleMenu = (name: string) => setOpenMenu((prev) => (prev === name ? null : name));

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBounds({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // decided before paint: the WebGL wallpaper must never mount on a phone
  useLayoutEffect(() => {
    setTouchDevice(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          setWallpaperReady(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const fmt = () => {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Prague',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
      setClock(`${get('weekday')} ${get('day')} ${get('month')} ${get('hour')}:${get('minute')}`);
    };
    fmt();
    const id = window.setInterval(fmt, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => document.body.classList.remove('shmack-mode'), []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCpu(32 + Math.round(Math.random() * 58));
      setGpu(46 + Math.round(Math.random() * 48));
    }, 1400);
    return () => window.clearInterval(id);
  }, []);


  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.desktop-stage', { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' });
      gsap.fromTo('.desktop-dock', { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: 'power3.out' });
      gsap.fromTo('.desktop-menubar', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.1, ease: 'power2.out' });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const focus = useCallback((id: WinId) => {
    setWins((prev) => {
      const top = Math.max(...(Object.values(prev) as Win[]).map((w) => w.z));
      return { ...prev, [id]: { ...prev[id], z: top + 1 } };
    });
  }, []);

  const openWin = useCallback((id: WinId, docId?: number) => {
    if (docId !== undefined) setViewerDocId(docId);
    setWins((prev) => {
      const top = Math.max(...(Object.values(prev) as Win[]).map((w) => w.z));
      return { ...prev, [id]: { ...prev[id], open: true, minimized: false, z: top + 1 } };
    });
  }, []);

  const closeWin = useCallback((id: WinId) => {
    setWins((prev) => ({ ...prev, [id]: { ...prev[id], open: false } }));
  }, []);

  const setRect = useCallback((id: WinId, rect: Rect) => {
    setWins((prev) => ({ ...prev, [id]: { ...prev[id], ...rect } }));
  }, []);

  const openDoc = useCallback((doc: DesktopDoc) => openWin('viewer', doc.id), [openWin]);

  const toggleWin = useCallback((id: WinId) => {
    setWins((prev) => {
      const top = Math.max(...(Object.values(prev) as Win[]).map((w) => w.z));
      const w = prev[id];
      if (!w.open) return { ...prev, [id]: { ...w, open: true, minimized: false, z: top + 1 } };
      if (w.minimized) return { ...prev, [id]: { ...w, minimized: false, z: top + 1 } };
      return { ...prev, [id]: { ...w, open: false } };
    });
  }, []);

  const minimizeWin = useCallback((id: WinId) => {
    setWins((prev) => ({ ...prev, [id]: { ...prev[id], minimized: true } }));
  }, []);

  const toggleMaximize = useCallback(
    (id: WinId) => {
      setWins((prev) => {
        const w = prev[id];
        const top = Math.max(...(Object.values(prev) as Win[]).map((x) => x.z));
        if (w.maximized) {
          const restored = w.prevRect ?? { x: w.x, y: w.y, w: w.w, h: w.h };
          return { ...prev, [id]: { ...w, maximized: false, prevRect: undefined, ...restored, z: top + 1 } };
        }
        return {
          ...prev,
          [id]: {
            ...w,
            maximized: true,
            prevRect: { x: w.x, y: w.y, w: w.w, h: w.h },
            ...maximizeRect(bounds),
            z: top + 1,
          },
        };
      });
    },
    [bounds]
  );

  const openSettings = useCallback(
    (pane: SettingsPane) => {
      setSettingsPane(pane);
      setSettingsKey((k) => k + 1);
      openWin('settings');
    },
    [openWin]
  );

  const openSafari = useCallback(
    (tabTitle: string) => {
      setSafariTab(tabTitle);
      setSafariKey((k) => k + 1);
      openWin('safari');
    },
    [openWin]
  );

  const frontId =
    (Object.keys(wins) as WinId[])
      .filter((id) => wins[id].open)
      .sort((a, b) => wins[b].z - wins[a].z)[0] ?? 'terminal';
  const appName =
    frontId === 'viewer'
      ? viewerDoc.kind === 'presentation'
        ? 'Keynote'
        : viewerDoc.kind === 'cv'
          ? 'Figma'
          : 'Pages'
      : APP_NAME[frontId];

  const typing = count < TOTAL_CHARS;
  const analysisId = docs.find((d) => d.kind === 'analysis')?.id ?? docs[0].id;
  const presentationId = docs.find((d) => d.kind === 'presentation')?.id ?? docs[0].id;

  const appsMenu: { label: string; action: () => void }[] = [
    { label: 'Finder', action: () => openWin('finder') },
    { label: 'Safari', action: () => openWin('safari') },
    { label: 'Mail', action: () => openWin('mail') },
    { label: 'Pages', action: () => openWin('viewer', analysisId) },
    { label: 'Keynote', action: () => openWin('viewer', presentationId) },
    { label: 'Figma (CV)', action: () => openWin('viewer', CV_DOC_ID) },
    { label: 'Skills', action: () => openWin('skills') },
    { label: 'Siri', action: () => openWin('siri') },
    { label: 'Minecraft', action: () => openWin('minecraft') },
    { label: 'System Settings', action: () => openSettings('appearance') },
    { label: 'Wikipedia', action: () => openSafari('Wikipedia') },
    { label: 'Terminal', action: () => openWin('terminal') },
  ];

  const panelCls = `absolute left-0 top-full z-50 mt-1 min-w-[13rem] overflow-hidden rounded-lg border p-1 shadow-2xl backdrop-blur-xl ${
    isDark ? 'border-white/10 bg-zinc-800/95 text-zinc-100' : 'border-black/10 bg-white/95 text-gray-800'
  }`;

  const dock: { key: WinId; label: string; icon: ReactNode; color: string; onClick: () => void; active: boolean }[] = [
    { key: 'finder', label: 'Finder', icon: <Folder className="h-6 w-6" fill="currentColor" />, color: 'bg-gradient-to-b from-sky-400 to-blue-600', onClick: () => toggleWin('finder'), active: wins.finder.open },
    { key: 'safari', label: 'Safari', icon: <Compass className="h-6 w-6" />, color: 'bg-gradient-to-b from-cyan-300 to-blue-500', onClick: () => toggleWin('safari'), active: wins.safari.open },
    { key: 'mail', label: 'Mail', icon: <MailIcon className="h-6 w-6" />, color: 'bg-gradient-to-b from-sky-300 to-blue-600', onClick: () => toggleWin('mail'), active: wins.mail.open },
    { key: 'viewer', label: 'Pages', icon: <FileText className="h-6 w-6" />, color: 'bg-gradient-to-b from-orange-300 to-amber-500', onClick: () => (wins.viewer.open && viewerDoc.kind === 'analysis' ? closeWin('viewer') : openWin('viewer', analysisId)), active: wins.viewer.open && viewerDoc.kind === 'analysis' },
    { key: 'viewer', label: 'Keynote', icon: <Presentation className="h-6 w-6" />, color: 'bg-gradient-to-b from-blue-400 to-indigo-600', onClick: () => (wins.viewer.open && viewerDoc.kind === 'presentation' ? closeWin('viewer') : openWin('viewer', presentationId)), active: wins.viewer.open && viewerDoc.kind === 'presentation' },
    { key: 'viewer', label: 'Figma', icon: <FigmaLogo />, color: 'bg-white ring-1 ring-black/10', onClick: () => openWin('viewer', CV_DOC_ID), active: wins.viewer.open && viewerDoc.kind === 'cv' },
    { key: 'skills', label: 'Skills', icon: <Sparkles className="h-6 w-6" />, color: 'bg-gradient-to-b from-violet-400 to-fuchsia-600', onClick: () => toggleWin('skills'), active: wins.skills.open },
    { key: 'siri', label: 'Siri', icon: <Mic className="h-6 w-6" />, color: 'bg-gradient-to-b from-fuchsia-500 via-purple-500 to-sky-500', onClick: () => toggleWin('siri'), active: wins.siri.open },
    { key: 'settings', label: 'Settings', icon: <SettingsIcon className="h-6 w-6" />, color: 'bg-gradient-to-b from-slate-400 to-slate-600', onClick: () => toggleWin('settings'), active: wins.settings.open },
    { key: 'terminal', label: 'Terminal', icon: <Terminal className="h-6 w-6" />, color: 'bg-gradient-to-b from-zinc-700 to-zinc-900', onClick: () => toggleWin('terminal'), active: wins.terminal.open },
  ];

  const launcherApps: { label: string; icon: ReactNode; color: string; action: () => void }[] = [
    { label: 'Finder', icon: <Folder className="h-7 w-7" fill="currentColor" />, color: 'bg-gradient-to-b from-sky-400 to-blue-600', action: () => openWin('finder') },
    { label: 'Safari', icon: <Compass className="h-7 w-7" />, color: 'bg-gradient-to-b from-cyan-300 to-blue-500', action: () => openWin('safari') },
    { label: 'Mail', icon: <MailIcon className="h-7 w-7" />, color: 'bg-gradient-to-b from-sky-300 to-blue-600', action: () => openWin('mail') },
    { label: 'Pages', icon: <FileText className="h-7 w-7" />, color: 'bg-gradient-to-b from-orange-300 to-amber-500', action: () => openWin('viewer', analysisId) },
    { label: 'Keynote', icon: <Presentation className="h-7 w-7" />, color: 'bg-gradient-to-b from-blue-400 to-indigo-600', action: () => openWin('viewer', presentationId) },
    { label: 'Figma (CV)', icon: <FigmaLogo />, color: 'bg-white ring-1 ring-black/10', action: () => openWin('viewer', CV_DOC_ID) },
    { label: 'Skills', icon: <Sparkles className="h-7 w-7" />, color: 'bg-gradient-to-b from-violet-400 to-fuchsia-600', action: () => openWin('skills') },
    { label: 'Siri', icon: <Mic className="h-7 w-7" />, color: 'bg-gradient-to-b from-fuchsia-500 via-purple-500 to-sky-500', action: () => openWin('siri') },
    { label: 'Minecraft', icon: <Gamepad2 className="h-7 w-7" />, color: 'bg-gradient-to-b from-emerald-400 to-green-700', action: () => openWin('minecraft') },
    { label: 'Settings', icon: <SettingsIcon className="h-7 w-7" />, color: 'bg-gradient-to-b from-slate-400 to-slate-600', action: () => openSettings('appearance') },
    { label: 'Wikipedia', icon: <Globe className="h-7 w-7" />, color: 'bg-gradient-to-b from-zinc-100 to-zinc-400 !text-gray-800', action: () => openSafari('Wikipedia') },
    { label: 'Terminal', icon: <Terminal className="h-7 w-7" />, color: 'bg-gradient-to-b from-zinc-700 to-zinc-900', action: () => openWin('terminal') },
    { label: 'Trash', icon: <Trash2 className="h-7 w-7" />, color: 'bg-gradient-to-b from-zinc-300 to-zinc-500', action: () => openWin('trash') },
  ];

  const desktopDark = isDark;

  return (
    <section
      ref={sectionRef}
      id="journey"
      aria-labelledby="journey-heading"
      className="relative h-[100svh] min-h-[520px] w-full md:h-[125vh] md:min-h-[720px]"
      style={{ background: WALLPAPERS[wallpaperIndex].css }}
    >
      <h2 id="journey-heading" className="sr-only">
        Education Journey
      </h2>

      {/* Sticky desktop stage — holds the desktop ~50vh so it can be enjoyed, then releases */}
      <div
        ref={stageRef}
        onPointerDown={() => setOpenMenu(null)}
        onPointerEnter={() => document.body.classList.add('shmack-mode')}
        onPointerLeave={() => document.body.classList.remove('shmack-mode')}
        className="desktop-stage shmack-cursors relative z-[60] h-[100svh] min-h-[520px] w-full overflow-hidden md:sticky md:top-0 md:h-screen md:min-h-[640px]"
      >
        {/* Default three.js wallpaper */}
        {wallpaperReady && !touchDevice && WALLPAPERS[wallpaperIndex].name === 'Orbit' && (
          <Suspense fallback={null}>
            <DesktopWallpaper />
          </Suspense>
        )}

        {/* Welcome banner — this is a working system, not a screenshot */}
        <DesktopToast active={started} />

        {/* Wallpaper glow + grain */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-1/4 h-[420px] w-[420px] animate-pulse rounded-full bg-fuchsia-500/30 blur-[120px]" />
          <div className="absolute right-0 top-0 h-[380px] w-[380px] rounded-full bg-sky-400/25 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-orange-400/20 blur-[130px]" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '4px 4px' }}
          />
          <div className={`absolute inset-0 ${desktopDark ? 'bg-gradient-to-t from-black/25 via-transparent to-black/10' : 'bg-gradient-to-t from-black/10 via-transparent to-white/10'}`} />
        </div>

        {/* Desktop widgets — left: files */}
        <div className="absolute left-4 top-11 z-0 hidden flex-col gap-3 lg:flex">
          <Widget>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">Files</p>
            <button
              type="button"
              onClick={() => openWin('viewer', CV_DOC_ID)}
              className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12px] hover:bg-white/10"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-300" />
              CV.pdf
            </button>
            {[
              { name: 'journey', action: () => openWin('terminal') },
              { name: 'analyses', action: () => openWin('finder') },
              { name: 'presentations', action: () => openWin('finder') },
              { name: 'projects', action: () => openWin('safari') },
              { name: 'skills', action: () => openWin('skills') },
              { name: 'cv', action: () => openWin('viewer', CV_DOC_ID) },
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={item.action}
                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12px] hover:bg-white/10"
              >
                <Folder className="h-3.5 w-3.5 text-sky-300" fill="currentColor" />
                {item.name}/
              </button>
            ))}
            <p className="mt-2 text-[10px] text-white/50">tip: cd there in the Terminal</p>
          </Widget>
        </div>

        {/* Desktop widgets — right: weather, system, markets */}
        <div className="absolute right-4 top-11 z-0 hidden flex-col gap-3 lg:flex">
          <Widget>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Prague</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums text-white">{clock || '—'}</span>
            </div>
            <p className="text-[11px] text-white/70">local time · CET</p>
          </Widget>

          <Widget>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">Shmack OS</p>
            <div className="flex items-center text-[11px]">
              CPU
              <Meter value={cpu} />
            </div>
            <div className="mt-1.5 flex items-center text-[11px]">
              GPU
              <Meter value={gpu} tone="bg-fuchsia-400" />
            </div>
            <p className="mt-2 text-[10px] text-white/50">CommandCode Silicon M∞ · 67 cores</p>
          </Widget>

          <Widget>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">Markets</p>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>BILI</span>
                <span className="text-emerald-300">▲ +∞%</span>
              </div>
              <div className="flex justify-between">
                <span>TUYA</span>
                <span className="text-emerald-300">▲ +6.9%</span>
              </div>
              <div className="flex justify-between">
                <span>GOOGL</span>
                <span className="text-rose-300">▼ −0.1%</span>
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-white/50">Sharpe 4.20 · conviction: high</p>
          </Widget>
        </div>

        {/* Menu bar */}
        <div
          className={`desktop-menubar absolute inset-x-0 top-0 z-50 flex h-[30px] items-center justify-between border-b px-2 text-[13px] font-medium backdrop-blur-xl ${
            desktopDark ? 'border-white/10 bg-black/25 text-white' : 'border-black/10 bg-white/60 text-gray-900'
          }`}
        >
          <div className="flex items-center gap-0.5">
            <div className="relative">
              <button
                type="button"
                onPointerDown={stop}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu('apple');
                }}
                className="flex items-center rounded px-2 py-1 hover:bg-white/15"
                aria-label="Apple menu"
              >
                <Apple className="h-4 w-4" fill="currentColor" />
              </button>
              {openMenu === 'apple' && (
                <div className={panelCls}>
                  <MenuRow label="About This Mac" onSelect={() => openSettings('about')} />
                  <div className="my-1 h-px bg-current opacity-10" />
                  <MenuRow label="System Settings…" onSelect={() => openSettings('appearance')} />
                  <div className="my-1 h-px bg-current opacity-10" />
                  <MenuRow label="Sleep" disabled />
                  <MenuRow label="Restart…" disabled />
                  <MenuRow label="Shut Down…" disabled />
                  <div className="my-1 h-px bg-current opacity-10" />
                  <MenuRow label="Lock Screen" disabled />
                  <MenuRow label="Log Out Simon…" disabled />
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onPointerDown={stop}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu('app');
                }}
                className="rounded px-2 py-1 font-semibold hover:bg-white/15"
              >
                {appName}
              </button>
              {openMenu === 'app' && (
                <div className={panelCls}>
                  <MenuRow label={`About ${appName}`} onSelect={() => openSettings('about')} />
                  <div className="my-1 h-px bg-current opacity-10" />
                  <MenuRow label={`Quit ${appName}`} onSelect={() => closeWin(frontId)} />
                </div>
              )}
            </div>

            {['File', 'Edit', 'View', 'Window', 'Help'].map((label) => (
              <div key={label} className="relative hidden sm:block">
                <button
                  type="button"
                  onPointerDown={stop}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(label);
                  }}
                  className="rounded px-2 py-1 hover:bg-white/15"
                >
                  {label}
                </button>
                {openMenu === label && (
                  <div className={panelCls}>
                    <MenuRow label={`${label}: nothing here yet`} disabled />
                    <MenuRow label="Shmack OS 67 — “Sun Tzu”" disabled />
                  </div>
                )}
              </div>
            ))}

            <div className="relative">
              <button
                type="button"
                onPointerDown={stop}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu('apps');
                }}
                className="rounded px-2 py-1 hover:bg-white/15"
              >
                Apps
              </button>
              {openMenu === 'apps' && (
                <div className={panelCls}>
                  {appsMenu.map((item) => (
                    <MenuRow key={item.label} label={item.label} onSelect={item.action} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-3 ${desktopDark ? 'text-white/90' : 'text-gray-700'}`}>
            <span className="hidden items-center gap-1 sm:flex">
              <BatteryFull className="h-4 w-4" />
              <span className="text-[11px] font-medium tabular-nums">180%</span>
            </span>
            <button
              type="button"
              onPointerDown={stop}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('control');
              }}
              className="hidden items-center rounded px-1.5 py-1 hover:bg-white/15 sm:flex"
              aria-label="Wi-Fi"
            >
              <Wifi className="h-4 w-4" />
            </button>
            <Search className="hidden h-4 w-4 sm:block" />
            <div className="relative">
              <button
                type="button"
                onPointerDown={stop}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu('control');
                }}
                className="flex items-center rounded px-1.5 py-1 hover:bg-white/15"
                aria-label="Control Centre"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              {openMenu === 'control' && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`absolute right-0 top-full z-50 mt-1 w-[19rem] rounded-2xl border p-3 shadow-2xl backdrop-blur-2xl ${
                    desktopDark ? 'border-white/10 bg-zinc-800/90 text-white' : 'border-black/10 bg-white/90 text-gray-800'
                  }`}
                >
                  <div className={`grid grid-cols-2 gap-2 ${desktopDark ? '[&_button]:bg-white/10' : '[&_button]:bg-black/5'}`}>
                    <button type="button" className="col-span-2 flex items-center gap-3 rounded-xl p-2 text-left">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                        <Wifi className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-[13px] font-medium">Wi-Fi</span>
                        <span className="block text-[11px] opacity-70">idk_pass</span>
                      </span>
                    </button>
                    <button type="button" className="flex items-center gap-2 rounded-xl p-2 text-left">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white">
                        <Bluetooth className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[12px]">
                        <span className="block font-medium">Bluetooth</span>
                        <span className="block text-[10px] opacity-70">On</span>
                      </span>
                    </button>
                    <button type="button" className="flex items-center gap-2 rounded-xl p-2 text-left">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white">
                        <Share2 className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[12px]">
                        <span className="block font-medium">AirDrop</span>
                        <span className="block text-[10px] opacity-70">Opportunities only</span>
                      </span>
                    </button>
                  </div>

                  <div className={`mt-2 rounded-xl p-2.5 ${desktopDark ? 'bg-white/10' : 'bg-black/5'}`}>
                    <div className="mb-1 flex items-center gap-2 text-[12px] font-medium">
                      <Sun className="h-3.5 w-3.5" />
                      Display
                      <span className="ml-auto text-[11px] opacity-60">{Math.round(brightness * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={35}
                      max={100}
                      value={Math.round(brightness * 100)}
                      onChange={(e) => setBrightness(Number(e.target.value) / 100)}
                      className="w-full accent-blue-500"
                      aria-label="Brightness"
                    />
                  </div>

                  <div className={`mt-2 rounded-xl p-2.5 ${desktopDark ? 'bg-white/10' : 'bg-black/5'}`}>
                    <div className="mb-1 flex items-center gap-2 text-[12px] font-medium">
                      {sound > 0 ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                      Sound
                      <span className="ml-auto text-[11px] opacity-60">{Math.round(sound * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(sound * 100)}
                      onChange={(e) => setSound(Number(e.target.value) / 100)}
                      className="w-full accent-blue-500"
                      aria-label="Sound"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className={`mt-2 w-full rounded-xl p-2 text-[12px] font-medium ${desktopDark ? 'bg-white/10' : 'bg-black/5'}`}
                  >
                    Appearance: {isDark ? 'Dark' : 'Light'}
                  </button>
                </div>
              )}
            </div>
            <span className="tabular-nums">{clock}</span>
          </div>
        </div>

        {/* Windows */}
        {wins.terminal.open && !wins.terminal.minimized && (
          <MacWindow
            title="simon — -zsh — 120×40"
            rect={winRect(wins.terminal)}
            bounds={bounds}
            z={wins.terminal.z}
            dark
            onFocus={() => focus('terminal')}
            onChange={(r) => setRect('terminal', r)}
            onClose={() => closeWin('terminal')}
            onMinimize={() => minimizeWin('terminal')}
            onMaximize={() => toggleMaximize('terminal')}
            headerExtra={
              typing ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-emerald-300">running</span>
                </>
              ) : (
                <span className="text-zinc-500">done</span>
              )
            }
          >
            <TerminalApp
              count={count}
              actions={{
                openDoc: (docId) => openWin('viewer', docId),
                openSafari: () => openWin('safari'),
                openSkills: () => openWin('skills'),
                openFinder: () => openWin('finder'),
                openSettings: () => openSettings('appearance'),
                openMinecraft: () => openWin('minecraft'),
                openTrash: () => openWin('trash'),
                openMail: () => openWin('mail'),
                openSiri: () => openWin('siri'),
              }}
            />
          </MacWindow>
        )}

        {wins.mail.open && !wins.mail.minimized && (
          <MacWindow
            title="New Message"
            rect={winRect(wins.mail)}
            bounds={bounds}
            z={wins.mail.z}
            dark={desktopDark}
            onFocus={() => focus('mail')}
            onChange={(r) => setRect('mail', r)}
            onClose={() => closeWin('mail')}
            onMinimize={() => minimizeWin('mail')}
            onMaximize={() => toggleMaximize('mail')}
          >
            <MailApp />
          </MacWindow>
        )}

        {wins.safari.open && !wins.safari.minimized && (
          <MacWindow
            title="Safari"
            rect={winRect(wins.safari)}
            bounds={bounds}
            z={wins.safari.z}
            dark={desktopDark}
            solid
            onFocus={() => focus('safari')}
            onChange={(r) => setRect('safari', r)}
            onClose={() => closeWin('safari')}
            onMinimize={() => minimizeWin('safari')}
            onMaximize={() => toggleMaximize('safari')}
          >
            <SafariApp key={safariKey} initialTabTitle={safariTab} />
          </MacWindow>
        )}

        {wins.finder.open && !wins.finder.minimized && (
          <MacWindow
            title="Documents"
            rect={winRect(wins.finder)}
            bounds={bounds}
            z={wins.finder.z}
            dark={desktopDark}
            onFocus={() => focus('finder')}
            onChange={(r) => setRect('finder', r)}
            onClose={() => closeWin('finder')}
            onMinimize={() => minimizeWin('finder')}
            onMaximize={() => toggleMaximize('finder')}
          >
            <FinderApp onOpen={openDoc} />
          </MacWindow>
        )}

        {wins.viewer.open && !wins.viewer.minimized && (
          <MacWindow
            title={`${viewerDoc.kind === 'presentation' ? 'Keynote' : viewerDoc.kind === 'cv' ? 'Figma' : 'Pages'} — ${viewerDoc.title}`}
            rect={winRect(wins.viewer)}
            bounds={bounds}
            z={wins.viewer.z}
            dark={desktopDark}
            solid
            onFocus={() => focus('viewer')}
            onChange={(r) => setRect('viewer', r)}
            onClose={() => closeWin('viewer')}
            onMinimize={() => minimizeWin('viewer')}
            onMaximize={() => toggleMaximize('viewer')}
          >
            <ViewerApp doc={viewerDoc} />
          </MacWindow>
        )}

        {wins.skills.open && !wins.skills.minimized && (
          <MacWindow
            title="Skills"
            rect={winRect(wins.skills)}
            bounds={bounds}
            z={wins.skills.z}
            dark={desktopDark}
            onFocus={() => focus('skills')}
            onChange={(r) => setRect('skills', r)}
            onClose={() => closeWin('skills')}
            onMinimize={() => minimizeWin('skills')}
            onMaximize={() => toggleMaximize('skills')}
          >
            <SkillsApp />
          </MacWindow>
        )}

        {wins.siri.open && !wins.siri.minimized && (
          <MacWindow
            title="Siri"
            rect={winRect(wins.siri)}
            bounds={bounds}
            z={wins.siri.z}
            dark
            onFocus={() => focus('siri')}
            onChange={(r) => setRect('siri', r)}
            onClose={() => closeWin('siri')}
            onMinimize={() => minimizeWin('siri')}
            onMaximize={() => toggleMaximize('siri')}
          >
            <SiriApp />
          </MacWindow>
        )}

        {wins.settings.open && !wins.settings.minimized && (
          <MacWindow
            title="System Settings"
            rect={winRect(wins.settings)}
            bounds={bounds}
            z={wins.settings.z}
            dark={desktopDark}
            onFocus={() => focus('settings')}
            onChange={(r) => setRect('settings', r)}
            onClose={() => closeWin('settings')}
            onMinimize={() => minimizeWin('settings')}
            onMaximize={() => toggleMaximize('settings')}
          >
            <SettingsApp
              key={settingsKey}
              theme={theme}
              onThemeChange={setTheme}
              wallpaperIndex={wallpaperIndex}
              onWallpaperChange={setWallpaperIndex}
              initialPane={settingsPane}
            />
          </MacWindow>
        )}

        {wins.trash.open && !wins.trash.minimized && (
          <MacWindow
            title="Trash"
            rect={winRect(wins.trash)}
            bounds={bounds}
            z={wins.trash.z}
            dark={desktopDark}
            onFocus={() => focus('trash')}
            onChange={(r) => setRect('trash', r)}
            onClose={() => closeWin('trash')}
            onMinimize={() => minimizeWin('trash')}
            onMaximize={() => toggleMaximize('trash')}
          >
            <TrashApp />
          </MacWindow>
        )}

        {wins.minecraft.open && !wins.minecraft.minimized && (
          <MacWindow
            title="Minecraft"
            rect={winRect(wins.minecraft)}
            bounds={bounds}
            z={wins.minecraft.z}
            dark
            solid
            onFocus={() => focus('minecraft')}
            onChange={(r) => setRect('minecraft', r)}
            onClose={() => closeWin('minecraft')}
            onMinimize={() => minimizeWin('minecraft')}
            onMaximize={() => toggleMaximize('minecraft')}
          >
            <MinecraftApp />
          </MacWindow>
        )}

        {/* Dock */}
        <div className="desktop-dock absolute inset-x-0 bottom-4 z-40 flex justify-center">
          <div
            className={`flex max-w-[94vw] items-end gap-1 overflow-x-auto rounded-2xl border px-2 py-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:max-w-none sm:gap-3 sm:overflow-visible sm:px-4 sm:py-2.5 ${
              desktopDark ? 'border-white/25 bg-white/20' : 'border-white/60 bg-white/55'
            }`}
          >
            <div className="group relative flex flex-col items-center">
              <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                Launchpad
              </span>
              <button
                type="button"
                onClick={() => setLaunchpad(true)}
                aria-label="Launchpad"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-b from-slate-100 to-slate-400 text-gray-700 shadow-lg transition-transform duration-200 ease-out group-hover:-translate-y-2 group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-[14px] [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-6 sm:[&_svg]:w-6"
              >
                <span className="dock-idle" style={{ animationDelay: '0ms' }}>
                  <LayoutGrid className="h-6 w-6" />
                </span>
              </button>
            </div>
            {dock.map((item, i) => (
              <div key={item.label} className="group relative flex flex-col items-center">
                <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
                <button
                  type="button"
                  onClick={item.onClick}
                  aria-label={item.label}
                  title={item.label}
                  aria-pressed={item.active}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-lg transition-transform duration-200 ease-out group-hover:-translate-y-2 group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-[14px] [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-6 sm:[&_svg]:w-6 ${item.color}`}
                >
                  <span
                    className={item.key === 'terminal' && typing ? 'dock-bounce' : 'dock-idle'}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    {item.icon}
                  </span>
                </button>
                {item.active && (
                  <span className={`mt-1 h-1 w-1 rounded-full ${desktopDark ? 'bg-white/80' : 'bg-gray-700/70'}`} />
                )}
              </div>
            ))}
            <span className={`mx-1 h-7 w-px self-center sm:h-9 ${desktopDark ? 'bg-white/30' : 'bg-black/15'}`} />
            <div className="group relative flex flex-col items-center">
              <button
                type="button"
                onClick={() => toggleWin('trash')}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-b from-zinc-300 to-zinc-500 text-white shadow-lg transition-transform duration-200 ease-out group-hover:-translate-y-2 group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-[14px] [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-6 sm:[&_svg]:w-6"
              >
                <span className="dock-idle" style={{ animationDelay: '1500ms' }}>
                  <Trash2 className="h-6 w-6" />
                </span>
              </button>
              {wins.trash.open && (
                <span className={`mt-1 h-1 w-1 rounded-full ${desktopDark ? 'bg-white/80' : 'bg-gray-700/70'}`} />
              )}
            </div>
          </div>
        </div>

        {/* Launchpad */}
        {launchpad && (
          <div
            className="absolute inset-0 z-[70] flex flex-col items-center bg-black/35 pt-10 backdrop-blur-[30px] sm:pt-14"
            onPointerDown={() => setLaunchpad(false)}
            aria-label="Launchpad"
          >
            <div onPointerDown={(e) => e.stopPropagation()} className="flex w-64 items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 backdrop-blur">
              <Search className="h-3.5 w-3.5 shrink-0 text-white/70" />
              <input
                value={lpQuery}
                onChange={(e) => setLpQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search apps"
                className="w-full bg-transparent text-center text-[13px] text-white placeholder-white/60 outline-none"
              />
            </div>

            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-10 grid grid-cols-4 gap-x-8 gap-y-8 px-6 sm:mt-14 sm:grid-cols-6 sm:gap-x-12 sm:gap-y-10 lg:grid-cols-7"
            >
              {launcherApps
                .filter((app) => app.label.toLowerCase().includes(lpQuery.trim().toLowerCase()))
                .map((app) => (
                  <button
                    key={app.label}
                    type="button"
                    onClick={() => {
                      setLaunchpad(false);
                      setLpQuery('');
                      app.action();
                    }}
                    className="group flex w-[84px] flex-col items-center gap-2"
                  >
                    <span
                      className={`flex h-[72px] w-[72px] items-center justify-center rounded-[22%] text-white shadow-[0_14px_28px_-10px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/20 transition-transform duration-200 group-hover:scale-105 [&_svg]:h-9 [&_svg]:w-9 ${app.color}`}
                    >
                      {app.icon}
                    </span>
                    <span className="w-full truncate text-center text-[12px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      {app.label}
                    </span>
                  </button>
                ))}
            </div>

            <div className="mt-auto mb-8 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
            </div>
          </div>
        )}

        {/* Brightness dimmer */}
        <div
          className="pointer-events-none absolute inset-0 z-[80] bg-black"
          style={{ opacity: (1 - brightness) * 0.8 }}
        />
      </div>

      {/* Screen-reader content */}
      <ol className="sr-only">
        {events.map((event) => (
          <li key={event.id}>
            <h3>{event.title}</h3>
            <p>
              {event.subtitle} — {event.date}, {event.location}
            </p>
            <p>{event.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default JourneyDesktop;
