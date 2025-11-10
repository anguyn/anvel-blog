# 🧠 Anvel — Personal Blog & Code Snippet Platform

A personal web platform built with **Next.js** where developers can share their **code snippets**, write **blog posts**, and manage everything through a **modular architecture**.  
The project also includes a **Node.js service** for handling **automation tasks**, **background jobs**, and **realtime updates**.

---

## 🧩 Features

### ✅ Core Features
- **Blog System:** Create and publish personal blog posts with Markdown editor support.  
- **Code Snippets:** Share, edit, and delete code snippets easily.  
- **Tag System:** Organize posts and snippets by language or topic (e.g., JavaScript, AI, Automation).  
- **Public Profiles:** Showcase your posts and snippets under your profile.  
- **Search & Filter:** Quickly find relevant snippets or blog posts.  
- **Responsive Design:** Optimized for both desktop and mobile.  
- **Internationalization (i18n):** Supports **English** and **Vietnamese**.  
- **Authentication:** Basic email/password login & registration (mocked for demo).  
- **SEO Ready:** Custom meta tags and titles for each post and snippet.

---

### ⚡ Bonus Features
- **Realtime Updates:** Powered by the Node.js automation service (e.g., auto-sync, background jobs).  
- **Time Complexity Analyzer:** Estimates algorithmic complexity (e.g., O(n), O(n²), O(log n)).  
- **Image Thumbnails:** Optionally attach preview thumbnails to snippets.  
- **Dark Mode:** Smooth theme toggle experience.  
- **Infinite Scroll / Pagination:** Load snippets and blog posts efficiently.

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | [Next.js 14](https://nextjs.org/) |
| **Styling** | [TailwindCSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) |
| **i18n** | [next-intl](https://next-intl-docs.vercel.app/) |
| **Backend Service** | **Node.js** (automation, cron jobs, realtime) |
| **Deployment** | [Render](https://render.com/) |

---

## ⚙️ How to Run Locally

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/anguyn/anvel.git
cd anvel
```

### 2️⃣ Install Dependencies
Make sure you have **Node.js v18+** installed.
```bash
yarn install
```

### 3️⃣ Add Environment Variables
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

### 4️⃣ Run the Development Server
```bash
yarn dev
```
Visit 👉 [http://localhost:3000](http://localhost:3000)

---

## 🧠 Node.js Automation Service
The **Node.js service** (separate module) handles:
- Background jobs and cron tasks  
- Real-time sync via WebSocket/EventSource  
- Automated data updates and analysis tasks  

> The service runs independently but integrates seamlessly with the main Next.js frontend.

---

## 📷 Live Demo
**URL:** [https://anvel.site/](https://anvel.site/)  
_Note: Render free tier may take 1–5 minutes to wake up if idle._

---

## 👤 Test Account
| Email | Password |
| ------ | -------- |
| admin@anvel.com | Admin@123456 |


---

## 📧 Contact
**An Nguyen**  
📩 [anguynvn99@gmail.com](mailto:anguynvn99@gmail.com)  
📞 07837676750
