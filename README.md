# Cohere
## 🧪 Demo Credentials

for quick demo, use the following account:

| Role       | Email                     | Password   |
| ---------- | ------------------------- | ---------- |
| Admin User | demo@cohere.com     | Demo@123#  |

Simply sign in at the login page with these credentials.
# Project Overview
Cohere is a Slack-style collaboration hub for industry teams and professionals. Cohere unifies real-time chat, threaded discussions, and granular role-based permissions in one sleek, scalable workspace, so your organization can innovate faster, stay aligned, and build stronger professional networks.

# ✨ Features
- 💬 Real-time Chat & Threads → modern Slack-style chat with threads for focused discussions.
- 🔐 SecureDrop → secure peer-to-peer messaging & file transfer with WebRTC, Socket.IO, and TURN servers.
- 🤖 AI Summarizer → automatically generate concise summaries of long chat discussions using Hugging Face models.
- 🛡️ Role-based Permissions → fine-grained control over access and collaboration.
- 📩 Email Notifications → powered by Resend for reliable communication.
- 🌐 Scalable Cloud Deployment → powered by Convex.dev + Vercel for seamless real-time sync.

## 🖥️ Tech Stack

**💻 Client:**  
- ⚡ Next.js 15 (React 18.3 + TypeScript)  
- 🎨 Tailwind CSS 3 + Plugins (tailwindcss-animate)  
- 🧩 Radix UI, Headless UI, Lucide React, React Icons  
- 🌱 Zustand (state management)  
- 📝 React Hook Form + Zod (forms & validation)  

**🛠️ Server / BaaS:**  
- ☁️ Convex.dev (serverless backend & real-time data sync)  
- 🔌 Next.js API Routes (TypeScript)  
- 🔒 NextAuth v5 (authentication)
- ✉️ Resend (email delivery) 
- 🔔 Socket.IO (real-time presence, notifications & signaling for SecureDrop)
- 🤖 Hugging Face Inference API (AI Summarizer integration)

**🗄️ Data & Caching:**  
- 📦 Convex built-in DB  
- 🔄 @tanstack/react-query (data fetching & caching)  
- 📅 date-fns (date utilities)  

**🚀 DevOps & CI/CD:**  
- 🌐 Vercel (hosting & auto-deploy)  
- 🤖 GitHub Actions (build → lint → test pipeline)   

**🧪 Testing & Quality:**  
- ✅ Jest + React Testing Library (unit & integration tests)  
- 🔍 ESLint (code quality) + 🎨 Prettier (formatting)  
- 🔐 TypeScript (static type safety)  

## SecureDrop enables:
- Peer-to-peer chat: Send messages directly to other users without the server storing message content.
- File transfer: Exchange files securely between peers, with status tracking (sending, sent, received).
- Serverless signaling: Uses Socket.IO to establish peer connections.
- TURN support: Ensures connectivity behind NATs/firewalls using Metered.co TURN servers.
- Secure & private: Only the peers involved in a session can access messages and files.

This feature integrates seamlessly into the existing chat interface.

## AI Summarizer enables:
- Summarize long chat threads into 2–4 sentences.
- Highlight key decisions and action items automatically.
- Works in real time using Convex Actions + Hugging Face models.
- Breaks long conversations into chunks for accurate summarization and merges results into a single concise output.

## 🚀 Demo

Here are quick walkthroughs of various features of the Cohere.  
📺 Tip: Watch at 2x speed for a faster overview!

### Youtube Demo
- [▶️ Cohere Demo (7:28)](https://youtu.be/ssDTyOHcHuI)
- [🔐 Cohere Secure Drop Feature (0:28)](https://youtu.be/-N1kZTby4dQ)
- [🤖 Cohere AI Channel Summarizer(1:00)](https://youtu.be/-N1kZTby4dQ)

## 🔐 Environment Variables

To run this project locally (or in staging/production), create a `.env.local` file in the root and define these keys:

```dotenv
# Convex Deployment
CONVEX_DEPLOYMENT=your-convex-deployment-key

# Public-facing Convex URL
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.dev

# Resend Email API Key
AUTH_RESEND_KEY=rtf_live_XXXXXXXXXXXXXXXXXXXXXXXX

# Metered.co TURN API Key (for SecureDrop)
NEXT_PUBLIC_METERED_API_KEY=your-metered-api-key

# Hugging Face API (for AI Summarizer)
HF_API_TOKEN=your-huggingface-api-token
HF_MODEL=facebook/bart-large-cnn   # or any summarization model
MAX_CHUNK_CHARS=8000
NEXT_PUBLIC_SUMMARY_CHUNK_CHARS=7000
```
## Run Locally

Clone the project

```bash
  git clone https://github.com/murtazanarwar/Cohere
```

Go to the project directory

```bash
  cd cohere-clone
```

Install dependencies

```bash
  npm install
```

Build for production

```bash
  npm run build
```

Start the production server

```bash
  npm run start
```
## License

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)  

## Badges

[![Version](https://img.shields.io/npm/v/cohere.svg)](https://www.npmjs.com/package/cohere)  
[![Build Status](https://img.shields.io/github/actions/workflow/status/your-username/cohere/ci.yml?branch=main)](https://github.com/your-username/cohere/actions)  
[![Coverage Status](https://img.shields.io/codecov/c/gh/your-username/cohere/main.svg)](https://codecov.io/gh/your-username/cohere)  
[![Dependencies](https://img.shields.io/librariesio/release/npm/cohere)](https://libraries.io/npm/cohere) 
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-username/cohere/pulls)  
