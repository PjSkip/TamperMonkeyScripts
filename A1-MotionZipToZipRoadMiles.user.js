// ==UserScript==
// @name         8 MotionTMS Zip to Zip Road Miles
// @namespace    MotionTMS-Custom-Scripts
// @version      11.0.6
// @description  Displays Air Miles with Road Miles below without a separator.
// @author       Ivan Karpenko
// @match        https://*.motiontms.com/*
// @grant        none
// @run-at       document-start
// @updateURL    https://github.com/PjSkip/TamperMonkeyScripts/raw/main/A1-MotionZipToZipRoadMiles.user.js
// @downloadURL  https://github.com/PjSkip/TamperMonkeyScripts/raw/main/A1-MotionZipToZipRoadMiles.user.js
// ==/UserScript==

(function() {
    'use strict';

    const processRows = () => {
        // Safety check to ensure we only run the math on the correct page
        if (!location.href.includes('/available-trucks/list')) return;

        const rawOrigin = document.querySelector('.mat-body-2.tw-break-normal.ng-star-inserted')?.textContent.trim();
        if (!rawOrigin) return;

        document.querySelectorAll('tr.available-unit-row').forEach(row => {
            const milesCell = row.querySelector('td.mat-column-miles .default-text-lt');
            const locCell = row.querySelector('td.mat-column-currentLocation .default-text-lt')?.textContent.trim();

            if (milesCell && locCell && !milesCell.dataset.processed) {
                const airMiles = milesCell.textContent.trim();
                milesCell.dataset.processed = "true";

                new google.maps.DistanceMatrixService().getDistanceMatrix({
                    origins: [rawOrigin],
                    destinations: [locCell],
                    travelMode: 'DRIVING',
                    unitSystem: 1
                }, (res, status) => {
                    if (status === 'OK' && res.rows[0].elements[0].status === 'OK') {
                        const roadMiles = res.rows[0].elements[0].distance.text;

                        // Original text followed by Road Miles in green, no separator
                        milesCell.innerHTML = `
                            <div>${airMiles}</div>
                            <div style="color: #1e7e34; font-weight: bold; font-size: 13px;">${roadMiles}</div>
                        `;
                    } else {
                        // Allow retry if it failed
                        milesCell.dataset.processed = "";
                    }
                });
            }
        });
    };

    // --- NEXT-GEN INITIALIZATION LOGIC (SPA Fix) ---
    let lastUrl = location.href;
    let burstInterval;

    function startWatching() {
        if (burstInterval) clearInterval(burstInterval);

        // High-speed burst to catch the rows the millisecond the new tab renders them
        let burstCount = 0;
        burstInterval = setInterval(() => {
            processRows();
            burstCount++;
            if (burstCount > 60) clearInterval(burstInterval); // 3 seconds burst
        }, 50);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWatching);
    } else {
        startWatching();
    }

    // SPA Link Listener: Intercepts History API for instant navigation detection
    function handleNavigation() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (location.href.includes('/available-trucks/list')) {
                setTimeout(startWatching, 50);
            }
        }
    }

    // Patch pushState and replaceState to catch SPA routing instantly
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

    // Maintenance check (Replaces the standalone setInterval)
    setInterval(() => {
        handleNavigation();
        processRows();
    }, 2000);

})();
