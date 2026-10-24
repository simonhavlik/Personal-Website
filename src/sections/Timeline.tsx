import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import JourneyTimeline2D from '../components/journey/JourneyTimeline2D';
import { useJourneyPrefs } from '../hooks/useJourneyPrefs';

// the desktop is a window server, three apps and a terminal — a phone should
// not parse it before the reader has scrolled this far
const JourneyDesktop = lazy(() => import('../components/journey/JourneyDesktop'));

const Timeline = () => {
  const allowRich = useJourneyPrefs();
  const holderRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!allowRich) return;
    const el = holderRef.current;
    if (!el) return;

    // a plain scroll test rather than an observer: the section is taller than
    // the viewport, so this is deterministic and cheap
    const check = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 900 && rect.bottom > -900) setNear(true);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [allowRich, near]);

  if (!allowRich) return <JourneyTimeline2D />;

  return (
    <div ref={holderRef} className="h-[100svh] min-h-[520px]">
      {near ? (
        <Suspense fallback={<div className="h-full w-full bg-gray-50" />}>
          <JourneyDesktop />
        </Suspense>
      ) : (
        <div className="h-full w-full bg-gray-50" aria-hidden="true" />
      )}
    </div>
  );
};

export default Timeline;
