// ==UserScript==
// @name         MotionTMS Zip to Zip Road Miles
// @namespace    MotionTMS-Custom-Scripts
// @version      13.11
// @description  Displays Air Miles with Road Miles below without a separator.
// @author       Ivan Karpenko
// @match        https://*.motiontms.com/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/MotionZipToZipRoadMiles.user.js
// @downloadURL  https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/MotionZipToZipRoadMiles.user.js
// ==/UserScript==


(function() {
    'use strict';

    let RouteMatrixClass = null;
    let isAddressAutoSelectEnabled = true;

    // --- INJECT UI STYLES FOR ADDRESS TOGGLE ---
    const STYLE = `
        .address-toggle-btn { cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.08); font-size: 11px !important; line-height: 1; transition: all 0.2s ease; vertical-align: middle; }
        .address-toggle-active { background-color: #d1e7dd !important; border-color: #a3cfbb !important; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.textContent = STYLE;
    document.head.appendChild(styleSheet);

    // --- ADDRESS AUTO-FILL LOGIC ---
    function simulateClick(el) {
        if (el) {
            try {
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            } catch (err) {
                el.click();
            }
        }
    }

    function triggerAutocomplete(inputEl) {
        if (!isAddressAutoSelectEnabled) return;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        setTimeout(() => {
            // Use the robust class selector instead of the fragile SVG path
            const verifyBtn = document.querySelector('button.verify-btn');
            if (verifyBtn) simulateClick(verifyBtn);

            let attempts = 0;
            const checkDropdown = setInterval(() => {
                const options = document.querySelectorAll('mat-option');
                if (options.length > 0) {
                    for (let opt of options) {
                        const text = opt.textContent.trim().toUpperCase();
                        // ONLY auto-click if it is a verified North American address
                        if (text.endsWith('USA') || text.endsWith('CANADA')) {
                            simulateClick(opt);
                            clearInterval(checkDropdown);
                            return;
                        }
                    }
                }
                if (attempts > 20) clearInterval(checkDropdown); // Give up after 2 seconds to prevent infinite loops
                attempts++;
            }, 100);

            inputEl.focus();
        }, 100);
    }

    function updateAddressToggles() {
        const manualBtn = document.getElementById('addr-manual-btn');
        const autoBtn = document.getElementById('addr-auto-btn');
        if (manualBtn && autoBtn) {
            manualBtn.classList.toggle('address-toggle-active', !isAddressAutoSelectEnabled);
            autoBtn.classList.toggle('address-toggle-active', isAddressAutoSelectEnabled);
        }
    }

    function handleAddressInput() {
        const addressInput = document.querySelector('input[formcontrolname="searchString"]');
        if (addressInput && !addressInput.dataset.listenerAttached) {
            addressInput.addEventListener('paste', () => setTimeout(() => triggerAutocomplete(addressInput), 100));
            addressInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') setTimeout(() => triggerAutocomplete(addressInput), 100);
            });
            addressInput.dataset.listenerAttached = "true";
        }

        const addressLabel = Array.from(document.querySelectorAll('motion-ui-label')).find(el => el.textContent.includes('Full Address'));
        if (addressLabel && !document.getElementById('address-toggle-container')) {
            const container = document.createElement('div');
            container.id = 'address-toggle-container';
            container.style.cssText = `display: inline-flex; gap: 6px; margin-left: 10px; vertical-align: middle; height: 18px; align-items: center;`;

            const createBtn = (id, icon, label, activeState) => {
                const btn = document.createElement('div');
                btn.id = id;
                btn.className = 'address-toggle-btn';
                btn.innerHTML = `<span style="font-size: 10px;">${icon}</span><span style="margin-left:4px; font-weight:600; font-size: 10px; color: #333;">${label}</span>`;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    isAddressAutoSelectEnabled = activeState;
                    updateAddressToggles();
                };
                return btn;
            };

            container.appendChild(createBtn('addr-manual-btn', '⏸️', 'Manual Input', false));
            container.appendChild(createBtn('addr-auto-btn', '▶️', 'Automatic', true));
            addressLabel.appendChild(container);
            updateAddressToggles();
        }
    }

    // --- MILES CALCULATION LOGIC ---
    const initRoutesAPI = async () => {
        if (!RouteMatrixClass && window.google?.maps?.importLibrary) {
            try {
                const { RouteMatrix } = await google.maps.importLibrary("routes");
                RouteMatrixClass = RouteMatrix;
            } catch (err) {
                console.error("Failed to load google.maps.routes:", err);
            }
        }
        return RouteMatrixClass;
    };

    const cleanForMaps = (address) => {
        if (!address) return "";
        return address.replace(/\s+/g, ' ').trim();
    };

    const processRows = async () => {
        if (!location.href.includes('/available-trucks/list')) return;

        // Ensure PU address listeners and UI are attached whenever the page renders
        handleAddressInput();

        const rawOrigin = document.querySelector('.mat-body-2.tw-break-normal.ng-star-inserted')?.textContent.trim();
        if (!rawOrigin) return;

        const RouteMatrix = await initRoutesAPI();
        if (!RouteMatrix) return;

        const rows = Array.from(document.querySelectorAll('tr.available-unit-row'));

        const rowPromises = rows.map(async (row) => {
            const milesCell = row.querySelector('td.mat-column-miles .default-text-lt');
            const locCell = row.querySelector('td.mat-column-currentLocation .default-text-lt')?.textContent.trim();

            if (milesCell && locCell && !milesCell.dataset.processed) {
                const airMiles = milesCell.textContent.trim();
                milesCell.dataset.processed = "processing";

                try {
                    const response = await RouteMatrix.computeRouteMatrix({
                        origins: [rawOrigin],
                        destinations: [locCell],
                        travelMode: 'DRIVING',
                        fields: ['condition', 'distanceMeters', 'localizedValues']
                    });

                    const matrixData = response?.matrix || response;
                    const firstRow = matrixData?.rows?.[0];
                    const route = firstRow?.items?.[0] || firstRow?.elements?.[0] || firstRow?.[0];

                    if (route && route.distanceMeters !== undefined) {
                        const rawMeters = route.distanceMeters;
                        const forcedMiles = Math.round(rawMeters / 1609.344);
                        const formattedMiles = `${forcedMiles.toLocaleString()} mi`;

                        const safeOrigin = encodeURIComponent(cleanForMaps(locCell));
                        const safeDest = encodeURIComponent(cleanForMaps(rawOrigin));

                        // Stacked aggressive URL parameters to force the Web UI into US Miles
                        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${safeOrigin}&destination=${safeDest}&travelmode=driving&units=imperial&gl=US&hl=en-US&doflg=ptm`;

                        milesCell.innerHTML = `
                            <div>${airMiles}</div>
                            <a href="${mapsUrl}" target="_blank" style="color: #1e7e34; font-weight: bold; font-size: 13px; text-decoration: none; display: block; cursor: pointer;" title="Check Empty Miles in Google Maps">${formattedMiles}</a>
                        `;
                        milesCell.dataset.processed = "true";
                    } else {
                        if (response?.error) {
                            console.warn("Motion TMS Miles Script: API Error Response:", response.error);
                        }
                        milesCell.dataset.processed = "";
                    }
                } catch (error) {
                    console.error("RouteMatrix API Error:", error);
                    milesCell.dataset.processed = "";
                }
            }
        });

        await Promise.all(rowPromises);
    };

    // --- OPTIMIZED OBSERVER LOGIC ---
    let lastUrl = location.href;
    let domObserver = null;
    let debounceTimer = null;

    const debouncedProcessRows = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            processRows();
        }, 100);
    };

    function startWatching() {
        if (domObserver) domObserver.disconnect();

        if (location.href.includes('/available-trucks/list')) {
            debouncedProcessRows();

            const targetContainer = document.querySelector('app-available-units-list') ||
                                    document.querySelector('.mat-table') ||
                                    document.body;

            domObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        debouncedProcessRows();
                        break;
                    }
                }
            });

            domObserver.observe(targetContainer, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWatching);
    } else {
        startWatching();
    }

    function handleNavigation() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (location.href.includes('/available-trucks/list')) {
                setTimeout(startWatching, 150);
            }
        }
    }

    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        handleNavigation();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        handleNavigation();
    };

    window.addEventListener('popstate', handleNavigation);

    setInterval(() => {
        if (location.href.includes('/available-trucks/list')) {
            processRows();
        }
    }, 3000);

})();
