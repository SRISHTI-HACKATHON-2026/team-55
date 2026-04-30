# 🌿 EcoLedger: Institutional Civic Portal

**EcoLedger** is a robust, inclusive smart city platform designed for high-authority municipal resource management. This is a **fully functional end-to-end website** deployed live at: **[https://sdmshrishti.onrender.com](https://sdmshrishti.onrender.com)**.

[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://sdmshrishti.onrender.com)
[![Next.js 14](https://img.shields.io/badge/Framework-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

---

## 🚀 Key Features

### 🌐 End-to-End Functional Platform
*   **Fully Deployed System:** A production-ready civic portal accessible live at [sdmshrishti.onrender.com](https://sdmshrishti.onrender.com).
*   **Real-time Data Sync:** Seamless integration between resident reporting and administrative oversight.
*   **Role-Based Access:** Secure, fully-implemented workflows for both citizens and municipal administrators.

### 📍 Geospatial Analysis & High-Precision Mapping
*   **Deep Street-Level Maps:** Admin dashboard uses **Leaflet** with high-detail street layers for precise problem localization.
*   **Sub-Meter Geolocation:** Uses hardware-level `navigator.geolocation` for field reports to ensure administrative accuracy.
*   **Heatmaps:** Visualizes community issue density to prioritize municipal response.

### 🧠 AI Vision & Classification
*   **Gemini AI Integration:** Automatically classifies waste types (Plastic, Metal, Organic) from uploaded photos.
*   **Automated Severity Assessment:** AI analyzes photo evidence to determine the urgency of reported issues.

### 🏛️ Government-Grade UI/UX
*   **Institutional Aesthetic:** Deep forest green theme, high-contrast formal layouts, and official government-style banners.
*   **Multi-Language Support:** Fully translated into **English, Hindi, Kannada, and Marathi** for local inclusivity.
*   **Responsive Dashboard:** Specialized portals for both Administrative Oversight and Resident Action.

---

## 🛠️ Tech Stack

*   **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion.
*   **Backend:** Next.js API Routes, MongoDB (Mongoose).
*   **Voice Engine:** Exotel IVR Webhooks.
*   **Mapping:** Leaflet.js, MapTiler, OpenStreetMap.
*   **AI:** Google Gemini Pro Vision.
*   **State Management:** React Context + UIProvider.
*   **Authentication:** NextAuth.js.

---

## 📦 Getting Started

### Prerequisites
*   Node.js 18+
*   MongoDB Atlas account
*   Exotel Account (for IVR)
*   Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SRISHTI-HACKATHON-2026/team-55.git
    cd team-55
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file with the following:
    ```env
    MONGODB_URI=your_mongodb_uri
    NEXTAUTH_SECRET=your_secret
    GEMINI_API_KEY=your_gemini_key
    IVRTOKEN=your_exotel_token
    IVRAPIKEY=your_exotel_key
    IVRSID=your_exotel_sid
    NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 🌐 Deployment

This project is optimized for deployment on **Render**.

### Deployment Steps:
1.  Connect your GitHub repository to a new **Web Service** on Render.
2.  Set the Build Command to `npm run build`.
3.  Set the Start Command to `npm start`.
4.  Add all environment variables from your `.env.local` to the Render Dashboard.
5.  Ensure the IVR Webhook URL in Exotel is updated to `https://your-app.onrender.com/api/ivr/webhook`.

---

## 🏆 Hackathon Context

Developed for the **Srishti Hackathon 2026**, EcoLedger aims to revolutionize municipal resource tracking by making digital governance truly inclusive through its unique voice-to-data bridge.

---

**Developed by Team 55**
*(Part of the SDMShrishti Smart City Initiative)*
