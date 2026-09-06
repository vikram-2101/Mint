export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-emerald-600 dark:text-emerald-400">
          ChatDigest
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          AI-Powered WhatsApp Group Chat Summarizer. Upload an export file,
          select a date range, and get clear, structured summaries with source
          traceability.
        </p>
      </div>
    </main>
  );
}
