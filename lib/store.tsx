"use client";
/**
 * Client-side store for the signed-in screens.
 *
 * Applications are real: loaded from Supabase through the server actions in
 * app/(app)/search/actions.ts, and every change is saved there first.
 * People, goals, career, and Ask Nudge are still in-memory placeholders (demo
 * people, empty target companies) until their tables exist.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteApplication,
  listApplications,
  saveApplication,
  setApplicationStatus,
  type Result,
} from "@/app/(app)/search/actions";
import { toISO } from "@/lib/dates";
import { DEMO_NAME, EMPTY, SAMPLE } from "@/lib/mock/sample";
import type { ApplicationInput } from "@/lib/services/applications";
import type {
  AppData,
  Application,
  CareerProfile,
  ChatMessage,
  EntityKind,
  Status,
} from "@/lib/types";

interface Editor {
  kind: EntityKind;
  id?: string;
}

/** A calm message about a change that didn't go through, with an optional retry. */
export interface Notice {
  text: string;
  retry?: () => void;
}

type LocalKind = Exclude<EntityKind, "apps">;

interface Store extends AppData {
  userName: string;
  editor: Editor | null;
  openEditor: (kind: EntityKind, id?: string) => void;
  closeEditor: () => void;
  /** People and target companies only (in memory). Applications use saveApp. */
  save: (kind: LocalKind, item: { id?: string } & Record<string, unknown>) => void;
  remove: (kind: LocalKind, id: string) => void;
  appsStatus: "loading" | "ready" | "error";
  reloadApps: () => void;
  /** Add (no id) or edit an application. Resolves with the server's answer so the form can show errors. */
  saveApp: (id: string | undefined, input: ApplicationInput) => Promise<Result<Application>>;
  /** Quick status change. Shows right away, rolls back with a notice if the save fails. */
  setStatus: (id: string, status: Status) => void;
  removeApp: (id: string) => Promise<boolean>;
  notice: Notice | null;
  dismissNotice: () => void;
  toggleGoal: (id: string) => void;
  addGoal: (text: string) => void;
  removeGoal: (id: string) => void;
  setCareer: (patch: Partial<CareerProfile>) => void;
  chat: ChatMessage[];
  sending: boolean;
  sendMessage: (text: string) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}

