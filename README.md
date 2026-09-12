# 🌿 ChatDigest — AI WhatsApp Group Chat Summarizer & Copilot

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5--flash-emerald?style=flat-square&logo=google)

**ChatDigest** turns thousands of chaotic, unread WhatsApp group messages into structured executive briefings, key decisions, action items, topic breakdowns, and a grounded AI Q&A Copilot with exact message citations.

---

## ✨ Features

- **⚡ Fast Parsing & Date Filtering**: Supports iOS and Android WhatsApp `.txt` exports with instant filtering (`Last 24h`, `Last 7d`, `Last 30d`, `All`, or `Custom Range`).
- **📑 Structured Executive Digest**: Generates overview summaries, key decisions, action items with assignees, important dates/deadlines, open issues, and participant statistics.
- **🤖 Grounded AI Chat Copilot**: Ask natural-language questions about any discussion. Every answer is strictly grounded in original chat messages with clickable source citations.
- **🛡️ 100% Privacy-First & Ephemeral**: Chat messages are parsed in-memory for the active session. Zero message text is stored in server-side databases.
- **🔑 Flexible API Key Configuration**: Provide a global `GEMINI_API_KEY` on the server or let users input their own Gemini API key directly in Settings.
- **📱 Clean Modern UI**: Pure emerald green and white palette, fully responsive across desktop, tablet, and mobile.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone <repository-url>
cd ChatDigest
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```
Add your Gemini API Key from [Google AI Studio](https://aistudio.google.com/):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Tests & Production Build
```bash
# Run unit & integration test suites
npm test

# Build optimized production bundle
npm run build
```

---

## ☁️ Deploying to Vercel (Production)

### Method 1: Deploy via GitHub (Recommended)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Add New Project"** -> **"Import Git Repository"**.
3. Select your `ChatDigest` repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/).
   - `GEMINI_MODEL`: `gemini-2.5-flash` *(optional)*.
5. Click **Deploy**. Vercel will automatically build and deploy your project with a live URL.

### Method 2: Deploy via Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```
2. Run deployment:
   ```bash
   vercel
   ```
3. When prompted, add your environment variables or configure them in the Vercel Dashboard under **Project Settings > Environment Variables**.
4. For production release:
   ```bash
   vercel --prod
   ```

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Yes\*** | Google Gemini API Key for server-side generation | — |
| `GEMINI_MODEL` | No | Primary Gemini model to use | `gemini-2.5-flash` |
| `NEXT_PUBLIC_APP_URL` | No | Base canonical URL of the deployed app | `http://localhost:3000` |
| `MAX_UPLOAD_SIZE_MB` | No | Maximum allowed chat upload size in megabytes | `25` |

*\*If omitted on the server, end-users can still supply their own Gemini API key in the app Settings screen.*

---

## 🏗️ Architecture & Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **AI Engine**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai) (`gemini-2.5-flash` with fallback cascade)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/) (60 automated unit & integration tests)

---

## 📄 License
MIT License. Free for personal and commercial use.

