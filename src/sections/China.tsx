import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from 'recharts';
import ChinaEffects from '../components/ChinaEffects';

const gdpData = [
  { year: 2000, China: 3.6, USA: 10.3 },
  { year: 2005, China: 7.0, USA: 13.1 },
  { year: 2010, China: 13.2, USA: 15.0 },
  { year: 2015, China: 19.8, USA: 18.0 },
  { year: 2020, China: 24.3, USA: 20.9 },
  { year: 2024, China: 33.0, USA: 23.0 },
];

const fdiData = [
  { year: 2018, China: 139, USA: 252 },
  { year: 2019, China: 141, USA: 246 },
  { year: 2020, China: 149, USA: 156 },
  { year: 2021, China: 181, USA: 367 },
  { year: 2022, China: 189, USA: 285 },
  { year: 2023, China: 163, USA: 148 },
];

const STATS = [
  ['$33T', 'GDP (PPP)', "world's largest"],
  ['8,000+', 'listed companies', '2× US markets'],
  ['600M+', 'middle class', 'largest consumer market'],
  ['35%', 'green investment', 'of global renewables'],
  ['8/10', 'Leiden top unis', 'in the region'],
  ['$163B', 'FDI inflows', '2023'],
  ['14nm', 'domestic chips', 'production node'],
  ['40%', 'global EV share', 'of output'],
];

type Frame = { src: string; note: string; video?: boolean; poster?: string };

const ROWS: Frame[][] = [
  [
    { src: '/field/nanjing-city-wall.jpg', note: 'Nanjing · city wall, Zifeng Tower behind' },
    { src: '/field/suzhou-night-signage.jpg', note: 'Suzhou · commercial frontage at night' },
    { src: '/field/shanghai-bund-bull.jpg', note: 'Shanghai · the Bund, bull and street sign' },
    { src: '/field/shanghai-nanjing-road.jpg', note: 'Shanghai · Nanjing Road signage after dark' },
    { src: '/field/shanghai-dahuchun-shengjian.jpg', note: 'Shanghai · Dahuchun Sheng Jian, Michelin-listed' },
  ],
  [
    { src: '/field/shanghai-yuyuan-banners.jpg', note: 'Shanghai · Yuyuan market banners' },
    { src: '/field/hangzhou-west-lake-sunset.jpg', note: 'Hangzhou · West Lake at sunset' },
    { src: '/field/hangzhou-temple-plaque.jpg', note: 'Hangzhou · temple plaque' },
    { src: '/field/wuhan-yellow-crane-tower.jpg', note: 'Wuhan · Yellow Crane Tower inscription' },
    { src: '/field/wuhan-riverside-towers.jpg', note: 'Wuhan · characters lit across the towers' },
  ],
  [
    { src: '/field/chongqing-service-centre.jpg', note: 'Chongqing · tourist service centre, Hongya Cave' },
    { src: '/field/chongqing-hongyadong.jpg', note: 'Chongqing · Hongya Cave, lit' },
    { src: '/field/chengdu-panda.mp4', poster: '/field/chengdu-panda.jpg', video: true, note: 'Chengdu · panda base, breakfast in progress' },
    { src: '/field/chengdu-panda-base.jpg', note: 'Chengdu · panda base entry signage' },
    { src: '/field/xian-terracotta-army.jpg', note: 'Xi’an · Terracotta Army pit' },
  ],
];

const FieldVideo = ({ src, poster, note }: { src: string; poster?: string; note: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setLoad(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // let the still frames settle first: the clip is the last thing in
          io.disconnect();
          window.setTimeout(() => setLoad(true), 1200);
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (load) ref.current?.play().catch(() => undefined);
  }, [load]);

  return (
    <figure className="field-cell group relative aspect-[16/9] h-[104px] w-auto shrink-0 overflow-hidden bg-gray-900 md:h-[168px]">
      <video
        ref={ref}
        src={load ? src : undefined}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        className="h-full w-full object-cover"
      />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-black/72 px-1.5 py-1 font-mono text-[6.5px] uppercase leading-tight tracking-[0.04em] text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 md:text-[7.5px]">
        {note}
      </figcaption>
    </figure>
  );
};

