# NanoPixel: Wafer Navigation Error Recovery Engine

## 🌐 Live Website
[https://ismail-io.github.io/Nano-Pixel/](https://ismail-io.github.io/Nano-Pixel/)

---

## 📝 Project Description
NanoPixel is a high-precision wafer alignment and calibration platform designed for semiconductor manufacturing nodes. The engine calculates and resolves sub-pixel alignment drift between physical wafer electron scans (Field of View) and ideal design templates (GDSII layouts) using real-time image-matching algorithms.

---

## ⚙️ Important Specifications
* **Scale Normalization:** Reference design layouts (160x160 px) consist of 10x10 pixel grid blocks. The matching engine downsamples the templates 10x to represent their true 16x16 scale prior to cross-correlation against the 576x432 scanning Field of View.
* **Repeating Grid Ambiguity Resolution:** Highly periodic memory structures (DRAM capacitors, FinFET nodes, NAND arrays) produce repeating, identical correlation peaks across the wafer surface. NanoPixel resolves this lattice ambiguity using a center-distance priority filter, selecting the winner candidate peak closest to the central coordinate `(288, 216)` when peak correlation scores are nearly identical.
* **Sub-Pixel Telemetry:** Translates pixel-level offset drifts directly into nanometer equivalents (using a calibration ratio of 2.8 nm/pixel) to support scanner calibration feedback.

---

## 🛠️ Tools & Technologies Used
* **Pattern Matching Pipeline:** Python 3.10+, OpenCV, NumPy, and JSON Serialization.
* **Frontend Web Application:** React 19, TypeScript, Vite, Tailwind CSS, and Lucide React.
* **Narration & Guides:** Web Speech API (`SpeechSynthesis`) for interactive narration, CSS keyframe animations, and custom DOM scroll-locking logic.

---

## 🚀 Running Locally
### Prerequisites
- Node.js (v18+)
- Python 3.10+ (optional, only to run the matching engine offline)

### Setup & Launch
1. Clone the repository and navigate to the directory:
   ```bash
   git clone https://github.com/ismail-io/Nano-Pixel.git
   cd Nano-Pixel
   ```
2. Install the web application dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.*
