"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { Button, Card } from "@sanson/ui";
import type { ChatMessage, ChatSession, SessionInsights } from "@sanson/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LegalDisclaimer } from "./legal-disclaimer";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isClient = msg.senderType === "CLIENT";
  const isSystem = msg.senderType === "SYSTEM";

  return (
    <div className={cn("flex gap-2", isClient ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isClient ? "bg-pink-500/20 text-pink-300" : "bg-violet-500/20 text-violet-300"
        )}
      >
        {isClient ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn("max-w-[85%] space-y-1", isClient ? "items-end text-right" : "")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg backdrop-blur-md",
            isClient && "rounded-br-md bg-pink-500/20 text-white",
            !isClient && !isSystem && "rounded-bl-md border sanson-panel text-zinc-100",
            isSystem && "border border-violet-500/20 bg-violet-500/10 text-violet-100"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
        </div>
        <span className="text-[10px] text-zinc-500">{formatTime(msg.createdAt)}</span>
      </div>
    </div>
  );
}

/** Collapse consecutive identical messages (from old stream retry duplicates). */
function visibleMessages(messages: ChatMessage[]): ChatMessage[] {
  const filtered = messages.filter(
    (m) => m.messageType !== "SYSTEM" || messages.length <= 2
  );
  const out: ChatMessage[] = [];
  for (const m of filtered) {
    const prev = out[out.length - 1];
    if (prev && prev.senderType === m.senderType && prev.message === m.message) {
      continue;
    }
    out.push(m);
  }
  return out;
}