const newId = () => String(Date.now() + Math.floor(Math.random() * 1000));
const localToday = () => toISO(new Date());
const OFFLINE = "We couldn't reach Nudge just now.";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Real accounts start empty. People, career, and goals are still demo placeholders.
  const [data, setData] = useState<AppData>(() => ({
    ...structuredClone(SAMPLE),
    apps: [],
    companies: EMPTY.companies,
  }));
  const [appsStatus, setAppsStatus] = useState<Store["appsStatus"]>("loading");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  // ---- Applications (Supabase) -------------------------------------------
  const appsRef = useRef<Application[]>([]);
  useEffect(() => {
    appsRef.current = data.apps;
  }, [data.apps]);

  /** Insert or replace, keeping the server's order (most recently updated first) for new rows. */
  const putApp = useCallback((app: Application) => {
    setData((d) => {
      const exists = d.apps.some((a) => a.id === app.id);
      return { ...d, apps: exists ? d.apps.map((a) => (a.id === app.id ? app : a)) : [app, ...d.apps] };
    });
  }, []);
  const dropApp = useCallback((id: string) => {
    setData((d) => ({ ...d, apps: d.apps.filter((a) => a.id !== id) }));
  }, []);

  const loadApps = useCallback(async () => {
    try {
      const res = await listApplications();
      if (!res.ok) return setAppsStatus("error");
      setData((d) => ({ ...d, apps: res.data }));
      setAppsStatus("ready");
    } catch {
      setAppsStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const reloadApps = useCallback(() => {
    setAppsStatus("loading");
    void loadApps();
  }, [loadApps]);

  const saveApp: Store["saveApp"] = useCallback(
    async (id, input) => {
      try {
        const res = await saveApplication(id ?? null, input, localToday());
        if (res.ok) putApp(res.data);
        return res;
      } catch {
        return { ok: false, error: `${OFFLINE} Your changes are still here, so try again in a moment.` };
      }
    },
    [putApp],
  );

  const setStatus: Store["setStatus"] = useCallback(
    function change(id: string, status: Status) {
      const before = appsRef.current.find((a) => a.id === id);
      if (!before || before.status === status) return;
      setNotice(null);
      putApp({ ...before, status });
      const fail = (text: string) => {
        putApp(before);
        setNotice({ text: `${before.company} is still ${before.status}. ${text}`, retry: () => change(id, status) });
      };
      setApplicationStatus(id, status, localToday())
        .then((res) => (res.ok ? putApp(res.data) : fail(res.error)))
        .catch(() => fail(OFFLINE));
    },
    [putApp],
  );

  const removeApp: Store["removeApp"] = useCallback(
    async function del(id: string): Promise<boolean> {
      const company = appsRef.current.find((a) => a.id === id)?.company ?? "That application";
      setNotice(null);
      const fail = (text: string) => {
        setNotice({ text: `${company} wasn't deleted. ${text}`, retry: () => void del(id) });
        return false;
      };
      try {
        const res = await deleteApplication(id);
        if (!res.ok) return fail(res.error);
        dropApp(id);
        return true;
      } catch {
        return fail(OFFLINE);
      }
    },
    [dropApp],
  );

  // ---- In-memory placeholders (people, target companies, goals, career) ----
  const save: Store["save"] = useCallback((kind, item) => {
    setData((d) => {
      const list = d[kind] as { id: string }[];
      const exists = item.id && list.some((x) => x.id === item.id);
      const next = exists
        ? list.map((x) => (x.id === item.id ? { ...x, ...item } : x))
        : [...list, { ...item, id: newId() }];
      return { ...d, [kind]: next } as AppData;
    });
  }, []);

  const remove: Store["remove"] = useCallback((kind, id) => {
    setData((d) => ({ ...d, [kind]: (d[kind] as { id: string }[]).filter((x) => x.id !== id) }) as AppData);
  }, []);

  const toggleGoal = useCallback((id: string) => {
    setData((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)) }));
  }, []);
  const addGoal = useCallback((text: string) => {
    setData((d) => ({ ...d, goals: [...d.goals, { id: newId(), text, done: false }] }));
  }, []);
  const removeGoal = useCallback((id: string) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }, []);
  const setCareer = useCallback((patch: Partial<CareerProfile>) => {
    setData((d) => ({ ...d, career: { ...d.career, ...patch } }));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || sending) return;
      const history = [...chat, { role: "user" as const, content }];
      setChat([...history, { role: "assistant", content: "", pending: true }]);
      setSending(true);
      let reply = "Ask Nudge isn't connected yet. Once the AI route is built, the answer shows up here.";
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        if (res.ok) reply = (await res.json()).reply ?? reply;
      } catch {
        /* fall through to the placeholder reply */
      }
      setChat([...history, { role: "assistant", content: reply }]);
      setSending(false);
    },
    [chat, sending],
  );

  const value = useMemo<Store>(
    () => ({
      ...data,
      userName: DEMO_NAME, // TODO: from the session once auth exists
      editor,
      openEditor: (kind, id) => setEditor({ kind, id }),
      closeEditor: () => setEditor(null),
      save,
      remove,
      appsStatus,
      reloadApps,
      saveApp,
      setStatus,
      removeApp,
      notice,
      dismissNotice: () => setNotice(null),
      toggleGoal,
      addGoal,
      removeGoal,
      setCareer,
      chat,
      sending,
      sendMessage,
    }),
    [data, editor, chat, sending, save, remove, appsStatus, reloadApps, saveApp, setStatus, removeApp, notice, toggleGoal, addGoal, removeGoal, setCareer, sendMessage],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
