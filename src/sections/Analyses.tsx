import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  FileText, Presentation, Download, ExternalLink, 
  ChevronRight, BookOpen, BarChart3,
  TrendingUp, Globe, Sparkles, Languages, Info, type LucideIcon
} from 'lucide-react';
import AnalysesEffects from '../components/AnalysesEffects';
import PdfFrame from '../components/PdfFrame';

gsap.registerPlugin(ScrollTrigger);

type DocumentType = 'analysis' | 'presentation';
type Language = 'en' | 'cs';

interface AnalysisDoc {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  type: DocumentType;
  date: string;
  pages: number;
  pdfUrl: string;
  thumbnailColor: string;
  icon: LucideIcon;
  tags: string[];
  language?: Language;
  featured?: boolean;
}

const analyses: AnalysisDoc[] = [
  {
    id: 1,
    title: 'Bilibili Equity Analysis',
    subtitle: 'EM Technology & Entertainment',
    description: 'Fundamental equity analysis of Bilibili Inc. (BILI), covering business model, financial performance, valuation metrics, and investment thesis for this Chinese video-sharing platform.',
    type: 'analysis',
    date: 'Oct 2026',
    pages: 28,
    pdfUrl: '/analyses/EM_BILI_Havlik.docx.pdf',
    thumbnailColor: 'from-pink-500 to-rose-600',
    icon: TrendingUp,
    tags: ['Equity Research', 'Technology', 'China'],
    language: 'cs',
    featured: true
  },
  {
    id: 2,
    title: 'Tuya Inc. Analysis',
    subtitle: 'IoT & Smart Home Technology',
    description: 'Comprehensive analysis of Tuya Inc., an IoT development platform company. Includes market positioning, competitive landscape, financial modeling, and risk assessment.',
    type: 'analysis',
    date: 'Dec 2024',
    pages: 22,
    pdfUrl: '/analyses/EM_TUYA_Havlik.pdf',
    thumbnailColor: 'from-cyan-500 to-blue-600',
    icon: Globe,
    tags: ['IoT', 'Technology', 'Emerging Markets'],
    language: 'cs'
  },
  {
    id: 3,
    title: 'Alphabet (Google) Analysis',
    subtitle: 'Large Cap Technology',
    description: 'Deep dive into Alphabet Inc. covering Google Search, YouTube, Cloud business segments. Features DCF valuation, competitive moat analysis, and AI positioning assessment.',
    type: 'analysis',
    date: 'Jul 2025',
    pages: 18,
    pdfUrl: '/analyses/GOOGL_Havlik.pdf',
    thumbnailColor: 'from-blue-500 to-indigo-600',
    icon: BarChart3,
    tags: ['Large Cap', 'Tech Giants', 'Valuation'],
    language: 'cs'
  },
  {
    id: 9,
    title: 'Bilibili Investment Case (IIE)',
    subtitle: 'Chinese Long-Form Video · 371M MAU',
    description: 'Pitch deck for Bilibili (NASDAQ: BILI, HKEX: 9626) presented with the KI analytical team: 371M monthly actives, monetisation path, gaming and advertising mix, and the valuation case for the platform.',
    type: 'presentation',
    date: 'Oct 2026',
    pages: 16,
    pdfUrl: '/presentations/presentation_BILI.pdf',
    thumbnailColor: 'from-rose-500 to-pink-600',
    icon: Presentation,
    tags: ['China', 'Media', 'Investment Case'],
    language: 'cs',
    featured: true
  },
  {
    id: 4,
    title: 'Chagee Investment Case',
    subtitle: 'High Risk, High Reward Opportunity',
    description: 'Contrarian investment thesis on Chagee, a leading Chinese tea chain. Despite recent stock decline, presents potential value opportunity through store expansion, brand moat, and margin recovery. High risk with significant upside potential.',
    type: 'presentation',
    date: 'Nov 2024',
    pages: 20,
    pdfUrl: '/presentations/presentation_Chagee.pdf',
    thumbnailColor: 'from-emerald-500 to-teal-600',
    icon: Presentation,
    tags: ['High Risk/Reward', 'Consumer', 'Value'],
    featured: true
  },
  {
    id: 5,
    title: 'Tencent Investment Case',
    subtitle: 'Chinese Tech Conglomerate',
    description: 'Strategic investment presentation on Tencent Holdings covering gaming, WeChat ecosystem, fintech, and cloud businesses with valuation framework and risk factors.',
    type: 'presentation',
    date: 'Oct 2024',
    pages: 24,
    pdfUrl: '/presentations/presentation_Tencent.pdf',
    thumbnailColor: 'from-violet-500 to-purple-600',
    icon: BookOpen,
    tags: ['Tech', 'China', 'Investment Case']
  },
  {
    id: 6,
    title: 'Chagee Equity Analysis',
    subtitle: 'Chinese Premium Tea Chain',
    description: 'Full write-up on Chagee (NASDAQ: CHA): premium tea unit economics, store growth and overseas expansion, margin durability, and a GARP case at roughly 6x EV/EBITDA versus a discount to peers.',
    type: 'analysis',
    date: 'Sep 2025',
    pages: 20,
    pdfUrl: '/analyses/EM_CHA_Havlik.pdf',
    thumbnailColor: 'from-emerald-500 to-lime-600',
    icon: TrendingUp,
    tags: ['Consumer', 'China', 'GARP'],
    language: 'cs'
  },
  {
    id: 7,
    title: 'Lyft Equity Analysis',
    subtitle: 'North American Rideshare',
    description: 'Lyft (NASDAQ: LYFT) turnaround case: sustained profitability and free cash flow under new leadership, roughly 30% North American share, AV partnerships and FREENOW expansion, with a ~60% upside target.',
    type: 'analysis',
    date: 'Mar 2026',
    pages: 27,
    pdfUrl: '/analyses/LYFT_Havlik.pdf',
    thumbnailColor: 'from-pink-500 to-fuchsia-600',
    icon: BarChart3,
    tags: ['Turnaround', 'Mobility', 'Value'],
    language: 'en'
  },
  {
    id: 8,
    title: 'Geely Automobile Analysis',
    subtitle: 'Chinese Auto & NEV Conglomerate',
    description: 'Geely (0175.HK) at a holding-company discount: 55.8% NEV mix, 3.02M units in 2025, SEA platform licensing and RMB 34.4B net cash, valued on a three-scenario DCF with base fair value ~25 HKD versus ~16.8 HKD at the time of writing.',
    type: 'analysis',
    date: 'Feb 2026',
    pages: 21,
    pdfUrl: '/analyses/EM_GELYF_Havlik.pdf',
    thumbnailColor: 'from-sky-500 to-blue-700',
    icon: BarChart3,
    tags: ['China', 'Automotive', 'NEV'],
    language: 'cs'
  },
];

