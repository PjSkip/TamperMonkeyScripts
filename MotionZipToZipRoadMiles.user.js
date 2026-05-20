// ==UserScript==
// @name         MotionTMS Zip to Zip Road Miles
// @namespace    MotionTMS-Custom-Scripts
// @version      16.8
// @description  Restored Road Miles via OSRM + Instant Cache & Native UI
// @author       Ivan Karpenko
// @match        https://*.motiontms.com/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/MotionZipToZipRoadMiles.user.js
// @downloadURL  https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/MotionZipToZipRoadMiles.user.js
// ==/UserScript==

(function() {
    'use strict';

    let isAddressAutoSelectEnabled = true;

    // ==========================================
    // 1. UI STYLES & CLICK STATES
    // ==========================================
    const STYLE = `
        .address-toggle-btn { cursor: pointer; display: inline-flex; align-items: center; background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.08); font-size: 11px !important; line-height: 1; transition: all 0.2s ease; vertical-align: middle; }
        .address-toggle-active { background-color: #d1e7dd !important; border-color: #a3cfbb !important; }

        /* Transparent Hero Bubble with Light Blue Border */
        .usko-miles-bubble {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            border: 1px solid #a2d2ff;
            border-radius: 5px;
            padding: 2px 5px;
            text-decoration: none !important;
            background-color: transparent;
            transition: all 0.2s ease;
            margin-top: 2px;
            max-width: 100%;
        }

        /* STRICT Cursor Fix: Applies to the bubble and everything inside it */
        .usko-miles-bubble, .usko-miles-bubble * {
            cursor: pointer !important;
        }

        .usko-miles-bubble:hover {
            border-color: #7ab8f5;
            background-color: rgba(162, 210, 255, 0.1);
        }

        /* Click States */
        .usko-miles-bubble.usko-clicked-history {
            background-color: #d4edda !important; /* Brighter, subtle pastel green */
        }
        .usko-miles-bubble.usko-clicked-recent {
            border-color: #dc3545 !important; /* Red Border */
        }

        .usko-miles-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            line-height: 1.15;
            white-space: nowrap;
            overflow: hidden;
        }

        /* Native TMS styling inheritance (No blue, no underline) */
        .usko-air-miles, .usko-road-miles {
            color: #333 !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: normal !important;
            text-decoration: none !important;
        }
        .usko-maps-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.textContent = STYLE;
    document.head.appendChild(styleSheet);

    document.addEventListener('click', (e) => {
        const bubble = e.target.closest('.usko-miles-bubble');
        if (bubble) {
            document.querySelectorAll('.usko-clicked-recent').forEach(el => {
                el.classList.remove('usko-clicked-recent');
            });
            bubble.classList.add('usko-clicked-history');
            bubble.classList.add('usko-clicked-recent');
        }
    });

    function simulateClick(el) {
        if (el) {
            try { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }
            catch (err) { el.click(); }
        }
    }

    function triggerAutocomplete(inputEl) {
        if (!isAddressAutoSelectEnabled) return;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        setTimeout(() => {
            const verifyBtn = document.querySelector('button.verify-btn');
            if (verifyBtn) simulateClick(verifyBtn);

            let attempts = 0;
            const checkDropdown = setInterval(() => {
                const options = document.querySelectorAll('mat-option');
                if (options.length > 0) {
                    for (let opt of options) {
                        const text = opt.textContent.trim().toUpperCase();
                        if (text.endsWith('USA') || text.endsWith('CANADA')) {
                            simulateClick(opt);
                            clearInterval(checkDropdown);
                            return;
                        }
                    }
                }
                if (attempts > 20) clearInterval(checkDropdown);
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
                btn.onclick = (e) => { e.stopPropagation(); isAddressAutoSelectEnabled = activeState; updateAddressToggles(); };
                return btn;
            };
            container.appendChild(createBtn('addr-manual-btn', '⏸️', 'Manual Input', false));
            container.appendChild(createBtn('addr-auto-btn', '▶️', 'Automatic', true));
            addressLabel.appendChild(container);
            updateAddressToggles();
        }
    }

    // ==========================================
    // 2. TRUE 1ST-OF-THE-MONTH CACHE WIPE
    // ==========================================
    function checkAndFlushCache() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const lastMonth = localStorage.getItem('usko_cache_month');

        if (lastMonth !== currentMonth) {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('usko_geo_') || key.startsWith('usko_route_')) {
                    localStorage.removeItem(key);
                }
            });
            localStorage.setItem('usko_cache_month', currentMonth);
            console.log('✅ 1st-of-the-month cache flush completed');
        }
    }

    // ==========================================
    // 3. CLEANING + GEOCODING + ROUTING
    // ==========================================
    const cleanForMaps = (address) => address ? address.replace(/\s+/g, ' ').trim() : "";

    const getMapQuery = (address) => {
        if (!address) return "";
        const zipMatch = address.match(/\b\d{5}\b/);
        if (zipMatch) return zipMatch[0];
        let clean = address.replace(/\bUSA\b/ig, '').replace(/\bUnited States\b/ig, '').replace(/\s+/g, ' ').trim();
        return clean.replace(/^,+|,+$/g, '').trim();
    };

    async function getCoordinates(address) {
        if (!address) return null;
        const clean = cleanForMaps(address);
        const cacheKey = 'usko_geo_' + clean;
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);

        try {
            const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(clean)}&sourceCountry=USA,CAN&maxLocations=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data?.candidates?.[0]?.location) {
                const coords = { lat: data.candidates[0].location.y, lon: data.candidates[0].location.x };
                localStorage.setItem(cacheKey, JSON.stringify(coords));
                return coords;
            }
        } catch (e) {}
        return null;
    }

    // Helper: Instantly checks cache without network
    function getCachedMiles(originAddr, destAddr) {
        const oClean = cleanForMaps(originAddr);
        const dClean = cleanForMaps(destAddr);
        const oCached = localStorage.getItem('usko_geo_' + oClean);
        const dCached = localStorage.getItem('usko_geo_' + dClean);

        if (oCached && dCached) {
            const oCoords = JSON.parse(oCached);
            const dCoords = JSON.parse(dCached);
            const coordsString = `${oCoords.lon},${oCoords.lat};${dCoords.lon},${dCoords.lat}`;
            const routeKey = 'usko_route_' + coordsString;
            const cachedRoute = localStorage.getItem(routeKey);
            if (cachedRoute) return parseInt(cachedRoute, 10);
        }
        return null;
    }

    async function fetchRoadMiles(originAddr, destAddr) {
        try {
            const oCoords = await getCoordinates(originAddr);
            const dCoords = await getCoordinates(destAddr);
            if (!oCoords || !dCoords) return null;

            const coordsString = `${oCoords.lon},${oCoords.lat};${dCoords.lon},${dCoords.lat}`;
            const routeKey = 'usko_route_' + coordsString;
            const cachedRoute = localStorage.getItem(routeKey);
            if (cachedRoute) return parseInt(cachedRoute, 10);

            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false`;
            const res = await fetch(osrmUrl);
            const data = await res.json();

            if (data.routes && data.routes[0]) {
                const miles = Math.round(data.routes[0].distance / 1609.344);
                localStorage.setItem(routeKey, miles.toString());
                return miles;
            }
        } catch (e) {}
        return null;
    }

    // ==========================================
    // 4. INSTANT CACHE BYPASS + SMART WATERFALL
    // ==========================================
    function renderBubbleUI(milesCell, airMilesText, roadMilesVal, rawOrigin, locCell) {
        let displayText;
        if (roadMilesVal === "loading") {
            displayText = "... mi";
        } else if (roadMilesVal !== null) {
            displayText = (roadMilesVal >= 1000 ? roadMilesVal.toLocaleString() : roadMilesVal) + ' mi';
        } else {
            displayText = (parseFloat(airMilesText) || 0).toLocaleString() + ' mi';
        }

        const mapUnit = encodeURIComponent(getMapQuery(locCell));
        const mapPickup = encodeURIComponent(getMapQuery(rawOrigin));

        // Fixed: Official Google Maps Directions API URL
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${mapUnit}&destination=${mapPickup}&travelmode=driving`;

        milesCell.innerHTML = `
            <a href="${mapsUrl}" target="_blank" class="usko-miles-bubble" title="Open Google Maps">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg" class="usko-maps-icon" alt="Maps">
                <div class="usko-miles-text">
                    <span class="usko-air-miles">${airMilesText}</span>
                    <span class="usko-road-miles">${displayText}</span>
                </div>
            </a>
        `;
    }

    const processRows = async () => {
        if (!location.href.includes('/available-trucks/list')) return;

        handleAddressInput();
        checkAndFlushCache();

        const rawOrigin = document.querySelector('.mat-body-2.tw-break-normal.ng-star-inserted')?.textContent.trim();
        const rows = Array.from(document.querySelectorAll('tr.available-unit-row'));

        if (!rawOrigin) {
            rows.forEach(row => {
                const milesCell = row.querySelector('td.mat-column-miles .default-text-lt');
                if (milesCell && milesCell.dataset.uskoProcessed) {
                    milesCell.innerHTML = milesCell.dataset.uskoAirText || milesCell.textContent.trim();
                    delete milesCell.dataset.uskoProcessed;
                    delete milesCell.dataset.uskoOrigin;
                }
            });
            return;
        }

        let networkDelayIndex = 0;

        for (const row of rows) {
            const milesCell = row.querySelector('td.mat-column-miles .default-text-lt');
            const locCell = row.querySelector('td.mat-column-currentLocation .default-text-lt')?.textContent.trim();

            if (!milesCell || !locCell) continue;

            if (milesCell.dataset.uskoProcessed && milesCell.dataset.uskoOrigin !== rawOrigin) {
                delete milesCell.dataset.uskoProcessed;
            }
            if (milesCell.dataset.uskoProcessed) continue;

            const airMilesText = milesCell.dataset.uskoAirText || milesCell.textContent.trim();
            milesCell.dataset.uskoAirText = airMilesText;
            milesCell.dataset.uskoOrigin = rawOrigin;

            // QUICK CACHE CHECK: If we have it, skip the timer completely
            const cachedMiles = getCachedMiles(rawOrigin, locCell);

            if (cachedMiles !== null) {
                // RENDER INSTANTLY (0 delay)
                renderBubbleUI(milesCell, airMilesText, cachedMiles, rawOrigin, locCell);
                milesCell.dataset.uskoProcessed = "true";
            } else {
                // NEEDS NETWORK: Show loading UI instantly
                milesCell.dataset.uskoProcessed = "processing";
                renderBubbleUI(milesCell, airMilesText, "loading", rawOrigin, locCell);

                // Queue the network fetch
                if (networkDelayIndex < 10) {
                    fetchAndUpdateRow(milesCell, airMilesText, rawOrigin, locCell);
                } else {
                    setTimeout(() => {
                        fetchAndUpdateRow(milesCell, airMilesText, rawOrigin, locCell);
                    }, 300 * (networkDelayIndex - 10)); // Only stagger the items that actually need the network
                }
                networkDelayIndex++;
            }
        }
    };

    async function fetchAndUpdateRow(milesCell, airMilesText, rawOrigin, locCell) {
        const roadMilesNum = await fetchRoadMiles(rawOrigin, locCell);

        const roadMilesSpan = milesCell.querySelector('.usko-road-miles');
        if (roadMilesSpan) {
            // Seamless update
            const displayText = roadMilesNum !== null
                ? (roadMilesNum >= 1000 ? roadMilesNum.toLocaleString() : roadMilesNum) + ' mi'
                : (parseFloat(airMilesText) || 0).toLocaleString() + ' mi';
            roadMilesSpan.textContent = displayText;
        } else {
            // Fallback render
            renderBubbleUI(milesCell, airMilesText, roadMilesNum, rawOrigin, locCell);
        }
        milesCell.dataset.uskoProcessed = "true";
    }

    // ==========================================
    // 5. OBSERVERS & LIFECYCLE
    // ==========================================
    let lastUrl = location.href;
    let domObserver = null;
    let debounceTimer = null;

    const debouncedProcessRows = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processRows, 120);
    };

    function startWatching() {
        if (domObserver) domObserver.disconnect();
        if (location.href.includes('/available-trucks/list')) {
            debouncedProcessRows();
            const target = document.querySelector('app-available-units-list') || document.querySelector('.mat-table') || document.body;
            domObserver = new MutationObserver(debouncedProcessRows);
            domObserver.observe(target, { childList: true, subtree: true });
        }
    }

    function handleNavigation() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (location.href.includes('/available-trucks/list')) setTimeout(startWatching, 150);
        }
    }

    const originalPushState = history.pushState;
    history.pushState = function() { originalPushState.apply(this, arguments); handleNavigation(); };

    const originalReplaceState = history.replaceState;
    history.replaceState = function() { originalReplaceState.apply(this, arguments); handleNavigation(); };

    window.addEventListener('popstate', handleNavigation);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWatching);
    } else {
        startWatching();
    }

    setInterval(() => {
        if (location.href.includes('/available-trucks/list')) processRows();
    }, 4000);
})();
