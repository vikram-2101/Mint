"use client";

import React, { useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import {
  FileText,
  Copy,
  Check,
  Download,
  CheckCircle2,
  HelpCircle,
  Calendar,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  Layers,
  Users,
  PanelRightClose,
  PanelRightOpen,
  ArrowLeft,
  Sparkles,
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

  // If no chat is currently selected, or active chat doesn't have a summary, but summarized chats exist:
  // Show list of summarized chats to choose from.
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
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6 animate-in fade-in duration-300">
        <div className="pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Generated Summaries
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Explore structured digests and chat with your summarized
            conversations.
          </p>
        </div>

        {summarizedChats.length === 0 ? (
          <div className="text-center py-16 space-y-4 bg-white border border-slate-200/80 rounded-3xl p-8">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {chat.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {chat.metadata.totalMessages.toLocaleString()} messages
                        analyzed
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Open Summary &rarr;
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

  const { summary, messagesMap, messages, name, id } = displayChat;

  const generateMarkdown = () => {
    let md = `# Summary: ${summary.metadata.groupName || name}\n`;
    md += `**Date Range**: ${formatDateString(summary.metadata.dateRange.start)} - ${formatDateString(summary.metadata.dateRange.end)}\n`;
    md += `**Messages Analyzed**: ${summary.metadata.totalMessagesAnalyzed} | **Participants**: ${summary.metadata.participantCount}\n\n`;

    md += `## Overview\n${summary.overview}\n\n`;

    if (summary.keyDiscussions.length > 0) {
      md += `## Key Discussions\n`;
      summary.keyDiscussions.forEach((d, i) => {
        md += `### ${i + 1}. ${d.topic}\n${d.summary}\n\n`;
      });
    }

    if (summary.decisionsAndAnnouncements.length > 0) {
      md += `## Decisions & Announcements\n`;
      summary.decisionsAndAnnouncements.forEach((d) => {
        md += `- **Decision**: ${d.text}\n`;
      });
      md += "\n";
    }

    if (summary.issuesAndQuestions.length > 0) {
      md += `## Issues & Questions\n`;
      summary.issuesAndQuestions.forEach((issue) => {
        md += `- **[${issue.status.toUpperCase()}] ${issue.topic}**: ${issue.details}\n`;
      });
      md += "\n";
    }

    if (summary.unresolvedTopics.length > 0) {
      md += `## Unresolved Topics\n`;
      summary.unresolvedTopics.forEach((u) => {
        md += `- ${u}\n`;
      });
      md += "\n";
    }

    if (summary.importantDatesAndActions.length > 0) {
      md += `## Important Dates & Actions\n`;
      summary.importantDatesAndActions.forEach((item) => {
        md += `- **${item.date}**: ${item.description}\n`;
      });
      md += "\n";
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
      <div className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {summarizedChats.length > 1 && (
            <button
              onClick={() => setActiveChatId(null)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-medium pr-2 border-r border-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Summaries</span>
            </button>
          )}
          <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{name}</span>
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            &bull; {formatDateString(summary.metadata.dateRange.start)} &rarr;{" "}
            {formatDateString(summary.metadata.dateRange.end)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 transition-colors"
            title="Export JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>JSON</span>
          </button>

          {/* Toggle AI Copilot Sidebar */}
          <button
            onClick={() => setShowCopilotSidebar(!showCopilotSidebar)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${
              showCopilotSidebar
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-slate-600 border-slate-200"
            }`}
            title="Toggle AI Chat Copilot Panel"
          >
            {showCopilotSidebar ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
            <span>AI Copilot</span>
            <span
              className={`h-2 w-2 rounded-full ${
                showCopilotSidebar ? "bg-white animate-pulse" : "bg-emerald-500"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Split Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Area: Main Summary Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
          {/* Executive Overview */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Executive Overview
            </span>
            <p className="text-base text-slate-800 leading-relaxed font-normal">
              {summary.overview}
            </p>

            <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
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
          {summary.keyDiscussions.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Key Discussions
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Main conversation threads
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {summary.keyDiscussions.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {d.topic}
                      </h4>

                      {d.sourceMessageIds && d.sourceMessageIds.length > 0 && (
                        <button
                          onClick={() =>
                            setModalCitation({
                              title: d.topic,
                              sourceMessageIds: d.sourceMessageIds,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline shrink-0"
                        >
                          <span>{d.sourceMessageIds.length} sources</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {d.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decisions & Announcements */}
          {summary.decisionsAndAnnouncements.length > 0 && (
            <div className="bg-white border border-emerald-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Decisions & Announcements
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Confirmed rules and official updates
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {summary.decisionsAndAnnouncements.map((decision, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                        {decision.text}
                      </span>
                    </div>

                    {decision.sourceMessageIds &&
                      decision.sourceMessageIds.length > 0 && (
                        <button
                          onClick={() =>
                            setModalCitation({
                              title: decision.text,
                              sourceMessageIds: decision.sourceMessageIds,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline shrink-0"
                        >
                          <span>View source</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues & Questions */}
          {summary.issuesAndQuestions.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Issues & Questions
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Concerns and their resolution status
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {summary.issuesAndQuestions.map((issue, idx) => {
                  const statusBadge =
                    issue.status === "resolved"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : issue.status === "unresolved"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : "bg-amber-100 text-amber-800 border-amber-200";

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusBadge}`}
                          >
                            {issue.status.replace("_", " ")}
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {issue.topic}
                          </h4>
                        </div>

                        {issue.sourceMessageIds &&
                          issue.sourceMessageIds.length > 0 && (
                            <button
                              onClick={() =>
                                setModalCitation({
                                  title: issue.topic,
                                  sourceMessageIds: issue.sourceMessageIds,
                                })
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline shrink-0"
                            >
                              <span>
                                Sources ({issue.sourceMessageIds.length})
                              </span>
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {issue.details}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unresolved Topics */}
          {summary.unresolvedTopics.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-950">
                  Unresolved Topics
                </h3>
              </div>
              <ul className="space-y-1.5">
                {summary.unresolvedTopics.map((u, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-amber-900"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Important Dates */}
          {summary.importantDatesAndActions.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
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

        {/* Right Area: IDE-Style AI Chat Copilot Sidebar */}
        {showCopilotSidebar && (
          <aside className="w-96 border-l border-slate-200/80 bg-white flex flex-col shrink-0 overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
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
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                title="Hide Copilot Sidebar"
              >
                <PanelRightClose className="h-4 w-4" />
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
