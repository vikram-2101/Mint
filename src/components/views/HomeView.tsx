"use client";

import React, { useRef, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import {
  Upload,
  FileText,
  ChevronRight,
  AlertCircle,
  FileUp,
} from "lucide-react";

export const HomeView: React.FC = () => {
  const { uploadChatText, loadSampleChat, errorMessage, setErrorMessage } =
    useChatContext();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.endsWith(".txt")) {
      setErrorMessage("Please upload a valid WhatsApp .txt export file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File exceeds the 25 MB size limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim().length === 0) {
        setErrorMessage("The uploaded file is empty.");
        return;
      }
      try {
        uploadChatText(text, file.name, file.size);
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMessage(error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Section */}
      <div className="space-y-3 sm:space-y-4 text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Summarize your{" "}
          <span className="text-emerald-600">WhatsApp groups</span> in seconds
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          Upload your exported WhatsApp chat and get clear, structured summaries
          of decisions, announcements, discussions, and more.
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Upload Zone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-6 sm:p-10 md:p-14 text-center transition-all bg-white shadow-sm space-y-5 sm:space-y-6 ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
            : "border-slate-200 hover:border-emerald-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {/* Green Document Icon */}
        <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto relative shadow-inner">
          <FileText className="h-7 w-7 sm:h-8 sm:w-8" />
          <div className="absolute -bottom-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white shadow-sm">
            <Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            Upload your WhatsApp chat
          </h3>
          <p className="text-xs text-slate-500 px-2">
            Drag and drop your exported{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">
              .txt
            </code>{" "}
            file here, or click to browse
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-md shadow-emerald-700/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <FileUp className="h-4 w-4" />
            <span>Choose file</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 pt-1">
          Supported format: WhatsApp .txt export (without media) &bull; Up to 25 MB
        </p>
      </div>

      {/* 3. Or Try A Sample Chat */}
      <div className="space-y-4 text-center pt-2">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">
            Or try a sample chat
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={() => loadSampleChat()}
          className="inline-flex items-center justify-between gap-4 max-w-sm w-full mx-auto px-5 py-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-slate-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>Try sample conversation</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
