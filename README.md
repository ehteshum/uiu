# 🎓 UIU CGPA & Tuition Calculator

A comprehensive utility tool designed for United International University (UIU) students to calculate their CGPA, estimate tuition fees, and plan their academic targets.

![UIU Calculator](https://img.shields.io/badge/UIU-Calculator-orange) ![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## ✨ Features

### 📊 CGPA Calculator
- Calculate GPA for the current trimester.
- Calculate overall CGPA based on completed credits.
- Support for **Retake courses** (automatically adjusts CGPA logic).
- **Auto-saves** your data so you never lose progress.

### 💰 Tuition Fee Estimator
- Calculate total payable amount after **Waivers** and **Scholarships**.
- Breakdown of installment payments (1st, 2nd, and 3rd).
- Shows **Last Date** for each payment with visual badges.
- Supports custom Trimester Fee inputs.

### 🎯 Target CGPA
- Calculate the required GPA for the current trimester to reach a specific **Target CGPA**.
- Instant feedback on whether the target is achievable or impossible.

### 🛠️ Utilities
- **Auto-Save:** All inputs are persisted locally using LocalStorage.
- **Dark/Light Mode:** Toggle between themes with system preference detection.
- **Responsive Design:** Optimized for Mobile (iPhone/Android), Tablet, and Desktop.
- **Reset Data:** One-click reset to clear all stored information.

### 🔗 Share & Export
Available on every tab (CGPA, Tuition, Target) and on the Results popup.

- **Share:** Opens the native phone share sheet (WhatsApp, Messenger, …). Falls back to
  copying the link on desktop.
- **Copy Link:** Every input is encoded into a compact, versioned `?s=` URL parameter —
  no account and no database needed. Open the link on any device to load the exact
  same calculation.
- **Image:** Renders a branded 1080px result card on a canvas and saves it as a PNG.
- **PDF:** Sends the same card to a print-ready A4 view for “Save as PDF”.
- Hand-drawn on Canvas 2D, so no `html2canvas`/`jsPDF` was added to the bundle.

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ehteshum/uiu.git
   ```
2. Navigate to the project directory:
   ```bash
   cd uiu
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 📱 Usage

1. **CGPA Tab:** Add your courses and grades. If you have retakes, use the "Add Retake" button.
2. **Tuition Tab:** Enter your total tuition fee, select any waivers or scholarships, and see the installment breakdown.
3. **Target Tab:** Enter your current status and your goal to see what you need to score this trimester.

## 👨‍💻 Developed By

**Ishmam**

---
*This project is not officially affiliated with United International University.*