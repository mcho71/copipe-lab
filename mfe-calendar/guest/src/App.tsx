/**
 * Calendar guest — the React side of the microfrontend.
 *
 * Receives the week's events from the host LWC as props (getUiState +
 * subscribe) and never talks to Salesforce directly. Dragging an event sends
 * an `eventmove` event to the host; the week buttons send `weekchange`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { getViewSDK } from '@salesforce/platform-sdk';

interface CalEvent {
  id: string;
  subject: string;
  start: string; // ISO 8601
  end: string;
}

interface HostProps {
  weekStart?: string;
  eventsJson?: string; // JSON-encoded CalEvent[]
  lang?: string;
  locale?: string;
  timeZone?: string;
}

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 28;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function useHostProps() {
  const [props, setProps] = useState<HostProps | null>(null);
  const [status, setStatus] = useState('getViewSDK() pending');
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    getViewSDK().then(
      (sdk) => {
        if (cancelled) return;
        const ui = sdk.getUiState?.();
        if (!ui) {
          setStatus(`SDK resolved (${sdk.constructor?.name}), but getUiState() returned nothing`);
          return;
        }
        setStatus('connected');
        setProps(ui.state.props as HostProps);
        unsubscribe = ui.subscribe((next) => setProps(next.props as HostProps));
      },
      (err) => setStatus(`getViewSDK() failed: ${err instanceof Error ? err.message : String(err)}`)
    );
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);
  return { props, status };
}

async function sendToHost(name: string, detail: unknown) {
  const sdk = await getViewSDK();
  sdk.dispatchEvent?.(new CustomEvent(name, { detail, bubbles: true }));
}

function minutesFromDayStart(date: Date) {
  return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
}

export default function App() {
  const { props: host, status } = useHostProps();
  // Moves the user made that the host has not confirmed yet (optimistic UI).
  const [pending, setPending] = useState<Record<string, { start: string; end: string }>>({});

  useEffect(() => setPending({}), [host]);

  const weekStart = useMemo(() => new Date(host?.weekStart ?? Date.now()), [host?.weekStart]);
  const intlLocale = (host?.locale ?? 'en-US').replace('_', '-');
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY_MS));
  const hostEvents: CalEvent[] = useMemo(() => JSON.parse(host?.eventsJson ?? '[]'), [host?.eventsJson]);
  // Pointer-based drag (works with mouse and touch, unlike HTML5 drag and drop).
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragRef = useRef<{ id: string; grabMinutes: number } | null>(null);
  const [preview, setPreview] = useState<{ id: string; start: string; end: string } | null>(null);
  const events = hostEvents.map((e) => ({
    ...e,
    ...pending[e.id],
    ...(preview?.id === e.id ? { start: preview.start, end: preview.end } : {}),
  }));
  const slots = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES;

  if (!host) {
    return (
      <p className="note">Waiting for the host: {status}</p>
    );
  }

  function moveWeek(offsetDays: number) {
    const next = new Date(weekStart.getTime() + offsetDays * DAY_MS);
    sendToHost('weekchange', { weekStart: next.toISOString() });
  }

  // Where the dragged event would land for a pointer position, snapped to the slot grid.
  function landingTimes(clientX: number, clientY: number) {
    const drag = dragRef.current;
    const target = drag && hostEvents.find((ev) => ev.id === drag.id);
    if (!drag || !target) return null;
    const dayIndex = dayRefs.current.findIndex((el) => {
      const r = el?.getBoundingClientRect();
      return !!r && clientX >= r.left && clientX < r.right;
    });
    if (dayIndex < 0) return null;
    const rect = dayRefs.current[dayIndex]!.getBoundingClientRect();
    const pointerMinutes = ((clientY - rect.top) / SLOT_HEIGHT) * SLOT_MINUTES;
    const startMinutes = Math.round((pointerMinutes - drag.grabMinutes) / SLOT_MINUTES) * SLOT_MINUTES;
    const duration = new Date(target.end).getTime() - new Date(target.start).getTime();
    const start = new Date(days[dayIndex]);
    start.setHours(DAY_START_HOUR, 0, 0, 0);
    start.setTime(start.getTime() + Math.max(0, startMinutes) * MINUTE_MS);
    return { start: start.toISOString(), end: new Date(start.getTime() + duration).toISOString() };
  }

  function handlePointerDown(id: string, e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { id, grabMinutes: ((e.clientY - rect.top) / SLOT_HEIGHT) * SLOT_MINUTES };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const landing = landingTimes(e.clientX, e.clientY);
    if (landing) setPreview({ id: dragRef.current.id, ...landing });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const landing = landingTimes(e.clientX, e.clientY);
    dragRef.current = null;
    setPreview(null);
    const original = hostEvents.find((ev) => ev.id === drag.id);
    if (!landing || !original || landing.start === new Date(original.start).toISOString()) return;
    setPending((p) => ({ ...p, [drag.id]: landing }));
    sendToHost('eventmove', { id: drag.id, ...landing });
  }

  return (
    <div className="calendar">
      <header>
        <button onClick={() => moveWeek(-7)}>‹</button>
        <strong>
          {new Intl.DateTimeFormat(intlLocale, { year: 'numeric', month: 'long', day: 'numeric' }).format(weekStart)}
        </strong>
        <button onClick={() => moveWeek(7)}>›</button>
      </header>
      <div className="grid" style={{ gridTemplateRows: `32px ${slots * SLOT_HEIGHT}px` }}>
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="day-head">
            {new Intl.DateTimeFormat(intlLocale, { weekday: 'short', day: 'numeric' }).format(day)}
          </div>
        ))}
        <div className="hours">
          {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => (
            <div key={i} style={{ height: SLOT_HEIGHT * 2 }}>
              {DAY_START_HOUR + i}:00
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => (
          <div
            key={day.toISOString()}
            className="day"
            ref={(el) => {
              dayRefs.current[dayIndex] = el;
            }}
          >
            {events
              .filter((ev) => new Date(ev.start).toDateString() === day.toDateString())
              .map((ev) => {
                const start = new Date(ev.start);
                const end = new Date(ev.end);
                const top = (minutesFromDayStart(start) / SLOT_MINUTES) * SLOT_HEIGHT;
                const height = ((end.getTime() - start.getTime()) / MINUTE_MS / SLOT_MINUTES) * SLOT_HEIGHT;
                return (
                  <div
                    key={ev.id}
                    className={`event${pending[ev.id] ? ' pending' : ''}${preview?.id === ev.id ? ' dragging' : ''}`}
                    style={{ top, height: Math.max(height, SLOT_HEIGHT) }}
                    onPointerDown={(e) => handlePointerDown(ev.id, e)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    <span>
                      {new Intl.DateTimeFormat(intlLocale, { hour: 'numeric', minute: '2-digit' }).format(start)}
                    </span>
                    {ev.subject}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
      <footer>
        host: lang={host.lang ?? '-'} / locale={host.locale ?? '-'} / timeZone={host.timeZone ?? '-'}
      </footer>
    </div>
  );
}
