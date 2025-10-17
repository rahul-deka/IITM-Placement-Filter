<div align="center">

# IITM Placement Filter

<em>A Chrome extension that adds per-column filtering in the IITM Placement Portal with an additional “Load All” functionality.</em>

<p align="center">
  <a href="https://github.com/rahul-deka/IITM-Placement-Filter/archive/refs/tags/v1.0.0.zip" title="Download v1.0.0">
    <img src="https://img.shields.io/badge/Download-v1.0.0-blue?style=flat-square&logo=github" alt="Download v1.0.0" />
  </a>
  <a>
    <img alt="size" src="https://img.shields.io/github/repo-size/rahul-deka/IITM-Placement-Filter?label=size&style=flat-square&color=green">
  </a>
  <a>
    <img alt="downloads" src="https://img.shields.io/github/downloads/rahul-deka/IITM-Placement-Filter/latest/IITM%20Placement%20Filter?displayAssetName=false&label=downloads&style=flat-square">
  </a>
  <a href="https://github.com/rahul-deka/IITM-Placement-Filter/blob/main/LICENSE" title="MIT License">
    <img alt="license" src="https://img.shields.io/badge/License-MIT-magenta?style=flat-square" />
  </a>
</p>

</div>

## Overview
This Chrome extension injects per-column filter controls into the placement table on the IITM placements site. It adds accessible filter icons next to each header, provides dropdowns for columns with repeated values and text inputs for free-text filtering, and supports a "Load All" mode that fetches and appends paginated pages so you can filter across all entries.

## Install locally

1. Click the "Download" button above to get the extension ZIP file.
2. Open Chrome and go to `chrome://extensions`.
3. Enable "Developer mode" using the toggle in the top-right corner.
4. Click "Load unpacked" and select the extracted folder from the downloaded ZIP file.
5. Navigate to `https://placement.iitm.ac.in/students-all-companies` to start using the extension.

## Notes
- For the best experience, set your browser's zoom level to 75%. This ensures the UI elements are optimally displayed.

## How it works

### Filtering
- Click the filter icon next to any column header to open a dropdown or text input.
- Select a value from the dropdown or type in the text input, then click Apply or press Enter.
- To remove a filter, click Clear.
- You can apply filters to multiple columns, which combine using AND logic.

### Load All Pages
- Click the "Load All Pages" button to fetch all paginated pages and display their rows in the table.
- While loading, the button shows a spinner and a loading label.
- After loading completes, the table rows are renumbered, and pagination controls are hidden.
- Your filters and Load All preference are saved automatically and restored on page reload.

## License
This project is distributed for educational and personal use. No affiliation with the official IIT Madras placement portal.