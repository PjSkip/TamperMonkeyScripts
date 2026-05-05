// ==UserScript==
// @name         11 Motion TMS LOADED MILES + PU & Del BAR
// @version      1.0
// @author       Ivan Karpenko
// @match        https://*.motiontms.com/*
// @grant        none
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/PjSkip/tamper-monkey-scripts/main/Motion-TMS-LoadedMiles-PU-Del-Bar.user.js
// @updateURL    https://raw.githubusercontent.com/PjSkip/tamper-monkey-scripts/main/Motion-TMS-LoadedMiles-PU-Del-Bar.user.js
// ==/UserScript==

(function() {
    'use strict';

    const stateFull = { "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming" };

    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const simplifyAddress = (address) => {
        const zipMatch = address.match(/\b\d{5}\b/);
        const zip = zipMatch ? ` ${zipMatch[0]}` : "";
        const stateMatch = address.match(/\b([A-Z]{2})\b/);
        const state = stateMatch ? stateMatch[1] : "";
        const fullState = stateFull[state] || state;
        let city = address.split(',')[0].trim();
        return `${city}, ${state}${zip} (${fullState})`;
    };

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
            const p = document.querySelector('.mat-body-2.tw-break-normal.ng-star-inserted')?.textContent.trim();
            const d1 = document.getElementById('dest1-input')?.value.trim();
            const d2 = document.getElementById('dest2-input')?.value.trim();

            let dests = [];
            if (d1 && d1.length > 2) dests.push(d1);
            if (d2 && d2.length > 2) dests.push(d2);

            if (p && dests.length > 0) {
                // FIXED: Using Google's explicit API parameters to force ZIP preservation and Driving Mode
                let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(p)}`;

                if (dests.length === 1) {
                    url += `&destination=${encodeURIComponent(dests[0])}`;
                } else if (dests.length === 2) {
                    // Maps treats intermediate stops as 'waypoints'
                    url += `&destination=${encodeURIComponent(dests[1])}&waypoints=${encodeURIComponent(dests[0])}`;
                }

                // Force "Driving" mode tab to be selected
                url += `&travelmode=driving`;

                window.open(url, '_blank');
            } else {
                alert("Please ensure the Pickup and at least one Delivery address are filled.");
            }
        };
    }

    const calculateMiles = () => {
        const p = document.querySelector('.mat-body-2.tw-break-normal.ng-star-inserted')?.textContent.trim();
        const d1 = document.getElementById('dest1-input')?.value.trim();
        const d2 = document.getElementById('dest2-input')?.value.trim();

        const milesBox = document.getElementById('loaded-miles-box');
        const locsBox = document.getElementById('locations-box');

        if (!d1 && !d2) {
            if (milesBox) milesBox.innerHTML = `Loaded Miles: `;
            if (locsBox) locsBox.innerHTML = `<div style="font-weight:600; color:#2c5273;">City/State</div><span style="font-size:22px; color:#1e7e34; font-weight:700;">→</span><div style="font-weight:600; color:#2c5273;">City/State</div>`;
            return;
        }

        if (!p || typeof google === 'undefined') return;

        let dests = [];
        if (d1 && d1.length > 2) dests.push(d1);
        if (d2 && d2.length > 2) dests.push(d2);

        if (dests.length === 0) return;

        let origins = [p];
        let destinations = [dests[0]];

        if (dests.length === 2) {
            origins.push(dests[0]);
            destinations.push(dests[1]);
        }

        new google.maps.DistanceMatrixService().getDistanceMatrix({
            origins: origins,
            destinations: destinations,
            travelMode: 'DRIVING',
            unitSystem: google.maps.UnitSystem.IMPERIAL
        }, (res, status) => {
            if (status === 'OK' && res.rows[0] && res.rows[0].elements[0].distance) {
                let totalMeters = res.rows[0].elements[0].distance.value;

                if (dests.length === 2 && res.rows[1] && res.rows[1].elements[1] && res.rows[1].elements[1].distance) {
                    totalMeters += res.rows[1].elements[1].distance.value;
                }

                const totalMiles = Math.round(totalMeters * 0.000621371);

                if (milesBox) milesBox.innerHTML = `Loaded Miles: <span style="color:#1e7e34; margin-left: 4px;">${formatNumber(totalMiles)}</span>`;

                const arrow = `<span style="font-size:22px; color:#1e7e34; font-weight:700;">→</span>`;
                let locsHTML = `<div style="font-weight:600; color:#2c5273;">${simplifyAddress(p)}</div>${arrow}<div style="font-weight:600; color:#2c5273;">${simplifyAddress(dests[0])}</div>`;

                if (dests.length === 2) {
                    locsHTML += `${arrow}<div style="font-weight:600; color:#2c5273;">${simplifyAddress(dests[1])}</div>`;
                }

                if (locsBox) locsBox.innerHTML = locsHTML;
            }
        });
    };

    const geocodeAndCalc = (el) => {
        if (typeof google === 'undefined') return;
        const val = el.value.trim();
        if (val.length > 3) {
            new google.maps.Geocoder().geocode({ 'address': val }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    let formatted = results[0].formatted_address;

                    const zipMatch = val.match(/\b\d{5}\b/);
                    if (zipMatch && !formatted.match(/\b\d{5}\b/)) {
                        if (formatted.endsWith(', USA')) {
                            formatted = formatted.replace(', USA', ` ${zipMatch[0]}, USA`);
                        } else {
                            formatted += ` ${zipMatch[0]}`;
                        }
                    }

                    el.value = formatted;
                    calculateMiles();
                }
            });
        } else if (val.length === 0) {
            calculateMiles();
        }
    };

    function injectCustomUI() {
        if (!location.href.includes('/available-trucks/list')) return;
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
    let burstInterval;

    function startWatching() {
        const mainObserver = new MutationObserver(() => injectCustomUI());
        mainObserver.observe(document.documentElement, { childList: true, subtree: true });

        if (burstInterval) clearInterval(burstInterval);

        let burstCount = 0;
        burstInterval = setInterval(() => {
            injectCustomUI();
            burstCount++;
            if (burstCount > 60) clearInterval(burstInterval);
        }, 50);
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
                setTimeout(startWatching, 50);
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
        handleNavigation();
        injectCustomUI();
    }, 1000);

})();
