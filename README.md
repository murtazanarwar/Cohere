# Cohere
## 🧪 Demo Credentials

for quick demo, use the following account:

| Role       | Email                     | Password   |
| ---------- | ------------------------- | ---------- |
| Admin User | demo@cohere.com     | Demo@123#  |

Simply sign in at the login page with these credentials.
# Project Overview

Cohere is a Slack-style collaboration hub for industry teams and professionals. Cohere unifies real-time chat, threaded discussions, public knowledge feeds, and granular role-based permissions in one sleek, scalable workspace, so your organization can innovate faster, stay aligned, and build stronger professional networks.
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
- 🔔 Socket.IO (real-time presence & notifications)  

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

## Demo

Insert gif or link to demo

## 🔐 Environment Variables

To run this project locally (or in staging/production), create a `.env.local` file in the root and define these keys:

```dotenv
# Convex Deployment
CONVEX_DEPLOYMENT=your-convex-deployment-key

# Public-facing Convex URL
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.dev

# Resend Email API Key
AUTH_RESEND_KEY=rtf_live_XXXXXXXXXXXXXXXXXXXXXXXX
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
