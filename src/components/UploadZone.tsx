"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Sparkles, AlertCircle } from "lucide-react";
import { ANDROID_24H_CHAT } from "@/lib/fixtures/sample-chat";

interface UploadZoneProps {
  onFileLoaded: (text: string, fileName: string) => void;
  isLoading?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileLoaded,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMessage(null);

    if (!file.name.endsWith(".txt")) {
      setErrorMessage("Please upload a .txt WhatsApp export file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File exceeds 25 MB maximum limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim().length === 0) {
        setErrorMessage("The uploaded file is empty.");
        return;
      }
      onFileLoaded(text, file.name);
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read the file. Please try again.");
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadDemo = () => {
    setErrorMessage(null);
    onFileLoaded(ANDROID_24H_CHAT, "Palm Grove Residents Chat.txt");
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]"
            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-emerald-400 dark:hover:border-emerald-500/60 shadow-sm"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Upload exported WhatsApp chat
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Drag & drop your exported{" "}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                .txt
              </code>{" "}
              file here, or click to browse
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <FileText className="h-4 w-4" />
            <span>
              Supported format: WhatsApp .txt export (Without Media) &bull; Up
              to 25 MB
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Demo Chat Option */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
        <span>Don&apos;t have a file ready?</span>
        <button
          type="button"
          onClick={handleLoadDemo}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Load sample apartment chat</span>
        </button>
      </div>
    </div>
  );
};
