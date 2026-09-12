# 🌊 JalRakshak — Community Water Intelligence

> Hyper-local micro-water quality monitoring & aquifer defense platform for Indian neighborhoods.

[Live Demo](https://jalrakshak0101.netlify.app/)

---

## 📌 Project Overview
**JalRakshak** bridges the gap between slow lab testing and daily water consumption. By turning smartphone cameras into RGB colorimetry readers, residents can test borewells or tanker supplies with ₹5 test strips, automatically contributing to a shared, block-level contamination heatmap.

---

## 🔥 Key Features

- **🗺️ Interactive Aquifer Mapping:** Dynamic block-by-block thermal map showing real-time Fluoride, Nitrate, and pH levels across local borewell nodes.
- **📸 In-Browser RGB Colorimetry Reader:** Uses WebAudio/MediaDevices & Canvas API to parse 5-parameter test strips with lighting calibration ($L^*a^*b^*$ color space transformation).
- **⚠️ Actionable Health Advisories:** Instant decision support giving clear rules (e.g., *"Fluoride > 1.5 mg/L — Do NOT boil; switch to municipal supply"*).
- **🚚 Verified Tanker Registry:** Crowd-sourced safety ratings and scan histories for private water suppliers operating across local sectors.
- **📊 Real-Time Network Health:** Tracks total borewells monitored, active outbreaks, and neighborhood coverage metrics.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Tailwind CSS, Lucide Icons
- **Mapping:** Leaflet.js / React-Leaflet
- **Vision & Calibration:** Canvas RGB API, CIEDE2000 ($\Delta E$) color distance algorithm
- **Deployment:** Netlify

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone [https://github.com/your-username/jalrakshak.git](https://github.com/your-username/jalrakshak.git)

# Install dependencies
npm install

# Run dev server
npm run dev
