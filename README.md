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

MIT License

Copyright (c) 2026 Vivek Koundal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