const Analyses = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const analysesListRef = useRef<HTMLDivElement>(null);
  const presentationsListRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  
  const [activeDoc, setActiveDoc] = useState<AnalysisDoc>(analyses[0]);

  const analysisDocs = analyses.filter(doc => doc.type === 'analysis');
  const presentationDocs = analyses.filter(doc => doc.type === 'presentation');

  const switchDocument = (doc: AnalysisDoc) => {
    setActiveDoc(doc);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo(analysesListRef.current,
        { x: -80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: analysesListRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo(viewerRef.current,
        { x: 80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          delay: 0.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: viewerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const renderDocCard = (doc: AnalysisDoc) => {
    const Icon = doc.icon;
    const isActive = activeDoc.id === doc.id;
    
    return (
      <div
        key={doc.id}
        onClick={() => switchDocument(doc)}
        className={`gloss-card group relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
          isActive 
            ? 'ring-2 ring-gray-900 shadow-xl scale-[1.02]' 
            : doc.featured
              ? 'featured-glow ring-2 ring-amber-400/70 hover:ring-amber-500'
              : 'ring-1 ring-gray-200 hover:ring-gray-400 hover:shadow-lg'
        }`}
      >
        <div className="flex">
          {/* Thumbnail */}
          <div className={`w-16 h-full min-h-[64px] bg-gradient-to-br ${doc.thumbnailColor} relative flex-shrink-0`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-5 h-5 text-white/90" />
            </div>
            
            {/* Page count badge */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5">
              <div className="bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5 text-center">
                <span className="text-[9px] font-bold text-gray-800">{doc.pages}p</span>
              </div>
            </div>

            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                <ChevronRight className="w-3 h-3 text-gray-900" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 px-2.5 py-1.5 bg-white">
            <p className="text-[9px] text-gray-400 mb-0.5">{doc.date}</p>
            <h3 className={`font-bold text-[13px] leading-tight mb-0.5 transition-colors ${
              isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
            }`}>
              {doc.title}
            </h3>
            <p className="text-[9.5px] text-gray-500 mb-1">{doc.subtitle}</p>
            
            {/* Tags + Language */}
            <div className="flex flex-wrap gap-1 items-center">
              {doc.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-medium text-gray-600"
                >
                  {tag}
                </span>
              ))}
              {doc.language === 'cs' && (
                <span
                  className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-medium"
                  title="Document in Czech - Translate available"
                >
                  CZ → EN
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="analyses"
      aria-labelledby="analyses-heading"
      className="relative py-20 md:py-28 bg-gray-50/80 backdrop-blur-sm overflow-hidden"
    >
      {/* Amber Analytical Effects */}
      <AnalysesEffects />
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-amber-50/60 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-blue-50/40 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[1600px] mx-auto">
        {/* HEADER */}
        <div ref={headerRef} className="px-6 md:px-12 lg:px-16 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-mono text-gray-600 uppercase tracking-wider">Research</span>
                </div>
                <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-gray-300 to-transparent" />
              </div>
              
              <h2 id="analyses-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Featured{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Analyses
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 8C50 2 150 2 198 8" stroke="currentColor" strokeWidth="3" className="text-amber-200" strokeLinecap="round"/>
                  </svg>
                </span>
              </h2>
            </div>

            <div className="lg:max-w-md lg:text-right">
              <p className="text-lg text-gray-600 leading-relaxed">
                In-depth{' '}
                <span className="text-gray-900 font-medium">financial research</span>{' '}
                and presentations covering portfolio optimization, equity analysis, and risk assessment.
              </p>
            </div>
          </div>
        </div>

        {/* SPLIT LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6 px-6 md:px-12 lg:px-16">
          
          {/* LEFT: Two separate sections for Analyses and Presentations */}
          <div className="w-full lg:w-[400px] xl:w-[420px] flex-shrink-0 space-y-4">
            
            {/* ANALYSES SECTION */}
            <div ref={analysesListRef}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Analyses</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-transparent" />
                <span className="text-xs text-gray-400">{analysisDocs.length} documents</span>
              </div>
              
              <div className="space-y-1.5">
                {analysisDocs.map(renderDocCard)}
              </div>
            </div>

            {/* PRESENTATIONS SECTION */}
            <div ref={presentationsListRef}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-lg">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">Presentations</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-purple-200 to-transparent" />
                <span className="text-xs text-gray-400">{presentationDocs.length} documents</span>
              </div>
              
              <div className="space-y-1.5">
                {presentationDocs.map(renderDocCard)}
              </div>
            </div>

          </div>

          {/* RIGHT: PDF Viewer */}
          <div 
            ref={viewerRef}
            className="flex-1"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 h-full min-h-[600px] lg:min-h-[700px] xl:min-h-[750px] flex flex-col">
              {/* Viewer Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="h-5 w-px bg-gray-700" />
                  <div className="flex items-center gap-2">
                    {activeDoc.type === 'analysis' ? (
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Presentation className="w-4 h-4 text-purple-400" />
                    )}
                    <span className="text-sm text-gray-200 font-medium truncate max-w-[200px] sm:max-w-[300px]">
                      {activeDoc.title}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {activeDoc.pages} pages
                  </span>
                  <div className="h-4 w-px bg-gray-700 hidden sm:block" />
                  {activeDoc.language === 'cs' && (
                    <>
                      <div className="flex items-center gap-1">
                        <a
                          href={`https://r.jina.ai/http://simonhavlik.com${activeDoc.pdfUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-gray-800 rounded-lg transition-colors"
                          title="Free AI translation (text only)"
                        >
                          <Languages className="w-4 h-4" />
                          <span className="hidden sm:inline">Translate</span>
                        </a>
                        {/* Info tooltip about translation options */}
                        <div className="relative group">
                          <Info className="w-4 h-4 text-gray-500 cursor-help" />
                          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            <p className="font-medium text-white mb-1">Free Translation Options:</p>
                            <ul className="space-y-1 list-disc pl-3">
                              <li><span className="text-amber-400">This link</span> = instant AI text translation</li>
                              <li><span className="text-blue-400">Download</span> + use <a href="https://www.onlinedoctranslator.com/en/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Online Doc Translator</a> for full PDF with charts</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="h-4 w-px bg-gray-700 hidden sm:block" />
                    </>
                  )}
                  <a
                    href={activeDoc.pdfUrl}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                  <a
                    href={activeDoc.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open</span>
                  </a>
                </div>
              </div>
              
              {/* PDF Viewer */}
              <div className="relative h-[64svh] min-h-[380px] overflow-hidden bg-gray-100 lg:h-auto lg:min-h-[500px] lg:flex-1">
                <PdfFrame
                  key={activeDoc.id}
                  src={activeDoc.pdfUrl}
                  title={activeDoc.title}
                  subtitle={activeDoc.subtitle}
                  pages={activeDoc.pages}
                />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Analyses;