export function AiAssistantChat() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [insights, setInsights] = useState<SessionInsights | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const [suggested, setSuggested] = useState<string[]>([]);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const loadSessions = useCallback(async () => {
    const res = await api.listChatSessions();
    if (res.success && res.data) setSessions(res.data);
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    const res = await api.getChatHistory(sessionId);
    if (res.success && res.data) setMessages(res.data);
    const ins = await api.getSessionInsights(sessionId);
    if (ins.success && ins.data) setInsights(ins.data);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadSessions();
      const sq = await api.getSuggestedQuestions();
      if (sq.success && sq.data) setSuggested(sq.data);
      setLoading(false);
    })();
    api
      .getSystemHealth()
      .then((r) => {
        if (r.success && r.data && "ai_chat_configured" in r.data) {
          setAiAvailable(Boolean((r.data as Record<string, unknown>).ai_chat_configured));
        }
      })
      .catch(() => {
        /* health is best-effort; keep chat usable */
      });
  }, [loadSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamBuffer, streaming, scrollToBottom]);

  const startNewSession = async () => {
    setSending(true);
    const res = await api.createChatSession();
    if (res.success && res.data) {
      setActiveSession(res.data);
      await loadSessions();
      await loadMessages(res.data.id);
    }
    setSending(false);
  };

  const selectSession = async (session: ChatSession) => {
    setActiveSession(session);
    setStreamBuffer("");
    await loadMessages(session.id);
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !activeSession || sending) return;

    setInput("");
    setSending(true);
    setStreaming(true);
    setStreamBuffer("");

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: activeSession.id,
      senderType: "CLIENT",
      message: content,
      messageType: "TEXT",
      tokenUsage: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const finish = async () => {
      setStreaming(false);
      setStreamBuffer("");
      await loadMessages(activeSession.id);
      setSending(false);
    };

    try {
      await api.streamChatMessage(
        activeSession.id,
        content,
        (delta) => setStreamBuffer((b) => b + delta),
        finish,
        async () => {
          /* Stream failed — user message may already be saved; reload only (no duplicate POST). */
          await finish();
        }
      );
    } catch {
      await finish();
    }
  };

  const handleDecision = async (decision: string) => {
    if (!activeSession) return;
    setDecisionLoading(true);
    const res = await api.submitChatDecision(activeSession.id, decision);
    setDecisionLoading(false);
    if (res.success) {
      if (decision === "REQUEST_LEGAL_REPRESENTATION" && res.data?.legalRequestId) {
        router.push("/dashboard/client/requests");
      } else if (decision === "RETURN_LATER") {
        await loadSessions();
        setActiveSession(null);
        setMessages([]);
      }
    }
  };

  const displayList = visibleMessages(messages);

  if (loading) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <div className="sanson-ai-chat-root grid h-full min-h-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:gap-4 xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,260px)]">
      <Card className="sanson-panel flex max-h-[min(28vh,220px)] min-h-0 flex-col overflow-hidden p-3 backdrop-blur-md md:max-h-none md:h-full">
        <Button
          className="mb-3 w-full shrink-0 gap-2"
          onClick={startNewSession}
          disabled={sending}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New conversation
        </Button>
        <p className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Session history
        </p>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
          {sessions.length === 0 && (
            <p className="text-xs text-zinc-500">No sessions yet</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectSession(s)}
              className={cn(
                "w-full rounded-lg px-2 py-2 text-left text-xs transition",
                activeSession?.id === s.id
                  ? "bg-pink-500/20 text-pink-100"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )}
            >
              <span className="font-mono text-[10px] text-zinc-500">{s.sessionReference}</span>
              <p className="truncate font-medium">{s.status}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex h-full min-h-0 flex-col overflow-hidden border-white/10 bg-gradient-to-b from-white/8 to-transparent backdrop-blur-md">
        <div className="shrink-0 border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-pink-400" />
            <h2 className="truncate font-semibold text-white">AI Legal Assistant</h2>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
            Magsulat sa English, Filipino, Cebuano, o anumang wika — tutugon ang assistant sa
            parehong wika.
          </p>
          {activeSession && (
            <p className="mt-1 truncate font-mono text-[10px] text-zinc-500 sm:text-xs">
              {activeSession.sessionReference}
            </p>
          )}
          {!aiAvailable && (
            <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              The AI assistant is being configured and may not reply right now. Your messages are
              still saved, and you can use <strong>Request representation</strong> to reach our
              team directly.
            </p>
          )}
        </div>

        <div ref={messagesScrollRef} className="sanson-ai-chat-messages space-y-4 p-3 sm:p-4">
          {!activeSession && (
            <div className="flex min-h-[12rem] flex-col items-center justify-center gap-4 py-8 text-center">
              <Bot className="h-14 w-14 text-pink-400/50 sm:h-16 sm:w-16" />
              <p className="max-w-sm text-sm text-zinc-400">
                Start a conversation to describe your legal concern. You may write in English,
                Filipino (Tagalog), Cebuano, or your preferred language.
              </p>
              <Button onClick={startNewSession}>Begin intake</Button>
            </div>
          )}

          {activeSession && displayList.map((m) => <MessageBubble key={m.id} msg={m} />)}

          {streaming && streamBuffer && (
            <div className="flex gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                <Bot className="h-4 w-4 text-violet-300" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border sanson-panel px-4 py-2.5 text-sm text-zinc-100">
                {streamBuffer}
                <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-pink-400" />
              </div>
            </div>
          )}

          {sending && !streaming && !streamBuffer && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
        </div>

        {activeSession && (
          <div className="shrink-0 border-t border-white/10">
            {suggested.length > 0 && messages.length < 3 && (
              <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto px-3 py-2 sm:px-4">
                {suggested.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-full border sanson-panel px-3 py-1 text-xs text-zinc-300 hover:border-pink-500/30 hover:text-pink-200"
                    onClick={() => sendMessage(q)}
                    disabled={sending}
                  >
                    {q.length > 60 ? `${q.slice(0, 60)}…` : q}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 sm:p-4">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ilahad ang legal concern (English, Filipino, Cebuano, atbp.)…"
                  rows={2}
                  className="max-h-24 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-pink-500/50 focus:outline-none"
                  disabled={sending || activeSession.status !== "ACTIVE"}
                />
                <Button
                  size="icon"
                  className="h-auto shrink-0 self-end"
                  onClick={() => sendMessage()}
                  disabled={sending || !input.trim() || activeSession.status !== "ACTIVE"}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {activeSession.status === "ACTIVE" && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={decisionLoading || sending}
                    onClick={() => handleDecision("CONTINUE_CHAT")}
                  >
                    Continue chat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={decisionLoading || sending}
                    onClick={() => handleDecision("RETURN_LATER")}
                  >
                    Return later
                  </Button>
                  <Button
                    size="sm"
                    disabled={decisionLoading || sending}
                    onClick={() => handleDecision("REQUEST_LEGAL_REPRESENTATION")}
                  >
                    Request representation
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <div className="hidden min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain xl:flex xl:max-h-full">
        <LegalDisclaimer compact />
        <Card className="sanson-panel shrink-0 p-4 backdrop-blur-md">
          <h3 className="mb-3 text-sm font-semibold text-white">Intake insights</h3>
          {!insights?.classification && !insights?.summary && (
            <p className="text-xs text-zinc-500">
              Classification and summary appear after sufficient conversation or when you request
              representation.
            </p>
          )}
          {insights?.classification && (
            <div className="mb-3 space-y-1 text-xs">
              <p>
                <span className="text-zinc-500">Category:</span>{" "}
                {insights.classification.category}
              </p>
              <p>
                <span className="text-zinc-500">Subcategory:</span>{" "}
                {insights.classification.subcategory}
              </p>
              <p>
                <span className="text-zinc-500">Urgency:</span> {insights.classification.urgency}
              </p>
              <p>
                <span className="text-zinc-500">Confidence:</span>{" "}
                {insights.classification.confidenceScore}%
              </p>
            </div>
          )}
          {insights?.summary && (
            <div className="text-xs text-zinc-300">
              <p className="font-medium text-zinc-200">Summary</p>
              <p className="mt-1 leading-relaxed">{insights.summary.summaryText}</p>
              {insights.summary.missingInformation?.length > 0 && (
                <>
                  <p className="mt-2 font-medium text-amber-300/90">Missing information</p>
                  <ul className="mt-1 list-inside list-disc text-zinc-400">
                    {insights.summary.missingInformation.map((item, i) => (
                      <li key={i}>{String(item)}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          {insights?.recommendations && insights.recommendations.length > 0 && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="mb-2 text-xs font-medium text-zinc-200">Recommendations</p>
              {insights.recommendations.map((r) => (
                <p key={r.id} className="mb-1 text-xs text-zinc-400">
                  • {r.message}
                </p>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
