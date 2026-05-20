// ==UserScript==
// @name         Motion TMS Loaded Miles + PU & Del Bar
// @namespace    MotionTMS-Custom-Scripts
// @version      13.4
// @description  Restored Loaded Miles Bar via OSRM + Instant Cache & Native UI
// @author       Ivan Karpenko
// @match        https://*.motiontms.com/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/MotionLoadedMilesPUDelBar.user.js
// @downloadURL  https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/MotionLoadedMilesPUDelBar.user.js
// ==/UserScript==

(function() {
    'use strict';

    let currentLoadedMiles = 0;

    const stateFull = { "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming" };

    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // FIXED: Smarter parsing for full state names and messy ArcGIS output
    const simplifyAddress = (address) => {
        if (!address) return "";
        const zipMatch = address.match(/\b\d{5}\b/);
        const zip = zipMatch ? ` ${zipMatch[0]}` : "";

        let stateAbbr = "";
        let fullState = "";

        // 1. Try to find a 2-letter state code
        const stateMatch = address.match(/\b([A-Z]{2})\b/);
        if (stateMatch && stateFull[stateMatch[1]]) {
            stateAbbr = stateMatch[1];
            fullState = stateFull[stateAbbr];
        } else {
            // 2. Try to find a full state name if 2-letter fails (e.g. "Oklahoma")
            for (const [abbr, full] of Object.entries(stateFull)) {
                if (new RegExp(`\\b${full}\\b`, 'i').test(address)) {
                    stateAbbr = abbr;
                    fullState = full;
                    break;
                }
            }
        }

        // 3. Extract the city properly
        let cleanAddr = address.replace(/\b\d{5}\b/g, '').replace(/\bUSA\b/ig, '').replace(/\bUnited States\b/ig, '').trim();
        let parts = cleanAddr.split(',').map(p => p.trim()).filter(p => p.length > 0);

        let city = parts[0];

        if (parts.length > 1) {
            let stateIndex = parts.findIndex(p =>
                (stateAbbr && new RegExp(`\\b${stateAbbr}\\b`, 'i').test(p)) ||
                (fullState && new RegExp(`\\b${fullState}\\b`, 'i').test(p))
            );

            // The city is almost always the block right before the state
            if (stateIndex > 0) {
                city = parts[stateIndex - 1];
            } else if (stateIndex === -1 && parts.length >= 2) {
                city = parts[0]; // fallback
            }
        }

        let formatted = city;
        if (stateAbbr) formatted += `, ${stateAbbr}`;
        if (zip) formatted += zip;
        if (fullState) formatted += ` (${fullState})`;

        return formatted;
    };

    // Flattens multi-line/messy text into a perfect single string for the URL
    const cleanForMaps = (address) => {
        if (!address) return "";
        return address.replace(/\s+/g, ' ').trim();
    };

    // Smart filter for Google Maps URL (Only returns Zip if it exists, otherwise clean City/State)
    const getMapQuery = (address) => {
        if (!address) return "";
        const zipMatch = address.match(/\b\d{5}\b/);
        if (zipMatch) return zipMatch[0];
        let clean = address.replace(/\bUSA\b/ig, '').replace(/\bUnited States\b/ig, '').replace(/\s+/g, ' ').trim();
        return clean.replace(/^,+|,+$/g, '').trim();
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // ==========================================
    // TRUE 1ST-OF-THE-MONTH CACHE WIPE
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
            console.log('✅ Loaded Miles Bar: 1st-of-the-month cache flush completed');
        }
    }

    // --- ArcGIS Geocoding (Locked to USA & Canada) ---
    async function geocodeAddressArcGIS(address) {
        if (!address) return null;
        const query = cleanForMaps(address);

        const cacheKey = 'usko_geo_' + query;
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);

        try {
            const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(query)}&sourceCountry=USA,CAN&maxLocations=1`;
            const res = await fetch(url);
            if (!res.ok) return null;

            const data = await res.json();
            if (data && data.candidates && data.candidates.length > 0) {
                const result = {
                    lat: data.candidates[0].location.y,
                    lon: data.candidates[0].location.x,
                    formatted: data.candidates[0].address
                };
                localStorage.setItem(cacheKey, JSON.stringify(result));
                return result;
            }
        } catch (e) {
            console.error("ArcGIS Geocoding failed for:", query, e);
        }
        return null;
    }

    // --- OSRM Routing ---
    async function getRoadMiles(originAddr, destAddr) {
        const originData = await geocodeAddressArcGIS(originAddr);
        const destData = await geocodeAddressArcGIS(destAddr);

        if (!originData || !destData) return null;

        const coordsString = `${originData.lon},${originData.lat};${destData.lon},${destData.lat}`;
        const routeKey = 'usko_route_' + coordsString;
        const cachedRoute = localStorage.getItem(routeKey);

        if (cachedRoute) return parseInt(cachedRoute, 10);

        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false`;
            const res = await fetch(url);
            if (!res.ok) return null;

            const data = await res.json();
            if (data && data.routes && data.routes.length > 0) {
                // Guaranteed whole number
                const miles = Math.ceil(data.routes[0].distance / 1609.344);
                localStorage.setItem(routeKey, miles.toString());
                return miles;
            }
        } catch (e) {
            console.error("OSRM Routing failed", e);
        }
        return null;
    }

    function createMileageUI() {
        const topBar = document.querySelector('section.tw-flex.tw-flex-row.tw-justify-between.tw-p-3');
        if (!topBar || document.getElementById('motion-load-miles-center')) return;

        const container = document.createElement('div');
        container.id = 'motion-load-miles-center';
        container.style.cssText = 'flex: 1; display: flex; align-items: center; justify-content: flex-start; gap: 12px; padding: 0 15px; font-size: 15px; margin-left: 40px;';

        container.innerHTML = `
            <button id="maps-go-btn" style="background:#2c5273;color:white;border:none;padding:0 16px;cursor:pointer;font-weight:600;font-size:13.5px;border-radius:6px;height:38px;white-space:nowrap;line-height:38px;">
                Google Maps
            </button>
            <div id="loaded-miles-box" style="background:#f8f9fa; border:1px solid #e0e0e0; border-radius:8px; padding:8px 16px; font-weight:700; font-size:17px; color:#1e7e34; white-space:nowrap; min-width:190px; text-align:center; height:38px; line-height:38px; display:flex; align-items:center; justify-content:center;">
                Loaded Miles:
            </div>
            <div id="locations-box" style="display:flex; align-items:center; gap:12px; background:#f8f9fa; border:1px solid #e0e0e0; border-radius:8px; padding:8px 16px; height:38px; line-height:38px;">
                <div style="font-weight:600; color:#2c5273;">City/State</div>
                <span style="font-size:22px; color:#1e7e34; font-weight:700;">→</span>
                <div style="font-weight:600; color:#2c5273;">City/State</div>
            </div>
        `;

        const rightButtons = topBar.querySelector('.tw-space-x-4');
        if (rightButtons) topBar.insertBefore(container, rightButtons);
        else topBar.appendChild(container);

        document.getElementById('maps-go-btn').onclick = (e) => {
            e.stopImmediatePropagation();
            const p = getMapQuery(document.querySelector('.mat-body-2.tw-break-normal.ng-star-inserted')?.textContent);
            const d1 = getMapQuery(document.getElementById('dest1-input')?.value);
            const d2 = getMapQuery(document.getElementById('dest2-input')?.value);

            let dests = [];
            if (d1 && d1.length > 2) dests.push(d1);
            if (d2 && d2.length > 2) dests.push(d2);

            if (p && dests.length > 0) {
                // Fixed: Official Google Maps Directions API formatting
                let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(p)}`;

                if (dests.length === 1) {
                    url += `&destination=${encodeURIComponent(dests[0])}`;
                } else if (dests.length === 2) {
                    url += `&destination=${encodeURIComponent(dests[1])}&waypoints=${encodeURIComponent(dests[0])}`;
                }

                url += `&travelmode=driving`;
                window.open(url, '_blank');
            } else {
                alert("Please ensure the Pickup and at least one Delivery address are filled.");
            }
        };
    }

    const calculateMiles = async () => {
        checkAndFlushCache();

        const p = document.querySelector('.mat-body-2.tw-break-normal.ng-star-inserted')?.textContent.trim();
        const d1 = document.getElementById('dest1-input')?.value.trim();
        const d2 = document.getElementById('dest2-input')?.value.trim();

        const milesBox = document.getElementById('loaded-miles-box');
        const locsBox = document.getElementById('locations-box');

        if (!d1 && !d2) {
            currentLoadedMiles = 0;
            if (milesBox) milesBox.innerHTML = `Loaded Miles: `;
            if (locsBox) locsBox.innerHTML = `<div style="font-weight:600; color:#2c5273;">City/State</div><span style="font-size:22px; color:#1e7e34; font-weight:700;">→</span><div style="font-weight:600; color:#2c5273;">City/State</div>`;
            updateAllUnitsMiles();
            return;
        }

        if (!p) return;

        let dests = [];
        if (d1 && d1.length > 2) dests.push(d1);
        if (d2 && d2.length > 2) dests.push(d2);

        if (dests.length === 0) return;

        try {
            let totalMiles = 0;
            let routesValid = true;

            const leg1 = await getRoadMiles(p, dests[0]);
            if (leg1 !== null) {
                totalMiles += leg1;
            } else {
                routesValid = false;
            }

            if (dests.length === 2) {
                await sleep(150); // Be kind to API if not cached
                const leg2 = await getRoadMiles(dests[0], dests[1]);
                if (leg2 !== null) {
                    totalMiles += leg2;
                } else {
                    routesValid = false;
                }
            }

            if (routesValid && totalMiles > 0) {
                currentLoadedMiles = totalMiles;

                if (milesBox) milesBox.innerHTML = `Loaded Miles: <span style="color:#1e7e34; margin-left: 4px;">${formatNumber(totalMiles)}</span>`;

                const arrow = `<span style="font-size:22px; color:#1e7e34; font-weight:700;">→</span>`;
                let locsHTML = `<div style="font-weight:600; color:#2c5273;">${simplifyAddress(p)}</div>${arrow}<div style="font-weight:600; color:#2c5273;">${simplifyAddress(dests[0])}</div>`;

                if (dests.length === 2) {
                    locsHTML += `${arrow}<div style="font-weight:600; color:#2c5273;">${simplifyAddress(dests[1])}</div>`;
                }

                if (locsBox) locsBox.innerHTML = locsHTML;

                updateAllUnitsMiles();
            }
        } catch (error) {
            console.error("OSRM API Error during Loaded Miles calculation:", error);
        }
    };

    const geocodeAndCalc = async (el) => {
        const val = el.value.trim();
        if (val.length > 3) {
            const data = await geocodeAddressArcGIS(val);
            if (data && data.formatted) {
                let formatted = data.formatted;

                const zipMatch = val.match(/\b\d{5}\b/);
                if (zipMatch && !formatted.match(/\b\d{5}\b/)) {
                    if (formatted.endsWith(', USA')) {
                        formatted = formatted.replace(', USA', ` ${zipMatch[0]}, USA`);
                    } else {
                        formatted += ` ${zipMatch[0]}`;
                    }
                }

                el.value = formatted;
            }
            calculateMiles();
        } else if (val.length === 0) {
            calculateMiles();
        }
    };

    function updateAllUnitsMiles() {
        const milesColumns = document.querySelectorAll('app-available-units-table-miles-column');

        milesColumns.forEach(column => {
            const container = column.querySelector('.default-text-lt');
            if (!container) return;

            const innerLink = container.querySelector('.motion-location-link');
            const dataWrapper = innerLink ? innerLink : container;

            if (innerLink) {
                innerLink.style.textDecoration = 'none';
                innerLink.style.color = '#333';
                innerLink.style.cursor = 'default';
            }

            if (innerLink) {
                Array.from(innerLink.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes('all')) {
                        node.nodeValue = node.nodeValue.replace(/[\d,\.]+\s*all/gi, '').trim();
                    }
                });
            }

            const rawText = dataWrapper.textContent || "";
            let roadMiles = 0;
            let foundRoadMiles = false;

            const miMatch = rawText.match(/([\d,\.]+)\s*mi/i);
            if (miMatch) {
                roadMiles = parseFloat(miMatch[1].replace(/,/g, ''));
                foundRoadMiles = true;
            }

            if (!currentLoadedMiles || currentLoadedMiles <= 0 || !foundRoadMiles || roadMiles <= 0) {
                const existingAllMiles = container.querySelector('.custom-all-miles-display');
                if (existingAllMiles) existingAllMiles.remove();
                return;
            }

            const allMiles = Math.ceil(currentLoadedMiles + roadMiles);

            let allMilesDiv = container.querySelector('.custom-all-miles-display');

            if (!allMilesDiv) {
                allMilesDiv = document.createElement('div');
                allMilesDiv.className = 'custom-all-miles-display';

                allMilesDiv.style.cssText = 'display: block !important; width: 100% !important; font-weight: bold !important; color: #1e7e34 !important; font-size: 13.5px !important; margin-bottom: 2px !important; text-align: center !important; text-decoration: none !important; cursor: default !important;';

                if (innerLink) {
                    container.insertBefore(allMilesDiv, innerLink);
                } else {
                    container.insertBefore(allMilesDiv, container.firstChild);
                }
            }

            allMilesDiv.textContent = `${formatNumber(allMiles)} all`;

            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.textAlign = 'center';

            if (innerLink) {
                innerLink.style.display = 'flex';
                innerLink.style.flexDirection = 'column';
                innerLink.style.alignItems = 'center';
                innerLink.style.whiteSpace = 'pre-line';
                innerLink.style.lineHeight = '1.4';
            } else {
                container.style.whiteSpace = 'pre-line';
                container.style.lineHeight = '1.4';
            }
        });
    }

    function injectCustomUI() {
        if (!location.href.includes('/available-trucks/list')) return;

        checkAndFlushCache();

        if (document.getElementById('dest1-input')) return;

        createMileageUI();

        const pCont = document.querySelector('app-available-units-address');
        if (!pCont) return;

        const div = document.createElement('div');
        div.style.cssText = 'margin-top: 12px; display: flex; flex-direction: column; gap: 4px;';
        div.innerHTML = `
            <label style="font-size: 12px; font-weight: 600; color: #2c5273;">DELIVERY ADDRESS 1:</label>
            <input type="text" id="dest1-input" style="padding:8px 12px; border:1px solid #ccd1d9; border-radius:6px; width:240px; height:38px; font-size:14px; outline:none;">
            <label style="font-size: 12px; font-weight: 600; color: #2c5273; margin-top:5px;">DELIVERY ADDRESS 2:</label>
            <input type="text" id="dest2-input" style="padding:8px 12px; border:1px solid #ccd1d9; border-radius:6px; width:240px; height:38px; font-size:14px; outline:none;">
        `;
        pCont.parentNode.insertBefore(div, pCont.nextSibling);

        ['dest1-input', 'dest2-input'].forEach(id => {
            const el = document.getElementById(id);
            el.addEventListener('blur', () => geocodeAndCalc(el));
            el.addEventListener('input', calculateMiles);
        });

        const pickupEl = document.querySelector('.mat-body-2.tw-break-normal.ng-star-inserted');
        if (pickupEl) {
            const pickupObserver = new MutationObserver(calculateMiles);
            pickupObserver.observe(pickupEl, { characterData: true, childList: true, subtree: true });
        }
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const text = btn.textContent.trim();
        if (text === 'CLEAR FILTERS' || text === 'Clear All') {
            if (!['Sprinter', 'Straight', 'Reefer', 'All'].some(k => text.includes(k))) {
                const d1 = document.getElementById('dest1-input');
                const d2 = document.getElementById('dest2-input');
                if (d1) d1.value = '';
                if (d2) d2.value = '';
                calculateMiles();
            }
        }
    });

    let lastUrl = location.href;
    let domObserver = null;
    let debounceTimer = null;

    const debouncedUpdate = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            injectCustomUI();
            updateAllUnitsMiles();
        }, 100);
    };

    function startWatching() {
        if (domObserver) domObserver.disconnect();

        if (location.href.includes('/available-trucks/list')) {
            debouncedUpdate();

            const targetContainer = document.querySelector('app-available-units-list') ||
                                    document.querySelector('.mat-table') ||
                                    document.body;

            domObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        debouncedUpdate();
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
            injectCustomUI();
            updateAllUnitsMiles();
        }
    }, 3000);

})();
