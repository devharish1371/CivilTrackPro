# CivilTrack Pro — User Manual

**Live Application Link:** [https://devharish1371.github.io/CivilTrackPro/](https://devharish1371.github.io/CivilTrackPro/)

Welcome to **CivilTrack Pro**, your comprehensive dashboard for tracking, managing, and reporting on civil infrastructure projects. This manual will guide you through all the features of the application, designed to give you seamless control over project workflows, finances, timelines, and spatial data.

---

## 📑 Table of Contents
1. [Introduction to the Dashboard](#1-introduction-to-the-dashboard)
2. [Managing Projects](#2-managing-projects)
3. [Filtering & Analytics](#3-filtering--analytics)
4. [Exporting Reports & Data](#4-exporting-reports--data)
5. [System Settings & Administration](#5-system-settings--administration)
6. [Offline Sync & Collaboration](#6-offline-sync--collaboration)
7. [Security, Exiting & Locking](#7-security-exiting--locking)

---

## 1. Introduction to the Dashboard

When you open CivilTrack Pro, you are greeted by the **Dashboard**. This is your command center, offering a high-level view of your entire civil engineering portfolio.

- **Key Metrics Overview**: At a glance, view the total number of projects, the total sanctioned amounts, received grants, utilized funds, and active alerts.
- **Interactive Stat Cards**: Click on the "Completed", "In Progress", or "Yet to Start" stat cards at the bottom of the dashboard. The app will instantly take you to the Projects list and filter it by that exact status!
- **Dynamic Filtering**: Click the **Filters** button at the top right to drill down into specific data. You can filter the entire dashboard by **Year**, **Constituency**, **Scheme**, or **Phase**. 
  - *Smart Filtering*: The dropdowns are smart! If you select a specific Scheme, the Constituency dropdown will only show constituencies that actually have projects under that scheme.
  - All charts and financial totals will instantly recalculate to reflect only your chosen filters.
- **Visual Analytics**: Interactive charts provide breakdowns of project statuses (Completed, In Progress, Yet to Start), scheme-wise budget distributions, and constituency-wise allocations.
- **Active Alerts**: A dedicated panel shows urgent items needing attention, such as expiring contractor guarantees or overdue security deposits, highlighted with bright, easy-to-read text.

---

## 2. Managing Projects

The **Projects** tab is where the day-to-day data entry and tracking occur.

### Adding a New Project
Click the **+ Add** button to create a new project. The form is logically divided into distinct workflow sections:
1. **Sanction & GO Details**: Enter foundational details like the Project Name, Constituency, Scheme, Category, **Phase**, and official GO Numbers.
2. **Timeline**: Log the Work Order Date, Contract Start/Completion dates, and Actual timelines. You can also assign the responsible **Contractor** here (this field is optional).
3. **Guarantee & Personnel**: Track the Performance Guarantee dates, Expiry Dates, and assign the Junior/Assistant Engineers overseeing the work.
4. **Financial Details**: Input the Sanctioned Amount, Tendered Cost, and actual Expenditure/Deductions. The system will automatically calculate the **Utilised Amount**, **Balance**, and provide a visual utilization percentage bar.
5. **Status**: Update the current status of the project and use the slider to set the real-time **Progress Percentage**.
6. **Security Deposit**: Log critical administrative details like the Security Amount, Deduction Date, Release Date, UC Sent Date, and M-Book numbers.
7. **Physical Parameters**: Use this large text area to write detailed, unstructured notes regarding physical site conditions or specific technical parameters.
8. **Geo-Tagging**: Input Latitude and Longitude coordinates. Once saved, you can view the project directly on Google Maps.
9. **Notes/Remarks**: General remarks regarding the project's overall lifecycle.

### Viewing & Editing Projects
In the Projects List, long project names will wrap beautifully to the next line so you never miss a detail. Click the **View (Eye icon)** on any project in the list to see a formatted read-only summary of all its details. From here, you can choose to Edit the project or export its specific details.

---

## 3. Filtering & Analytics

As your database grows, finding specific projects becomes crucial. The **Projects List** offers a powerful Filter Bar.

- You can search for projects by typing in names, GO numbers, or M-Book numbers.
- Use dropdowns to filter by Year, Scheme, Category, Phase, Status, Constituency, Engineer, or Contractor.
- The table will instantly filter down, and you can see the **Last Updated** column to quickly identify recently modified entries.

---

## 4. Exporting Reports & Data

CivilTrack Pro is built for extensive reporting, allowing you to take your data into the field or into meetings.

### PDF Export
- **List Level**: In the Projects list, click **PDF** at the top to instantly generate a tabular, professional PDF report of all currently filtered projects.
- **Individual Level**: Right next to every single project in the list, there are two quick-action buttons:
  - **Download PDF (Document Icon)**: Instantly generates a highly detailed, multi-page dossier for just that specific project.
  - **Share PDF (Share Icon)**: Directly opens your phone or computer's native sharing menu (WhatsApp, Email, etc.) so you can instantly share the specific project's dossier with your team.
- **Detail Level**: Inside a specific project's view, you also have the same PDF and Share buttons at the top of the page.

### Excel Export
Click the **Excel** button in the Projects list to export your data to a beautifully formatted `.xlsx` spreadsheet. It includes separate sheets for "All Projects", "Contractors", "Engineers", "Schemes", "Constituencies", and "Grants".

### KML Export (Google Earth)
Click the **KML** button to export a `.kml` file of your geo-tagged projects. You can load this file directly into Google Earth or external GIS software to see all your project locations mapped out geographically.

---

## 5. System Settings & Administration

Navigate to the **Settings** page (or the dedicated left-side menu items) to manage the core dropdowns and metadata used throughout the app.

- **Constituency Manager**: Add, edit, or delete Constituencies.
- **Scheme Manager**: Manage funding Schemes and their abbreviations.
- **Grant Module**: Log incoming funds for specific schemes and assign them to specific constituencies. The dashboard automatically compares these grants against your actual expenditures.
- **Engineer & Contractor Managers**: Maintain your roster of Junior Engineers, Assistant Engineers, and Contractors. Note: The Contractor Manager includes a predefined "Class" selection (Class 1 through 5).

---

## 6. Offline Sync & Collaboration

Because internet connectivity at civil project sites can be unreliable, CivilTrack Pro features a robust **Offline Excel Sync** system, allowing you to seamlessly work across multiple devices (e.g., your mobile phone and your office PC).

### How to use Offline Sync:
1. **On Device A (e.g., Mobile Phone)**: You add or edit project data while in the field.
2. **Export**: Go to **Settings -> Offline Excel Sync**. Select a custom date range (e.g., "Today") and click **Export Data (Excel)**. This downloads an Excel file containing all the projects and master data (contractors, schemes, grants) you recently updated.
3. **Transfer**: Send that Excel file to Device B (e.g., your office PC) via email, WhatsApp, or USB.
4. **On Device B (Office PC)**: Open CivilTrack Pro, go to **Settings -> Offline Excel Sync**, and click **Import Data (Excel)**. Select the file you just transferred.
5. **Merge**: The system will intelligently merge the data. It recognizes existing projects via their unique IDs and updates them, while seamlessly adding any completely new projects or master data you created in the field.

---

## 7. Security, Exiting & Locking

To prevent accidental deletions or unauthorized edits to finalized projects, CivilTrack Pro features robust security mechanisms.

- **Locking a Project**: In the Projects list or Detail view, click the **Lock** button. You will be prompted to enter the administrative master password. Once locked, the project cannot be edited or deleted by anyone without the password.
- **Unlocking**: Simply click the Lock icon again and enter the master password to unlock the project for further editing.
- **Exit App**: When you are finished, you can safely close the session by clicking the **Exit App** button at the very bottom of the left sidebar navigation menu. This will prompt a confirmation and safely close the application.

---
*CivilTrack Pro — Streamlining infrastructure management, from the office to the field.*