const China = () => {
  const wallRef = useRef<HTMLDivElement>(null);
  const [wallOn, setWallOn] = useState(false);

  useEffect(() => {
    const check = () => {
      const el = wallRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 800 && rect.bottom > -800) setWallOn(true);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current,
        { y: 18, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 88%', toggleActions: 'play none none reverse' },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="china"
      aria-labelledby="china-heading"
      className="section bg-gray-50/80 backdrop-blur-sm relative overflow-hidden"
    >
      <ChinaEffects />

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-12">
        <div ref={titleRef} className="mb-4 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <div>
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.2em] text-gray-400">
              Field research · China
            </span>
            <h2 id="china-heading" className="text-2xl font-semibold tracking-[-0.02em] text-gray-900 md:text-3xl">
              The world's second economy, read from the street
            </h2>
          </div>
          <p className="max-w-md text-[12px] leading-snug text-gray-500 md:text-right">
            Scale, capital and language. Six months of coursework and three summers on the ground —
            what the numbers look like in signage, and what they cost in a conversation.
          </p>
        </div>

        {/* one dense strip instead of eight cards */}
        <div className="grid grid-cols-4 border-t border-gray-300 md:grid-cols-8">
          {STATS.map(([value, label, note]) => (
            <div key={label} className="border-b border-gray-200 px-1.5 py-1.5 md:px-2">
              <p className="font-mono text-[15px] leading-none tabular-nums text-gray-900 md:text-[16px]">{value}</p>
              <p className="mt-1 font-mono text-[7px] uppercase leading-none tracking-[0.06em] text-gray-500">{label}</p>
              <p className="mt-0.5 hidden text-[7px] uppercase leading-tight tracking-[0.04em] text-gray-400 md:block">{note}</p>
            </div>
          ))}
        </div>

        {/* the two charts, half the height */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="border border-gray-200 bg-white px-2 pb-1 pt-2">
            <div className="mb-1 flex items-baseline justify-between">
              <h3 className="text-[11px] font-medium text-gray-900">GDP (PPP), $T</h3>
              <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-gray-400">China vs USA</span>
            </div>
            <div className="h-40 md:h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gdpData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                  <XAxis dataKey="year" stroke="#9ca3af" fontSize={9} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e5e7eb', fontSize: 11 }} />
                  <Legend iconSize={6} wrapperStyle={{ fontSize: 9, paddingTop: 0 }} />
                  <Line type="monotone" dataKey="China" stroke="#DC2626" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="USA" stroke="#6B7280" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-gray-200 bg-white px-2 pb-1 pt-2">
            <div className="mb-1 flex items-baseline justify-between">
              <h3 className="text-[11px] font-medium text-gray-900">FDI inflows, $B</h3>
              <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-gray-400">China vs USA</span>
            </div>
            <div className="h-40 md:h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fdiData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                  <XAxis dataKey="year" stroke="#9ca3af" fontSize={9} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #e5e7eb', fontSize: 11 }} />
                  <Legend iconSize={6} wrapperStyle={{ fontSize: 9, paddingTop: 0 }} />
                  <Bar dataKey="China" fill="#DC2626" />
                  <Bar dataKey="USA" fill="#9CA3AF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* signage, three rows, no crops and no rounded corners */}
        <div ref={wallRef} className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between border-t border-gray-300 pt-2">
            <h3 className="font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">Signage</h3>
            <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-gray-400">
              fourteen frames · hover for the note
            </span>
          </div>

          <div className="space-y-[3px]">
            {ROWS.map((row, rowIndex) => {
              // repeat enough that the track always exceeds the viewport, then
              // translate by half so the loop is seamless at any width
              const copies = 2;
              const doubled = Array.from({ length: copies }, () => row).flat();
              return (
                <div key={rowIndex} className="field-row group/row overflow-hidden">
                  <div
                    className={`field-track flex w-max gap-[3px] ${rowIndex === 1 ? 'field-track--reverse' : ''}`}
                    style={{ animationDuration: `${rowIndex === 1 ? 38 : 46 + rowIndex * 6}s` }}
                  >
                    {doubled.map((item, index) => item.video ? (
                      <FieldVideo key={`${item.src}-${index}`} src={item.src} poster={item.poster} note={item.note} />
                    ) : (
                      <figure
                        key={`${item.src}-${index}`}
                        className="field-cell group relative aspect-[4/3] h-[104px] w-auto shrink-0 overflow-hidden md:h-[168px]"
                      >
                        <img
                          src={item.src}
                          alt={item.note}
                          loading={wallOn ? 'eager' : 'lazy'}
                          decoding="async"
                          width={224}
                          height={168}
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-black/72 px-1.5 py-1 font-mono text-[6.5px] uppercase leading-tight tracking-[0.04em] text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 md:text-[7.5px]">
                          {item.note}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .field-track { animation: fieldSlide linear infinite; }
        .field-row:hover .field-track { animation-play-state: paused; }
        .field-track--reverse { animation-direction: reverse; }
        @keyframes fieldSlide { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .field-track { animation: none !important; }
        }
      `}</style>
    </section>
  );
};

export default China;
