"use client";

import React, { useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import {
  FileText,
  Copy,
  Check,
  Download,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Layers,
  Users,
  PanelRightClose,
  PanelRightOpen,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { AskTheChat } from "../AskTheChat";
import { SourceCitationModal } from "../SourceCitationModal";

export const SummariesView: React.FC = () => {
  const { chats, activeChat, setActiveChatId, setActiveView, apiKey } =
    useChatContext();

  const [copied, setCopied] = useState(false);
  const [showCopilotSidebar, setShowCopilotSidebar] = useState(true);
  const [modalCitation, setModalCitation] = useState<{
    title: string;
    sourceMessageIds: string[];
  } | null>(null);

  const summarizedChats = chats.filter((c) => c.summary !== null);

  const displayChat =
    activeChat && activeChat.summary !== null
      ? activeChat
      : summarizedChats.length === 1
        ? summarizedChats[0]
        : null;

  const formatDateString = (isoString?: string) => {
    if (!isoString) return "";
    try {
      return format(parseISO(isoString), "dd MMM yyyy, HH:mm");
    } catch {
      return isoString;
    }
  };

  if (!displayChat || !displayChat.summary) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-in fade-in duration-300">
        <div className="pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Generated Summaries
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Explore structured digests and chat with your summarized
            conversations.
          </p>
        </div>

        {summarizedChats.length === 0 ? (
          <div className="text-center py-16 space-y-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                No summaries generated yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload a WhatsApp chat from the Home page and generate your
                first structured summary.
              </p>
            </div>
            <button
              onClick={() => setActiveView("home")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
            >
              <span>Go to Upload</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summarizedChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className="p-5 text-left rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {chat.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {chat.metadata.totalMessages.toLocaleString()} messages
                        analyzed
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Open &rarr;
                  </span>
                </div>

                {chat.summary && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {chat.summary.overview}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const { summary, messagesMap, messages, name } = displayChat;

  const generateMarkdown = () => {
    let md = `# Summary: ${summary.metadata.groupName || name}\n`;
    md += `**Date Range**: ${formatDateString(summary.metadata.dateRange.start)} - ${formatDateString(summary.metadata.dateRange.end)}\n`;
    md += `**Messages Analyzed**: ${summary.metadata.totalMessagesAnalyzed} | **Participants**: ${summary.metadata.participantCount}\n\n`;

    md += `## Overview\n${summary.overview}\n\n`;

    if (summary.keyDiscussions && summary.keyDiscussions.length > 0) {
      md += `## Key Discussions\n`;
      summary.keyDiscussions.forEach((d, i) => {
        md += `### ${i + 1}. ${d.topic}\n${d.summary}\n\n`;
      });
    }

    if (summary.decisionsAndAnnouncements && summary.decisionsAndAnnouncements.length > 0) {
      md += `## Decisions & Announcements\n`;
      summary.decisionsAndAnnouncements.forEach((dec) => {
        md += `- ${dec.text}\n`;
      });
      md += `\n`;
    }

    if (summary.issuesAndQuestions && summary.issuesAndQuestions.length > 0) {
      md += `## Issues & Questions\n`;
      summary.issuesAndQuestions.forEach((iss) => {
        md += `- **${iss.topic}** (${iss.status}): ${iss.details}\n`;
      });
      md += `\n`;
    }

    if (summary.importantDatesAndActions && summary.importantDatesAndActions.length > 0) {
      md += `## Important Dates & Actions\n`;
      summary.importantDatesAndActions.forEach((item) => {
        md += `- **${item.date}**: ${item.description}\n`;
      });
      md += `\n`;
    }

    if (summary.unresolvedTopics && summary.unresolvedTopics.length > 0) {
      md += `## Unresolved Topics\n`;
      summary.unresolvedTopics.forEach((u) => {
        md += `- ${u}\n`;
      });
      md += `\n`;
    }

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `${name.replace(/\s+/g, "_")}-summary.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Top Workspace Header Bar */}
      <div className="min-h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {summarizedChats.length > 1 && (
            <button
              onClick={() => setActiveChatId(null)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-medium pr-2 border-r border-slate-200 shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">All Summaries</span>
            </button>
          )}
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-xs">{name}</span>
          </span>
          <span className="text-[11px] text-slate-400 hidden md:inline truncate">
            &bull; {formatDateString(summary.metadata.dateRange.start)} &rarr;{" "}
            {formatDateString(summary.metadata.dateRange.end)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200/80 transition-colors"
            title="Copy as Markdown"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy Markdown"}</span>
            <span className="sm:hidden">{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200/80 transition-colors"
            title="Export JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>JSON</span>
          </button>

          {/* Toggle AI Copilot Sidebar */}
          <button
            onClick={() => setShowCopilotSidebar(!showCopilotSidebar)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs ${
              showCopilotSidebar
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/30"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-400"
            }`}
            title={showCopilotSidebar ? "Hide AI Copilot Sidebar" : "Open AI Copilot Sidebar"}
          >
            {showCopilotSidebar ? (
              <PanelRightClose className="h-3.5 w-3.5 text-white" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5 text-emerald-700" />
            )}
            <span>AI Copilot</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                showCopilotSidebar ? "bg-white animate-pulse" : "bg-emerald-500"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Split Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Area: Main Summary Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-4xl mx-auto w-full">
          {/* Executive Overview */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Executive Overview
            </span>
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
              {summary.overview}
            </p>

            <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  <strong>
                    {summary.metadata.totalMessagesAnalyzed.toLocaleString()}
                  </strong>{" "}
                  messages
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>
                  <strong>{summary.metadata.participantCount}</strong> active
                  members
                </span>
              </div>
            </div>
          </div>

          {/* Key Discussions */}
          {summary.keyDiscussions && summary.keyDiscussions.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Key Discussions
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Main conversation threads
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {summary.keyDiscussions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {item.topic}
                      </h4>
                      {item.sourceMessageIds && item.sourceMessageIds.length > 0 && (
                        <button
                          onClick={() =>
                            setModalCitation({
                              title: item.topic,
                              sourceMessageIds: item.sourceMessageIds,
                            })
                          }
                          className="text-[10px] text-emerald-700 font-semibold hover:underline shrink-0"
                        >
                          Sources ({item.sourceMessageIds.length})
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decisions & Announcements */}
          {summary.decisionsAndAnnouncements && summary.decisionsAndAnnouncements.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Decisions & Announcements
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Resolved points and agreed consensus
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {summary.decisionsAndAnnouncements.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-emerald-950 leading-snug">
                        {item.text}
                      </p>
                      {item.sourceMessageIds && item.sourceMessageIds.length > 0 && (
                        <button
                          onClick={() =>
                            setModalCitation({
                              title: item.text,
                              sourceMessageIds: item.sourceMessageIds,
                            })
                          }
                          className="text-[10px] text-emerald-700 font-semibold hover:underline shrink-0"
                        >
                          Sources
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues & Questions */}
          {summary.issuesAndQuestions && summary.issuesAndQuestions.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Issues & Questions Raised
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Questions, concerns, and their resolution status
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {summary.issuesAndQuestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.topic}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.details}
                      </p>
                    </div>

                    {item.sourceMessageIds && item.sourceMessageIds.length > 0 && (
                      <button
                        onClick={() =>
                          setModalCitation({
                            title: item.topic,
                            sourceMessageIds: item.sourceMessageIds,
                          })
                        }
                        className="text-[10px] text-emerald-700 font-semibold hover:underline self-start sm:self-auto shrink-0"
                      >
                        Inspect Citation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unresolved Topics */}
          {summary.unresolvedTopics && summary.unresolvedTopics.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-100 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Unresolved Topics
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Discussions requiring further clarification
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {summary.unresolvedTopics.map((u, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-slate-800"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Important Dates & Actions */}
          {summary.importantDatesAndActions && summary.importantDatesAndActions.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Important Dates & Upcoming Actions
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Deadlines and scheduled events
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {summary.importantDatesAndActions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-1.5"
                  >
                    <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      {item.date}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Area: AI Chat Copilot Drawer / Sidebar */}
        {showCopilotSidebar && (
          <>
            {/* Mobile/Tablet Backdrop (< lg) */}
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs animate-in fade-in"
              onClick={() => setShowCopilotSidebar(false)}
            />

            {/* Sidebar Container (Desktop inline, Mobile/Tablet slide-over drawer) */}
            <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] lg:relative lg:inset-auto lg:z-auto lg:w-96 xl:w-[420px] border-l border-slate-200/80 bg-white flex flex-col shrink-0 overflow-y-auto shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      AI Chat Copilot
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[190px]">
                      Context: {name}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCopilotSidebar(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  title="Close AI Copilot Panel"
                  aria-label="Close Copilot"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 p-4">
                <AskTheChat
                  messages={messages}
                  messagesMap={messagesMap}
                  apiKey={apiKey}
                  groupName={name}
                />
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Modal Citation Viewer */}
      {modalCitation && (
        <SourceCitationModal
          isOpen={Boolean(modalCitation)}
          onClose={() => setModalCitation(null)}
          title={modalCitation.title}
          sourceMessageIds={modalCitation.sourceMessageIds}
          messagesMap={messagesMap}
        />
      )}
    </div>
  );
};
