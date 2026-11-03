"use client";
/**
 * Temporary client-side store. It holds the demo data in memory so the whole UI
 * works before a backend exists. Nothing persists after a reload.
 *
 * When the backend is ready, replace the bodies of these actions with server
 * actions or fetch calls (and load initial data in the (app) layout). Components
 * should not need to change, they only talk to useStore().
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { isoDaysAgo } from "@/lib/dates";
import { DEMO_NAME, SAMPLE } from "@/lib/mock/sample";
import type {
  AppData,
  CareerProfile,
  ChatMessage,
  EntityKind,
  Status,
} from "@/lib/types";

interface Editor {
  kind: EntityKind;
  id?: string;
}

interface Store extends AppData {
  userName: string;
  editor: Editor | null;
  openEditor: (kind: EntityKind, id?: string) => void;
  closeEditor: () => void;
  save: (kind: EntityKind, item: { id?: string } & Record<string, unknown>) => void;
  remove: (kind: EntityKind, id: string) => void;
  setStatus: (id: string, status: Status) => void;
  markFollowedUp: (id: string) => void;
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => structuredClone(SAMPLE));
  const [editor, setEditor] = useState<Editor | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

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

  const setStatus: Store["setStatus"] = useCallback((id, status) => {
    setData((d) => ({
      ...d,
      apps: d.apps.map((a) => {
        if (a.id !== id) return a;
        const stamp = status === "Applied" && !a.dateApplied;
        return {
          ...a,
          status,
          ...(stamp ? { dateApplied: isoDaysAgo(0), lastActivity: isoDaysAgo(0) } : {}),
        };
      }),
    }));
  }, []);

  const markFollowedUp: Store["markFollowedUp"] = useCallback((id) => {
    setData((d) => ({
      ...d,
      apps: d.apps.map((a) => (a.id === id ? { ...a, lastActivity: isoDaysAgo(0) } : a)),
    }));
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
      setStatus,
      markFollowedUp,
      toggleGoal,
      addGoal,
      removeGoal,
      setCareer,
      chat,
      sending,
      sendMessage,
    }),
    [data, editor, chat, sending, save, remove, setStatus, markFollowedUp, toggleGoal, addGoal, removeGoal, setCareer, sendMessage],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
