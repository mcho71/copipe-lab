/**
 * Stand-in for @salesforce/platform-sdk when the same React app is built into a
 * Visualforce page (vite build --mode vf). There is no host LWC there, so this
 * plays the host's part: it reads and saves events with JavaScript Remoting and
 * feeds them to App as props, the same shape calendarHost passes.
 */
interface VfConfig {
  getMyEvents: string;
  moveEvent: string;
  lang: string;
  locale: string;
  timeZone: string;
}

interface RemoteEvent {
  id: string;
  subject: string;
  startDateTime: number; // Remoting returns Datetime as epoch milliseconds
  endDateTime: number;
}

type UiState = { props: Record<string, unknown> };

declare const Visualforce: {
  remoting: {
    Manager: {
      invokeAction(
        action: string,
        ...args: [...unknown[], (result: unknown, event: { status: boolean; message: string }) => void, object]
      ): void;
    };
  };
};
declare const sforce: { one?: { showToast?(params: object): void } } | undefined;

const config = (window as unknown as { MFE_VF: VfConfig }).MFE_VF;
const DAY_MS = 24 * 60 * 60 * 1000;

function invoke<T>(action: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    Visualforce.remoting.Manager.invokeAction(
      action,
      ...args,
      (result: unknown, event: { status: boolean; message: string }) =>
        event.status ? resolve(result as T) : reject(new Error(event.message)),
      { escape: false }
    );
  });
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function toast(title: string, message: string, type: 'success' | 'error') {
  // Only inside Lightning Experience; a standalone /apex/ page has no sforce.one.
  if (typeof sforce !== 'undefined') sforce.one?.showToast?.({ title, message, type });
}

let weekStart = startOfWeek(new Date()).toISOString();
let state: UiState = { props: {} };
const listeners = new Set<(next: UiState) => void>();

async function load() {
  const end = new Date(new Date(weekStart).getTime() + 7 * DAY_MS).toISOString();
  const rows = await invoke<RemoteEvent[]>(config.getMyEvents, weekStart, end);
  const events = rows.map((e) => ({
    id: e.id,
    subject: e.subject,
    start: new Date(e.startDateTime).toISOString(),
    end: new Date(e.endDateTime).toISOString(),
  }));
  state = {
    props: {
      weekStart,
      eventsJson: JSON.stringify(events),
      lang: config.lang,
      locale: config.locale,
      timeZone: config.timeZone,
    },
  };
  listeners.forEach((fn) => fn(state));
}

async function handle(evt: CustomEvent) {
  const detail = evt.detail ?? {};
  if (evt.type === 'weekchange' && detail.weekStart) {
    weekStart = detail.weekStart;
    await load();
  } else if (evt.type === 'eventmove' && detail.id) {
    try {
      await invoke(config.moveEvent, detail.id, detail.start, detail.end);
      toast('Event moved', 'The event time was saved.', 'success');
    } catch (err) {
      toast('Could not move the event', err instanceof Error ? err.message : String(err), 'error');
    }
    await load();
  }
}

const sdk = {
  getUiState: () => ({
    get state() {
      return state;
    },
    subscribe(fn: (next: UiState) => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  }),
  dispatchEvent: (evt: CustomEvent) => {
    void handle(evt);
    return true;
  },
};

const ready = load().then(() => sdk);

export function getViewSDK() {
  return ready;
}
