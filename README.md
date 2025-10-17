# IITM Placement Filter

## Overview
This Chrome extension injects per-column filter controls into the placement table on the IITM placements site. It adds accessible filter icons next to each header, provides dropdowns for columns with repeated values and text inputs for free-text filtering, and supports a "Load All" mode that fetches and appends paginated pages so you can filter across all entries.

## Install locally
1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked" and select this folder
4. Open `https://placement.iitm.ac.in/students-all-companies`

## How it works (user-facing)

Filtering
- Click the SVG filter icon next to any column header.
- A popover opens with either a dropdown (when the column has many repeated values) or a text input for free-text search.
- Choose or type a value, then click Apply (or press Enter for text inputs). Clear removes the column filter.
- Multiple column filters combine with AND logic.

Load All (bypass pagination)
- Click the "Load All Pages" button in the bottom-right to fetch all paginated pages and append their rows to the current table.
- While pages are being fetched the button shows a spinner and a loading label.
- After loading finishes the table rows are renumbered (Sl No./first column) and the pagination UI is hidden.
- The extension persists your Load All preference and filters in localStorage so the state can be restored on reload.

Accessibility and keyboard
- Filter buttons are focusable and respond to Space/Enter to open the popover.
- Popovers use aria-expanded/aria-hidden attributes and are movable with keyboard focus to the control.

Persistence (localStorage keys)
- Filters are saved under the key `pf-filters-v2` as an object mapping header text → value.
- The Load All preference is saved under `pf-load-all` as `'true'` or `'false'`.

## Technical details (developer)
- Content script injects UI using `content.js` and runs on pages matched in `manifest.json`.
- Column detection: header text is read from the header cell content (e.g., inside `<div class="th-inner">`).
- Filter logic: client-side row hiding via `row.style.display = 'none'`.
- Dropdowns are created when a column has 2..100 unique non-empty values; otherwise a text input is shown.
- Load All implementation: the script fetches each paginated page via `fetch()`, parses the HTML with `DOMParser`, extracts rows from tables (selector `.table-striped tbody tr`), appends cloned rows to the current `tbody`, then renumbers the first column.
- During Load All the UI shows a centered loading message and the bottom-right button switches to a spinner state.

## Customization
- To change the matched URL pattern, edit `manifest.json` → `content_scripts` → `matches`.
- To change dropdown threshold, edit the `unique.length <= 100` check in `content.js`.
- To change or replace icons, edit `content.js` where inline SVGs are assigned (search for `btn.innerHTML` and `buildLoadButtonContent`).

## Notes and caveats
- Load All can take noticeable time on sites with many pages; use the spinner and on-screen loading message to monitor progress.
- The extension hides the site's pagination container after appending all rows; to restore pagination reload the page.

If you want, I can also:
- Replace remaining textual glyphs (e.g., any `▼` in docs) with the SVG icon and update images.
- Add a short demo HTML to exercise the content script locally.
