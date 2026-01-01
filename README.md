# 🚀 IIITL Coding School - LMS Portal

A modern, high-performance frontend for the IIITL Coding School Learning Management System. This project features advanced UI interactions like magnetic buttons, 3D tilt effects, and smooth scroll animations, built with **React** and **Vite**.

![Project Preview](public/1st.png)
*(Note: Replace the image path above with a screenshot of your actual website if you have one)*

---

## ✨ Features

- **🎨 Modern UI/UX:** Dark-themed, glassmorphism design with a moving gradient background.
- **🧲 Magnetic Buttons:** Interactive buttons that magnetically follow your mouse cursor.
- **🧊 3D Tilt Cards:** Course and classroom cards that tilt in 3D space on hover.
- **📜 Scroll Animations:** Elements reveal smoothly as you scroll down the page.
- **⚡ Fast Performance:** Built using Vite for lightning-fast reloading.
- **📱 Fully Responsive:** Works perfectly on desktops, tablets, and mobile phones.
- **🔔 Notification System:** A simulated notification dropdown and badge counter.
- **❓ FAQ Section:** Interactive accordion-style Frequently Asked Questions.

---

## 🛠️ Tech Stack

- **Frontend Framework:** [React.js](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** CSS3 (Custom Animations, Flexbox, Grid)
- **Icons:** [Remix Icons](https://remixicon.com/)

---

## 📂 Project Structure

```bash
lms-project/
├── public/              # Static assets (images, icons)
│   ├── 1st.png          # Instructor/Hero Image
│   ├── r1.png           # Course Image 1
│   ├── r2.png           # Course Image 2
│   ├── r3.png           # Course Image 3
│   └── vite.svg
├── src/
│   ├── components/      # Reusable React Components
│   │   ├── MagneticButton.jsx  # Button logic
│   │   └── TiltCard.jsx        # 3D Card logic
│   ├── App.jsx          # Main Application Logic
│   ├── index.css        # Global Styles & Animations
│   └── main.jsx         # Entry point
├── index.html           # HTML Shell
├── package.json         # Project dependencies
└── vite.config.js       # Vite configuration
