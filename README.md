# CivilTrack Pro

CivilTrack Pro is a comprehensive Civil Engineering Management Dashboard designed for administrators, project managers, and engineers to seamlessly track, manage, and report on infrastructure projects across various constituencies and schemes.

**Live Demo / Deployment:** [https://devharish1371.github.io/CivilTrackPro/](https://devharish1371.github.io/CivilTrackPro/)

## 🚀 Features

- **Comprehensive Data State Management:** Robust tracking for Schemes, Constituencies, and Grant allocations.
- **Dynamic Financial Tracking:** Automatically calculate balances and utilization metrics against granted funds in real-time.
- **Secure Editing:** Project-level edits and administrative actions are secured behind a master password. 
- **Data Synchronization:** Built-in auto-sync engine and initialization utility for real-time synchronization with external Google Sheets to enable shared team collaboration.
- **Advanced Export Capabilities:** Full reporting functionality supporting multiple formats:
  - **PDF** and **Excel** for administrative and financial reporting.
  - **KML** for geospatial mapping of projects.
- **Rich Dashboard Analytics:** Visualize project status, fund utilization, and geographical spread through intuitive charts and metrics.
- **Role Management:** Manage Contractors and Engineers associated with various projects.

## 🛠️ Tech Stack

- **Core Framework:** React 19 + Vite
- **Styling:** Vanilla CSS (Tailwind-like structure in index.css)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Exporting/Reporting:** `jspdf`, `jspdf-autotable`, `xlsx`, `file-saver`
- **Routing:** React Router DOM
- **Date Manipulation:** `date-fns`

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devharish1371/CivilTrackPro.git
   cd CivilTrackPro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```


## 🚀 Deployment (GitHub Pages)

This project is configured to be deployed automatically to GitHub Pages.
To deploy a new version:
```bash
npm run deploy
```
This will build the Vite project and push the `dist` folder to the `gh-pages` branch.

## 📁 Project Structure

- `src/components/` - Core UI components including Dashboards, Layout, and Managers (Contractors, Engineers, Constituencies, etc.)
- `src/context/` - Global state management for projects and authentication.
- `src/utils/` - Utility functions for PDF/Excel/KML exports and Google Sheets sync engine.
- `src/data/` - Sample datasets.
- `public/` - Static assets like SVGs and icons.

## 📄 License

This project is proprietary and intended for authorized civil engineering administrative use.
