// ==UserScript==
// @name         Gmail Highway Carrier411 MC badges
// @namespace    shipsierra.highway.gmail
// @version      2026.36.7.21
// @description  Highway and Carrier411 carrier info next to MC numbers in Gmail.
// @author       Ivan Karpenko
// @copyright    2026, ShipSierra.com (Ivan Karpenko)
// @license      Proprietary. Copyright (c) 2026 ShipSierra.com. All rights reserved. Copying or redistribution is not allowed.
// @homepageURL  https://github.com/PjSkip/TamperMonkeyScripts
// @updateURL    https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/GmailHighwayCarrier411MCBadges.user.js
// @downloadURL  https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/GmailHighwayCarrier411MCBadges.user.js
// @match        https://mail.google.com/*
// @match        https://www.carrier411.com/*
// @match        https://carrier411.com/*
// @match        https://highway.com/broker/carriers/*
// @match        https://*.highway.com/broker/carriers/*
// @connect      highway.com
// @connect      www.carrier411.com
// @connect      carrier411.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_addValueChangeListener
// @run-at       document-idle
// ==/UserScript==

/**
 * Copyright (c) 2026 ShipSierra.com. All rights reserved.
 * Developer: Ivan Karpenko.
 * Copying, modification, or redistribution of this source is not allowed.
 */

(function () {
  'use strict';
  var IGNORE_MC = { '137469': true };
  var IGNORE_DOT = { '3192183': true };
  var CACHE_KEY = 'hwy_mc_cache_v10';
  var C411_CACHE_KEY = 'c411_fg_cache_v1';
  var SETTINGS_KEY = 'hwy_c411_badge_settings_v3';
  var SCRIPT_VERSION = '2026.36.7.21';
  var SCRIPT_TITLE = 'ShipSierra.com Carrier Check on Hwy/C411';
  var RELEASE_DATE = 'September 8, 2026';
  var ORG_MC_KEY = 'ss_org_mc';
  var ORG_MC_NEED_KEY = 'ss_org_mc_need';
  var NOTES_VER_KEY = 'ss_notes_ver';
  var CACHE_VER_KEY = 'ss_hwy_cache_ver';
  var ADDR_MC_KEY = 'ss_addr_mc_v2';
  var ADDR_MC_TTL = 24 * 60 * 60 * 1000;
  var CALLOUT_BG = '#fff6d9';
  var CARET_PX = 11;
  var HWY_FAIL_REPLY =
    'Thanks for your interest in this load. Unfortunately you do not pass our Highway.com requirements, so we are unable to proceed.';
  var RELEASE_NOTES =
    '• Fail (envelope) opens Reply or Reply all on that carrier’s email to say they do not pass Highway.\n' +
    '• Pause in settings stops all checks. A red 1 on the truck means it is paused.\n' +
    '• In a thread with many carriers, each bar’s $ is that sender’s bid, not another company’s.\n' +
    '• Expanding a collapsed email still shows the carrier bar.\n' +
    '• Turn on Cargo INS or other extra badges in settings and they load on bars already open.\n' +
    '• Copy next to the MC copies MC only. Copy next to the $ copies MC and the rate.\n' +
    '• Dollar and k quotes in the email are clickable rates. They are not links on the left inbox list.\n' +
    '• Hover the $ on the bar to highlight that amount in that sender’s email.\n' +
    '• Domain tooltip shows who emailed you first, then the Highway emails.\n' +
    '• Long threads stay smooth: the open email is scanned now, others you expand are scanned in small idle slices.\n' +
    '• Quoted history is not walked, so Expand all does not freeze Gmail. MC numbers in signatures still get a bar.';
  var HWY_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHGSURBVHgB7ZZNTsJQEMdnWqWwqwsjyx5BtxJjOQF6AnoDuYF4MkgMuhRPQNlh3LCyBdOOry2B8j4LYWd/m5fMTOf937yPKUBNzX8HTQHRpD1EpGfOPG3eft2UDfHb1YwNXtlGhC+tzmIIGiwwKUTqC0aCucT2KSRHegIDWgHRa9sHblWFKgh5UwqijQDcTY7jBICdBgpPCBVE5RPY+iooBUSjtoeAfZmPEpwK8xMuFal8GrkuHCoAGuCrXLaVCJPZkExlsdk2rBwngEMFIKTK0jU638JkiWWrKpDRU88jYT25vE7R+gA1ocLuqT5g29Zt3S3GvP1MFpwgDgwPhAcHgjY9sGHM26VbwA7fPZwYtqC+7DAKAtjLF8ARKzSRHcYfp+WDSYD05TsRtuRg7211fvcdmoGeUO0iVmJ0QYOzWl1gd7m9MfuHsAEBGLAofZRdw4zonS2A9AuIG80BG4bbfGVnlfKfr39Dla8Zx7q3oJiQa1BbAcrGU4Lt17JcPsGf+0grgm9QuwqoG0/54xDMQcaYcoPKBegaD5d8bowBrBCza1BFBTSNZz+3eXVphSqVG5RV5E2Nfy4bQmNEBZEbelBTU8P4A46qjYFyL5/4AAAAAElFTkSuQmCC';
  var C411_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAC1UlEQVR4nMSWTUwTQRTHZ5cWqkAopAoVFA2CihEwaow1ICSGg0D0oKLx4MFEL3Iw4SAYY4gQ4sfJePOgXvwIEBWDMR4Uw4cGjdHwWTCBgBJaU8XWUtvd7vp/W7M0bS3hsOs7/Dp9b2by/pl5b9ZQd+sUY2xi1s7+bUFRjvJIbCnLz9oE8kxjM3yeG8cPx3Mxw6FMOSUNn/83aE23gmvSc0D3ghu0fx0FjXxixFr7LPm1VxA/LAZFcNv6ErDlxDUw2ZQaMcfrIx2tbc1gz3A3bcovbqu5Au5AS2nMgBAQwMrt1WD9wQvgT28AvN7eC844f4A5Gcng6ard4LqsdPBqB+l4NvAUTOATdFJQFifc1dgNTjt/gYdbO0DB71ejkt+rju+erwVL8rPBo601oMvjYrrcoqgCCIp0cyqLq5V/FG560E9+iWqCNxrJLfgolkD5ZaaZwK7+IVVBedF+sK33vi4KuOgS5qjzZJqzVMebiTkwxUBTZUVfqBPJEs0szKWZVbZC0PGdTiV1BdWKLMvsf1Uyp+KvyXLMxaFTsVrSGNU8jc0ppsUNlOT1OAMuLKMg5SITR78Mqf4jtnyw8+2Ymlgor2yLGaw/VgG2vfwA7tycCzrm6cx4TpdKNsjKnQkI1GdKt5SDeavpJbIV7FMnXay1gdMO6j/vxmYUH2UmiKT1Sc8gWLO3GPT4PGDnQDtoMq5keigI9byGQ01gxdbKiPCUc1Id3z5HtT00+Q3sG5kCC9dawNKiDeqcszfPgEmJdJdkpVq076YuN2WUkWqJGS67RG+ZOTkDPL7nJLhj4y6wwEp1Oz47Ar6fGADv9d4BA8orEm7aK5CjqtS9MA82P6JXbHD6U0RUFMSYGxk4Y0y/vgpeDb8Abzy/AgbEAFu+SVGLtFcgKR3x8uNGsM/+GkwyGJdcFhTiRaWwL1ftFTQ8rGN0Wz6y5ZskcHGieauoB2uu4A8AAAD//1ZDwTcAAAAGSURBVAMARiLtUypmc+4AAAAASUVORK5CYII=';
  var SET_LOGO = 'data:image/png;base64,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';
  var SEARCH_URL = 'https://highway.com/broker/carriers/search-results?q=';
  var C411_URL = 'https://www.carrier411.com/manager/companydetail.cfm?docket=';
  var HWY_LOGIN_URL = 'https://highway.com/broker/login';
  var C411_LOGIN_URL = 'https://www.carrier411.com/';
  var API_SEARCH_BASE =
    'https://highway.com/monitor/api/v1/carriers/global_search?page=1' +
    '&q%5Bs%5D=legal_name_search+asc';
  var MC_GAP = '[\\s\\u00a0\\u2007\\u202f\\u200b\\u200c\\u200d\\ufeff\\-#.:\\uFF1A]*';
  var MC_FILL = '(?:is|no|num(?:ber)?)?';
  var MC_LEAD = '^[\\s\\u00a0\\u2007\\u202f\\u200b\\u200c\\u200d\\ufeff\\-#.:\\uFF1A]*';
  var MC_RE = new RegExp('\\bMC' + MC_GAP + MC_FILL + MC_GAP + '([0-9]{4,8})(?![0-9])', 'gi');
  var MC_TEST = new RegExp('\\bMC' + MC_GAP + MC_FILL + MC_GAP + '[0-9]{4,8}(?![0-9])', 'i');
  var MC_AFTER_RE = new RegExp('\\b([0-9]{4,8})' + MC_GAP + 'MC\\b', 'gi');
  var MC_AFTER_TEST = new RegExp('\\b[0-9]{4,8}' + MC_GAP + 'MC\\b', 'i');
  var MC_ASK = /\bmc(?:\s*(?:#|no\.?|num(?:ber)?))?\b|\bmotor\s*carrier\b/i;
  var BARE_MC_REPLY = /^\s*#?\s*([0-9]{5,8})\s*\.?\s*$/;
  var BARE_RATE_REPLY = /^\s*\$?\s*([1-9]\d{2,4}(?:,\d{3})?)\s*\$?\s*[.!?]?\s*$/;
  var HWY_CHECK =
    "data:image/svg+xml,%3csvg%20width='13'%20height='13'%20viewBox='0%200%2013%2013'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M6.30466%2012.2119C9.35139%2012.2119%2011.8212%209.74201%2011.8212%206.69529C11.8212%205.8144%2011.6148%204.98173%2011.2476%204.24303L6.49714%208.99348L5.93988%209.55074L5.38262%208.99348L2.95534%206.56621L4.06986%205.45169L5.93988%207.32171L10.3341%202.92748C9.32739%201.8513%207.89458%201.17871%206.30466%201.17871C3.25794%201.17871%200.788086%203.64857%200.788086%206.69529C0.788086%209.74201%203.25794%2012.2119%206.30466%2012.2119Z'%20fill='%2354C774'/%3e%3c/svg%3e";
  var HWY_X =
    "data:image/svg+xml,%3csvg%20width='13'%20height='13'%20viewBox='0%200%2013%2013'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3ccircle%20cx='6.5'%20cy='6.5'%20r='5.5'%20fill='%23E11D48'/%3e%3cpath%20d='M4.2%204.2L8.8%208.8M8.8%204.2L4.2%208.8'%20stroke='%23fff'%20stroke-width='1.55'%20stroke-linecap='round'/%3e%3c/svg%3e";
  var MC_END = new RegExp('MC(?:\\b' + MC_GAP + MC_FILL + MC_GAP + ')$', 'i');
  var MC_NEXT = new RegExp(MC_LEAD + '([0-9]{4,8})(?![0-9])');
  var NUM_END = /([0-9]{4,8})[ \u00a0\u2007\u202f\u200b]*$/;
  var MC_ONLY = new RegExp(MC_LEAD + 'MC\\b', 'i');
  var MC_PUNCT = new RegExp('^[\\s\\u00a0\\u2007\\u202f\\u200b\\u200c\\u200d\\ufeff\\-#.:\\uFF1A]*$');
  var USPS_ST = {
    AL: 1, AK: 1, AZ: 1, AR: 1, CA: 1, CO: 1, CT: 1, DE: 1, FL: 1, GA: 1,
    HI: 1, ID: 1, IL: 1, IN: 1, IA: 1, KS: 1, KY: 1, LA: 1, ME: 1, MD: 1,
    MA: 1, MI: 1, MN: 1, MS: 1, MO: 1, MT: 1, NE: 1, NV: 1, NH: 1, NJ: 1,
    NM: 1, NY: 1, NC: 1, ND: 1, OH: 1, OK: 1, OR: 1, PA: 1, RI: 1, SC: 1,
    SD: 1, TN: 1, TX: 1, UT: 1, VT: 1, VA: 1, WA: 1, WV: 1, WI: 1, WY: 1,
    DC: 1, PR: 1, VI: 1, GU: 1, AS: 1, MP: 1
  };
  function looksLikeZipNumber(text, digitStart, digits) {
    if (String(digits || '').length !== 5) return false;
    var s = String(text || '');
    if (/^\d{5}-\d{4}\b/.test(s.slice(digitStart))) return true;
    var before = s.slice(Math.max(0, digitStart - 48), digitStart);
    var m = before.match(/(?:^|[^A-Za-z])([A-Za-z]{2})\s+$/);
    if (!m) return false;
    return !!USPS_ST[m[1].toUpperCase()];
  }
  function looksLikePhoneNumber(text, digitStart, digitEnd, digits) {
    var s = String(text || '');
    var d = String(digits || '');
    var before = s.slice(Math.max(0, digitStart - 44), digitStart);
    var win = s.slice(Math.max(0, digitStart - 18), Math.min(s.length, digitEnd + 18));
    if (
      /(?:\bfax|\btele?(?:phone)?\b|\bphone\b|\bph\b|\bcell\b|\bmobile\b|\boffice\b|\bext(?:ension)?\b|\bpager\b|\bsms\b)\s*[:.#]?\s*$/i.test(
        before
      )
    ) {
      return true;
    }
    if (/\d{3}[-.\s]\d{3}[-.\s]$/.test(before) && d.length === 4) return true;
    if (/\(\d{3}\)[-.\s]*\d{3}[-.\s]$/.test(before) && d.length === 4) return true;
    if (/\+?1[-.\s]\d{3}[-.\s]\d{3}[-.\s]$/.test(before) && d.length === 4) return true;
    if (d.length <= 4 && /\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(win)) return true;
    if (d.length <= 4 && /\(\d{3}\)[-.\s]*\d{3}[-.\s]\d{4}/.test(win)) return true;
    return false;
  }
  function looksLikeDollarAmount(text, digitStart, digits) {
    var s = String(text || '');
    var before = s.slice(Math.max(0, digitStart - 28), digitStart);
    if (/\$\s*$/.test(before)) return true;
    if (/\brates?\s*[:.\-#]?\s*$/i.test(before) && String(digits || '').length <= 5) return true;
    return false;
  }
  function isFalseMcNumber(text, digitStart, digitEnd, digits) {
    return (
      looksLikeZipNumber(text, digitStart, digits) ||
      looksLikePhoneNumber(text, digitStart, digitEnd, digits) ||
      looksLikeDollarAmount(text, digitStart, digits)
    );
  }

  var HWY_FIELD_META = {
    assessment: { label: 'Pass / Fail', source: 'Highway rules_assessment.summary.overall_result' },
    units: { label: 'Power units', source: 'Highway equipment_portfolio.total_observed_power_units' },
    safety: { label: 'Safety (BASIC)', source: 'Highway sms_basics.unsafe_driving_measure (Unsafe Driving)' },
    alerts: { label: 'Identity alerts (ID OK / DB)', source: 'Highway identity_alerts — open alerts and type' },
    cargo: { label: 'Cargo INS', source: 'Highway active motor truck cargo policy limit' },
    bipd: { label: 'Auto INS', source: 'Highway active automobile liability limit' },
    gl: { label: 'Gen Liab Ins', source: 'Highway active commercial general liability aggregate limit' },
    connection: { label: 'Connected / No Connect', source: 'Yellow Connected only if Highway status is onboarded/connected. Any other status (Connect, connecting, none) is a red No Connect pill.' },
    dnu: { label: 'Do Not Use (DNU)', source: 'Highway Do Not Use switch (connection.status do_not_dispatch)' },
    domain: { label: 'Email domain match', source: 'Green check: exact Highway email, or same unique company domain. Public (Gmail/Yahoo/iCloud): Unmatched (yellow) if Highway has that brand but a different address; Bad email (red) if Highway does not. Unique domain with no match: Domain NOT Match (red).' },
    truckPlate: { label: 'Truck plate', source: 'Green check if a truck plate in the email is on this carrier’s Highway equipment list. Red if it is not.' },
    trailerPlate: { label: 'Trailer plate', source: 'Green check if a trailer plate in the email is on this carrier’s Highway equipment list. Red if it is not.' },
    truckVin: { label: 'Truck VIN', source: 'Green check if a truck VIN in the email is on this carrier’s Highway equipment list. Red if it is not.' }
  };
  var C411_FIELD_META = {
    fg: { label: 'FreightGuard (FG 8/12/26)', source: 'Carrier411 Reported Items date' },
    loss: { label: 'Freight loss', source: 'Carrier411 unjustified loss of freight. Shown only when reported.' },
    rating: { label: 'Safety rating (SAT/COND/UNSAT)', source: 'Carrier411 Safety Rating' },
    related: { label: 'Related companies (Related cos)', source: 'Carrier411 “Related companies detected” on the company page' }
  };

  GM_addStyle(
    '.hwy-mc-wrap{display:inline-block;white-space:nowrap;vertical-align:middle;}' +
      '.hwy-mc-link{color:#1a73e8;text-decoration:underline;font-weight:600;cursor:pointer;' +
      '-webkit-user-select:text;user-select:text;}' +
      '.hwy-mc-badges,.hwy-mc-badges *{' +
      '-webkit-user-select:none !important;user-select:none !important;}' +
      '.hwy-mc-badges{display:inline-flex;align-items:center;gap:5px;margin:0 0 0 6px;vertical-align:middle;}' +
      '.hwy-mc-box{display:inline-flex;align-items:center;gap:5px;margin:0;padding:2px 7px 2px 6px;vertical-align:middle;' +
      'font:11px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
      'background:#F3F6F9;border:1px solid #C5CDD6;border-radius:8px;box-shadow:0 1px 2px rgba(16,24,40,.08);}' +
      '.hwy-mc-hit,.hwy-c411-hit{display:inline-flex;align-items:center;gap:4px;cursor:pointer;}' +
      '.hwy-mc-hit:hover,.hwy-c411-hit:hover{opacity:.85;}' +
      '.hwy-mc-logo{display:block;width:16px;height:16px;object-fit:contain;flex-shrink:0;border-radius:3px;}' +
      '.hwy-mc-pill{display:inline-flex;align-items:center;gap:3px;border-radius:999px;padding:1px 6px;font-weight:700;border:1px solid transparent;white-space:nowrap;}' +
      '.hwy-mc-pill.ss-fail-mail{position:relative;padding-right:16px;overflow:visible;cursor:pointer;}' +
      '.hwy-mc-pill.ss-fail-mail .ss-fail-mail-ico{position:absolute;top:-7px;right:-7px;width:16px;height:16px;display:block;pointer-events:auto;overflow:visible;cursor:pointer;}' +
      '.ss-intel-msg .hwy-mc-hit,.ss-intel-msg .hwy-c411-hit,.ss-intel-msg .ss-intel-pills{overflow:visible;}' +
      '.hwy-mc-pill .hwy-check,.hwy-mc-pill .hwy-x{width:13px;height:13px;display:block;flex:none;}' +
      '.hwy-mc-fail{background:#F8D0D6;color:#9B1B30;border-color:#F0A8B4;}' +
      '.hwy-mc-partial{background:#D1E7DD;color:#0F5132;border-color:#A3CFBB;}' +
      '.hwy-mc-pass{background:#D1E7DD;color:#0F5132;border-color:#A3CFBB;}' +
      '.hwy-mc-wait{background:#EEF2F6;color:#4B5563;border-color:#D0D7DE;}' +
      '.hwy-mc-units-ok{background:#D1E7DD;color:#0F5132;border-color:#A3CFBB;}' +
      '.hwy-mc-units-low{background:#F8D0D6;color:#9B1B30;border-color:#F0A8B4;}' +
      '.hwy-mc-fg{background:#F8D0D6;color:#9B1B30;border-color:#F0A8B4;}' +
      '.hwy-mc-nofg{background:#EEF2F6;color:#5B6B7C;border-color:#D0D7DE;}' +
      '.hwy-mc-basic-mid,.hwy-mc-unmatch{background:#FEF08A;color:#713F12;border-color:#CA8A04;}' +
      '.hwy-mc-conn{background:rgba(248,198,23,.28);color:#92400E;border-color:#F8C617;}' +
      '.hwy-mc-noconn{background:#F8D0D6;color:#9B1B30;border-color:#F0A8B4;}' +
      '.hwy-mc-dnu{background:#F8D0D6;color:#9B1B30;border-color:#E11D48;font-weight:800;}' +
      '#ss-hwy-c411-set-wrap{display:inline-flex;align-items:center;justify-content:center;flex:none;position:relative;' +
      'z-index:auto;margin:0 4px 0 0;vertical-align:middle;}' +
      '#ss-hwy-c411-set-btn{width:64px;height:36px;min-width:64px;min-height:36px;border-radius:18px;cursor:pointer;flex:none;' +
      'display:inline-flex;align-items:center;justify-content:center;position:relative;margin:0;padding:0 4px;' +
      'background:transparent;border:0;outline:none;z-index:auto;box-sizing:border-box;color:#5f6368;overflow:visible;}' +
      '#ss-hwy-c411-set-btn:hover{background:rgba(60,64,67,.08);}' +
      '#ss-hwy-c411-set-btn .ss-set-icon{display:block;width:50px;height:50px;pointer-events:none;object-fit:contain;background:transparent;}' +
      '.ss-mc-badge{position:absolute;top:-5px;right:-4px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;' +
      'background:#d93025;color:#fff;font:700 10px/16px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
      'text-align:center;pointer-events:none;z-index:2;box-shadow:0 0 0 2px #fff;' +
      'animation:ss-mc-pulse 2.6s ease-in-out infinite;}' +
      '@keyframes ss-mc-pulse{0%,100%{background:#d93025;}50%{background:#ea4335;}}' +
      '.ss-intel-host{display:block;margin:1px 0 0;padding:0;text-align:right;max-width:100%;}' +
      'tr.ss-intel-tr td{padding:7px calc(2px + var(--ss-time-pad, 0px)) 1px 0 !important;text-align:right !important;vertical-align:top;' +
      'border:0 !important;outline:none !important;box-shadow:none !important;width:100% !important;}' +
      '.ss-intel-msg{display:inline-flex;flex-direction:column;align-items:flex-end;gap:0;width:auto;max-width:100%;' +
      'box-sizing:border-box;margin:0 0 0 auto !important;padding:0;float:right !important;' +
      'font:11px/1.25 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#202124;}' +
      '.ss-intel-msg .ss-intel-card{display:flex;flex-direction:column;align-items:flex-start;gap:3px;margin:0;' +
      'padding:3px 8px;border:1px solid #e2e8f0 !important;border-radius:6px;min-width:0;max-width:100%;' +
      'width:max-content;background:#f8fafc;text-align:left;box-shadow:none !important;outline:none !important;}' +
      '.ss-intel-msg .ss-intel-card.ss-risk{background:#fff7f8 !important;border-color:#e2e8f0 !important;}' +
      '.ss-intel-msg .ss-intel-card.ss-ok{background:#f3faf6 !important;border-color:#e2e8f0 !important;}' +
      '.ss-intel-msg .ss-intel-card.ss-warn{background:#fffbeb !important;border-color:#e2e8f0 !important;}' +
      '.ss-intel-msg .ss-intel-row{display:inline-flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:4px;margin:0;}' +
      '.ss-intel-msg .ss-intel-name{font-weight:800;font-size:11px;}' +
      '.ss-copy-btn{display:inline-flex;align-items:center;justify-content:center;box-sizing:content-box;' +
      'width:16px;height:18px;padding:3px 8px 3px 10px;margin:0 1px 0 -4px;' +
      'border:0;background:transparent;color:#5f6368;cursor:pointer;flex:none;vertical-align:middle;line-height:0;' +
      'transition:color .12s ease,transform .12s ease;}' +
      '.ss-copy-btn:hover{color:#1a73e8;}' +
      '.ss-copy-btn.ss-copied{color:#15803d;}' +
      '.ss-copy-btn.ss-copied svg{animation:ss-copy-pop .28s ease;}' +
      '@keyframes ss-copy-pop{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}' +
      '.ss-intel-msg .ss-intel-mc{color:#1a73e8;font-weight:700;cursor:default;}' +
      '.ss-intel-msg .ss-intel-rate{color:#1a73e8;font-weight:800;margin-left:6px;white-space:nowrap;}' +
      '.ss-rate-wrap{color:#1a73e8;font-weight:700;text-decoration:underline;cursor:pointer;' +
      '-webkit-user-select:text;user-select:text;}' +
      '#ss-hwy-c411-panel .ss-set-ver{font:700 11px/18px inherit;color:#92400e;flex:none;white-space:nowrap;margin-left:8px;}' +
      '.ss-notes-pill{margin-left:8px;padding:1px 8px;border-radius:999px;border:1px solid #dadce0;background:#eef3fb;' +
      'color:#1a73e8;font:600 11px/18px inherit;cursor:pointer;flex:none;}' +
      '.ss-notes-pill:hover{background:#d3e3fd;}' +
      '.ss-org-box{margin:10px 4px 8px;padding:10px 10px 8px;border:1px solid #c5ced6;border-radius:10px;background:#e6ebf0;}' +
      '.ss-org-box p{margin:0 0 8px;font-size:12px;line-height:1.4;color:#5f6368;}' +
      '.ss-org-box-need{background:#fff6d9;border-color:#e8c547;box-shadow:0 0 0 2px rgba(232,197,71,.35);}' +
      '.ss-org-box-need p{color:#7a4e00;font-weight:700;}' +
      '.ss-login-notes{margin:8px 12px 0;display:flex;flex-direction:column;gap:6px;}' +
      '.ss-login-note{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #e8c547;border-radius:10px;background:#fff6d9;}' +
      '.ss-login-note .ss-login-lab{flex:1;font-size:12px;font-weight:700;color:#7a4e00;line-height:1.3;}' +
      '.ss-login-note .hwy-mc-logo{width:16px;height:16px;flex:none;}' +
      '.ss-login-note .hwy-mc-pill{cursor:pointer;}' +
      '.ss-org-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}' +
      '.ss-org-row b{font-size:13px;}' +
      '.ss-org-mc{width:88px;padding:5px 8px;border:1px solid #dadce0;border-radius:6px;font:13px inherit;background:#fff;}' +
      '.ss-org-warn{margin:6px 0 0;font-size:12px;color:#b45309;}' +
      '.ss-org-err{margin:6px 0 0;font-size:12px;color:#b91c1c;}' +
      '.ss-org-ok{margin-left:6px;padding:4px 10px;border:0;border-radius:6px;background:#1a73e8;color:#fff;font:600 12px inherit;cursor:pointer;}' +
      '.ss-org-no{margin-left:4px;padding:4px 8px;border:1px solid #dadce0;border-radius:6px;background:#fff;font:12px inherit;cursor:pointer;}' +
      '#ss-ss-callout{position:fixed;z-index:2147483646;width:380px;max-width:calc(100vw - 24px);box-sizing:border-box;' +
      'padding:14px 16px 14px;background:' +
      CALLOUT_BG +
      ';color:#202124;border:1px solid #e8c547;border-radius:10px;' +
      'box-shadow:0 8px 28px rgba(15,23,42,.22);font:13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;}' +
      '#ss-ss-callout .ss-co-x{position:absolute;top:6px;right:6px;width:28px;height:28px;border:0;border-radius:50%;' +
      'background:#f4e4a8;cursor:pointer;font-size:16px;line-height:28px;color:#3c4043;}' +
      '#ss-ss-callout h4{margin:0 34px 6px 0;font-size:13px;line-height:1.35;font-weight:800;white-space:nowrap;}' +
      '#ss-ss-callout .ss-co-ver{margin:0 34px 8px 0;font-size:12px;font-weight:700;color:#92400e;}' +
      '#ss-ss-callout .ss-co-body{white-space:pre-wrap;overflow-wrap:break-word;max-width:100%;color:#3c4043;font-size:12px;line-height:1.45;}' +
      '#ss-ss-callout .ss-co-caret{position:absolute;width:0;height:0;border:' +
      CARET_PX +
      'px solid transparent;}' +
      '#ss-ss-callout .ss-co-field{display:flex;align-items:center;gap:6px;margin-top:10px;}' +
      '#ss-ss-callout .ss-co-field input{width:100px;padding:5px 8px;border:1px solid #dadce0;border-radius:6px;font:13px inherit;background:#fff;}' +
      '#ss-ss-callout .ss-co-go{margin-top:10px;padding:6px 12px;border:0;border-radius:6px;background:#1a73e8;color:#fff;font:600 12px inherit;cursor:pointer;}' +
      '#ss-ss-callout .ss-co-err{margin-top:6px;color:#b91c1c;font-size:12px;}' +
      '.ss-intel-msg .ss-intel-note{color:#9b1b30;font-weight:700;font-size:10px;}' +
      '.ss-intel-msg .ss-intel-pills{display:inline-flex;flex-wrap:wrap;justify-content:flex-start;gap:3px;align-items:center;margin:0;min-width:0;}' +
      '.ss-intel-msg .hwy-mc-hit,.ss-intel-msg .hwy-c411-hit{display:inline-flex;align-items:center;gap:3px;flex-wrap:wrap;min-width:0;}' +
      '.ss-fast-tip{position:fixed;z-index:2147483647;max-width:360px;padding:6px 8px;border-radius:6px;' +
      'background:#202124;color:#fff;font:12px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
      'white-space:pre-wrap;box-shadow:0 6px 18px rgba(15,23,42,.28);pointer-events:none;}' +
      'mark.ss-eq-hi,.ss-rate-wrap.ss-eq-hi{font:inherit;color:inherit;border-radius:2px;padding:0 1px;' +
      'box-shadow:inset 0 0 0 1px rgba(0,0,0,.12);}' +
      'mark.ss-eq-hi-pass,.ss-rate-wrap.ss-eq-hi-pass{background:#86efac;}' +
      'mark.ss-eq-hi-fail,.ss-rate-wrap.ss-eq-hi-fail{background:#fda4af;}' +
      '#ss-hwy-c411-panel{position:fixed !important;top:0 !important;right:0 !important;bottom:0 !important;left:auto !important;' +
      'width:360px !important;max-width:92vw !important;height:100vh !important;height:100dvh !important;' +
      'margin:0 !important;border:0 !important;padding:0 !important;transform:none !important;' +
      'z-index:2147483647 !important;background:#d8dee5 !important;color:#202124 !important;' +
      'box-shadow:-8px 0 28px rgba(15,23,42,.22) !important;display:flex !important;flex-direction:column !important;' +
      'font:13px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif !important;' +
      'visibility:visible !important;opacity:1 !important;pointer-events:auto !important;overflow:hidden !important;}' +
      '#ss-hwy-c411-panel:not(.ss-open){right:-380px !important;}' +
      '#ss-hwy-c411-panel.ss-open{right:0 !important;inset:0 0 0 auto !important;}' +
      '#ss-hwy-c411-panel .ss-set-head{display:flex;align-items:center;gap:8px;padding:12px 12px 10px;border-bottom:1px solid #c5ced6;background:#cfd6de;}' +
      '#ss-hwy-c411-panel .ss-set-title{font-weight:700;font-size:14px;flex:1;}' +
      '#ss-hwy-c411-panel .ss-set-close{width:28px;height:28px;border:0;background:#c2cad3;border-radius:50%;cursor:pointer;font-size:16px;line-height:28px;color:#3c4043;}' +
      '#ss-hwy-c411-panel .ss-set-close:hover{background:#b5bec7;}' +
      '#ss-hwy-c411-panel .ss-set-search{margin:8px 12px 6px;padding:6px 10px;border:1px solid #cdd5dc;border-radius:8px;width:auto;font:13px/1.3 inherit;background:#fff;}' +
      '#ss-hwy-c411-panel .ss-set-body{flex:1 1 auto;overflow:auto;padding:6px 8px;min-height:240px;}' +
      '#ss-hwy-c411-panel .ss-set-sec{margin:8px 4px 4px;padding:6px 8px 4px;border:1px solid #c5ced6;border-radius:10px;background:#e6ebf0;}' +
      '#ss-hwy-c411-panel .ss-set-sec-off{background:#fff6d9;border-color:#e8c547;}' +
      '#ss-hwy-c411-panel .ss-set-hint{margin:2px 6px 8px;font-size:12px;line-height:1.35;color:#5f6368;}' +
      '#ss-hwy-c411-panel .ss-set-sec h3{display:flex;align-items:center;gap:6px;margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#5f6368;}' +
      '#ss-hwy-c411-panel .ss-set-sec h3 img{width:14px;height:14px;border-radius:3px;}' +
      '#ss-hwy-c411-panel .ss-set-row{display:flex !important;align-items:center;gap:6px;padding:5px 6px;border-radius:6px;cursor:pointer;' +
      'box-sizing:border-box !important;min-height:30px;color:#202124;font-size:13px;line-height:1.25;}' +
      '#ss-hwy-c411-panel .ss-set-row:hover{background:#d0d8e0;}' +
      '#ss-hwy-c411-panel .ss-set-row.ss-hidden-row{display:none !important;}' +
      '#ss-hwy-c411-panel .ss-set-row.ss-set-dragging{opacity:.72;outline:2px dashed #1a73e8;outline-offset:-2px;background:#e8f0fe;}' +
      '#ss-hwy-c411-panel .ss-set-row.ss-set-drop-before,#ss-hwy-c411-panel .ss-set-row.ss-set-drop-after{outline:2px solid #1a73e8;outline-offset:-2px;background:#eef4ff;}' +
      '#ss-hwy-c411-panel .ss-set-row.ss-set-drop-before{box-shadow:inset 0 3px 0 0 #1a73e8;}' +
      '#ss-hwy-c411-panel .ss-set-row.ss-set-drop-after{box-shadow:inset 0 -3px 0 0 #1a73e8;}' +
      '#ss-hwy-c411-panel .ss-set-grip{color:#9aa0a6;font-size:14px;letter-spacing:-1px;user-select:none;cursor:grab;}' +
      '#ss-hwy-c411-panel .ss-set-check{width:16px;height:16px;flex:none;border:2px solid #5f6368;border-radius:4px;background:#fff;color:#fff;text-align:center;font:700 11px/12px sans-serif;box-sizing:border-box;}' +
      '#ss-hwy-c411-panel .ss-set-check[aria-checked="true"]{background:#1a73e8;border-color:#1a73e8;}' +
      '#ss-hwy-c411-panel .ss-set-lab{flex:1;cursor:pointer;color:#202124;font-size:13px;}' +
      '#ss-hwy-c411-panel .ss-set-row.ss-has-extra{flex-wrap:wrap;align-items:flex-start;}' +
      '#ss-hwy-c411-panel .ss-set-extra{flex:1 1 100%;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:1px 0 2px 38px;font-size:12px;color:#5f6368;cursor:default;}' +
      '#ss-hwy-c411-panel .ss-set-nlab{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;cursor:default;}' +
      '#ss-hwy-c411-panel .ss-set-num{width:58px;padding:3px 6px;border:1px solid #dadce0;border-radius:6px;font:12px/1.2 inherit;background:#fff;color:#202124;}' +
      '#ss-hwy-c411-shade{position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,.18);display:none;}' +
      '#ss-hwy-c411-shade.ss-open{display:block;}'
  );

  function digits(s) {
    return String(s || '').replace(/\D/g, '');
  }
  function normMc(s) {
    var d = digits(s);
    if (!d) return '';
    return String(Number(d));
  }
  function loadOrgMc() {
    try {
      var n = normMc(GM_getValue(ORG_MC_KEY, '') || '');
      return n || '';
    } catch (e) {
      return '';
    }
  }
  function orgMcNeeded() {
    try {
      if (String(GM_getValue(ORG_MC_NEED_KEY, '') || '') === '1') return true;
    } catch (e) {}
    return !loadOrgMc();
  }
  function setOrgMcNeeded(on) {
    try {
      GM_setValue(ORG_MC_NEED_KEY, on ? '1' : '0');
    } catch (e2) {}
  }
  function saveOrgMc(mc) {
    var n = normMc(mc);
    if (!n) return '';
    try {
      GM_setValue(ORG_MC_KEY, n);
    } catch (e) {}
    setOrgMcNeeded(false);
    return n;
  }
  var sessionHwy = null;
  var sessionC411 = null;
  function noticeCount() {
    if (isPaused()) return 1;
    var n = 0;
    if (orgMcNeeded()) n += 1;
    if (sessionHwy === false) n += 1;
    if (sessionC411 === false) n += 1;
    return n;
  }
  function setSessionHwy(ok) {
    var next = ok ? true : false;
    if (sessionHwy === next) {
      syncMcBadge();
      return;
    }
    sessionHwy = next;
    syncMcBadge();
    paintLoginNotes();
  }
  function setSessionC411(ok) {
    var next = ok ? true : false;
    if (sessionC411 === next) {
      syncMcBadge();
      return;
    }
    sessionC411 = next;
    syncMcBadge();
    paintLoginNotes();
  }
  function makeLoginPill(url) {
    var p = el('span', 'hwy-mc-pill hwy-mc-wait', 'Log In');
    p.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      window.open(url, '_blank', 'noopener');
    });
    return p;
  }
  function makeLoginNote(kind) {
    var row = el('div', 'ss-login-note');
    row.setAttribute('data-ss-login', kind);
    if (kind === 'hwy') {
      row.appendChild(logoImg(HWY_LOGO, 'Highway'));
      row.appendChild(el('span', 'ss-login-lab', 'Sign in to Highway.com for results.'));
      row.appendChild(makeLoginPill(HWY_LOGIN_URL));
    } else {
      row.appendChild(logoImg(C411_LOGO, 'Carrier411'));
      row.appendChild(el('span', 'ss-login-lab', 'Sign in to Carrier411 for results.'));
      row.appendChild(makeLoginPill(C411_LOGIN_URL));
    }
    return row;
  }
  function paintLoginNotes() {
    if (!panelEl) return;
    var search = panelEl.querySelector('.ss-set-search');
    var host = panelEl.querySelector('.ss-login-notes');
    var showHwy = sessionHwy === false;
    var showC411 = sessionC411 === false;
    if (!showHwy && !showC411) {
      if (host && host.parentNode) host.parentNode.removeChild(host);
      return;
    }
    if (!host) {
      host = el('div', 'ss-login-notes');
      if (search && search.parentNode) search.parentNode.insertBefore(host, search);
      else panelEl.insertBefore(host, panelEl.firstChild);
    }
    while (host.firstChild) host.removeChild(host.firstChild);
    if (showHwy) host.appendChild(makeLoginNote('hwy'));
    if (showC411) host.appendChild(makeLoginNote('c411'));
  }
  function probeHwySession() {
    gmGet(searchUrlExact('1'), null)
      .then(function () {
        setSessionHwy(true);
      })
      .catch(function (err) {
        if (err && err.code === 'login') setSessionHwy(false);
      });
  }
  function probeC411Session() {
    gmGetHtml(C411_URL + 'MC000001')
      .then(function (html) {
        var parsed = parseC411HtmlToFg(html);
        setSessionC411(!parsed.login);
      })
      .catch(function () {});
  }
  function probeSessions() {
    probeHwySession();
    probeC411Session();
  }
  function syncMcBadge() {
    var btn = document.getElementById('ss-hwy-c411-set-btn');
    if (!btn) return;
    var n = noticeCount();
    var b = document.getElementById('ss-hwy-c411-mc-badge');
    if (!n) {
      if (b && b.parentNode) b.parentNode.removeChild(b);
      return;
    }
    if (!b) {
      b = document.createElement('span');
      b.id = 'ss-hwy-c411-mc-badge';
      b.className = 'ss-mc-badge';
      b.setAttribute('aria-label', 'Open Settings');
      btn.appendChild(b);
    }
    b.textContent = String(n);
  }
  function shouldIgnore(mc) {
    if (!mc) return false;
    if (IGNORE_MC[mc] || IGNORE_DOT[mc]) return true;
    var org = loadOrgMc();
    return !!(org && org === mc);
  }
  function copyMcText(mc) {
    var n = normMc(mc);
    return n ? 'MC ' + n : '';
  }
  function formatUsdAmount(n) {
    var v = Math.round(Number(n));
    if (!isFinite(v) || v < 0) return '';
    return '$' + v.toLocaleString('en-US');
  }
  function copyMcRateText(mc, amount) {
    var mcTxt = copyMcText(mc);
    var money = formatUsdAmount(amount);
    if (!mcTxt) return money;
    if (!money) return mcTxt;
    return mcTxt + ' ' + money;
  }
  function clipText(text) {
    try {
      if (typeof GM_setClipboard === 'function') GM_setClipboard(text, 'text');
      else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
    } catch (e) {}
  }
  function padMcLine(mc) {
    var d = digits(mc);
    if (!d) return '';
    if (d.length < 6) d = ('000000' + d).slice(-6);
    return 'MC ' + d;
  }
  function padDotLine(dot) {
    var d = digits(dot);
    return d ? 'DOT ' + d : '';
  }
  function carrierClipboardText(name, mc, dot) {
    var n = String(name || '').replace(/\s+/g, ' ').trim();
    var mcLine = padMcLine(mc);
    var lines = [n || mcLine || 'MC'];
    if (mcLine) lines.push(mcLine);
    var dotLine = padDotLine(dot);
    if (dotLine) lines.push(dotLine);
    return lines.join('\n');
  }
  function formatSafety(n) {
    if (n == null || n === '' || isNaN(Number(n))) return '?';
    var num = Number(n);
    if (num === 0) return '0';
    var s = String(num);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  function unitsPillText(n) {
    if (n == null || n === '') return '? units';
    var v = Number(n);
    if (isNaN(v)) return String(n) + ' units';
    return v === 1 ? '1 unit' : v + ' units';
  }
  function safetyPillText(n) {
    if (n == null || n === '') return 'Safety ?';
    return 'Safety ' + formatSafety(n);
  }
  function compactFgDate(s) {
    if (!s) return '';
    var str = String(s).replace(/\s+/g, ' ').trim();
    var months = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
    };
    var m = str.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{2,4})$/);
    if (m) {
      var mo = months[m[1].slice(0, 3).toLowerCase()];
      if (mo) return mo + '/' + Number(m[2]) + '/' + String(m[3]).slice(-2);
    }
    m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return Number(m[2]) + '/' + Number(m[3]) + '/' + String(m[1]).slice(-2);
    m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) return Number(m[1]) + '/' + Number(m[2]) + '/' + String(m[3]).slice(-2);
    return str;
  }
  function compactAssessment(label) {
    var l = String(label || '').toLowerCase();
    if (l.indexOf('partial') >= 0) return 'Partial';
    if (l === 'pass') return 'Pass';
    if (l.indexOf('incomplete') >= 0) return 'Inc';
    if (l.indexOf('no mc') >= 0) return 'None';
    if (l.indexOf('sign') >= 0) return 'Sign in';
    if (l.indexOf('lookup') >= 0) return 'Error';
    if (l.indexOf('fail') >= 0) return 'Fail';
    return label || '—';
  }
  function isHwyFailLabel(label) {
    var a = String(label || '').toLowerCase();
    return a.indexOf('fail') >= 0 && a.indexOf('lookup') < 0;
  }
  function numOr(v, fb) {
    var n = Number(v);
    if (v === '' || v == null || isNaN(n)) return fb;
    return n;
  }
  function defaultThresh() {
    return { unitsMin: 10, cargoMinK: 100, safetyGreen: 0, safetyYellow: 3, safetyRed: 3 };
  }
  function mergeThresh(got) {
    var d = defaultThresh();
    if (!got || typeof got !== 'object') return d;
    return {
      unitsMin: numOr(got.unitsMin, d.unitsMin),
      cargoMinK: numOr(got.cargoMinK, d.cargoMinK),
      safetyGreen: numOr(got.safetyGreen, d.safetyGreen),
      safetyYellow: numOr(got.safetyYellow, d.safetyYellow),
      safetyRed: numOr(got.safetyRed, d.safetyRed)
    };
  }
  function loadThresh() {
    var s = loadSettings();
    return mergeThresh(s && s.thresh);
  }
  function defaultSettings() {
    return {
      paused: false,
      ui: 'bar',
      layoutVer: 1,
      hwy: [
        { id: 'assessment', on: true },
        { id: 'units', on: true },
        { id: 'safety', on: true },
        { id: 'alerts', on: true },
        { id: 'cargo', on: false },
        { id: 'bipd', on: false },
        { id: 'gl', on: false },
        { id: 'connection', on: true },
        { id: 'dnu', on: true },
        { id: 'domain', on: true },
        { id: 'truckPlate', on: true },
        { id: 'trailerPlate', on: true },
        { id: 'truckVin', on: true }
      ],
      c411: [
        { id: 'fg', on: true },
        { id: 'loss', on: true },
        { id: 'rating', on: false },
        { id: 'related', on: false }
      ],
      thresh: defaultThresh()
    };
  }
  function mergeSettings(saved) {
    var d = defaultSettings();
    if (!saved || typeof saved !== 'object') return d;
    function merge(def, got) {
      if (!Array.isArray(got)) return def.slice();
      var specBy = {};
      def.forEach(function (x) {
        specBy[x.id] = x;
      });
      var ordered = [];
      var seen = {};
      got.forEach(function (x) {
        if (!x || !specBy[x.id] || seen[x.id]) return;
        seen[x.id] = true;
        ordered.push({
          id: x.id,
          on: typeof x.on === 'boolean' ? x.on : specBy[x.id].on
        });
      });
      def.forEach(function (x) {
        if (seen[x.id]) return;
        ordered.push({ id: x.id, on: x.on });
      });
      return ordered;
    }
    var ui;
    if (!saved.layoutVer) ui = 'bar';
    else if (saved.ui === 'bar' || saved.ui === 'inline' || saved.ui === 'both') ui = saved.ui;
    else ui = 'bar';
    return {
      paused: !!saved.paused,
      ui: ui,
      layoutVer: 1,
      hwy: merge(d.hwy, saved.hwy),
      c411: merge(d.c411, saved.c411),
      thresh: mergeThresh(saved.thresh)
    };
  }
  function findMcMatches(text) {
    var s = String(text || '');
    var out = [];
    function add(rx, grp) {
      rx.lastIndex = 0;
      var m;
      while ((m = rx.exec(s))) {
        var mc = normMc(m[grp]);
        if (!mc || shouldIgnore(mc)) continue;
        var start = m.index;
        var end = m.index + m[0].length;
        var digitOff = m[0].search(/[0-9]{4,8}/);
        var digitStart = start + (digitOff >= 0 ? digitOff : 0);
        var digitEnd = digitStart + String(m[grp]).length;
        if (isFalseMcNumber(s, digitStart, digitEnd, m[grp])) continue;
        var overlap = false;
        var i;
        for (i = 0; i < out.length; i++) {
          if (!(end <= out[i].start || start >= out[i].end)) {
            overlap = true;
            break;
          }
        }
        if (overlap) continue;
        out.push({ start: start, end: end, mc: mc, full: m[0] });
      }
    }
    add(MC_RE, 1);
    add(MC_AFTER_RE, 1);
    out.sort(function (a, b) {
      return a.start - b.start;
    });
    return out;
  }
  function c411RatingShort(v) {
    var s = String(v || '').toLowerCase();
    if (s.indexOf('unsat') >= 0) return 'UNSAT';
    if (s.indexOf('cond') >= 0) return 'COND';
    if (s.indexOf('sat') >= 0) return 'SAT';
    if (!s || s === 'none' || s.indexOf('not') >= 0) return 'NR';
    return null;
  }
  function moneyShort(n) {
    var v = Number(n);
    if (!isFinite(v) || v < 0) return null;
    if (v === 0) return '$0';
    if (v >= 1000000) {
      var m = v / 1000000;
      var ms = m % 1 === 0 ? String(m) : String(Math.round(m * 10) / 10);
      return '$' + ms.replace(/\.0$/, '') + 'm';
    }
    if (v >= 1000) {
      var k = Math.round(v / 1000);
      return '$' + k + 'k';
    }
    return '$' + Math.round(v);
  }
  function cargoInsShort(n) {
    var s = moneyShort(n);
    if (!s) return null;
    return s.replace(/^\$/, '').replace(/k$/i, 'K').replace(/m$/i, 'M');
  }
  function cargoPill(amount) {
    if (amount == null || amount === '') return null;
    var n = Number(amount);
    if (!isFinite(n) || n < 0) return null;
    if (n === 0) {
      return { text: 'Cargo none', cls: 'hwy-mc-fail', title: 'No cargo insurance on file' };
    }
    var s = cargoInsShort(n);
    if (s == null) return null;
    var minK = loadThresh().cargoMinK;
    var minAmt = Number(minK) * 1000;
    if (!isFinite(minAmt) || minAmt < 0) minAmt = 100000;
    var ok = n >= minAmt;
    var floor = cargoInsShort(minAmt) || minK + 'K';
    return {
      text: 'Cargo INS ' + s,
      cls: ok ? 'hwy-mc-pass' : 'hwy-mc-fail',
      title: ok
        ? 'Cargo insurance ' + s
        : 'Cargo INS ' + s + ' is below ' + floor
    };
  }
  function bipdPill(amount) {
    if (amount == null || amount === '') return null;
    var s = moneyShort(amount);
    if (s == null) return null;
    var n = Number(amount);
    return {
      text: 'Auto ' + s,
      cls: n >= 750000 ? 'hwy-mc-pass' : n > 0 ? 'hwy-mc-basic-mid' : 'hwy-mc-fail',
      title: 'Auto insurance ' + (n > 0 ? '$' + Number(n).toLocaleString() : 'none on file')
    };
  }
  function glPill(amount) {
    if (amount == null || amount === '') return null;
    var s = moneyShort(amount);
    if (s == null) return null;
    var n = Number(amount);
    return {
      text: 'Gen Liab Ins ' + s,
      cls: n > 0 ? 'hwy-mc-pass' : 'hwy-mc-fail',
      title: 'General liability ' + (n > 0 ? '$' + Number(n).toLocaleString() : 'none on file')
    };
  }
  function alertPill(info) {
    if (!info || info.count == null) return null;
    var n = Number(info.count);
    if (isNaN(n)) return null;
    if (n <= 0) return { text: 'ID OK', cls: 'hwy-mc-pass', title: 'No open Highway identity alerts' };
    var types = (info.types || []).join(' ').toLowerCase();
    if (/double/.test(types)) return { text: 'DB', cls: 'hwy-mc-fail', title: 'Highway identity alert: double brokering' };
    if (/hostage/.test(types)) return { text: 'HOSTAGE', cls: 'hwy-mc-fail', title: 'Highway identity alert: hostage load' };
    if (/theft/.test(types)) return { text: 'THEFT', cls: 'hwy-mc-fail', title: 'Highway identity alert: identity theft' };
    return { text: 'ID ' + n, cls: 'hwy-mc-fail', title: n + ' open Highway identity alert(s)' };
  }
  function ratingPill(v) {
    var short = c411RatingShort(v);
    if (!short) return null;
    var cls = short === 'SAT' ? 'hwy-mc-pass' : short === 'NR' ? 'hwy-mc-wait' : 'hwy-mc-fail';
    return { text: short, cls: cls, title: 'Carrier411 safety rating ' + String(v) };
  }
  function emailDomain(s) {
    var t = String(s || '').trim().toLowerCase();
    var at = t.lastIndexOf('@');
    return at < 0 ? '' : t.slice(at + 1).replace(/[>\])\s]+$/g, '').replace(/\.$/, '');
  }
  function uniqEmail(arr, v) {
    var s = String(v || '').trim().toLowerCase().replace(/^mailto:/i, '').split('?')[0];
    if (!s || s.indexOf('@') < 0 || /@highway\.com$/i.test(s)) return;
    if (arr.indexOf(s) < 0) arr.push(s);
  }
  function emailFromNode(n) {
    if (!n) return '';
    if (typeof n === 'string') return n;
    if (typeof n.email === 'string') return n.email;
    if (typeof n.value === 'string') return n.value;
    if (n.email_address) return emailFromNode(n.email_address);
    return n.domain || '';
  }
  function collectHwyEmails(obj) {
    var out = [];
    if (!obj || typeof obj !== 'object') return out;
    var ci = obj.contact_information || {};
    if (ci.dispatch_contact) uniqEmail(out, emailFromNode(ci.dispatch_contact));
    [ci.email_addresses, obj.email_addresses, ci.contacts, obj.contacts, obj.company_domains].forEach(function (list) {
      if (!Array.isArray(list)) return;
      list.forEach(function (n) {
        var v = emailFromNode(n);
        uniqEmail(out, v.indexOf('@') >= 0 ? v : v ? 'holder@' + v : '');
      });
    });
    return out;
  }
  var PUBLIC_MAIL = {
    'gmail.com': 'Gmail',
    'googlemail.com': 'Gmail',
    'yahoo.com': 'Yahoo',
    'yahoo.co.uk': 'Yahoo',
    'ymail.com': 'Yahoo',
    'rocketmail.com': 'Yahoo',
    'aol.com': 'AOL',
    'aim.com': 'AOL',
    'hotmail.com': 'Hotmail',
    'outlook.com': 'Outlook',
    'live.com': 'Live',
    'msn.com': 'MSN',
    'icloud.com': 'iCloud',
    'me.com': 'iCloud',
    'mac.com': 'iCloud',
    'protonmail.com': 'Proton',
    'proton.me': 'Proton',
    'gmx.com': 'GMX',
    'gmx.net': 'GMX',
    'mail.com': 'Mail.com',
    'zoho.com': 'Zoho',
    'yandex.com': 'Yandex',
    'yandex.ru': 'Yandex',
    'comcast.net': 'Comcast',
    'att.net': 'AT&T',
    'sbcglobal.net': 'SBC',
    'verizon.net': 'Verizon',
    'bellsouth.net': 'BellSouth',
    'cox.net': 'Cox',
    'charter.net': 'Charter'
  };
  function normEmail(s) {
    var t = String(s || '')
      .trim()
      .toLowerCase()
      .replace(/^mailto:/i, '')
      .split('?')[0];
    var m = t.match(/[a-z0-9._%+\-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    return m ? m[0].toLowerCase() : '';
  }
  function publicMailBrand(domain) {
    var d = String(domain || '').toLowerCase();
    if (PUBLIC_MAIL[d]) return PUBLIC_MAIL[d];
    var parts = d.split('.');
    if (parts.length > 2) {
      var root2 = parts.slice(-2).join('.');
      if (PUBLIC_MAIL[root2]) return PUBLIC_MAIL[root2];
    }
    return '';
  }
  var myAddrMem = null;
  function myGmailAddr() {
    if (myAddrMem) return myAddrMem;
    var titleHit = String(document.title || '').match(/[a-z0-9._%+\-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    if (titleHit) {
      myAddrMem = titleHit[0].toLowerCase();
      return myAddrMem;
    }
    var sels = [
      'a[aria-label*="Google Account"]',
      'a[href*="SignOutOptions"]',
      'a[aria-label*="@"]',
      'img[aria-label*="@"]',
      '[data-identifier]'
    ];
    var i;
    var j;
    for (i = 0; i < sels.length; i++) {
      var nodes = document.querySelectorAll(sels[i]);
      for (j = 0; j < nodes.length; j++) {
        var blob =
          (nodes[j].getAttribute('aria-label') || '') +
          ' ' +
          (nodes[j].getAttribute('data-identifier') || '') +
          ' ' +
          (nodes[j].getAttribute('href') || '');
        var m = blob.match(/[a-z0-9._%+\-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
        if (m) {
          myAddrMem = m[0].toLowerCase();
          return myAddrMem;
        }
      }
    }
    return '';
  }
  function isSelfOrCoworkerAddr(addr) {
    var e = normEmail(addr);
    if (!e) return false;
    var mine = myGmailAddr();
    if (mine && e === normEmail(mine)) return true;
    var myDom = emailDomain(mine);
    var d = emailDomain(e);
    if (!myDom || !d) return false;
    if (publicMailBrand(d) || publicMailBrand(myDom)) return false;
    return d === myDom;
  }
  function hwyEmailList(hwyEmails) {
    var list = [];
    var i;
    var raw = hwyEmails || [];
    for (i = 0; i < raw.length; i++) {
      var e = normEmail(raw[i]);
      if (e && list.indexOf(e) < 0) list.push(e);
    }
    return list;
  }
  function hwyUniqueDomains(emails) {
    var d = [];
    var list = hwyEmailList(emails);
    var i;
    for (i = 0; i < list.length; i++) {
      var x = emailDomain(list[i]);
      if (x && !publicMailBrand(x) && d.indexOf(x) < 0) d.push(x);
    }
    return d;
  }
  function hwyHasPublicBrand(hwyEmails, brand) {
    if (!brand) return false;
    var list = hwyEmailList(hwyEmails);
    var i;
    for (i = 0; i < list.length; i++) {
      if (publicMailBrand(emailDomain(list[i])) === brand) return true;
    }
    return false;
  }
  function emailLocalPart(s) {
    var e = normEmail(s);
    var at = e.lastIndexOf('@');
    return at < 0 ? '' : e.slice(0, at);
  }
  function emailsExact(a, b) {
    var x = normEmail(a);
    var y = normEmail(b);
    if (!x || !y) return false;
    if (x === y) return true;
    var dx = emailDomain(x);
    var dy = emailDomain(y);
    if (
      (dx === 'gmail.com' || dx === 'googlemail.com') &&
      (dy === 'gmail.com' || dy === 'googlemail.com')
    ) {
      return emailLocalPart(x) === emailLocalPart(y);
    }
    return false;
  }
  function hwyHasExactEmail(from, hwyEmails) {
    var list = hwyEmailList(hwyEmails);
    var i;
    for (i = 0; i < list.length; i++) {
      if (emailsExact(from, list[i])) return true;
    }
    return false;
  }
  function domainMatch(gmailAddr, hwyEmails) {
    var g = emailDomain(gmailAddr);
    if (!g || publicMailBrand(g)) return false;
    var ds = hwyUniqueDomains(hwyEmails);
    return ds.indexOf(g) >= 0;
  }
  function domainTipText(from, matched, hwyEmails) {
    var list = hwyEmailList(hwyEmails);
    var kind = matched;
    if (matched === true) kind = 'exact';
    if (matched === false) kind = 'nomatch';
    var lines = [];
    if (!from || kind === 'none') {
      lines.push('No carrier email in this message');
    } else {
      lines.push(from);
      if (kind === 'team') lines.push('Team email');
      else if (kind === 'exact') lines.push('Exact match on Highway');
      else if (kind === 'domain') lines.push('Domain matches Highway');
      else if (kind === 'unmatched') lines.push('Not the Highway address');
      else if (kind === 'bad') lines.push('Not on Highway');
      else lines.push('Does not match Highway email');
    }
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i] && lines.indexOf(list[i]) < 0) lines.push(list[i]);
    }
    return lines.join('\n');
  }
  function isBoardOrSystemAddr(addr) {
    var e = normEmail(addr);
    if (!e) return true;
    if (/^(no-?reply|noreply|mailer-daemon|notifications?|postedloads|donotreply|do-not-reply)(\+.*)?@/i.test(e)) {
      return true;
    }
    var d = emailDomain(e);
    return /^(sylectus\.com|dat\.com|truckstop\.com|123loadboard\.com|loadboard\.com|u-?ship\.com|convoy\.com|transfix\.io)$/i.test(
      d
    );
  }
  function isSkipCarrierAddr(addr) {
    return !normEmail(addr) || isSelfOrCoworkerAddr(addr) || isBoardOrSystemAddr(addr);
  }
  var addrMcMem = null;
  function dropExpiredAddrMc(map) {
    var now = Date.now();
    Object.keys(map || {}).forEach(function (k) {
      var rec = map[k];
      if (!rec || !rec.ts || now - rec.ts > ADDR_MC_TTL) delete map[k];
    });
  }
  function loadAddrMcMap() {
    if (addrMcMem) {
      dropExpiredAddrMc(addrMcMem);
      return addrMcMem;
    }
    try {
      addrMcMem = JSON.parse(GM_getValue(ADDR_MC_KEY, '{}') || '{}');
    } catch (e) {
      addrMcMem = {};
    }
    if (!addrMcMem || typeof addrMcMem !== 'object') addrMcMem = {};
    dropExpiredAddrMc(addrMcMem);
    return addrMcMem;
  }
  function saveAddrMcMap() {
    try {
      GM_setValue(ADDR_MC_KEY, JSON.stringify(addrMcMem || {}));
    } catch (e) {}
  }
  function attrThreadId(el) {
    if (!el || !el.getAttribute) return '';
    var id = String(
      el.getAttribute('data-legacy-thread-id') ||
        el.getAttribute('data-thread-perm-id') ||
        el.getAttribute('data-thread-id') ||
        ''
    );
    if (id.charAt(0) === '#') id = id.slice(1);
    return id;
  }
  function hashThreadId() {
    var hash = String(location.hash || '');
    if (!hash) return '';
    var tagged = hash.match(/(?:thread-f:|thread-a:|th\/)([A-Za-z0-9:_-]+)/i);
    if (tagged) return tagged[1];
    var parts = hash.replace(/^#\/?/, '').split('/');
    var skip =
      /^(inbox|sent|drafts|starred|snoozed|important|chats|spam|trash|all|scheduled|search|label|category|advsearch|settings|imp|n|f)$/i;
    var i;
    for (i = parts.length - 1; i >= 0; i--) {
      var p = decodeURIComponent(parts[i] || '').split('?')[0];
      if (!p || skip.test(p) || p.length < 8) continue;
      if (/^FMfc/i.test(p) || /^[0-9a-f]{12,}$/i.test(p) || p.length >= 16) return p;
    }
    return '';
  }
  function gmailThreadId(node) {
    var start = node;
    if (node && node.querySelector) {
      var h2s = node.querySelectorAll('h2.hP');
      var i;
      for (i = 0; i < h2s.length; i++) {
        if (isShown(h2s[i])) {
          start = h2s[i];
          break;
        }
      }
    }
    var n = start;
    var hops = 0;
    while (n && n !== document.body && hops < 20) {
      if (n.matches && n.matches('tr.zA')) break;
      var id = attrThreadId(n);
      if (id) return id;
      var listish = n.querySelectorAll && n.querySelectorAll('tr.zA').length > 3;
      if (!listish && n.querySelector) {
        var marked = n.querySelector(
          '[data-legacy-thread-id], [data-thread-perm-id], [data-thread-id]'
        );
        if (marked && !(marked.closest && marked.closest('tr.zA'))) {
          var fromEl = attrThreadId(marked);
          if (fromEl) return fromEl;
        }
      }
      n = n.parentElement;
      hops++;
    }
    return hashThreadId();
  }
  function addrMcKey(tid, email) {
    return String(tid || '') + '\x1e' + String(email || '');
  }
  function rememberAddrMc(addr, mcs, tid) {
    var e = normEmail(addr);
    tid = String(tid || '');
    if (!e || !tid || isSkipCarrierAddr(e)) return;
    var list = [];
    var i;
    for (i = 0; i < (mcs || []).length; i++) {
      var mc = mcs[i];
      if (!mc || shouldIgnore(mc) || list.indexOf(mc) >= 0) continue;
      list.push(mc);
    }
    if (!list.length) return;
    var map = loadAddrMcMap();
    var key = addrMcKey(tid, e);
    var prev = map[key];
    var merged = [];
    var seen = {};
    function pushMc(x) {
      if (!x || seen[x] || shouldIgnore(x)) return;
      seen[x] = true;
      merged.push(x);
    }
    if (prev && prev.mcs && prev.ts && Date.now() - prev.ts <= ADDR_MC_TTL) {
      var p;
      for (p = 0; p < prev.mcs.length; p++) pushMc(prev.mcs[p]);
    }
    for (i = 0; i < list.length; i++) pushMc(list[i]);
    if (prev && prev.mcs && prev.mcs.length === merged.length) {
      var same = true;
      var j;
      for (j = 0; j < merged.length; j++) {
        if (prev.mcs[j] !== merged[j]) {
          same = false;
          break;
        }
      }
      if (same) return;
    }
    map[key] = { mcs: merged, ts: Date.now() };
    addrMcMem = map;
    saveAddrMcMap();
  }
  function assignedMcsForAddr(addr, tid) {
    var e = normEmail(addr);
    tid = String(tid || '');
    if (!e || !tid) return [];
    var rec = loadAddrMcMap()[addrMcKey(tid, e)];
    if (!rec || !rec.ts || Date.now() - rec.ts > ADDR_MC_TTL) return [];
    var out = [];
    var i;
    for (i = 0; i < (rec.mcs || []).length; i++) {
      var mc = rec.mcs[i];
      if (!mc || shouldIgnore(mc) || out.indexOf(mc) >= 0) continue;
      out.push(mc);
    }
    return out;
  }
  function domainBadge(gmailAddr, hwyEmails) {
    var from = normEmail(gmailAddr);
    if (!from) {
      return {
        text: 'No carrier email',
        cls: 'hwy-mc-wait',
        title: domainTipText('', 'none', hwyEmails),
        fast: true
      };
    }
    if (isSelfOrCoworkerAddr(from)) {
      return {
        text: 'Team email',
        cls: 'hwy-mc-wait',
        title: domainTipText(from, 'team', hwyEmails),
        fast: true
      };
    }
    var g = emailDomain(from);
    if (!g) return null;
    var brand = publicMailBrand(g);
    if (hwyHasExactEmail(from, hwyEmails)) {
      return {
        text: brand || 'Domain',
        cls: 'hwy-mc-pass',
        title: domainTipText(from, 'exact', hwyEmails),
        fast: true,
        check: true
      };
    }
    if (brand) {
      if (hwyHasPublicBrand(hwyEmails, brand)) {
        return {
          text: 'Unmatched',
          cls: 'hwy-mc-unmatch',
          title: domainTipText(from, 'unmatched', hwyEmails),
          fast: true
        };
      }
      return {
        text: 'Bad email',
        cls: 'hwy-mc-fail',
        title: domainTipText(from, 'bad', hwyEmails),
        fast: true
      };
    }
    if (domainMatch(from, hwyEmails)) {
      return {
        text: 'Domain',
        cls: 'hwy-mc-pass',
        title: domainTipText(from, 'domain', hwyEmails),
        fast: true,
        check: true
      };
    }
    return {
      text: 'Domain NOT Match',
      cls: 'hwy-mc-fail',
      title: domainTipText(from, 'nomatch', hwyEmails),
      fast: true
    };
  }
  function normConnStatus(status) {
    return String(status || '').toLowerCase().replace(/[\s-]+/g, '_');
  }
  function connKind(status) {
    var s = normConnStatus(status);
    if (s === 'onboarded' || s === 'connected') return 'connected';
    return 'none';
  }
  function isDnuStatus(status) {
    var s = normConnStatus(status);
    return s === 'do_not_dispatch' || s === 'do_not_use';
  }
  function isHwyBadgeSkipClass(cls) {
    return /(^|\s)(hwy-mc-badges)(\s|$)/.test(String(cls || ''));
  }
  function stripBadgeClassChunks(html) {
    var s = String(html || '');
    function stripOne(cls) {
      var needle = 'class="' + cls;
      var guard = 0;
      var idx;
      while (guard++ < 40 && (idx = s.indexOf(needle)) >= 0) {
        var start = s.lastIndexOf('<', idx);
        if (start < 0) break;
        var depth = 0;
        var i = start;
        var end = -1;
        while (i < s.length) {
          if (s.slice(i, i + 5).toLowerCase() === '<span') {
            depth += 1;
            i += 5;
            continue;
          }
          if (s.slice(i, i + 7).toLowerCase() === '</span>') {
            depth -= 1;
            i += 7;
            if (depth === 0) {
              end = i;
              break;
            }
            continue;
          }
          i += 1;
        }
        if (end < 0) break;
        s = s.slice(0, start) + s.slice(end);
      }
    }
    stripOne('hwy-mc-badges');
    stripOne('ss-fast-tip');
    return s.replace(/[ \t\u00a0]{2,}/g, ' ');
  }

  var BASIC_MEASURE_KEYS = [
    ['unsafe_driving_measure', 'Unsafe Driving'],
    ['hos_compliance_measure', 'HOS'],
    ['vehicle_maintenance_measure', 'Vehicle'],
    ['substance_alcohol_measure', 'Substances'],
    ['controlled_substance_measure', 'Substances'],
    ['driver_fitness_measure', 'Fitness']
  ];
  function latestSmsBasics(obj) {
    var list = obj && obj.sms_basics;
    if (!Array.isArray(list) || !list.length) return null;
    var copy = list.slice();
    copy.sort(function (a, b) {
      return String((b && b.file_date) || '').localeCompare(String((a && a.file_date) || ''));
    });
    return copy[0];
  }
  function pickSafetyDetail(obj) {
    var latest = latestSmsBasics(obj);
    if (!latest) return null;
    var parts = [];
    var seen = {};
    var shown = null;
    var i;
    for (i = 0; i < BASIC_MEASURE_KEYS.length; i++) {
      var key = BASIC_MEASURE_KEYS[i][0];
      var label = BASIC_MEASURE_KEYS[i][1];
      if (seen[label]) continue;
      if (latest[key] == null || latest[key] === '') continue;
      var n = Number(latest[key]);
      if (isNaN(n)) continue;
      seen[label] = true;
      parts.push({ label: label, value: n });
      if (key === 'unsafe_driving_measure') shown = n;
    }
    if (shown == null && parts.length) shown = parts[0].value;
    if (shown == null) return null;
    return { value: shown, parts: parts, date: latest.file_date || null };
  }
  function pickSafety(obj) {
    var d = pickSafetyDetail(obj);
    return d ? d.value : null;
  }
  function safetyClass(score) {
    if (score == null || score === '' || isNaN(Number(score))) return 'hwy-mc-wait';
    var n = Number(score);
    var t = loadThresh();
    if (n <= t.safetyGreen) return 'hwy-mc-pass';
    if (n > t.safetyRed) return 'hwy-mc-fail';
    if (n <= t.safetyYellow) return 'hwy-mc-basic-mid';
    return 'hwy-mc-fail';
  }
  function safetyTitle(detail) {
    if (!detail || !detail.parts || !detail.parts.length) return 'Highway safety score';
    var bits = detail.parts.map(function (p) {
      return p.label + ' ' + formatSafety(p.value);
    });
    var extra = detail.date ? ' · ' + detail.date : '';
    return 'Unsafe Driving shown: ' + bits.join(' · ') + extra;
  }
  function logoImg(src, alt) {
    var img = document.createElement('img');
    img.className = 'hwy-mc-logo';
    img.src = src;
    img.alt = alt || '';
    img.width = 16;
    img.height = 16;
    img.decoding = 'async';
    img.draggable = false;
    return img;
  }

  var settingsMem = null;
  function loadSettings() {
    if (settingsMem) return settingsMem;
    var parsed = null;
    try {
      var raw = GM_getValue(SETTINGS_KEY, 'null');
      if (!raw || raw === 'null') raw = GM_getValue('hwy_c411_badge_settings_v2', 'null');
      parsed = JSON.parse(raw);
    } catch (e) {
      parsed = null;
    }
    settingsMem = mergeSettings(parsed);
    if (parsed && !parsed.layoutVer) saveSettings(settingsMem);
    return settingsMem;
  }
  function isPaused() {
    var s = loadSettings();
    return !!(s && s.paused);
  }
  function saveSettings(s) {
    var wasPaused = !!(settingsMem && settingsMem.paused);
    settingsMem = s;
    try {
      GM_setValue(SETTINGS_KEY, JSON.stringify(s));
    } catch (e) {}
    try {
      if (s && s.paused) {
        if (typeof applyPausedState === 'function') applyPausedState();
        return;
      }
      if (wasPaused) {
        if (typeof applyPausedState === 'function') applyPausedState();
        return;
      }
      if (typeof applyUiMode === 'function') applyUiMode();
    } catch (e2) {}
  }
  function extrasOn(which, ids) {
    var list = loadSettings()[which] || [];
    return list.some(function (x) {
      return x.on && ids.indexOf(x.id) >= 0;
    });
  }
  function extrasOnSig() {
    var s = loadSettings();
    function pack(list) {
      var i;
      var out = '';
      for (i = 0; i < (list || []).length; i++) {
        out += (list[i].id || '') + (list[i].on ? '1' : '0');
      }
      return out;
    }
    return pack(s.hwy) + '|' + pack(s.c411);
  }
  function threshSig() {
    var t = loadThresh();
    return [t.unitsMin, t.cargoMinK, t.safetyGreen, t.safetyYellow, t.safetyRed].join(',');
  }

  var hwyCacheMem = null;
  var c411CacheMem = null;
  var cacheWriteTimer = 0;
  function resetHwyCacheOnUpdate() {
    var seen = '';
    try {
      seen = String(GM_getValue(CACHE_VER_KEY, '') || '');
    } catch (e) {}
    if (seen === SCRIPT_VERSION) return;
    hwyCacheMem = {};
    try {
      GM_setValue(CACHE_KEY, '{}');
    } catch (e2) {}
    try {
      GM_setValue(CACHE_VER_KEY, SCRIPT_VERSION);
    } catch (e3) {}
  }
  function persistCaches() {
    cacheWriteTimer = 0;
    try {
      if (hwyCacheMem) GM_setValue(CACHE_KEY, JSON.stringify(hwyCacheMem));
    } catch (e) {}
    try {
      if (c411CacheMem) GM_setValue(C411_CACHE_KEY, JSON.stringify(c411CacheMem));
    } catch (e2) {}
  }
  function scheduleCacheWrite() {
    if (cacheWriteTimer) return;
    cacheWriteTimer = setTimeout(persistCaches, 800);
  }
  function readCache() {
    if (hwyCacheMem) return hwyCacheMem;
    try {
      hwyCacheMem = JSON.parse(GM_getValue(CACHE_KEY, '{}') || '{}');
    } catch (e) {
      hwyCacheMem = {};
    }
    return hwyCacheMem;
  }
  function writeCache(obj) {
    hwyCacheMem = obj || {};
    scheduleCacheWrite();
  }
  function readC411Cache() {
    if (c411CacheMem) return c411CacheMem;
    try {
      c411CacheMem = JSON.parse(GM_getValue(C411_CACHE_KEY, '{}') || '{}');
    } catch (e) {
      c411CacheMem = {};
    }
    return c411CacheMem;
  }
  function writeC411Cache(obj) {
    c411CacheMem = obj || {};
    scheduleCacheWrite();
  }
  function sameLocalDay(ts) {
    if (!ts) return false;
    var a = new Date(ts);
    var b = new Date();
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  function cacheStillGood(hit) {
    if (!hit || !hit.ts) return false;
    if (hit.login || hit.error) return Date.now() - hit.ts < 2 * 60 * 1000;
    return sameLocalDay(hit.ts);
  }
  var CACHE_MAX = 80;
  function dropStaleCache(all) {
    Object.keys(all).forEach(function (k) {
      if (!cacheStillGood(all[k])) delete all[k];
    });
    var keys = Object.keys(all);
    if (keys.length <= CACHE_MAX) return;
    keys.sort(function (a, b) {
      return (all[a].ts || 0) - (all[b].ts || 0);
    });
    var i;
    for (i = 0; i < keys.length - CACHE_MAX; i++) delete all[keys[i]];
  }
  function getC411Cached(mc) {
    var all = readC411Cache();
    var hit = all[mc];
    if (!cacheStillGood(hit)) return null;
    if (hit.login || hit.error) return null;
    if (extrasOn('c411', ['rating']) && hit.extras !== 2) return null;
    return hit;
  }
  function setC411Cached(mc, data) {
    var all = readC411Cache();
    var prev = all[mc];
    if (
      prev &&
      cacheStillGood(prev) &&
      prev.ok &&
      !prev.login &&
      !prev.error &&
      (data.login || data.error)
    ) {
      return;
    }
    all[mc] = {
      ok: data.ok !== false && !data.login && !data.error,
      hasFg: !!data.hasFg,
      date: data.date || null,
      type: data.type || null,
      count: data.count || 0,
      cargoAmt: data.cargoAmt == null ? null : data.cargoAmt,
      bipdAmt: data.bipdAmt == null ? null : data.bipdAmt,
      rating: data.rating || null,
      related: !!data.related,
      loss: !!data.loss,
      extras: 2,
      login: !!data.login,
      error: !!data.error,
      ts: Date.now()
    };
    dropStaleCache(all);
    writeC411Cache(all);
  }

  function docketFromMc(mc) {
    var d = digits(mc);
    if (d.length < 6) d = ('000000' + d).slice(-6);
    return 'MC' + d;
  }
  function cacheNeedsHwyExtras(hit) {
    if (!hit) return true;
    if (extrasOn('hwy', ['safety']) && hit.safety == null) return true;
    if (extrasOn('hwy', ['connection', 'dnu']) && hit.connStatus === undefined) return true;
    if (extrasOn('hwy', ['domain']) && !Array.isArray(hit.emails)) return true;
    if (extrasOn('hwy', ['cargo']) && hit.cargoAmt == null) return true;
    if (extrasOn('hwy', ['bipd']) && hit.bipdAmt == null) return true;
    if (extrasOn('hwy', ['gl']) && hit.glAmt == null) return true;
    if (hit.name && hit.dot == null) return true;
    return false;
  }
  function getCached(mc) {
    var all = readCache();
    var hit = all[mc];
    if (!hit || !hit.ts || hit.login) return null;
    if (!sameLocalDay(hit.ts)) return null;
    return hit;
  }
  function setCached(mc, data) {
    var all = readCache();
    var prev = all[mc] || {};
    var vehicles = Array.isArray(data.vehicles)
      ? data.vehicles
      : Array.isArray(prev.vehicles)
        ? prev.vehicles
        : undefined;
    all[mc] = {
      name: data.name || null,
      assessment: data.assessment || null,
      fleet: data.fleet == null ? null : data.fleet,
      safety: data.safety == null ? null : data.safety,
      safetyParts: data.safetyParts || null,
      safetyDate: data.safetyDate || null,
      alerts: data.alerts == null ? null : data.alerts,
      alertTypes: data.alertTypes || null,
      cargoAmt: data.cargoAmt == null ? null : data.cargoAmt,
      bipdAmt: data.bipdAmt == null ? null : data.bipdAmt,
      glAmt: data.glAmt == null ? null : data.glAmt,
      connStatus: data.connStatus == null ? null : data.connStatus,
      dnu: !!data.dnu,
      dnuNote: data.dnuNote || '',
      emails: Array.isArray(data.emails) ? data.emails : [],
      id: data.id || null,
      dot: data.dot ? String(data.dot) : '',
      ts: Date.now()
    };
    if (vehicles) all[mc].vehicles = vehicles;
    dropStaleCache(all);
    writeCache(all);
  }

  function hwyLoginError() {
    var err = new Error('login');
    err.code = 'login';
    return err;
  }
  function looksLikeHwyLogin(res) {
    var status = res && res.status;
    if (status === 401 || status === 403) return true;
    var url = String((res && res.finalUrl) || '');
    if (/\/broker\/login|\/onboarding\/sign-|\/users\/sign_in|\/login/i.test(url)) return true;
    var text = String((res && res.responseText) || '');
    var trim = text.replace(/^\s+/, '');
    if (!trim) return false;
    if (trim.charAt(0) === '{' || trim.charAt(0) === '[') return false;
    return /<html|<!doctype/i.test(trim) && /password|sign in|log in|broker\/login/i.test(text);
  }
  var hwyAborts = {};
  function abortHwy(mc) {
    var list = hwyAborts[mc];
    hwyAborts[mc] = [];
    if (!list) return;
    var i;
    for (i = 0; i < list.length; i++) {
      try {
        if (list[i] && typeof list[i].abort === 'function') list[i].abort();
      } catch (e) {}
    }
  }
  function gmGet(url, mc) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      function finish(fn, arg) {
        if (settled) return;
        settled = true;
        fn(arg);
      }
      var h = GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        anonymous: false,
        timeout: 10000,
        headers: { Accept: 'application/json' },
        onload: function (res) {
          if (looksLikeHwyLogin(res)) {
            finish(reject, hwyLoginError());
            return;
          }
          if (res.status < 200 || res.status >= 300) {
            finish(reject, new Error('HTTP ' + res.status));
            return;
          }
          try {
            finish(resolve, JSON.parse(res.responseText));
          } catch (e) {
            if (looksLikeHwyLogin(res) || /<html|<!doctype/i.test(res.responseText || '')) {
              finish(reject, hwyLoginError());
              return;
            }
            finish(reject, e);
          }
        },
        onerror: function () {
          finish(reject, new Error('network'));
        },
        ontimeout: function () {
          finish(reject, new Error('timeout'));
        },
        onabort: function () {
          finish(reject, new Error('abort'));
        }
      });
      if (mc && h) {
        if (!hwyAborts[mc]) hwyAborts[mc] = [];
        hwyAborts[mc].push(h);
      }
    });
  }

  function stripHtml(html) {
    return String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#36;/g, '$')
      .replace(/&amp;/gi, '&');
  }
  function parseDollarLine(s) {
    var m = String(s || '').match(/\$[\s]*([\d,]+(?:\.\d+)?)/);
    if (m) {
      var n = Number(m[1].replace(/,/g, ''));
      return isFinite(n) ? n : null;
    }
    m = String(s || '').match(/\b(\d{1,3}(?:,\d{3}){1,3})\b/);
    if (m) {
      var n2 = Number(m[1].replace(/,/g, ''));
      return isFinite(n2) && n2 >= 5000 ? n2 : null;
    }
    return null;
  }
  function parseC411Coverage(plain) {
    var text = String(plain || '');
    var start = text.search(/Insurance Status/i);
    if (start < 0) start = text.search(/\bBIPD\s*(\/Primary)?\b/i);
    if (start < 0) return { cargoAmt: null, bipdAmt: null };
    var slice = text.slice(start, start + 4000);
    var cut = slice.search(/\n\s*(Inspections|Crashes|Census Data|SMS BASIC|Reported Items)\b/i);
    if (cut > 80) slice = slice.slice(0, cut);
    var lines = slice.split(/\n+/).map(function (l) {
      return l.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
    var bipdAmt = null;
    var cargoAmt = null;
    var pending = [];
    var loose = [];
    var i;
    for (i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/FILED|REQUIRED|CARGOREQ|BIPDREQ/i.test(line) && parseDollarLine(line) == null) continue;
      var dol = parseDollarLine(line);
      var isBipd = /\bBIPD\b/i.test(line);
      var isCargo = /\bCARGO\b/i.test(line) && !/claim|guard/i.test(line);
      if (isBipd && dol != null) bipdAmt = dol;
      else if (isCargo && dol != null) cargoAmt = dol;
      else if (isBipd) pending.push('bipd');
      else if (isCargo) pending.push('cargo');
      else if (dol != null) loose.push(dol);
    }
    var j = 0;
    for (i = 0; i < pending.length && j < loose.length; i++) {
      if (pending[i] === 'bipd' && bipdAmt == null) bipdAmt = loose[j++];
      else if (pending[i] === 'cargo' && cargoAmt == null) cargoAmt = loose[j++];
    }
    if (bipdAmt == null && /BIPD[\s\S]{0,100}\bNONE\b/i.test(slice)) bipdAmt = 0;
    if (cargoAmt == null && /CARGO[\s\S]{0,100}\bNONE\b/i.test(slice)) cargoAmt = 0;
    return { cargoAmt: cargoAmt, bipdAmt: bipdAmt };
  }

  function parseC411Page(html) {
    var plain = stripHtml(html);
    var loggedOut = /type=["']password["']/i.test(html) && !/USDOT\s+\d+/i.test(plain);
    if (loggedOut || /please log in|member login|unauthorized=1/i.test(plain + html)) {
      return { ok: false, login: true, hasFg: false };
    }

    var idx = html.toLowerCase().indexOf('reported items');
    var section = idx >= 0 ? html.slice(idx, idx + 3500) : '';
    var dates = [];
    var dateRe = /\b((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{1,2},\s+\d{4})\b/gi;
    var dm;
    while ((dm = dateRe.exec(section))) dates.push(dm[1]);

    var type = null;
    var tm = section.match(/REPORTED ITEMS<\/strong><\/span>\s*(?:<br[^>]*>\s*)+<span[^>]*>([^<]+)/i);
    if (tm) type = tm[1].replace(/\s+/g, ' ').trim();
    if (!type) {
      var tm2 = plain.match(/REPORTED ITEMS\s+([A-Z][A-Z0-9 \/,\-]{4,80})/);
      if (tm2) type = tm2[1].trim();
    }

    var countM = plain.match(/(\d+)\s+FreightGuard Reports?\s+was submitted/i);
    var count = dates.length;
    if (countM) count = Number(countM[1]);
    var hasFg = idx >= 0 || (countM && count > 0);

    var authority = null;
    var authSlice = '';
    var ai = plain.search(/Operating Authority/i);
    if (ai >= 0) authSlice = plain.slice(ai, ai + 900);
    else authSlice = plain;
    if (
      /(COMMON|CONTRACT)[\s\S]{0,120}\bACTIVE\b/i.test(authSlice) ||
      /Authority[^\n]{0,40}\bACTIVE\b/i.test(authSlice)
    ) {
      authority = 'active';
    } else if (/Pending Revocation/i.test(authSlice)) {
      authority = 'inactive';
    } else if (
      /(COMMON|CONTRACT)[\s\S]{0,120}\b(INACTIVE|NONE|REVOKED)\b/i.test(authSlice) ||
      /NOT AUTHORIZED|\bINACTIVE\b/i.test(authSlice)
    ) {
      authority = 'inactive';
    }

    var cov = parseC411Coverage(plain);

    var rating = null;
    var rm =
      plain.match(/Safety Rating[:\s]*\n+\s*(SATISFACTORY|CONDITIONAL|UNSATISFACTORY|NONE|NOT RATED)/i) ||
      html.match(/Safety Rating[\s\S]{0,180}?(SATISFACTORY|CONDITIONAL|UNSATISFACTORY|NONE|NOT RATED)/i) ||
      plain.match(/CURRENT CARRIER SAFETY RATING[:\s]*(SATISFACTORY|CONDITIONAL|UNSATISFACTORY)/i);
    if (rm) rating = rm[1];

    return {
      ok: true,
      login: false,
      hasFg: !!hasFg,
      date: dates[0] || null,
      type: type,
      count: count || (hasFg ? 1 : 0),
      authority: authority,
      cargoAmt: cov.cargoAmt,
      bipdAmt: cov.bipdAmt,
      rating: rating,
      related: /RELATED COMPANIES DETECTED/i.test(plain),
      loss: /UNJUSTIFIED LOSS OF FREIGHT/i.test(plain)
    };
  }

  var c411Inflight = {};
  var c411Clicked = {};
  function markC411Clicked(mc) {
    if (!mc) return;
    c411Clicked[mc] = Date.now();
  }
  function applyC411ToMc(mc, fg) {
    if (!mc) return;
    if (mcStore && mcStore[mc]) {
      var cur = mcStore[mc].fg;
      if (!(cur && !cur.login && !cur.error && fg && (fg.login || fg.error))) {
        mcStore[mc].fg = fg;
      }
      try {
        notifyMc(mc);
      } catch (e0) {}
    }
    document.querySelectorAll('.hwy-mc-wrap[data-hwy-mc="' + mc + '"]').forEach(function (w) {
      try {
        if (typeof w._ssApplyC411 === 'function') w._ssApplyC411(fg);
      } catch (e) {}
    });
  }
  function refreshC411WrapsFromCache() {
    if (!/mail\.google|inbox\.google/i.test(location.hostname)) return;
    var host = openThreadRoot() || document;
    var wraps = host.querySelectorAll('.hwy-mc-wrap');
    var i;
    var seen = {};
    for (i = 0; i < wraps.length; i++) {
      var mc = wraps[i].getAttribute('data-hwy-mc');
      if (!mc || seen[mc]) continue;
      seen[mc] = true;
      var hit = getC411Cached(mc);
      if (hit) applyC411ToMc(mc, hit);
    }
  }
  function retryClickedC411() {
    if (!/mail\.google|inbox\.google/i.test(location.hostname)) return;
    var now = Date.now();
    var mcs = Object.keys(c411Clicked);
    var n = 0;
    mcs.forEach(function (mc) {
      if (now - c411Clicked[mc] > 15 * 60 * 1000) {
        delete c411Clicked[mc];
        return;
      }
      if (n >= 8) return;
      var hit = getC411Cached(mc);
      if (hit && !hit.login && !hit.error) {
        applyC411ToMc(mc, hit);
        delete c411Clicked[mc];
        return;
      }
      n += 1;
      lookupC411(mc, true).then(function (fg) {
        applyC411ToMc(mc, fg || { error: true });
        if (fg && !fg.login && !fg.error) delete c411Clicked[mc];
      });
    });
  }
  if (typeof GM_addValueChangeListener === 'function') {
    GM_addValueChangeListener(C411_CACHE_KEY, function () {
      c411CacheMem = null;
      refreshC411WrapsFromCache();
    });
    GM_addValueChangeListener(CACHE_KEY, function () {
      hwyCacheMem = null;
    });
    GM_addValueChangeListener(SETTINGS_KEY, function () {
      settingsMem = null;
      try {
        if (typeof applyUiMode === 'function') applyUiMode();
      } catch (e) {}
      try {
        var ae = document.activeElement;
        if (
          ae &&
          ae.classList &&
          (ae.classList.contains('ss-set-num') || ae.classList.contains('ss-org-mc'))
        ) {
          return;
        }
        if (typeof refreshPanel === 'function') refreshPanel();
      } catch (e2) {}
    });
  }
  function forgetC411Cached(mc) {
    var all = readC411Cache();
    if (!all[mc]) return;
    delete all[mc];
    writeC411Cache(all);
  }
  function gmGetHtml(url) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        anonymous: false,
        timeout: 15000,
        headers: { Accept: 'text/html' },
        onload: function (res) {
          if (res.status === 429) {
            reject(new Error('429'));
            return;
          }
          if (res.status < 200 || res.status >= 300) {
            reject(new Error('HTTP ' + res.status));
            return;
          }
          resolve(String(res.responseText || ''));
        },
        onerror: function () {
          reject(new Error('network'));
        },
        ontimeout: function () {
          reject(new Error('timeout'));
        }
      });
    });
  }
  function parseC411HtmlToFg(html) {
    var parsed = parseC411Page(html);
    var text = String(html || '');
    if (
      /unauthorized=1|link\.cfm/i.test(text) ||
      (/unauthorized/i.test(text) && !/USDOT\s+\d+/i.test(text)) ||
      (/Login Message/i.test(text) && !/USDOT\s+\d+/i.test(text))
    ) {
      return { ok: false, hasFg: false, login: true };
    }
    return parsed;
  }
  function fetchC411Direct(mc) {
    var url = C411_URL + encodeURIComponent(docketFromMc(mc));
    return gmGetHtml(url).then(function (html) {
      var parsed = parseC411HtmlToFg(html);
      if (parsed.login) {
        setSessionC411(false);
        setC411Cached(mc, { hasFg: false, login: true, ok: false });
      } else {
        setSessionC411(true);
        setC411Cached(mc, parsed);
      }
      return getC411Cached(mc) || parsed;
    });
  }
  function lookupC411(mc, force) {
    if (force) {
      forgetC411Cached(mc);
      delete c411Inflight[mc];
    }
    var cached = getC411Cached(mc);
    if (cached) return Promise.resolve(cached);
    if (c411Inflight[mc]) return c411Inflight[mc];
    c411Inflight[mc] = fetchC411Direct(mc)
      .catch(function (err) {
        var msg = String((err && err.message) || err || '');
        if (msg === '429' || msg === 'timeout' || msg === 'network' || msg.indexOf('HTTP') === 0) {
          return { ok: false, hasFg: false, error: true };
        }
        return { ok: false, hasFg: false, login: true };
      })
      .then(function (fg) {
        delete c411Inflight[mc];
        return fg || { ok: false, hasFg: false, login: true };
      });
    return c411Inflight[mc];
  }

  function startC411PageHint() {
    function cacheLiveDocket() {
      try {
        var m = String(location.search || '').match(/docket=MC0*(\d+)/i);
        if (!m) return;
        var liveMc = String(Number(m[1]));
        var live = parseC411HtmlToFg(document.documentElement.innerHTML || '');
        if (!live.login) {
          setSessionC411(true);
          setC411Cached(liveMc, live);
        }
      } catch (e) {}
    }
    cacheLiveDocket();
    window.addEventListener('pageshow', cacheLiveDocket);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) cacheLiveDocket();
    });
  }

  function carriersFrom(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    return data.carriers || data.results || data.data || data.items || [];
  }

  function hasMc(carrier, mc) {
    var ids = carrier.identifiers || [];
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (String(id.is_type || id.type || '').toUpperCase() !== 'MC') continue;
      var v = normMc(id.value_non_padded || id.value || '');
      if (v && v === mc) return true;
    }
    return false;
  }
  function dotFromIds(ids) {
    if (!Array.isArray(ids)) return '';
    var i;
    for (i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (!id) continue;
      var t = String(id.is_type || id.type || '').toUpperCase();
      if (t !== 'DOT' && t !== 'USDOT') continue;
      var v = digits(id.value || id.value_non_padded || '');
      if (v) return v;
    }
    return '';
  }
  function pickDot(obj) {
    var direct =
      dotFromIds(obj && obj.identifiers) ||
      dotFromIds(obj && obj.carrier && obj.carrier.identifiers);
    if (direct) return direct;
    var found = '';
    jsonWalk(obj, function (node) {
      if (found || !node || !Array.isArray(node.identifiers)) return;
      found = dotFromIds(node.identifiers);
    }, 0);
    return found;
  }

  function jsonWalk(obj, fn, depth) {
    if (!obj || typeof obj !== 'object' || depth > 8) return;
    fn(obj);
    if (Array.isArray(obj)) {
      var i;
      for (i = 0; i < obj.length && i < 40; i++) jsonWalk(obj[i], fn, (depth || 0) + 1);
      return;
    }
    Object.keys(obj).forEach(function (k) {
      jsonWalk(obj[k], fn, (depth || 0) + 1);
    });
  }

  function pickAssessment(obj) {
    var summary =
      (obj && obj.rules_assessment && obj.rules_assessment.summary) ||
      (obj && obj.carrier && obj.carrier.rules_assessment && obj.carrier.rules_assessment.summary) ||
      {};
    if (summary.overall_result) {
      var r = String(summary.overall_result).toLowerCase().replace(/[\s-]+/g, '_');
      if (r === 'fail') return 'Fail';
      if (r === 'pass') return 'Pass';
      if (r.indexOf('partial') >= 0) return 'Partial Pass';
      if (r.indexOf('incomplete') >= 0) return 'Incomplete';
    }
    var raw = '';
    try {
      raw = JSON.stringify(obj);
    } catch (e) {
      return null;
    }
    var m = raw.match(/"overall_result"\s*:\s*"([^"]+)"/i);
    if (m) {
      var o = m[1].toLowerCase().replace(/[\s-]+/g, '_');
      if (o === 'fail') return 'Fail';
      if (o === 'pass') return 'Pass';
      if (o.indexOf('partial') >= 0) return 'Partial Pass';
      if (o.indexOf('incomplete') >= 0) return 'Incomplete';
    }
    if (/partial[_\s-]*pass/i.test(raw)) return 'Partial Pass';
    return null;
  }

  function pickFleet(obj) {
    function fromEp(ep) {
      if (!ep || typeof ep !== 'object') return null;
      if (typeof ep.total_observed_power_units === 'number') return ep.total_observed_power_units;
      if (typeof ep.total_observed_power_units === 'string' && /^\d+$/.test(ep.total_observed_power_units)) {
        return Number(ep.total_observed_power_units);
      }
      return null;
    }
    var ep =
      obj.equipment_portfolio ||
      (obj.carrier && obj.carrier.equipment_portfolio) ||
      (obj.equipment && obj.equipment.summary) ||
      obj.equipment;
    var n = fromEp(ep);
    if (n != null) return n;
    var raw = '';
    try {
      raw = JSON.stringify(obj);
    } catch (e) {
      raw = '';
    }
    var m = raw.match(/"total_observed_power_units"\s*:\s*(\d+)/);
    if (m) return Number(m[1]);
    return null;
  }

  function asMoney(v) {
    if (typeof v === 'number' && isFinite(v) && v >= 0) return v;
    if (typeof v !== 'string') return null;
    var s = v.replace(/[$,\s]/g, '');
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    return Number(s);
  }
  function moneyFromNode(node) {
    if (!node || typeof node !== 'object') return null;
    var keys = [
      'limit',
      'amount',
      'coverage',
      'coverage_amount',
      'coverage_to',
      'filed_amount',
      'limit_amount',
      'on_file',
      'value'
    ];
    var i;
    for (i = 0; i < keys.length; i++) {
      var n = asMoney(node[keys[i]]);
      if (n != null) return n;
    }
    if (typeof node.limit_cents === 'number') return node.limit_cents / 100;
    return null;
  }
  function nodeLabel(node) {
    if (!node || typeof node !== 'object') return '';
    return [
      node.type,
      node.kind,
      node.name,
      node.line,
      node.coverage_type,
      node.policy_type,
      node.insurance_type,
      node.category
    ]
      .map(function (x) {
        return String(x || '');
      })
      .join(' ');
  }
  function pickLimit(obj, typeRe) {
    var best = null;
    jsonWalk(obj, function (node) {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;
      var lab = nodeLabel(node) + ' ' + Object.keys(node).join(' ');
      if (!typeRe.test(lab)) return;
      var amt = moneyFromNode(node);
      if (amt != null) best = amt;
    });
    if (best != null) return best;
    var raw = '';
    try {
      raw = JSON.stringify(obj);
    } catch (e) {
      return null;
    }
    var m = raw.match(typeRe);
    if (!m) return null;
    var slice = raw.slice(m.index, m.index + 220);
    var dol = slice.match(/(\d{4,9})/);
    if (dol) {
      var n = Number(dol[1]);
      if (n >= 1000) return n;
    }
    return null;
  }
  function pickAlerts(obj) {
    var n = null;
    var types = [];
    jsonWalk(obj, function (node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node) && node === obj) return;
      if (Array.isArray(node.identity_alerts)) {
        n = node.identity_alerts.length;
        node.identity_alerts.forEach(function (a) {
          if (!a) return;
          types.push(String(a.type || a.kind || a.category || a.name || a.title || ''));
        });
      }
      if (typeof node.open_identity_alerts_count === 'number') {
        n = node.open_identity_alerts_count;
      }
      if (node.identity_alerts_summary && typeof node.identity_alerts_summary === 'object') {
        var c = node.identity_alerts_summary.open_count;
        if (typeof c !== 'number') c = node.identity_alerts_summary.count;
        if (typeof c === 'number') n = c;
      }
      if (node.has_identity_alerts === true && n == null) n = 1;
      if (Array.isArray(node.published_identity_alerts)) {
        n = node.published_identity_alerts.length;
        node.published_identity_alerts.forEach(function (a) {
          if (!a) return;
          types.push(String(a.type || a.is_type || a.kind || a.category || a.name || a.title || ''));
        });
      }
    });
    if (n == null) {
      var raw = '';
      try {
        raw = JSON.stringify(obj);
      } catch (e) {
        return null;
      }
      if (!/"identity_alerts"/i.test(raw)) return null;
      var inner = raw.match(/"identity_alerts"\s*:\s*(\[[^\]]*\])/i);
      if (inner) {
        try {
          var arr = JSON.parse(inner[1]);
          if (Array.isArray(arr)) n = arr.length;
        } catch (e2) {
          n = 0;
        }
      } else {
        n = 0;
      }
    }
    return { count: n, types: types };
  }
  function pickCargoLimit(obj) {
    return pickLimit(obj, /cargo/i);
  }
  function pickBipdLimit(obj) {
    var n = pickLimit(obj, /bipd|auto_liab|auto liability|automobile|truckers.?liab/i);
    if (n != null) return n;
    var best = null;
    jsonWalk(obj, function (node) {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;
      var lab = nodeLabel(node) + ' ' + Object.keys(node).join(' ');
      if (/cargo/i.test(lab) || !/liability/i.test(lab)) return;
      var amt = moneyFromNode(node);
      if (amt != null) best = amt;
    });
    return best;
  }

  function applyHwyExtras(result, obj) {
    if (!obj) return;
    var a = pickAlerts(obj);
    if (a && a.count != null) {
      result.alerts = a.count;
      result.alertTypes = a.types || [];
    }
    var mails = collectHwyEmails(obj);
    if (mails.length) {
      var have = result.emails || [];
      var i;
      for (i = 0; i < mails.length; i++) uniqEmail(have, mails[i]);
      result.emails = have;
    }
  }
  function applyHwyConn(result, src) {
    var conn = null;
    if (Array.isArray(src)) {
      if (!src.length) {
        if (result.connStatus == null) result.connStatus = '';
        return;
      }
      conn = src[0];
    } else if (src && src.connection) {
      conn = src.connection;
    } else if (src && src.status && (src.carrier_id || src.issuer_id)) {
      conn = src;
    }
    if (!conn) return;
    result.connStatus = normConnStatus(conn.status);
    result.dnu =
      isDnuStatus(result.connStatus) ||
      conn.do_not_dispatch === true ||
      conn.do_not_use === true;
    if (conn.notes) result.dnuNote = String(conn.notes);
  }
  function connectionsUrl(id) {
    return (
      'https://highway.com/monitor/api/v1/connections?q%5Bcarrier_id_eq%5D=' +
      encodeURIComponent(id) +
      '&page=1&per_page=5'
    );
  }
  function insuranceUrl(id) {
    return (
      'https://highway.com/monitor/api/v1/insurance_policies/active_by_carrier_id' +
      '?with_cancelled=true&with_active_pending=true&carrier_id=' +
      encodeURIComponent(id)
    );
  }
  function policyMoney(p, prefer) {
    var limits = (p && p.insurance_limits) || [];
    var i;
    var j;
    var n;
    for (i = 0; i < prefer.length; i++) {
      for (j = 0; j < limits.length; j++) {
        if (!limits[j]) continue;
        if (String(limits[j].is_type || '') !== prefer[i]) continue;
        n = asMoney(limits[j].value);
        if (n != null) return n;
      }
    }
    return asMoney(p && p.limit);
  }
  function applyHwyInsurance(result, data) {
    var list = Array.isArray(data)
      ? data
      : data && Array.isArray(data.insurance_policies)
        ? data.insurance_policies
        : data && Array.isArray(data.data)
          ? data.data
          : [];
    var i;
    var p;
    var t;
    var n;
    for (i = 0; i < list.length; i++) {
      p = list[i];
      if (!p) continue;
      var st = String(p.status || '').toLowerCase();
      if (st && (st.indexOf('cancel') >= 0 || st.indexOf('inactive') >= 0 || st.indexOf('expire') >= 0)) continue;
      t = String(p.is_type || p.type || '');
      if (t === 'motor_truck_cargo') {
        n = policyMoney(p, ['limit']);
        if (n != null) result.cargoAmt = n;
      } else if (t === 'automobile_liability') {
        n = policyMoney(p, ['combined_single_limit', 'limit']);
        if (n != null) result.bipdAmt = n;
      } else if (t === 'commercial_general_liability') {
        n = policyMoney(p, ['general_aggregate', 'each_occurrence', 'limit']);
        if (n != null) result.glAmt = n;
      }
    }
  }

  function searchUrlExact(mc) {
    return API_SEARCH_BASE + '&q%5Bidentifiers_value_eq%5D=' + encodeURIComponent(mc);
  }
  function searchUrlPrefix(mc) {
    return API_SEARCH_BASE + '&q%5Bidentifiers_value_non_padded_start%5D=' + encodeURIComponent(mc);
  }
  function pickCarrierByMc(data, mc) {
    var list = carriersFrom(data);
    var i;
    for (i = 0; i < list.length; i++) {
      if (hasMc(list[i], mc)) return list[i];
    }
    return null;
  }

  var inflight = {};
  var hwyActive = 0;
  var hwyWait = [];
  var hwyExtrasInflight = {};
  var hwyVehiclesInflight = {};
  function applyHwyExtraPack(result, pack) {
    var detail = pack[0];
    var safety = pack[1];
    var conns = pack[2];
    var ins = pack[3];
    if (detail) {
      result.assessment = pickAssessment(detail) || result.assessment;
      if (result.fleet == null) {
        var f = pickFleet(detail);
        if (f != null) result.fleet = f;
      }
      applyHwyExtras(result, detail);
      applyHwyConn(result, detail);
      var moreDot = pickDot(detail);
      if (moreDot) result.dot = moreDot;
    }
    applyHwyConn(result, conns);
    if (ins) {
      applyHwyInsurance(result, ins);
      if (extrasOn('hwy', ['cargo']) && result.cargoAmt == null) result.cargoAmt = 0;
      if (extrasOn('hwy', ['bipd']) && result.bipdAmt == null) result.bipdAmt = 0;
      if (extrasOn('hwy', ['gl']) && result.glAmt == null) result.glAmt = 0;
    }
    var sdet = pickSafetyDetail(safety) || pickSafetyDetail(detail);
    if (sdet) {
      result.safety = sdet.value;
      result.safetyParts = sdet.parts;
      result.safetyDate = sdet.date;
    }
    return result;
  }
  function loadHwyExtras(mc, id, result) {
    if (!id) return Promise.resolve(result);
    if (hwyExtrasInflight[mc]) return hwyExtrasInflight[mc];
    var wantDetail = extrasOn('hwy', ['domain', 'alerts']);
    var wantSafety = extrasOn('hwy', ['safety']);
    var wantConn = extrasOn('hwy', ['connection', 'dnu']);
    var wantIns = extrasOn('hwy', ['cargo', 'bipd', 'gl']);
    if (!result.assessment) wantDetail = true;
    if (!wantDetail && !wantSafety && !wantConn && !wantIns) return Promise.resolve(result);
    var detailUrl = 'https://highway.com/monitor/api/v1/carriers/' + id;
    var safetyUrl = detailUrl + '/safety';
    var jobs = [];
    function runExtra(want, url, slot) {
      if (!want) return;
      jobs.push(
        gmGet(url, mc)
          .then(function (data) {
            var pack = [null, null, null, null];
            pack[slot] = data;
            applyHwyExtraPack(result, pack);
            setCached(mc, result);
            if (mcStore[mc]) {
              mcStore[mc].hwy = result;
              try {
                notifyMc(mc);
              } catch (e) {}
            }
          })
          .catch(function () {
            return null;
          })
      );
    }
    runExtra(wantDetail, detailUrl, 0);
    runExtra(wantSafety, safetyUrl, 1);
    runExtra(wantConn, connectionsUrl(id), 2);
    runExtra(wantIns, insuranceUrl(id), 3);
    hwyExtrasInflight[mc] = Promise.all(jobs)
      .catch(function () {
        return result;
      })
      .then(function () {
        setCached(mc, result);
        delete hwyExtrasInflight[mc];
        return result;
      });
    return hwyExtrasInflight[mc];
  }
  function vehiclesUrl(id, page) {
    return (
      'https://highway.com/monitor/api/v1/carriers/' +
      encodeURIComponent(id) +
      '/vehicles?page=' +
      page +
      '&per_page=100'
    );
  }
  function vehiclesFrom(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    if (Array.isArray(data.vehicles)) return data.vehicles;
    if (Array.isArray(data.carrier_vehicles)) return data.carrier_vehicles;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  }
  function plateFromVehicle(v) {
    if (!v || typeof v !== 'object') return '';
    var lcv = v.latest_carrier_vehicle || v.current_carrier_vehicle || v.carrier_vehicle || v;
    var raw =
      (lcv && (lcv.license_plate_number || lcv.plate_number || lcv.plate)) ||
      v.license_plate_number ||
      v.plate_number ||
      '';
    if (raw && typeof raw === 'object') raw = raw.number || raw.value || '';
    if (!raw && lcv && lcv.license_plate && typeof lcv.license_plate === 'object') {
      raw = lcv.license_plate.number || lcv.license_plate.value || '';
    }
    return String(raw || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }
  function vinFromVehicle(v) {
    if (!v || typeof v !== 'object') return '';
    return String(v.vin || v.VIN || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }
  function kindFromVehicle(v) {
    var t = String((v && (v.is_type || v.type || v.vehicle_type)) || '').toLowerCase();
    if (t === 'trailer' || t.indexOf('trailer') >= 0) return 'trailer';
    if (t === 'power_unit' || t === 'truck' || t === 'tractor' || t.indexOf('power') >= 0) {
      return 'truck';
    }
    return 'other';
  }
  function slimVehicle(v) {
    var plate = plateFromVehicle(v);
    var vin = vinFromVehicle(v);
    if (!plate && !vin) return null;
    return { plate: plate, vin: vin, kind: kindFromVehicle(v) };
  }
  function fetchHwyVehiclePages(mc, id) {
    var all = [];
    var page = 1;
    var maxPages = 15;
    function next() {
      if (page > maxPages) return Promise.resolve(all);
      return gmGet(vehiclesUrl(id, page), mc).then(function (data) {
        var list = vehiclesFrom(data);
        var i;
        for (i = 0; i < list.length; i++) {
          var item = slimVehicle(list[i]);
          if (item) all.push(item);
        }
        page += 1;
        if (!list.length || list.length < 50) return all;
        return next();
      });
    }
    return next();
  }
  function loadHwyVehicles(mc, id, result) {
    if (!id || !result) return Promise.resolve(result);
    if (Array.isArray(result.vehicles) || result.vehiclesFailed) return Promise.resolve(result);
    if (hwyVehiclesInflight[mc]) return hwyVehiclesInflight[mc];
    hwyVehiclesInflight[mc] = fetchHwyVehiclePages(mc, id)
      .then(function (list) {
        result.vehicles = list;
        result.vehiclesFailed = false;
        setCached(mc, result);
        if (mcStore[mc]) {
          mcStore[mc].hwy = result;
          try {
            notifyMc(mc);
          } catch (e) {}
        }
        delete hwyVehiclesInflight[mc];
        return result;
      })
      .catch(function (err) {
        if (err && err.code === 'login') setSessionHwy(false);
        result.vehiclesFailed = true;
        delete hwyVehiclesInflight[mc];
        return result;
      });
    return hwyVehiclesInflight[mc];
  }
  function fetchHwy(mc) {
    return gmGet(searchUrlExact(mc), mc)
      .then(function (data) {
        var best = pickCarrierByMc(data, mc);
        if (best) return best;
        return gmGet(searchUrlPrefix(mc), mc).then(function (data2) {
          return pickCarrierByMc(data2, mc);
        });
      })
      .then(function (best) {
        setSessionHwy(true);
        if (!best) {
          var miss = {
            name: null,
            assessment: 'No MC match',
            fleet: null,
            safety: null,
            alerts: null,
            alertTypes: null,
            cargoAmt: null,
            bipdAmt: null,
            glAmt: null,
            connStatus: '',
            dnu: false,
            emails: [],
            id: null,
            dot: ''
          };
          setCached(mc, miss);
          return miss;
        }
        var result = {
          name: best.legal_name || best.name || null,
          assessment: pickAssessment(best),
          fleet: pickFleet(best),
          safety: pickSafety(best),
          safetyParts: null,
          safetyDate: null,
          alerts: null,
          alertTypes: null,
          cargoAmt: null,
          bipdAmt: null,
          glAmt: null,
          connStatus: null,
          dnu: false,
          emails: [],
          id: best.id || null,
          dot: pickDot(best) || ''
        };
        applyHwyExtras(result, best);
        applyHwyConn(result, best);
        if (best.id) loadHwyExtras(mc, best.id, result);
        setCached(mc, result);
        if (mcStore[mc]) {
          mcStore[mc].hwy = result;
          try {
            notifyMc(mc);
          } catch (e0) {}
        }
        return result;
      })
      .catch(function (err) {
        var login = !!(err && err.code === 'login');
        if (login) setSessionHwy(false);
        return {
          name: null,
          assessment: login ? 'Sign in' : 'Lookup failed',
          login: login,
          fleet: null,
          safety: null,
          alerts: null,
          alertTypes: null,
          cargoAmt: null,
          bipdAmt: null,
          glAmt: null,
          connStatus: null,
          dnu: false,
          emails: [],
          id: null,
          dot: '',
          nocache: true
        };
      });
  }
  function lookupMc(mc, force) {
    if (!force) {
      var cached = getCached(mc);
      if (cached) {
        if (cacheNeedsHwyExtras(cached) && cached.id) loadHwyExtras(mc, cached.id, cached);
        return Promise.resolve(cached);
      }
      if (inflight[mc]) return inflight[mc];
    } else {
      abortHwy(mc);
      delete hwyVehiclesInflight[mc];
    }
    inflight[mc] = new Promise(function (resolve) {
      var mine = inflight[mc];
      function start() {
        hwyActive += 1;
        fetchHwy(mc).then(function (res) {
          hwyActive -= 1;
          if (inflight[mc] === mine) delete inflight[mc];
          resolve(res);
          if (hwyWait.length) hwyWait.shift()();
        });
      }
      if (hwyActive < 2) start();
      else {
        if (hwyWait.length > 6) hwyWait.shift();
        hwyWait.push(start);
      }
    });
    return inflight[mc];
  }

  function pillClass(assessment) {
    var a = String(assessment || '').toLowerCase();
    if (a.indexOf('fail') >= 0 && a.indexOf('lookup') < 0) return 'hwy-mc-fail';
    if (a.indexOf('partial') >= 0) return 'hwy-mc-partial';
    if (a === 'pass') return 'hwy-mc-pass';
    return 'hwy-mc-wait';
  }

  function unitsClass(fleet) {
    if (fleet == null || fleet === '') return 'hwy-mc-wait';
    var n = Number(fleet);
    if (isNaN(n)) return 'hwy-mc-wait';
    return n >= loadThresh().unitsMin ? 'hwy-mc-units-ok' : 'hwy-mc-units-low';
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var fastTipEl = null;
  var fastTipTimer = 0;
  var fastTipAnchor = null;
  function hideFastTip() {
    if (fastTipTimer) {
      clearTimeout(fastTipTimer);
      fastTipTimer = 0;
    }
    if (fastTipEl && fastTipEl.parentNode) fastTipEl.parentNode.removeChild(fastTipEl);
    fastTipEl = null;
    fastTipAnchor = null;
  }
  function tipAnchorStillHot(anchor) {
    var a = anchor || fastTipAnchor;
    if (!a || !a.isConnected) return false;
    try {
      if (a.matches && a.matches(':hover')) return true;
    } catch (e) {}
    return false;
  }
  function showFastTip(anchor, text, delay, force) {
    if (!text || !anchor) return;
    if (fastTipAnchor === anchor && fastTipEl && fastTipEl.textContent === text) return;
    hideFastTip();
    fastTipAnchor = anchor;
    var wait = delay == null ? 0 : delay;
    function place() {
      fastTipTimer = 0;
      if (!anchor || !anchor.isConnected) return;
      if (!force && !tipAnchorStillHot(anchor)) return;
      var r = anchor.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (fastTipEl && fastTipEl.parentNode) fastTipEl.parentNode.removeChild(fastTipEl);
      fastTipEl = el('div', 'ss-fast-tip', text);
      (document.documentElement || document.body).appendChild(fastTipEl);
      var tw = fastTipEl.offsetWidth || 200;
      var th = fastTipEl.offsetHeight || 40;
      var left = r.left;
      if (left + tw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - tw - 8);
      var top = r.top - th - 8;
      if (top < 8) top = r.bottom + 8;
      fastTipEl.style.left = Math.round(left) + 'px';
      fastTipEl.style.top = Math.round(top) + 'px';
    }
    if (wait <= 0) place();
    else fastTipTimer = setTimeout(place, wait);
  }
  function flashCopied(anchor, restoreTip) {
    if (!anchor) return;
    showFastTip(anchor, 'Copied', 0, true);
    setTimeout(function () {
      if (restoreTip && anchor.matches && anchor.matches(':hover')) showFastTip(anchor, restoreTip);
      else hideFastTip();
    }, 1400);
  }
  function bindHoverTip(el, text) {
    if (!el) return el;
    el._ssTip = text || '';
    if (el._ssTipBound) return el;
    el._ssTipBound = true;
    el.addEventListener('mouseenter', function () {
      if (el.classList && el.classList.contains('ss-copied')) return;
      var t = el._ssTip;
      if (typeof t === 'function') t = t();
      if (t) showFastTip(el, t, 0);
    });
    el.addEventListener('mouseleave', hideFastTip);
    return el;
  }
  document.addEventListener(
    'scroll',
    function () {
      if (tipAnchorStillHot()) return;
      hideFastTip();
    },
    true
  );
  function hwyCheckEl() {
    var img = document.createElement('img');
    img.className = 'hwy-check';
    img.src = HWY_CHECK;
    img.alt = '';
    img.width = 13;
    img.height = 13;
    img.draggable = false;
    return img;
  }
  function hwyXEl() {
    var img = document.createElement('img');
    img.className = 'hwy-x';
    img.src = HWY_X;
    img.alt = '';
    img.width = 13;
    img.height = 13;
    img.draggable = false;
    return img;
  }
  function addPill(parent, cls, text, title) {
    var p = el('span', 'hwy-mc-pill ' + cls, text);
    if (title) bindHoverTip(p, title);
    parent.appendChild(p);
    return p;
  }
  function isAlnumChar(c) {
    var code = c.charCodeAt(0);
    return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
  }
  function isPlateSepChar(c) {
    return c === ' ' || c === '-' || c === '.' || c === '\u00a0';
  }
  function findNormHits(text, token) {
    var hits = [];
    var tok = String(token || '').toUpperCase();
    if (!tok || tok.length < 4) return hits;
    var s = String(text || '');
    var i = 0;
    var n = s.length;
    while (i < n) {
      while (i < n && !isAlnumChar(s.charAt(i))) i++;
      if (i >= n) break;
      var start = i;
      var built = '';
      var j = i;
      while (j < n && built.length < tok.length) {
        var ch = s.charAt(j);
        if (isAlnumChar(ch)) {
          built += ch.toUpperCase();
          j++;
        } else if (isPlateSepChar(ch) && built.length) {
          j++;
        } else break;
      }
      if (built === tok) {
        if (start > 0 && isAlnumChar(s.charAt(start - 1))) {
          i = start + 1;
          continue;
        }
        if (j < n && isAlnumChar(s.charAt(j))) {
          i = start + 1;
          continue;
        }
        hits.push({ start: start, end: j });
        i = j;
      } else {
        i = start + 1;
      }
    }
    return hits;
  }
  function findTokenHitsInText(text, tokens) {
    var hits = [];
    var ti;
    for (ti = 0; ti < (tokens || []).length; ti++) {
      var tok = tokens[ti];
      if (!tok) continue;
      var found = findNormHits(text, tok);
      var hi;
      for (hi = 0; hi < found.length; hi++) hits.push(found[hi]);
    }
    hits.sort(function (a, b) {
      return a.start - b.start || b.end - a.end;
    });
    var out = [];
    var lastEnd = 0;
    var i;
    for (i = 0; i < hits.length; i++) {
      if (hits[i].start < lastEnd) continue;
      out.push(hits[i]);
      lastEnd = hits[i].end;
    }
    return out;
  }
  var eqHiState = null;
  function unwrapEquipHi(scope) {
    var root = scope || document;
    if (!root || !root.querySelectorAll) return;
    var marks = root.querySelectorAll('mark.ss-eq-hi');
    var i;
    for (i = 0; i < marks.length; i++) {
      var m = marks[i];
      var p = m.parentNode;
      if (!p) continue;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      p.removeChild(m);
      if (p.normalize) p.normalize();
    }
  }
  function hideEquipHi() {
    eqHiState = null;
    unwrapEquipHi(document);
    document.querySelectorAll('.ss-rate-wrap.ss-eq-hi').forEach(function (n) {
      n.classList.remove('ss-eq-hi', 'ss-eq-hi-pass', 'ss-eq-hi-fail');
    });
  }
  function paintEquipHi() {
    if (!eqHiState || !eqHiState.msg || !eqHiState.msg.isConnected) {
      hideEquipHi();
      return;
    }
    var msg = eqHiState.msg;
    var box =
      (msg.querySelector && (msg.querySelector('div.a3s') || msg.querySelector('div.ii.gt'))) || msg;
    unwrapEquipHi(box);
    var fail = !!eqHiState.fail;
    var vals = eqHiState.vals || [];
    if (!vals.length) return;
    var nodes = collectTextNodes(box);
    var i;
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n || !n.nodeValue || !n.parentNode) continue;
      if (n.parentElement && n.parentElement.closest && n.parentElement.closest('.ss-eq-hi')) continue;
      if (!isShown(n.parentElement || n)) continue;
      var hits = findTokenHitsInText(n.nodeValue, vals);
      if (!hits.length) continue;
      var text = n.nodeValue;
      var parent = n.parentNode;
      var last = 0;
      var frag = document.createDocumentFragment();
      var h;
      for (h = 0; h < hits.length; h++) {
        var hit = hits[h];
        if (hit.start > last) frag.appendChild(document.createTextNode(text.slice(last, hit.start)));
        var mark = document.createElement('mark');
        mark.className = 'ss-eq-hi ' + (fail ? 'ss-eq-hi-fail' : 'ss-eq-hi-pass');
        mark.appendChild(document.createTextNode(text.slice(hit.start, hit.end)));
        frag.appendChild(mark);
        last = hit.end;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      parent.replaceChild(frag, n);
    }
  }
  function showEquipHi(msg, vals, fail) {
    eqHiState = { msg: msg, vals: vals || [], fail: !!fail };
    paintEquipHi();
  }
  function bindEquipHi(pill, msg, spec) {
    if (!pill || !msg || !spec || !spec.vals || !spec.vals.length) return pill;
    if (pill._ssEqBound) return pill;
    pill._ssEqBound = true;
    pill.addEventListener('mouseenter', function () {
      showEquipHi(msg, spec.vals, /hwy-mc-fail/.test(pill.className || ''));
    });
    pill.addEventListener('mouseleave', hideEquipHi);
    return pill;
  }
  function bindRateHi(el, msg, amount) {
    if (!el || !msg || amount == null) return el;
    if (el._ssRateHiBound) return el;
    el._ssRateHiBound = true;
    el.addEventListener('mouseenter', function () {
      var wraps = msg.querySelectorAll('.ss-rate-wrap[data-ss-rate="' + String(amount) + '"]');
      if (wraps.length) {
        hideEquipHi();
        var i;
        for (i = 0; i < wraps.length; i++) {
          wraps[i].classList.add('ss-eq-hi', 'ss-eq-hi-pass');
        }
        eqHiState = { msg: msg, vals: [], fail: false };
        return;
      }
      var amt = String(amount);
      var comma = amt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      showEquipHi(msg, comma === amt ? [amt] : [amt, comma], false);
    });
    el.addEventListener('mouseleave', hideEquipHi);
    return el;
  }
  function paintEquipPill(parent, spec, msg) {
    if (!spec || !spec.text) return;
    var p = addPill(parent, spec.cls, spec.text, spec.title);
    if (spec.check) p.appendChild(hwyCheckEl());
    else if (spec.x) p.appendChild(hwyXEl());
    bindEquipHi(p, msg, spec);
    return p;
  }
  function messageBodyText(msg) {
    if (!msg) return '';
    return unquotedMessageText(messageBodyBox(msg));
  }
  function normPlateToken(s) {
    return String(s || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }
  function looksLikePlateToken(tok, plateWordCue) {
    var p = normPlateToken(tok);
    if (p.length < 4 || p.length > 8) return false;
    if (/^(MC|DOT|US|USDOT)[0-9]+$/.test(p)) return false;
    if (/^(PLATE|PLATES|PLT|PLTS|TAG|TAGS|TRUCK|TRUCKS|TRAILER|TRAILERS|TRLR|TRLRS|TRL|LP)$/.test(p)) {
      return false;
    }
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return true;
    if (plateWordCue && /^[0-9]{4,8}$/.test(p)) return true;
    return false;
  }
  function pushUniqStr(arr, v) {
    if (!v || arr.indexOf(v) >= 0) return;
    arr.push(v);
  }
  function lastWordIndex(text, re) {
    var last = -1;
    var r = new RegExp(re.source, 'g');
    var m;
    while ((m = r.exec(text))) last = m.index;
    return last;
  }
  function plateKindFromLeft(left) {
    var trailerAt = lastWordIndex(left, /\b(?:TRAILERS?|TRLRS?|TRL)\b/);
    var truckAt = lastWordIndex(left, /\b(?:TRUCKS?|TRACTORS?|POWER\s*UNITS?)\b/);
    if (trailerAt < 0 && truckAt < 0) return 'unlabeled';
    if (trailerAt > truckAt) return 'trailer';
    if (truckAt > trailerAt) return 'truck';
    return 'unlabeled';
  }
  function findEquipMentions(text) {
    var raw = String(text || '').replace(/\s+/g, ' ');
    var upper = raw.toUpperCase();
    var truckPlates = [];
    var trailerPlates = [];
    var unlabeledPlates = [];
    var truckVins = [];
    var used = {};
    var m;
    var vinRe = /\b([A-HJ-NPR-Z0-9]{17})\b/g;
    while ((m = vinRe.exec(upper))) {
      var vin = m[1];
      if (!/[A-Z]/.test(vin) || !/[0-9]/.test(vin)) continue;
      pushUniqStr(truckVins, vin);
      var vi;
      for (vi = m.index; vi < m.index + m[0].length; vi++) used[vi] = true;
    }
    var cueRe =
      /\b(?:LICENSE\s*PLATES?|LIC\s*PLATES?|PLATES?|PLTS?|TAGS?|LP|TRUCKS?|TRACTORS?|TRAILERS?|TRLRS?|TRL|POWER\s*UNITS?)\b/g;
    var cues = [];
    while ((m = cueRe.exec(upper))) {
      cues.push({
        start: m.index,
        end: m.index + m[0].length,
        plateWord: /PLATE|PLT|TAG|\bLP\b|LICENSE/.test(m[0])
      });
    }
    var ci;
    for (ci = 0; ci < cues.length; ci++) {
      var cue = cues[ci];
      var from = Math.max(0, cue.start - 12);
      var to = Math.min(upper.length, cue.end + 48);
      var window = upper.slice(from, to);
      var localRe =
        /\b([A-Z]{1,4}[\- ]?[0-9]{2,6}[A-Z]{0,3}|[0-9]{1,3}[A-Z]{1,4}[0-9]{1,4}|[A-Z][A-Z0-9]{3,7}|[0-9]{4,8})\b/g;
      var pm;
      while ((pm = localRe.exec(window))) {
        var abs = from + pm.index;
        if (used[abs]) continue;
        var cand = pm[1] || pm[0];
        if (!looksLikePlateToken(cand, cue.plateWord)) continue;
        var np = normPlateToken(cand);
        var k;
        for (k = abs; k < abs + pm[0].length; k++) used[k] = true;
        var left = upper.slice(Math.max(0, abs - 36), abs);
        var kind = plateKindFromLeft(left);
        if (kind === 'truck') pushUniqStr(truckPlates, np);
        else if (kind === 'trailer') pushUniqStr(trailerPlates, np);
        else pushUniqStr(unlabeledPlates, np);
      }
    }
    return {
      truckPlates: truckPlates,
      trailerPlates: trailerPlates,
      unlabeledPlates: unlabeledPlates,
      truckVins: truckVins,
      any:
        !!(
          truckPlates.length ||
          trailerPlates.length ||
          unlabeledPlates.length ||
          truckVins.length
        )
    };
  }
  function needEquipFetch(found) {
    if (!found || !found.any) return false;
    if (
      (found.truckPlates.length || found.trailerPlates.length || found.unlabeledPlates.length) &&
      extrasOn('hwy', ['truckPlate', 'trailerPlate'])
    ) {
      return true;
    }
    if (found.truckVins.length && extrasOn('hwy', ['truckVin'])) return true;
    return false;
  }
  function ensureHwyVehicles(mc, state) {
    var hwy = state && state.hwy;
    if (!hwy || !hwy.id || hwy.login) return;
    if (Array.isArray(hwy.vehicles) || hwy.vehiclesFailed) return;
    loadHwyVehicles(mc, hwy.id, hwy);
  }
  function anyListed(values, map) {
    var i;
    for (i = 0; i < values.length; i++) {
      if (map[values[i]]) return true;
    }
    return false;
  }
  function equipMatchSpec(ok, text, vals) {
    var spec;
    if (ok) {
      spec = {
        text: text,
        cls: 'hwy-mc-pass',
        title: "On this carrier's Highway equipment list.",
        check: true
      };
    } else {
      spec = {
        text: text,
        cls: 'hwy-mc-fail',
        title: "Not on this carrier's Highway equipment list.",
        x: true
      };
    }
    spec.vals = vals || [];
    return spec;
  }
  function planEquipPills(found, hwy) {
    var out = {};
    if (!found || !found.any || !hwy || !Array.isArray(hwy.vehicles)) return out;
    var truckPlateMap = {};
    var trailerPlateMap = {};
    var truckVinMap = {};
    var i;
    for (i = 0; i < hwy.vehicles.length; i++) {
      var v = hwy.vehicles[i];
      if (!v) continue;
      if (v.plate) {
        if (v.kind === 'trailer') trailerPlateMap[v.plate] = true;
        else truckPlateMap[v.plate] = true;
      }
      if (v.vin && v.kind !== 'trailer') truckVinMap[v.vin] = true;
    }
    var unlabTruck = [];
    var unlabTrailer = [];
    for (i = 0; i < found.unlabeledPlates.length; i++) {
      var p = found.unlabeledPlates[i];
      if (truckPlateMap[p]) unlabTruck.push(p);
      else if (trailerPlateMap[p]) unlabTrailer.push(p);
    }
    var truckWant = found.truckPlates.concat(unlabTruck);
    var trailerWant = found.trailerPlates.concat(unlabTrailer);
    if (truckWant.length) {
      out.truckPlate = equipMatchSpec(anyListed(truckWant, truckPlateMap), 'Truck plate', truckWant);
    }
    if (trailerWant.length) {
      out.trailerPlate = equipMatchSpec(
        anyListed(trailerWant, trailerPlateMap),
        'Trailer plate',
        trailerWant
      );
    }
    if (found.truckVins.length) {
      out.truckVin = equipMatchSpec(anyListed(found.truckVins, truckVinMap), 'Truck VIN', found.truckVins);
    }
    return out;
  }

  function paintHwyPills(hwyHit, state, fromAddr, compact, msg, mc) {
    hwyHit.appendChild(logoImg(HWY_LOGO, 'Highway'));
    if (state.hwy && state.hwy.login) {
      addPill(hwyHit, 'hwy-mc-wait', 'Sign in', 'Sign in to Highway');
      return;
    }
    if (!state.hwy) {
      addPill(hwyHit, 'hwy-mc-wait', '…', 'Looking up Highway. Click the Highway icon to retry.');
      return;
    }
    var found = { any: false };
    var equip = {};
    if (extrasOn('hwy', ['truckPlate', 'trailerPlate', 'truckVin'])) {
      found = findEquipMentions(messageBodyText(msg));
      if (needEquipFetch(found)) ensureHwyVehicles(mc, state);
      equip = planEquipPills(found, state.hwy);
    }
    var order = loadSettings().hwy;
    var i;
    for (i = 0; i < order.length; i++) {
      if (!order[i].on) continue;
      var id = order[i].id;
      if (id === 'assessment') {
        var label = state.hwy.assessment || 'No assessment';
        var aPill = addPill(hwyHit, pillClass(label), compactAssessment(label), label);
        if (isHwyFailLabel(label) && aPill) {
          aPill.className += ' ss-fail-mail';
          aPill.appendChild(mailIcoEl());
          bindHoverTip(aPill, 'Reply: you do not pass Highway');
          aPill.addEventListener('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            openHwyFailDraft(messageRoot(aPill) || msg);
          });
        }
      } else if (id === 'units') {
        addPill(
          hwyHit,
          unitsClass(state.hwy.fleet),
          unitsPillText(state.hwy.fleet),
          'Highway observed power units'
        );
      } else if (id === 'safety') {
        var sVal = state.hwy.safety;
        var sDet = state.hwy.safetyParts
          ? { value: sVal, parts: state.hwy.safetyParts, date: state.hwy.safetyDate }
          : sVal != null
            ? { value: sVal, parts: [], date: null }
            : null;
        addPill(hwyHit, safetyClass(sVal), safetyPillText(sVal), safetyTitle(sDet));
      } else if (id === 'alerts') {
        var ap = alertPill({ count: state.hwy.alerts, types: state.hwy.alertTypes || [] });
        if (ap) addPill(hwyHit, ap.cls, ap.text, ap.title);
      } else if (id === 'cargo') {
        var cp = cargoPill(state.hwy.cargoAmt);
        if (cp) addPill(hwyHit, cp.cls, cp.text, cp.title);
      } else if (id === 'bipd') {
        var bp = bipdPill(state.hwy.bipdAmt);
        if (bp) addPill(hwyHit, bp.cls, bp.text, bp.title);
      } else if (id === 'gl') {
        var gp = glPill(state.hwy.glAmt);
        if (gp) addPill(hwyHit, gp.cls, gp.text, gp.title);
      } else if (id === 'connection') {
        if (connKind(state.hwy.connStatus) === 'connected') {
          addPill(hwyHit, 'hwy-mc-conn', 'Connected', 'Connected with this carrier on Highway');
        } else {
          addPill(
            hwyHit,
            'hwy-mc-noconn',
            'No Connect',
            'Not connected on Highway'
          );
        }
      } else if (id === 'dnu') {
        if (state.hwy.dnu || isDnuStatus(state.hwy.connStatus)) {
          addPill(hwyHit, 'hwy-mc-dnu', 'DNU', 'Highway Do Not Use is on');
        }
      } else if (id === 'domain') {
        var db = domainBadge(fromAddr, state.hwy.emails || []);
        if (db) {
          var dPill = addPill(hwyHit, db.cls, db.text, db.title);
          if (db.check && dPill) dPill.appendChild(hwyCheckEl());
        }
      } else if (id === 'truckPlate') {
        paintEquipPill(hwyHit, equip.truckPlate, msg);
      } else if (id === 'trailerPlate') {
        paintEquipPill(hwyHit, equip.trailerPlate, msg);
      } else if (id === 'truckVin') {
        paintEquipPill(hwyHit, equip.truckVin, msg);
      }
    }
    var hwyLogo = hwyHit.querySelector('.hwy-mc-logo');
    if (hwyLogo) {
      bindHoverTip(
        hwyLogo,
        state.hwy && state.hwy.name ? state.hwy.name + ' (open Highway)' : 'Open Highway'
      );
    }
  }

  function paintC411Pills(c411Hit, state, mc, compact) {
    c411Hit.appendChild(logoImg(C411_LOGO, 'Carrier411'));
    if (!state.fg) {
      addPill(c411Hit, 'hwy-mc-wait', '…', 'Looking up Carrier411');
      return;
    }
    if (state.fg.login) {
      addPill(c411Hit, 'hwy-mc-wait', 'Login', 'Login to Carrier411');
      var loginLogo = c411Hit.querySelector('.hwy-mc-logo');
      if (loginLogo) bindHoverTip(loginLogo, 'Login to Carrier411');
      return;
    }
    if (state.fg.error) {
      addPill(c411Hit, 'hwy-mc-wait', '…', 'Carrier411 lookup did not finish. Click the Carrier411 icon to retry.');
      return;
    }
    var order = loadSettings().c411;
    var i;
    for (i = 0; i < order.length; i++) {
      if (!order[i].on) continue;
      var id = order[i].id;
      if (id === 'fg') {
        if (state.fg.hasFg) {
          var d = compactFgDate(state.fg.date);
          var txt = d ? 'FG ' + d : 'FG';
          addPill(
            c411Hit,
            'hwy-mc-fail',
            txt,
            (state.fg.type || 'FreightGuard') + (state.fg.count > 1 ? ' (' + state.fg.count + ')' : '')
          );
        } else {
          addPill(c411Hit, 'hwy-mc-partial', 'No FG', 'No FreightGuard reports');
        }
      } else if (id === 'rating') {
        var rp = ratingPill(state.fg.rating);
        if (!rp) {
          rp = {
            text: 'NR',
            cls: 'hwy-mc-wait',
            title: 'Carrier411 safety rating not listed yet. Click the badge to open Carrier411.'
          };
        }
        addPill(c411Hit, rp.cls, rp.text, rp.title);
      } else if (id === 'related') {
        if (state.fg.related) {
          addPill(c411Hit, 'hwy-mc-fail', 'Related cos', 'Carrier411: related companies detected');
        }
      } else if (id === 'loss') {
        if (state.fg.loss) {
          addPill(
            c411Hit,
            'hwy-mc-dnu',
            'Freight loss',
            'Carrier411: unjustified loss of freight reported'
          );
        }
      }
    }
    var c411Logo = c411Hit.querySelector('.hwy-mc-logo');
    if (c411Logo) bindHoverTip(c411Logo, 'Open Carrier411 for ' + docketFromMc(mc));
  }

  var mcStore = {};
  function uiMode() {
    var s = loadSettings();
    return s.ui === 'bar' || s.ui === 'inline' ? s.ui : 'both';
  }
  function inQuoted(node) {
    var el = node && node.nodeType === 3 ? node.parentElement : node;
    return !!(el && el.closest && el.closest('.gmail_quote, .gmail_extra, .gmail_attr, blockquote.gmail_quote'));
  }
  function isShown(el) {
    if (!el || !el.getBoundingClientRect) return false;
    if (el.closest && el.closest('[aria-hidden="true"]')) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    try {
      var st = window.getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return false;
    } catch (e) {}
    return true;
  }
  function openThreadRoot() {
    var h2s = document.querySelectorAll('h2.hP');
    var i;
    var h2 = null;
    for (i = 0; i < h2s.length; i++) {
      if (isShown(h2s[i])) {
        h2 = h2s[i];
        break;
      }
    }
    if (!h2) return null;
    var n = h2.parentElement;
    var best = null;
    while (n && n !== document.body) {
      if (n.getAttribute && n.getAttribute('role') === 'main') break;
      var hasMsg =
        n.querySelector &&
        (n.querySelector('.h7') ||
          n.querySelector('.adn.ads') ||
          n.querySelector('div.kv .iA.g6'));
      if (hasMsg) best = n;
      var listRows = n.querySelectorAll && n.querySelectorAll('tr.zA');
      if (listRows && listRows.length > 1) break;
      var other = n.querySelectorAll && n.querySelectorAll('h2.hP');
      if (other && other.length > 1) break;
      n = n.parentElement;
    }
    return best || h2.closest('.nH.a98') || h2.closest('.nH.ao8') || h2.parentElement;
  }
  function hwyPageUrl(mc) {
    var st = mcStore[mc];
    var id = st && st.hwy && st.hwy.id;
    if (id) return 'https://highway.com/broker/carriers/' + encodeURIComponent(id);
    return SEARCH_URL + encodeURIComponent(mc);
  }
  function ensureMc(mc) {
    if (!mcStore[mc]) mcStore[mc] = { hwy: null, fg: null, subs: [], _hwyGen: 0 };
    var st = mcStore[mc];
    if (isPaused()) return st;
    if (!st.hwy) {
      var hit = getCached(mc);
      if (hit) st.hwy = hit;
    }
    if (st.hwy && st.hwy.id && !st.hwy.login && cacheNeedsHwyExtras(st.hwy)) {
      loadHwyExtras(mc, st.hwy.id, st.hwy);
    }
    if (!st.fg) {
      var fgHit = getC411Cached(mc);
      if (fgHit && !fgHit.login && !fgHit.error) st.fg = fgHit;
    }
    if (!st._gotHwy) {
      st._gotHwy = true;
      var gen = st._hwyGen || 0;
      lookupMc(mc).then(function (info) {
        if ((st._hwyGen || 0) !== gen) return;
        if (info && info.login && st.hwy && !st.hwy.login) return;
        if (info && info.nocache && st.hwy && st.hwy.assessment && !st.hwy.login) return;
        st.hwy = info || st.hwy || {};
        notifyMc(mc);
      });
    }
    if (!st._gotFg) {
      st._gotFg = true;
      lookupC411(mc).then(function (fg) {
        if (st.fg && !st.fg.login && !st.fg.error && fg && (fg.login || fg.error)) return;
        st.fg = fg || st.fg || { error: true };
        notifyMc(mc);
      });
    }
    return st;
  }
  function hwyNeedsRetry(hwy) {
    if (!hwy) return true;
    if (hwy.login || hwy.nocache) return true;
    var a = String(hwy.assessment || '').toLowerCase();
    if (!a || a.indexOf('lookup') >= 0) return true;
    return false;
  }
  function openHighway(mc) {
    var url = hwyPageUrl(mc);
    var st = mcStore[mc] || (mcStore[mc] = { hwy: null, fg: null, subs: [], _hwyGen: 0 });
    if (hwyNeedsRetry(st.hwy)) {
      st._hwyGen = (st._hwyGen || 0) + 1;
      var gen = st._hwyGen;
      st._gotHwy = true;
      st.hwy = null;
      notifyMc(mc);
      lookupMc(mc, true).then(function (info) {
        if ((st._hwyGen || 0) !== gen) return;
        st.hwy = info || {};
        notifyMc(mc);
      });
    }
    window.open(url, '_blank', 'noopener');
  }
  var barPaintQueued = false;
  function schedulePaintBar() {
    if (isPaused()) return;
    if (barPaintQueued) return;
    barPaintQueued = true;
    var done = false;
    var kick = function () {
      if (done) return;
      done = true;
      barPaintQueued = false;
      paintBar();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(kick);
    setTimeout(kick, 48);
  }
  function notifyMc(mc) {
    if (isPaused()) return;
    var st = mcStore[mc];
    if (!st) return;
    (st.subs || []).forEach(function (fn) {
      try {
        fn();
      } catch (e) {}
    });
    schedulePaintBar();
  }
  function messageRoot(node) {
    if (!node || !node.closest) return null;
    return (
      node.closest('.h7') ||
      node.closest('div.kv') ||
      node.closest('.adn') ||
      node.closest('.adf') ||
      node.closest('.gs')
    );
  }
  function inInboxList(el) {
    return !!(el && el.closest && el.closest('tr.zA'));
  }
  function messageBodyBox(msg) {
    if (!msg || !msg.querySelector) return msg;
    return (
      msg.querySelector('div.a3s') ||
      msg.querySelector('div.ii.gt') ||
      msg.querySelector('.iA.g6') ||
      msg
    );
  }
  function messageFromAddr(msg) {
    if (!msg || !msg.querySelector) return '';
    var em =
      msg.querySelector('.gE span.gD[email]') ||
      msg.querySelector('span.gD[email]') ||
      msg.querySelector('span[email].g2') ||
      msg.querySelector('[email].gD');
    if (em) {
      var v = em.getAttribute('email') || em.getAttribute('data-hovercard-id') || '';
      if (v.indexOf('@') >= 0) return v;
    }
    var go = msg.querySelector('.gE span.go, span.go');
    if (go && /@/.test(go.textContent || '')) return go.textContent;
    return '';
  }
  function emailsInMessage(msg, unquotedOnly) {
    var box =
      (msg &&
        msg.querySelector &&
        (msg.querySelector('div.a3s') || msg.querySelector('div.ii.gt'))) ||
      msg;
    if (!box) return [];
    var found = [];
    function add(v) {
      var e = normEmail(v);
      if (!e || found.indexOf(e) >= 0 || isSkipCarrierAddr(e)) return;
      found.push(e);
    }
    var links = box.querySelectorAll ? box.querySelectorAll('a[href^="mailto:"]') : [];
    var i;
    for (i = 0; i < links.length; i++) {
      if (
        unquotedOnly &&
        links[i].closest &&
        links[i].closest('.gmail_quote, .gmail_extra, .gmail_attr')
      ) {
        continue;
      }
      add((links[i].getAttribute('href') || '').replace(/^mailto:/i, ''));
    }
    var text = '';
    if (unquotedOnly && box.querySelector) {
      var walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT, null);
      while (walker.nextNode()) {
        var p = walker.currentNode.parentElement;
        if (p && p.closest && p.closest('.gmail_quote, .gmail_extra, .gmail_attr')) continue;
        text += walker.currentNode.nodeValue + ' ';
      }
    } else {
      text = String(box.innerText || box.textContent || '');
    }
    var plain = text.match(/[a-z0-9._%+\-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
    for (i = 0; i < plain.length; i++) add(plain[i]);
    return found;
  }
  function collectMessageCarrierAddrs(node) {
    var msg = messageRoot(node);
    var out = [];
    function push(v) {
      var e = normEmail(v);
      if (!e || isSkipCarrierAddr(e) || out.indexOf(e) >= 0) return;
      out.push(e);
    }
    if (msg) {
      push(messageFromAddr(msg));
      var unq = emailsInMessage(msg, true);
      var all = emailsInMessage(msg, false);
      var i;
      for (i = 0; i < unq.length; i++) push(unq[i]);
      for (i = 0; i < all.length; i++) push(all[i]);
    }
    return out;
  }
  function threadCarrierAddr(wrap) {
    var cands = collectMessageCarrierAddrs(wrap);
    return cands[0] || '';
  }
  function gmailHeaderFromNode(node) {
    return messageFromAddr(messageRoot(node) || node);
  }
  function stripChips(wrap) {
    if (!wrap) return;
    var mc = wrap.getAttribute('data-hwy-mc');
    var st = mc && mcStore[mc];
    if (st && st.subs && wrap._ssPaint) {
      var drop = st.subs.indexOf(wrap._ssPaint);
      if (drop >= 0) st.subs.splice(drop, 1);
    }
    var badges = wrap.querySelector('.hwy-mc-badges');
    if (badges && badges.parentNode) badges.parentNode.removeChild(badges);
    wrap.setAttribute('data-ss-full', '0');
    wrap._ssHasChips = false;
    wrap._ssPaint = function () {};
    wrap._ssRefreshExtras = function () {};
  }
  function bindChipPaint(wrap, mc) {
    if (!wrap || !mc) return;
    if (wrap._ssHasChips && wrap.querySelector('.hwy-mc-badges')) {
      wrap._ssPaint();
      return;
    }
    var badges = wrap.querySelector('.hwy-mc-badges');
    if (!badges) {
      badges = el('span', 'hwy-mc-badges');
      badges.appendChild(el('span', 'hwy-mc-box'));
      badges.appendChild(el('span', 'hwy-mc-box'));
      wrap.appendChild(badges);
    }
    var boxes = wrap.querySelectorAll('.hwy-mc-badges .hwy-mc-box');
    var hwyBox = boxes[0];
    var c411Box = boxes[1];
    if (!hwyBox || !c411Box) return;
    var st = ensureMc(mc);
    function openHwy(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      openHighway(mc);
    }
    function openC411(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      markC411Clicked(mc);
      if (!st.fg || st.fg.login || st.fg.error) {
        st._gotFg = false;
        st.fg = null;
        ensureMc(mc);
      }
      var url = C411_URL + encodeURIComponent(docketFromMc(mc));
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    function paint() {
      while (hwyBox.firstChild) hwyBox.removeChild(hwyBox.firstChild);
      while (c411Box.firstChild) c411Box.removeChild(c411Box.firstChild);
      var hwyHit = el('span', 'hwy-mc-hit');
      hwyHit.addEventListener('click', openHwy);
      paintHwyPills(hwyHit, st, threadCarrierAddr(wrap), false, messageRoot(wrap), mc);
      hwyBox.appendChild(hwyHit);
      var c411Hit = el('span', 'hwy-c411-hit');
      c411Hit.addEventListener('click', openC411);
      paintC411Pills(c411Hit, st, mc, false);
      c411Box.appendChild(c411Hit);
    }
    var stSubs = st.subs;
    if (wrap._ssPaint && stSubs) {
      var drop = stSubs.indexOf(wrap._ssPaint);
      if (drop >= 0) stSubs.splice(drop, 1);
    }
    wrap._ssHasChips = true;
    wrap._ssPaint = paint;
    wrap._ssApplyC411 = function (fg) {
      if (!fg) return;
      if (st.fg && !st.fg.login && !st.fg.error && (fg.login || fg.error)) return;
      st.fg = fg;
      paint();
      schedulePaintBar();
    };
    wrap._ssRefreshExtras = function () {
      paint();
      schedulePaintBar();
    };
    wrap._ssHeaderFrom = function () {
      return gmailHeaderFromNode(wrap);
    };
    if (st.subs.indexOf(paint) < 0) st.subs.push(paint);
    wrap.setAttribute('data-ss-full', '1');
    paint();
  }
  function wrapsInOpenMail(root) {
    var out = [];
    var seenNode = [];
    function addAll(host) {
      if (!host || !host.querySelectorAll) return;
      var list = host.querySelectorAll('.hwy-mc-wrap');
      var i;
      for (i = 0; i < list.length; i++) {
        if (seenNode.indexOf(list[i]) >= 0) continue;
        seenNode.push(list[i]);
        out.push(list[i]);
      }
    }
    if (!root) return out;
    addAll(root.querySelector('h2.hP'));
    var msgs = expandedMessages(root);
    var j;
    for (j = 0; j < msgs.length; j++) addAll(msgs[j]);
    return out;
  }
  function applyUiMode() {
    if (isPaused()) return;
    var mode = uiMode();
    var root = openThreadRoot();
    var wraps = wrapsInOpenMail(root);
    var seen = {};
    var i;
    for (i = 0; i < wraps.length; i++) {
      var w = wraps[i];
      var mc = w.getAttribute('data-hwy-mc');
      if (!mc) continue;
      ensureMc(mc);
      if (mode === 'bar') {
        stripChips(w);
        continue;
      }
      var first = !seen[mc];
      seen[mc] = true;
      if (mode === 'inline' || first) bindChipPaint(w, mc);
      else stripChips(w);
    }
    schedulePaintBar();
  }
  function makeWrap(fullMatch, mc, opts) {
    opts = opts || {};
    var wrap = el('span', 'hwy-mc-wrap');
    wrap.setAttribute('data-hwy-mc', mc);
    wrap.setAttribute('data-ss-full', '0');
    if (opts.quoted) wrap.setAttribute('data-ss-quoted', '1');

    var a = el('span', 'hwy-mc-link', fullMatch);
    bindHoverTip(a, 'Copy MC');
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      clipText(copyMcText(mc));
      flashCopied(a, 'Copy MC');
    });
    wrap.appendChild(a);
    wrap._ssHeaderFrom = function () {
      return gmailHeaderFromNode(wrap);
    };
    wrap._ssPaint = function () {};
    wrap._ssApplyC411 = function () {};
    wrap._ssRefreshExtras = function () {};
    ensureMc(mc);
    var mode = uiMode();
    if (mode !== 'bar') {
      var scope = openThreadRoot() || document;
      var first = !scope.querySelector('.hwy-mc-wrap[data-ss-full="1"][data-hwy-mc="' + mc + '"]');
      if (mode === 'inline' || first) bindChipPaint(wrap, mc);
    }
    return wrap;
  }

  function riskClass(st, fromAddr) {
    if (!st) return 'ss-warn';
    var hwy = st.hwy || {};
    var fg = st.fg || {};
    if (hwy.dnu || isDnuStatus(hwy.connStatus)) return 'ss-risk';
    var a = String(hwy.assessment || '').toLowerCase();
    if (a.indexOf('fail') >= 0 && a.indexOf('lookup') < 0) return 'ss-risk';
    if (hwy.alerts > 0) return 'ss-risk';
    if (fg && fg.hasFg) return 'ss-risk';
    if (fg && fg.loss && extrasOn('c411', ['loss'])) return 'ss-risk';
    var db = domainBadge(fromAddr, hwy.emails || []);
    if (db && db.cls === 'hwy-mc-fail') return 'ss-risk';
    if (a.indexOf('partial') >= 0 || connKind(hwy.connStatus) !== 'connected') return 'ss-warn';
    if (a === 'pass' && fg && fg.ok && !fg.hasFg) return 'ss-ok';
    return 'ss-warn';
  }

  function dropNode(n) {
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }
  function isExpandedMsg(msg) {
    if (!msg || !msg.querySelector) return false;
    var body = msg.querySelector('div.a3s, div.ii.gt');
    if (body && isShown(body)) return true;
    if (msg.classList && (msg.classList.contains('kv') || msg.classList.contains('kQ'))) return false;
    return false;
  }
  function expandedMessages(root) {
    if (!root || !root.querySelectorAll) return [];
    var out = [];
    var list = root.querySelectorAll('.h7, div.kv');
    var i;
    for (i = 0; i < list.length; i++) {
      if (isExpandedMsg(list[i])) out.push(list[i]);
    }
    if (out.length) return out;
    list = root.querySelectorAll('.adn.ads');
    for (i = 0; i < list.length; i++) {
      if (isShown(list[i])) out.push(list[i]);
    }
    if (out.length) return out;
    list = root.querySelectorAll('.h7');
    if (list.length) return [list[list.length - 1]];
    list = root.querySelectorAll('.adn.ads');
    if (list.length) return [list[list.length - 1]];
    return out;
  }
  function threadMessageNodes(root) {
    if (!root || !root.querySelectorAll) return [];
    var list = root.querySelectorAll('.h7, div.kv');
    var n = list.length;
    var start = n > 80 ? n - 80 : 0;
    var out = [];
    var i;
    for (i = start; i < n; i++) {
      var msg = list[i];
      if (inInboxList(msg)) continue;
      if (msg.classList && msg.classList.contains('kv')) {
        if (
          !(
            msg.querySelector &&
            (msg.querySelector('.iA.g6') || msg.querySelector('[email], span.gD'))
          )
        ) {
          continue;
        }
      }
      out.push(msg);
    }
    return out;
  }
  function msgInViewport(msg) {
    if (!msg || !msg.getBoundingClientRect) return false;
    var r = msg.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    return r.bottom > -80 && r.top < vh + 80 && r.height > 0;
  }
  function hotMessages(root) {
    var exp = expandedMessages(root);
    var all = threadMessageNodes(root);
    var pick = [];
    var seen = [];
    function add(m) {
      if (!m || seen.indexOf(m) >= 0) return;
      seen.push(m);
      pick.push(m);
    }
    var i;
    if (exp.length) add(exp[exp.length - 1]);
    else if (all.length) add(all[all.length - 1]);
    for (i = 0; i < exp.length; i++) {
      if (msgInViewport(exp[i])) add(exp[i]);
    }
    return pick;
  }
  function collapsedSnippetBox(msg) {
    if (!msg || !msg.querySelector) return null;
    return msg.querySelector('.iA.g6') || msg.querySelector('.g6') || null;
  }
  function collapsedSnippetText(msg) {
    var snip = collapsedSnippetBox(msg);
    var t = '';
    try {
      t = String((snip && snip.textContent) || (msg && msg.textContent) || '').slice(0, 2500);
    } catch (eSnip) {}
    return t;
  }
  function collapsedHasMc(msg) {
    if (!msg || isExpandedMsg(msg)) return false;
    var t = collapsedSnippetText(msg);
    return MC_TEST.test(t) || MC_AFTER_TEST.test(t);
  }
  function collapsedHasRate(msg) {
    if (!msg || isExpandedMsg(msg)) return false;
    var t = collapsedSnippetText(msg);
    if (findRateMatches(t).length) return true;
    return bareRateInText(t) != null;
  }
  function threadScanMessages(root) {
    var hot = hotMessages(root);
    var exp = expandedMessages(root);
    var i;
    for (i = 0; i < exp.length; i++) {
      if (hot.indexOf(exp[i]) >= 0) continue;
      if (exp[i].querySelector && exp[i].querySelector('.hwy-mc-wrap, .ss-intel-msg, [data-ss-scanned="1"]')) {
        hot.push(exp[i]);
      }
    }
    var all = threadMessageNodes(root);
    for (i = 0; i < all.length; i++) {
      if (hot.indexOf(all[i]) >= 0) continue;
      if (isExpandedMsg(all[i])) continue;
      if (
        (all[i].querySelector && all[i].querySelector('.hwy-mc-wrap, .ss-intel-msg, .ss-rate-wrap')) ||
        collapsedHasMc(all[i]) ||
        collapsedHasRate(all[i])
      ) {
        hot.push(all[i]);
      }
    }
    return hot;
  }
  function nodeInScanMessages(node, msgs) {
    if (!node || !msgs || !msgs.length) return true;
    var msg =
      (node.closest &&
        (node.closest('.h7') || node.closest('div.kv') || node.closest('.adn'))) ||
      null;
    if (!msg && node.classList && node.classList.contains('hP')) return true;
    if (!msg) return false;
    return msgs.indexOf(msg) >= 0;
  }
  var idleQueue = [];
  var idleHandle = 0;
  function cancelIdleDrain() {
    if (!idleHandle) return;
    try {
      if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idleHandle);
    } catch (e1) {}
    try {
      clearTimeout(idleHandle);
    } catch (e2) {}
    idleHandle = 0;
  }
  function enqueueIdleMsg(msg) {
    if (!msg || !msg.isConnected) return;
    if (msg.getAttribute && msg.getAttribute('data-ss-scanned') === '1') return;
    if (idleQueue.indexOf(msg) >= 0) return;
    idleQueue.push(msg);
    scheduleIdleDrain();
  }
  function scheduleIdleDrain() {
    if (isPaused() || idleHandle || !idleQueue.length) return;
    var kick = function () {
      idleHandle = 0;
      drainIdleScan();
    };
    if (typeof requestIdleCallback === 'function') {
      idleHandle = requestIdleCallback(kick, { timeout: 800 });
    } else {
      idleHandle = setTimeout(kick, 200);
    }
  }
  function drainIdleScan() {
    if (isPaused()) {
      idleQueue = [];
      return;
    }
    if (scanning) {
      scheduleIdleDrain();
      return;
    }
    var msg = null;
    while (idleQueue.length && !msg) {
      msg = idleQueue.shift();
      if (!msg || !msg.isConnected) msg = null;
    }
    if (!msg) return;
    scanning = true;
    try {
      obs.disconnect();
      processOneMessage(msg);
      applyUiMode();
    } catch (eIdle) {
    } finally {
      scanning = false;
      armObserver();
    }
    if (idleQueue.length) scheduleIdleDrain();
  }
  function processOneMessage(msg) {
    if (!msg) return;
    var scopes = [];
    function add(node) {
      if (!node) return;
      if (node.closest && node.closest('tr.zA, .ss-intel-msg, #ss-intel-bar, .hwy-mc-wrap, mark.ss-eq-hi')) return;
      if (scopes.indexOf(node) >= 0) return;
      scopes.push(node);
    }
    if (msg.querySelectorAll) {
      var bodies = msg.querySelectorAll('div.a3s, div.ii.gt');
      var b;
      for (b = 0; b < bodies.length; b++) {
        if (!isShown(bodies[b])) continue;
        add(bodies[b]);
      }
      if (!isExpandedMsg(msg)) {
        var snip = collapsedSnippetBox(msg);
        if (snip) add(snip);
      }
    }
    var i;
    for (i = 0; i < scopes.length; i++) processScope(scopes[i]);
    for (i = 0; i < scopes.length; i++) wrapRatesInScope(scopes[i]);
  }
  function headerColCount(acz) {
    if (!acz) return 4;
    var n = 0;
    var i;
    var cells = acz.children;
    for (i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var tag = cell.tagName;
      if (tag !== 'TD' && tag !== 'TH') continue;
      n += Number(cell.colSpan) || 1;
    }
    return n || 4;
  }
  function messageHeaderHost(msg) {
    if (!msg || !msg.querySelector) return null;
    var acz = msg.querySelector('tr.acZ');
    var table =
      (acz && acz.closest && acz.closest('table')) ||
      msg.querySelector('.gE table.cf.gJ') ||
      msg.querySelector('table.cf.gJ');
    if (table) {
      if (!acz) acz = table.querySelector('tr.acZ') || table.querySelector('tbody > tr, tr');
      var cols = headerColCount(acz);
      var tr = table.querySelector('tr.ss-intel-tr');
      if (!tr) {
        tr = document.createElement('tr');
        tr.className = 'ss-intel-tr';
        var td = document.createElement('td');
        td.colSpan = cols;
        tr.appendChild(td);
        var parent = (acz && acz.parentNode) || table.tBodies[0] || table;
        if (acz && acz.nextSibling) parent.insertBefore(tr, acz.nextSibling);
        else parent.appendChild(tr);
      } else if (tr.firstChild) {
        tr.firstChild.colSpan = cols;
      }
      var host = tr.firstChild;
      try {
        var winW = window.innerWidth || 0;
        var needPad =
          host &&
          host.style &&
          (host.getAttribute('data-ss-w') !== String(winW) || !host.style.getPropertyValue('--ss-time-pad'));
        if (needPad) {
          var alignEl =
            (acz &&
              (acz.querySelector('[aria-label*="More message" i]') ||
                acz.querySelector('td.gH.acX'))) ||
            table;
          var tableRight = table.getBoundingClientRect().right;
          var alignRight = alignEl.getBoundingClientRect().right;
          var pad = Math.round(tableRight - alignRight);
          if (pad < 0 || pad > 80) pad = 0;
          host.style.setProperty('--ss-time-pad', pad + 'px');
          host.setAttribute('data-ss-w', String(winW));
        }
      } catch (ePad) {}
      return host;
    }
    return msg.querySelector('.gE') || msg.querySelector('tr.acZ') || msg;
  }
  function wrapIsQuoted(w) {
    if (!w) return false;
    if (w.getAttribute && w.getAttribute('data-ss-quoted') === '1') return true;
    return inQuoted(w);
  }
  function mcsInMessage(msg, unquotedOnly) {
    var seen = {};
    var out = [];
    if (!msg || !msg.querySelectorAll) return out;
    msg.querySelectorAll('.hwy-mc-wrap[data-hwy-mc]').forEach(function (w) {
      var mc = w.getAttribute('data-hwy-mc');
      if (!mc || seen[mc] || shouldIgnore(mc)) return;
      if (unquotedOnly && wrapIsQuoted(w)) return;
      seen[mc] = true;
      out.push(mc);
    });
    return out;
  }
  function emailsFromAttr(el) {
    var out = [];
    function add(v) {
      var e = normEmail(v);
      if (!e || out.indexOf(e) >= 0) return;
      out.push(e);
    }
    if (!el) return out;
    var nodes = el.querySelectorAll ? el.querySelectorAll('[email], a[href^="mailto:"]') : [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      add(nodes[i].getAttribute('email') || (nodes[i].getAttribute('href') || '').replace(/^mailto:/i, ''));
    }
    var plain = String(el.textContent || '').match(/[a-z0-9._%+\-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
    for (i = 0; i < plain.length; i++) add(plain[i]);
    return out;
  }
  function attrEmailForNode(node) {
    var q = node && node.closest && node.closest('.gmail_quote, .gmail_extra, blockquote');
    while (q) {
      var attr =
        (q.querySelector && (q.querySelector(':scope > .gmail_attr') || q.querySelector('.gmail_attr'))) ||
        null;
      var emails = emailsFromAttr(attr);
      if (emails.length) return emails[0];
      q = q.parentElement && q.parentElement.closest && q.parentElement.closest('.gmail_quote, .gmail_extra, blockquote');
    }
    return '';
  }
  function messageRecipientAddrs(msg) {
    var from = normEmail(messageFromAddr(msg));
    var out = [];
    if (!msg || !msg.querySelectorAll) return out;
    var nodes = msg.querySelectorAll('.gE [email], .hb [email], span.g2[email], span.gD[email]');
    var i;
    for (i = 0; i < nodes.length; i++) {
      var e = normEmail(nodes[i].getAttribute('email') || nodes[i].getAttribute('data-hovercard-id') || '');
      if (!e || e === from || out.indexOf(e) >= 0) continue;
      out.push(e);
    }
    return out;
  }
  function nonTeamRecipients(msg) {
    var recips = [];
    var list = messageRecipientAddrs(msg);
    var i;
    for (i = 0; i < list.length; i++) {
      if (isSelfOrCoworkerAddr(list[i]) || isBoardOrSystemAddr(list[i])) continue;
      recips.push(list[i]);
    }
    return recips;
  }
  function mcsForSingleKnownRecipient(msg, tid) {
    var recips = nonTeamRecipients(msg);
    if (recips.length !== 1) return [];
    return assignedMcsForAddr(recips[0], tid);
  }
  function mcsFromMessageText(msg) {
    var hits = findMcMatches(unquotedMessageText(messageBodyBox(msg)));
    var out = [];
    var i;
    for (i = 0; i < hits.length; i++) {
      if (!hits[i].mc || out.indexOf(hits[i].mc) >= 0) continue;
      out.push(hits[i].mc);
    }
    return out;
  }
  function barMcsForMessage(msg) {
    var from = messageFromAddr(msg);
    var own = mcsInMessage(msg, true);
    if (!own.length) own = mcsFromMessageText(msg);
    var tid = gmailThreadId(openThreadRoot() || msg);
    if (isSelfOrCoworkerAddr(from)) return uniqMcs(own.concat(mcsForSingleKnownRecipient(msg, tid)));
    return uniqMcs(own.concat(assignedMcsForAddr(from, tid)));
  }
  function learnMcsFromThread(root) {
    if (!root || !root.querySelectorAll) return;
    var tid = gmailThreadId(root);
    if (!tid) return;
    var fromUnquoted = {};
    var fromQuoted = {};
    function addMap(map, addr, mc) {
      var e = normEmail(addr);
      if (!e || isSkipCarrierAddr(e) || !mc || shouldIgnore(mc)) return;
      if (!map[e]) map[e] = [];
      if (map[e].indexOf(mc) < 0) map[e].push(mc);
    }
    var msgs = threadScanMessages(root);
    var i;
    for (i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      var from = messageFromAddr(msg);
      var unq = mcsInMessage(msg, true);
      var u;
      for (u = 0; u < unq.length; u++) addMap(fromUnquoted, from, unq[u]);
      if (from && !unq.length) {
        var hits = findMcMatches(unquotedMessageText(msg.querySelector('div.a3s') || msg.querySelector('div.ii.gt') || msg));
        for (u = 0; u < hits.length; u++) addMap(fromUnquoted, from, hits[u].mc);
      }
      if (isSelfOrCoworkerAddr(from) && unq.length) {
        var recips = nonTeamRecipients(msg);
        if (recips.length === 1) {
          for (u = 0; u < unq.length; u++) addMap(fromUnquoted, recips[0], unq[u]);
        }
      }
    }
    var wraps = root.querySelectorAll('.hwy-mc-wrap[data-hwy-mc]');
    for (i = 0; i < wraps.length; i++) {
      var w = wraps[i];
      if (!wrapIsQuoted(w)) continue;
      var mc = w.getAttribute('data-hwy-mc');
      var who = attrEmailForNode(w);
      if (who) addMap(fromQuoted, who, mc);
    }
    Object.keys(fromQuoted).forEach(function (e) {
      if (!fromUnquoted[e]) rememberAddrMc(e, fromQuoted[e], tid);
    });
    Object.keys(fromUnquoted).forEach(function (e) {
      rememberAddrMc(e, fromUnquoted[e], tid);
    });
  }
  function svgEl(name, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', name);
    var k;
    for (k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    }
    return n;
  }
  function mailIcoEl() {
    var svg = svgEl('svg', {
      viewBox: '0 0 24 24',
      width: '16',
      height: '16',
      class: 'ss-fail-mail-ico'
    });
    var g = svgEl('g', { transform: 'translate(1.4,3) scale(0.0414)' });
    g.appendChild(
      svgEl('path', {
        fill: '#fff',
        stroke: '#9B1B30',
        'stroke-width': '22',
        'stroke-linejoin': 'round',
        d:
          'M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z'
      })
    );
    svg.appendChild(g);
    return svg;
  }
  function tapEl(el) {
    if (!el) return false;
    try {
      el.focus();
    } catch (e) {}
    try {
      el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, view: window, button: 0 }));
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0 }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0 }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, button: 0 }));
    } catch (e2) {}
    try {
      el.click();
    } catch (e3) {}
    return true;
  }
  function findReplyForMessage(msg) {
    if (!msg || !msg.querySelectorAll) return null;
    var host =
      (msg.closest && (msg.closest('.h7') || msg.closest('div.kv') || msg.closest('.adn') || msg.closest('.adf'))) ||
      msg;
    if (!host.querySelectorAll) host = msg;
    var allBtn = null;
    var replyBtn = null;
    var nodes = host.querySelectorAll('[aria-label]');
    var i;
    for (i = 0; i < nodes.length; i++) {
      var lab = String(nodes[i].getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      if (/^reply to all$/i.test(lab)) allBtn = nodes[i];
      else if (/^reply$/i.test(lab)) replyBtn = nodes[i];
    }
    return allBtn || replyBtn;
  }
  function fillGmailCompose(text, tries) {
    tries = tries || 0;
    if (tries > 20) return;
    var box =
      document.querySelector('div[aria-label="Message Body"]') ||
      document.querySelector('div[aria-label="Message body"]') ||
      document.querySelector('div.Am.Al[contenteditable="true"]') ||
      document.querySelector('div.editable[contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"][g_editable="true"]');
    if (!box) {
      setTimeout(function () {
        fillGmailCompose(text, tries + 1);
      }, 140);
      return;
    }
    if (tries < 3) {
      setTimeout(function () {
        fillGmailCompose(text, tries + 1);
      }, 140);
      return;
    }
    if (box.getAttribute && box.getAttribute('data-ss-fail-filled') === '1') return;
    function prependFail() {
      var n = document.createElement('div');
      n.textContent = text;
      var sig = box.querySelector(
        '.gmail_signature, .gmail_signature_prefix, .gmail_quote, blockquote.gmail_quote'
      );
      if (sig) box.insertBefore(n, sig);
      else box.insertBefore(n, box.firstChild);
      var gap = document.createElement('div');
      gap.appendChild(document.createElement('br'));
      if (n.nextSibling) box.insertBefore(gap, n.nextSibling);
      else box.appendChild(gap);
    }
    try {
      if (box.setAttribute) box.setAttribute('data-ss-fail-filled', '1');
      box.focus();
      var range = document.createRange();
      range.selectNodeContents(box);
      range.collapse(true);
      var sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      if (document.execCommand) document.execCommand('insertText', false, text + '\n\n');
      else prependFail();
    } catch (e) {
      try {
        prependFail();
      } catch (e2) {}
    }
  }
  function openHwyFailDraft(msg) {
    msg = messageRoot(msg) || msg;
    var btn = findReplyForMessage(msg);
    tapEl(btn);
    fillGmailCompose(HWY_FAIL_REPLY, 0);
  }
  function copyIconBtn(hoverLabel) {
    var tip = hoverLabel || 'Copy';
    var b = el('button', 'ss-copy-btn');
    b.type = 'button';
    b.setAttribute('aria-label', tip);
    b._ssTip = tip;
    var svg = svgEl('svg', {
      viewBox: '0 0 24 24',
      width: '14',
      height: '14',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    });
    svg.appendChild(
      svgEl('rect', { x: '8', y: '8', width: '13', height: '13', rx: '2' })
    );
    svg.appendChild(
      svgEl('path', { d: 'M16 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2' })
    );
    b.appendChild(svg);
    bindHoverTip(b, tip);
    return b;
  }
  function flashCopyBtn(btn, hoverLabel) {
    if (!btn) return;
    btn.classList.add('ss-copied');
    flashCopied(btn, hoverLabel || btn._ssTip || 'Copy');
    setTimeout(function () {
      btn.classList.remove('ss-copied');
    }, 1400);
  }
  function copyCarrierToClipboard(name, mc, dot, btn) {
    clipText(carrierClipboardText(name, mc, dot));
    flashCopyBtn(btn, 'Copy Carrier + MC/DOT');
  }
  function buildMsgCard(msg, mc, rateAmt) {
    var st = ensureMc(mc);
    var wrapForMc = msg.querySelector('.hwy-mc-wrap[data-hwy-mc="' + mc + '"]');
    var fromAddr = threadCarrierAddr(wrapForMc || msg);
    var card = el('div', 'ss-intel-card ' + riskClass(st, fromAddr));
    card.setAttribute('data-ss-mc', mc);
    var head = el('span', 'ss-intel-row');
    var name = (st.hwy && st.hwy.name) || 'MC ' + mc;
    head.appendChild(el('span', 'ss-intel-name', name));
    var copyBtn = copyIconBtn('Copy Carrier + MC/DOT');
    copyBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var cur = ensureMc(mc);
      copyCarrierToClipboard(
        (cur.hwy && cur.hwy.name) || 'MC ' + mc,
        mc,
        cur.hwy && cur.hwy.dot,
        copyBtn
      );
    });
    head.appendChild(copyBtn);
    head.appendChild(el('span', 'ss-intel-mc', 'MC ' + mc));
    var mcCopy = copyIconBtn('Copy MC');
    mcCopy.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      clipText(copyMcText(mc));
      flashCopyBtn(mcCopy, 'Copy MC');
    });
    head.appendChild(mcCopy);
    if (rateAmt != null) {
      var rateEl = el('span', 'ss-intel-rate', formatUsdAmount(rateAmt));
      rateEl.setAttribute('data-ss-rate', String(rateAmt));
      bindRateHi(rateEl, msg, rateAmt);
      head.appendChild(rateEl);
      var rateCopy = copyIconBtn('Copy MC and Rate');
      rateCopy.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        clipText(copyMcRateText(mc, rateAmt));
        flashCopyBtn(rateCopy, 'Copy MC and Rate');
      });
      head.appendChild(rateCopy);
    }
    if (st.hwy && (st.hwy.dnu || isDnuStatus(st.hwy.connStatus)) && st.hwy.dnuNote) {
      head.appendChild(el('span', 'ss-intel-note', 'DNU: ' + st.hwy.dnuNote));
    }
    card.appendChild(head);
    var pills = el('span', 'ss-intel-pills');
    var hwyHit = el('span', 'hwy-mc-hit');
    hwyHit.addEventListener('click', function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest('.ss-fail-mail')) return;
      ev.preventDefault();
      ev.stopPropagation();
      openHighway(mc);
    });
    paintHwyPills(hwyHit, st, fromAddr, false, msg, mc);
    pills.appendChild(hwyHit);
    var c411Hit = el('span', 'hwy-c411-hit');
    c411Hit.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      markC411Clicked(mc);
      window.open(C411_URL + encodeURIComponent(docketFromMc(mc)), '_blank', 'noopener,noreferrer');
    });
    paintC411Pills(c411Hit, st, mc, false);
    pills.appendChild(c411Hit);
    card.appendChild(pills);
    return card;
  }
  function uniqMcs(mcs) {
    var out = [];
    var seen = {};
    var i;
    for (i = 0; i < (mcs || []).length; i++) {
      var mc = mcs[i];
      if (!mc || seen[mc]) continue;
      seen[mc] = true;
      out.push(mc);
    }
    return out;
  }
  function cardStateSig(mc, msg, rateAmt) {
    var st = mcStore[mc] || {};
    var hwy = st.hwy || {};
    var fg = st.fg || {};
    var found = { truckPlates: [], trailerPlates: [], truckVins: [] };
    if (extrasOn('hwy', ['truckPlate', 'trailerPlate', 'truckVin'])) {
      found = findEquipMentions(messageBodyText(msg));
    }
    return [
      mc,
      extrasOnSig(),
      threshSig(),
      hwy.assessment || '',
      hwy.fleet == null ? '' : hwy.fleet,
      hwy.safety == null ? '' : hwy.safety,
      hwy.connStatus || '',
      hwy.dnu ? '1' : '0',
      hwy.login ? '1' : '0',
      Array.isArray(hwy.vehicles) ? String(hwy.vehicles.length) : '',
      hwy.alerts == null ? '' : hwy.alerts,
      hwy.cargoAmt == null ? '' : hwy.cargoAmt,
      hwy.bipdAmt == null ? '' : hwy.bipdAmt,
      hwy.glAmt == null ? '' : hwy.glAmt,
      (hwy.emails || []).length,
      fg.hasFg ? '1' : '0',
      fg.date || '',
      fg.login ? '1' : '0',
      fg.error ? '1' : '0',
      (found.truckPlates || []).join(','),
      (found.trailerPlates || []).join(','),
      (found.truckVins || []).join(','),
      messageFromAddr(msg) || '',
      rateAmt == null ? '' : String(rateAmt)
    ].join('\t');
  }
  function fillMsgBar(bar, msg, mcs, rateAmt) {
    mcs = uniqMcs(mcs);
    var sig = mcs
      .map(function (mc) {
        return cardStateSig(mc, msg, rateAmt);
      })
      .join('\n');
    if (bar.getAttribute('data-ss-sig') === sig && bar.firstChild) return;
    if (fastTipAnchor && bar.contains(fastTipAnchor)) hideFastTip();
    if (eqHiState && eqHiState.msg === msg) hideEquipHi();
    while (bar.firstChild) bar.removeChild(bar.firstChild);
    mcs.forEach(function (mc) {
      bar.appendChild(buildMsgCard(msg, mc, rateAmt));
    });
    bar.setAttribute('data-ss-sig', sig);
  }
  function paintBar() {
    if (isPaused()) return;
    dropNode(document.getElementById('ss-intel-bar'));
    var root = openThreadRoot();
    if (uiMode() === 'inline' || !root) {
      document.querySelectorAll('.ss-intel-msg').forEach(dropNode);
      document.querySelectorAll('tr.ss-intel-tr, .ss-intel-host').forEach(dropNode);
      return;
    }
    var msgs = threadScanMessages(root);
    var wrapList = root.querySelectorAll('.hwy-mc-wrap[data-hwy-mc]');
    var wi;
    for (wi = 0; wi < wrapList.length; wi++) {
      var wrapMsg = messageRoot(wrapList[wi]);
      if (wrapMsg && msgs.indexOf(wrapMsg) < 0) msgs.push(wrapMsg);
    }
    if (!msgs.length) {
      var wrapOnly = root.querySelector('.hwy-mc-wrap');
      var fromWrap = wrapOnly && messageRoot(wrapOnly);
      if (fromWrap) msgs = [fromWrap];
    }
    var keep = [];
    var i;
    learnMcsFromThread(root);
    var rateMap = senderRateMap(root);
    var subjMcs = mcsInMessage(root.querySelector('h2.hP'), true);
    for (i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      var mcs = barMcsForMessage(msg);
      if (i === msgs.length - 1 && subjMcs.length && !mcs.length) {
        mcs = subjMcs.slice();
      }
      var host = messageHeaderHost(msg);
      var bar = msg.querySelector('.ss-intel-msg');
      if (!mcs.length || !host) {
        if (bar) dropNode(bar);
        var emptyHost = msg.querySelector('tr.ss-intel-tr, .ss-intel-host');
        if (emptyHost && !emptyHost.querySelector('.ss-intel-msg')) dropNode(emptyHost);
        continue;
      }
      if (!bar) {
        bar = el('div', 'ss-intel-msg');
        host.appendChild(bar);
      } else if (bar.parentNode !== host) {
        host.appendChild(bar);
      }
      fillMsgBar(bar, msg, mcs, rateForBarMessage(msg, rateMap));
      keep.push(bar);
    }
    root.querySelectorAll('.ss-intel-msg').forEach(function (n) {
      if (keep.indexOf(n) < 0) dropNode(n);
    });
    root.querySelectorAll('tr.ss-intel-tr, .ss-intel-host').forEach(function (n) {
      if (!n.querySelector('.ss-intel-msg')) dropNode(n);
    });
    wrapRatesInOpenThread();
  }

  function repaintAll() {
    applyUiMode();
  }

  function isSkippable(node) {
    var eln = node.parentElement;
    if (!eln) return true;
    if (
      eln.closest(
        'tr.zA, .hwy-mc-wrap, .ss-rate-wrap, .ss-intel-msg, #ss-intel-bar, #ss-hwy-c411-panel, #ss-ss-callout, .ss-fast-tip, mark.ss-eq-hi, .gmail_quote, .gmail_extra, blockquote.gmail_quote'
      )
    ) {
      return true;
    }
    var tag = eln.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return true;
    if (eln.isContentEditable) return true;
    return false;
  }

  var SKIP_WALK = /gmail_quote|gmail_extra|gmail_attr/;
  function collectTextNodes(root) {
    var all = [];
    function walk(node) {
      if (!node || all.length >= 400) return;
      if (node.nodeType === 1) {
        var cls = node.className ? String(node.className) : '';
        if (SKIP_WALK.test(cls)) return;
        var tag = node.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return;
        if (node.isContentEditable) return;
        var kids = node.childNodes;
        var i;
        for (i = 0; i < kids.length; i++) walk(kids[i]);
        return;
      }
      if (node.nodeType === 3 && node.nodeValue) {
        if (isSkippable(node)) return;
        all.push(node);
      }
    }
    walk(root);
    return all;
  }

  function wrapHits(textNode, hits, quoted) {
    var text = textNode.nodeValue;
    var parent = textNode.parentNode;
    if (!parent || !hits.length) return;
    var last = 0;
    var frag = document.createDocumentFragment();
    hits.forEach(function (h) {
      if (h.start > last) frag.appendChild(document.createTextNode(text.slice(last, h.start)));
      frag.appendChild(makeWrap(h.full, h.mc, { quoted: quoted }));
      last = h.end;
    });
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    parent.replaceChild(frag, textNode);
  }

  function processScope(root) {
    if (!root) return;
    var hasWrap = root.querySelector && root.querySelector('.hwy-mc-wrap');
    if (hasWrap && root.getAttribute && root.getAttribute('data-ss-scanned') === '1') return;
    var quotedRoot = inQuoted(root);
    var all = collectTextNodes(root);
    var i;
    for (i = 0; i < all.length; i++) {
      var n = all[i];
      if (!n.nodeValue) continue;
      if (!MC_TEST.test(n.nodeValue) && !MC_AFTER_TEST.test(n.nodeValue)) continue;
      var hits = findMcMatches(n.nodeValue);
      if (!hits.length) continue;
      wrapHits(n, hits, quotedRoot || inQuoted(n));
    }
    all = collectTextNodes(root);
    for (i = 0; i < all.length; i++) {
      var a = all[i];
      if (!MC_END.test(a.nodeValue || '')) continue;
      var b = null;
      var j;
      for (j = i + 1; j < all.length; j++) {
        var nxt = String(all[j].nodeValue || '');
        if (!nxt || MC_PUNCT.test(nxt)) continue;
        b = all[j];
        break;
      }
      if (!b) continue;
      var nm = String(b.nodeValue || '').match(MC_NEXT);
      if (!nm) continue;
      var mc2 = normMc(nm[1]);
      if (!mc2 || shouldIgnore(mc2)) continue;
      if (b.parentElement && b.parentElement.closest('.hwy-mc-wrap')) continue;
      var ctx2 = String(a.nodeValue || '') + String(b.nodeValue || '');
      var d2 = ctx2.search(/[0-9]{4,8}/);
      if (d2 >= 0 && isFalseMcNumber(ctx2, d2, d2 + nm[1].length, nm[1])) continue;
      var parentB = b.parentNode;
      if (!parentB) continue;
      var after = b.nodeValue.slice(nm[0].length);
      var frag2 = document.createDocumentFragment();
      frag2.appendChild(makeWrap(nm[1], mc2, { quoted: quotedRoot || inQuoted(b) }));
      if (after) frag2.appendChild(document.createTextNode(after));
      parentB.replaceChild(frag2, b);
    }
    all = collectTextNodes(root);
    for (i = 0; i < all.length; i++) {
      var na = all[i];
      var numM = String(na.nodeValue || '').match(NUM_END);
      if (!numM) continue;
      var nb = null;
      for (j = i + 1; j < all.length; j++) {
        var nxt2 = String(all[j].nodeValue || '');
        if (!nxt2 || MC_PUNCT.test(nxt2)) continue;
        nb = all[j];
        break;
      }
      if (!nb || !MC_ONLY.test(nb.nodeValue || '')) continue;
      var mc3 = normMc(numM[1]);
      if (!mc3 || shouldIgnore(mc3)) continue;
      if (na.parentElement && na.parentElement.closest('.hwy-mc-wrap')) continue;
      var ctx3 =
        (i > 0 ? String(all[i - 1].nodeValue || '') : '') +
        String(na.nodeValue || '') +
        String(nb.nodeValue || '');
      var d3 = ctx3.lastIndexOf(numM[1]);
      if (d3 >= 0 && isFalseMcNumber(ctx3, d3, d3 + numM[1].length, numM[1])) continue;
      var parentA = na.parentNode;
      if (!parentA) continue;
      var before = na.nodeValue.slice(0, numM.index);
      var frag3 = document.createDocumentFragment();
      if (before) frag3.appendChild(document.createTextNode(before));
      frag3.appendChild(makeWrap(numM[1] + ' MC', mc3, { quoted: quotedRoot || inQuoted(na) }));
      parentA.replaceChild(frag3, na);
    }
    maybeWrapBareMcReply(root);
    var wrapped = root.querySelector && root.querySelector('.hwy-mc-wrap');
    var blob = '';
    try {
      blob = String(root.textContent || '');
    } catch (e1) {}
    if (blob.length > 8000) blob = blob.slice(0, 8000);
    var maybeMc = MC_TEST.test(blob) || MC_AFTER_TEST.test(blob);
    if (root.setAttribute && (wrapped || !maybeMc)) root.setAttribute('data-ss-scanned', '1');
  }
  function parseRateNum(raw, isK) {
    var n = Number(String(raw || '').replace(/,/g, ''));
    if (!isFinite(n) || n <= 0) return null;
    if (isK) n = n * 1000;
    if (n < 100 || n >= 50000) return null;
    return Math.round(n);
  }
  function bareRateInText(s) {
    var t = String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t || t.length > 80) return null;
    var m = t.match(BARE_RATE_REPLY);
    if (!m) return null;
    return parseRateNum(m[1], false);
  }
  function rateAfterIsUnit(text, end) {
    return /^\s*(?:lbs?|pounds?|kgs?|kilos?|mi(?:les?)?|kms?)\b/i.test(String(text || '').slice(end));
  }
  function findRateMatches(text) {
    var s = String(text || '');
    var out = [];
    function addHit(start, end, full, n) {
      if (n == null || rateAfterIsUnit(s, end)) return;
      var i;
      for (i = 0; i < out.length; i++) {
        if (!(end <= out[i].start || start >= out[i].end)) return;
      }
      out.push({ start: start, end: end, full: full, n: n });
    }
    var dollarRe =
      /\$\s*([0-9]{1,2}(?:,[0-9]{3})+|[1-9][0-9]{2,4})(?:\.\d{1,2})?|([0-9]{1,2}(?:,[0-9]{3})+|[1-9][0-9]{2,4})(?:\.\d{1,2})?\s*\$/g;
    var kRe = /\$?\s*([1-9]\d?(?:\.\d{1,2})?)\s*[kK](?:\s*\$)?(?![A-Za-z])/g;
    var m;
    while ((m = dollarRe.exec(s))) {
      addHit(m.index, m.index + m[0].length, m[0], parseRateNum(m[1] || m[2], false));
    }
    while ((m = kRe.exec(s))) {
      addHit(m.index, m.index + m[0].length, m[0], parseRateNum(m[1], true));
    }
    out.sort(function (a, b) {
      return a.start - b.start;
    });
    return out;
  }
  function messageMcForRates(root) {
    var msg = messageRoot(root) || root;
    var mcs = mcsInMessage(msg, true);
    var i;
    for (i = 0; i < mcs.length; i++) {
      if (!shouldIgnore(mcs[i])) return mcs[i];
    }
    mcs = mcsFromMessageText(msg);
    for (i = 0; i < mcs.length; i++) {
      if (!shouldIgnore(mcs[i])) return mcs[i];
    }
    var from = messageFromAddr(msg);
    var tid = gmailThreadId(openThreadRoot() || msg);
    var assigned = isSelfOrCoworkerAddr(from)
      ? mcsForSingleKnownRecipient(msg, tid)
      : assignedMcsForAddr(from, tid);
    for (i = 0; i < assigned.length; i++) {
      if (!shouldIgnore(assigned[i])) return assigned[i];
    }
    return '';
  }
  function addrFromQuoteAttr(attr) {
    if (!attr) return '';
    var a = attr.querySelector && attr.querySelector('a[href^="mailto:"]');
    if (a) {
      var href = String(a.getAttribute('href') || '')
        .replace(/^mailto:/i, '')
        .split('?')[0];
      if (href.indexOf('@') >= 0) return href;
    }
    var em =
      attr.querySelector &&
      (attr.querySelector('[email]') || attr.querySelector('[data-hovercard-id]'));
    if (em) {
      var v = em.getAttribute('email') || em.getAttribute('data-hovercard-id') || '';
      if (v.indexOf('@') >= 0) return v;
    }
    var m = String(attr.textContent || '').match(
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
    );
    return m ? m[0] : '';
  }
  function quoteAuthorAddr(el) {
    if (!el || !el.closest) return '';
    var q = el.closest('blockquote.gmail_quote, div.gmail_quote, .gmail_extra');
    if (!q) return '';
    var attr = null;
    if (q.tagName === 'BLOCKQUOTE') {
      var prev = q.previousElementSibling;
      if (prev && /(^|\s)gmail_attr(\s|$)/.test(prev.className || '')) attr = prev;
      if (!attr && q.parentElement) {
        var kids = q.parentElement.children;
        var k;
        for (k = 0; k < kids.length; k++) {
          if (kids[k] === q) break;
          if (/(^|\s)gmail_attr(\s|$)/.test(kids[k].className || '')) attr = kids[k];
        }
      }
    }
    if (!attr && q.querySelector) attr = q.querySelector('.gmail_attr');
    return addrFromQuoteAttr(attr);
  }
  function skipTeamRateNode(n, teamMsg) {
    var el = n && n.parentElement;
    if (!el || !el.closest) return true;
    if (el.closest('.hwy-mc-wrap, .ss-rate-wrap, .gmail_attr')) return true;
    var quoted = el.closest('.gmail_quote, .gmail_extra, blockquote.gmail_quote');
    if (!quoted) return !!teamMsg;
    var qFrom = quoteAuthorAddr(el);
    if (!qFrom) return !!teamMsg;
    return isSelfOrCoworkerAddr(qFrom);
  }
  function wrapRatesInScope(root) {
    if (!root || !root.querySelector) return;
    if (inInboxList(root)) return;
    var mc = messageMcForRates(root);
    if (!mc) {
      var card = document.querySelector('.ss-intel-card[data-ss-mc]');
      if (card) mc = card.getAttribute('data-ss-mc') || '';
    }
    if (!mc) return;
    var msg = messageRoot(root) || root;
    var teamMsg = isSelfOrCoworkerAddr(messageFromAddr(msg));
    var all = collectTextNodes(root);
    var i;
    for (i = 0; i < all.length; i++) {
      var n = all[i];
      if (
        !n.nodeValue ||
        (n.nodeValue.indexOf('$') < 0 &&
          !/\d\s*\$/.test(n.nodeValue) &&
          !/\d(?:\.\d{1,2})?\s*[kK]\b/.test(n.nodeValue))
      ) {
        continue;
      }
      if (skipTeamRateNode(n, teamMsg)) continue;
      var hits = findRateMatches(n.nodeValue);
      if (!hits.length) continue;
      var text = n.nodeValue;
      var last = 0;
      var frag = document.createDocumentFragment();
      hits.forEach(function (h) {
        if (h.start > last) frag.appendChild(document.createTextNode(text.slice(last, h.start)));
        var w = el('span', 'ss-rate-wrap', h.full);
        w.setAttribute('data-ss-rate', String(h.n));
        w.setAttribute('data-ss-rate-mc', mc);
        (function (wrapEl, amount, mcNum) {
          bindHoverTip(wrapEl, 'Copy MC + Rate');
          wrapEl.addEventListener('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            clipText(copyMcRateText(mcNum, amount));
            flashCopied(wrapEl, 'Copy MC + Rate');
          });
        })(w, h.n, mc);
        frag.appendChild(w);
        last = h.end;
      });
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      n.parentNode.replaceChild(frag, n);
    }
  }
  function wrapRatesInOpenThread() {
    if (isPaused()) return;
    var root = openThreadRoot();
    if (!root || !root.querySelectorAll) return;
    var msgs = threadScanMessages(root);
    if (!msgs.length) msgs = hotMessages(root);
    var nodes = root.querySelectorAll('div.a3s, div.ii.gt, h2.hP, .iA.g6');
    var i;
    var n = nodes.length;
    for (i = 0; i < n; i++) {
      var node = nodes[i];
      if (inInboxList(node)) continue;
      if (!nodeInScanMessages(node, msgs) && !(node.classList && node.classList.contains('hP'))) continue;
      if (!isShown(node) && !(node.classList && node.classList.contains('hP'))) continue;
      if (node.classList && node.classList.contains('g6')) {
        var host = node.closest && (node.closest('.h7') || node.closest('div.kv'));
        if (host && isExpandedMsg(host)) continue;
      }
      wrapRatesInScope(node);
    }
  }
  function lastUnquotedRateWrap(msg) {
    if (!msg || !msg.querySelectorAll) return null;
    var wraps = msg.querySelectorAll('.ss-rate-wrap[data-ss-rate]');
    var amt = null;
    var i;
    for (i = 0; i < wraps.length; i++) {
      if (inQuoted(wraps[i])) continue;
      var n = Number(wraps[i].getAttribute('data-ss-rate'));
      if (isFinite(n) && n >= 100) amt = n;
    }
    return amt;
  }
  function latestRateInMessage(msg) {
    var wrapAmt = lastUnquotedRateWrap(msg);
    if (!isExpandedMsg(msg)) {
      var snipHits = findRateMatches(collapsedSnippetText(msg));
      if (snipHits.length) return snipHits[snipHits.length - 1].n;
      var snipBare = bareRateInText(collapsedSnippetText(msg));
      if (snipBare != null) return snipBare;
      return wrapAmt;
    }
    var t = unquotedMessageText(messageBodyBox(msg));
    var hits = findRateMatches(t);
    if (hits.length) return hits[hits.length - 1].n;
    var bare = bareRateInText(t);
    if (bare != null) return bare;
    return wrapAmt;
  }
  function senderRateMap(root) {
    var map = {};
    root = root || openThreadRoot();
    if (!root || !root.querySelectorAll) return map;
    var msgs = threadMessageNodes(root);
    var i;
    for (i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      var from = normEmail(messageFromAddr(msg));
      if (!from || isSkipCarrierAddr(from)) continue;
      var amt = latestRateInMessage(msg);
      if (amt == null) continue;
      map[from] = amt;
    }
    return map;
  }
  function rateForBarMessage(msg, rateMap) {
    var from = normEmail(messageFromAddr(msg));
    if (!from) return latestRateInMessage(msg);
    if (isSelfOrCoworkerAddr(from)) {
      var recips = nonTeamRecipients(msg);
      if (recips.length === 1) {
        var k = normEmail(recips[0]);
        if (k && rateMap && rateMap[k] != null) return rateMap[k];
      }
      return latestRateInMessage(msg);
    }
    if (rateMap && rateMap[from] != null) return rateMap[from];
    return latestRateInMessage(msg);
  }
  function unquotedMessageText(a3s) {
    if (!a3s) return '';
    var t = '';
    function walk(node) {
      if (!node) return;
      if (node.nodeType === 1) {
        var cls = node.className ? String(node.className) : '';
        if (SKIP_WALK.test(cls) || /(hwy-mc-wrap|ss-rate-wrap|ss-intel-msg)/.test(cls)) return;
        var kids = node.childNodes;
        var i;
        for (i = 0; i < kids.length; i++) walk(kids[i]);
        return;
      }
      if (node.nodeType === 3 && node.nodeValue) t += node.nodeValue + ' ';
    }
    walk(a3s);
    return t;
  }
  function nearbyAskedMc(a3s) {
    var quoted = a3s.querySelector && a3s.querySelector('.gmail_quote, .gmail_extra');
    if (quoted && MC_ASK.test(quoted.innerText || '')) return true;
    var msg = (a3s.closest && (a3s.closest('.h7') || a3s.closest('.adn'))) || null;
    if (!msg) return false;
    var n = msg.previousElementSibling;
    var hops = 0;
    while (n && hops < 8) {
      if (n.querySelector && (/\bh7\b/.test(n.className || '') || /\badn\b/.test(n.className || '') || n.querySelector('div.a3s'))) {
        return MC_ASK.test((n.innerText || '').slice(0, 2500));
      }
      n = n.previousElementSibling;
      hops++;
    }
    return false;
  }
  function maybeWrapBareMcReply(root) {
    var a3s =
      root && root.classList && root.classList.contains('a3s')
        ? root
        : root && root.closest && root.closest('div.a3s');
    if (!a3s || a3s.querySelector('.hwy-mc-wrap')) return;
    var m = unquotedMessageText(a3s).replace(/\s+/g, ' ').trim().match(BARE_MC_REPLY);
    if (!m) return;
    var mc = normMc(m[1]);
    if (!mc || shouldIgnore(mc) || !nearbyAskedMc(a3s)) return;
    var nodes = collectTextNodes(a3s);
    var i;
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.parentElement && n.parentElement.closest('.gmail_quote, .gmail_extra, .hwy-mc-wrap')) continue;
      var hit = String(n.nodeValue || '').match(new RegExp('(?:^|\\s)(' + m[1] + ')(?:\\s|$|\\.)'));
      if (!hit) continue;
      var idx = n.nodeValue.indexOf(m[1]);
      if (idx < 0) continue;
      var parent = n.parentNode;
      if (!parent) return;
      var frag = document.createDocumentFragment();
      if (idx > 0) frag.appendChild(document.createTextNode(n.nodeValue.slice(0, idx)));
      frag.appendChild(makeWrap(m[1], mc, { quoted: false }));
      var after = n.nodeValue.slice(idx + m[1].length);
      if (after) frag.appendChild(document.createTextNode(after));
      parent.replaceChild(frag, n);
      return;
    }
  }

  function processRoot(root) {
    if (isPaused()) return;
    if (!root || !root.querySelectorAll) return;
    var subj = root.querySelector('h2.hP');
    if (subj) {
      processScope(subj);
      wrapRatesInScope(subj);
    }
    var hot = hotMessages(root);
    var i;
    for (i = 0; i < hot.length; i++) processOneMessage(hot[i]);
    var all = threadMessageNodes(root);
    for (i = 0; i < all.length; i++) {
      if (hot.indexOf(all[i]) >= 0) continue;
      if (isExpandedMsg(all[i])) continue;
      if (collapsedHasMc(all[i]) || collapsedHasRate(all[i])) processOneMessage(all[i]);
    }
    var exp = expandedMessages(root);
    for (i = 0; i < exp.length; i++) {
      if (hot.indexOf(exp[i]) >= 0) continue;
      enqueueIdleMsg(exp[i]);
    }
  }

  function pruneIdleMc(root) {
    var keep = {};
    wrapsInOpenMail(root).forEach(function (w) {
      var mc = w.getAttribute('data-hwy-mc');
      if (mc) keep[mc] = true;
    });
    try {
      var addrMap = loadAddrMcMap();
      Object.keys(addrMap).forEach(function (k) {
        var rec = addrMap[k];
        var i;
        for (i = 0; i < ((rec && rec.mcs) || []).length; i++) {
          if (rec.mcs[i]) keep[rec.mcs[i]] = true;
        }
      });
    } catch (eKeep) {}
    Object.keys(mcStore).forEach(function (mc) {
      if (keep[mc] || inflight[mc] || c411Inflight[mc] || hwyExtrasInflight[mc]) return;
      delete mcStore[mc];
    });
  }
  function unwrapToText(node) {
    if (!node || !node.parentNode) return;
    var txt = '';
    var link = node.querySelector && node.querySelector('.hwy-mc-link');
    txt = (link && link.textContent) || node.textContent || '';
    node.parentNode.replaceChild(document.createTextNode(txt), node);
  }
  function unwrapGmailUi() {
    try {
      hideFastTip();
    } catch (eTip) {}
    try {
      hideEquipHi();
    } catch (eEq) {}
    try {
      var co = document.getElementById('ss-ss-callout');
      if (co) {
        stopCalloutFollow(co);
        dropNode(co);
      }
    } catch (eCo) {}
    dropNode(document.getElementById('ss-intel-bar'));
    document.querySelectorAll('.ss-intel-msg').forEach(dropNode);
    document.querySelectorAll('tr.ss-intel-tr, .ss-intel-host').forEach(dropNode);
    document.querySelectorAll('mark.ss-eq-hi').forEach(unwrapToText);
    document.querySelectorAll('.ss-rate-wrap').forEach(unwrapToText);
    document.querySelectorAll('.hwy-mc-wrap').forEach(function (w) {
      try {
        stripChips(w);
      } catch (eStrip) {}
      unwrapToText(w);
    });
    document.querySelectorAll('[data-ss-scanned]').forEach(function (n) {
      try {
        n.removeAttribute('data-ss-scanned');
      } catch (eScan) {}
    });
  }
  function applyPausedState() {
    syncMcBadge();
    var btn = document.getElementById('ss-hwy-c411-set-btn');
    if (btn) {
      btn.setAttribute(
        'aria-label',
        isPaused()
          ? 'Carrier check is paused. Open settings to turn it back on.'
          : 'Highway and Carrier411 badge settings'
      );
    }
    if (isPaused()) {
      cancelSched();
      cancelIdleDrain();
      idleQueue = [];
      if (expandQuiet) {
        clearTimeout(expandQuiet);
        expandQuiet = 0;
      }
      if (openRetry) {
        clearTimeout(openRetry);
        openRetry = 0;
      }
      if (expandRetry1) {
        clearTimeout(expandRetry1);
        expandRetry1 = 0;
      }
      unwrapGmailUi();
      injectSettingsBtn();
      try {
        obs.disconnect();
      } catch (eObs) {}
      armObserver();
      return;
    }
    injectSettingsBtn();
    kickScan();
    setTimeout(function () {
      if (!isPaused()) kickScan();
    }, 280);
  }
  var scanning = false;
  var scanRescan = 0;
  function expandedNeedsRescan() {
    var root = openThreadRoot();
    if (!root) return false;
    var msgs = hotMessages(root);
    var i;
    for (i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      if (msg.querySelector && msg.querySelector('.hwy-mc-wrap, .ss-intel-msg')) continue;
      var t = unquotedMessageText(messageBodyBox(msg));
      if (findMcMatches(t).length) return true;
    }
    return false;
  }
  function scanNow() {
    if (scanning) return;
    scanning = true;
    try {
      obs.disconnect();
      if (isPaused()) {
        unwrapGmailUi();
        injectSettingsBtn();
        return;
      }
      var root = openThreadRoot();
      if (root) {
        processRoot(root);
        applyUiMode();
        pruneIdleMc(root);
      } else {
        dropNode(document.getElementById('ss-intel-bar'));
        document.querySelectorAll('.ss-intel-msg').forEach(dropNode);
        document.querySelectorAll('tr.ss-intel-tr, .ss-intel-host').forEach(dropNode);
        pruneIdleMc(null);
      }
      injectSettingsBtn();
      maybeShowCallout();
    } catch (e) {
    } finally {
      scanning = false;
      armObserver();
      if (eqHiState) paintEquipHi();
      if (!isPaused() && scanRescan < 2 && expandedNeedsRescan()) {
        scanRescan++;
        schedule();
      } else {
        scanRescan = 0;
      }
    }
  }

  var scheduled = false;
  var schedHandle = 0;
  var schedIdle = false;
  var openRetry = 0;
  function cancelSched() {
    if (!schedHandle) {
      scheduled = false;
      return;
    }
    if (schedIdle && typeof cancelIdleCallback === 'function') {
      try {
        cancelIdleCallback(schedHandle);
      } catch (e) {}
    } else {
      clearTimeout(schedHandle);
    }
    schedHandle = 0;
    schedIdle = false;
    scheduled = false;
  }
  function schedule() {
    if (isPaused()) {
      injectSettingsBtn();
      return;
    }
    if (scheduled) return;
    scheduled = true;
    var kick = function () {
      scheduled = false;
      schedHandle = 0;
      scanNow();
    };
    if (typeof requestIdleCallback === 'function') {
      schedIdle = true;
      schedHandle = requestIdleCallback(kick, { timeout: 240 });
    } else {
      schedIdle = false;
      schedHandle = setTimeout(kick, 160);
    }
  }
  function kickScan() {
    if (isPaused()) {
      injectSettingsBtn();
      return;
    }
    cancelSched();
    scanNow();
    scheduleOpenRetries();
  }
  function scheduleOpenRetries() {
    if (openRetry) return;
    var delays = [400, 900, 1600, 2800];
    var i = 0;
    function step() {
      if (i >= delays.length) {
        openRetry = 0;
        return;
      }
      openRetry = setTimeout(function () {
        openRetry = 0;
        if (isPaused()) return;
        scanNow();
        i += 1;
        step();
      }, delays[i]);
    }
    step();
  }
  var expandRetry1 = 0;
  var expandQuiet = 0;
  function kickExpandScan() {
    if (isPaused()) return;
    if (expandQuiet) clearTimeout(expandQuiet);
    expandQuiet = setTimeout(function () {
      expandQuiet = 0;
      if (isPaused()) return;
      schedule();
      var root = openThreadRoot();
      if (!root) return;
      var exp = expandedMessages(root);
      var i;
      for (i = 0; i < exp.length; i++) enqueueIdleMsg(exp[i]);
    }, 350);
  }
  function clickLooksLikeCollapsedMsg(ev) {
    var n = ev && ev.target;
    if (!n) return false;
    var el = n.nodeType === 1 ? n : n.parentElement;
    if (!el || !el.closest) return false;
    if (el.closest('tr.zA, .ss-intel-msg, .hwy-mc-wrap, .ss-rate-wrap, #ss-hwy-c411-panel, #ss-hwy-c411-set-wrap, a[href]')) {
      return false;
    }
    return !!(el.closest('div.kv') || el.closest('.kQ'));
  }
  function clickLooksLikeExpandAll(ev) {
    var n = ev && ev.target;
    if (!n) return false;
    var el = n.nodeType === 1 ? n : n.parentElement;
    var hops = 0;
    while (el && hops < 6) {
      var lab = '';
      var role = '';
      if (el.getAttribute) {
        lab = String(el.getAttribute('aria-label') || el.getAttribute('data-tooltip') || '');
        role = String(el.getAttribute('role') || '');
      }
      if (/expand all|collapse all|show trimmed/i.test(lab)) return true;
      var tag = el.tagName || '';
      if (tag === 'BUTTON' || role === 'menuitem' || role === 'button') {
        var t = String(el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length <= 36 && /expand all|collapse all|show trimmed/i.test(t)) return true;
      }
      el = el.parentElement;
      hops++;
    }
    return false;
  }

  var panelEl = null;
  var shadeEl = null;
  var lastToggle = 0;
  function isPanelOpen() {
    return !!(panelEl && panelEl.parentNode && panelEl.classList.contains('ss-open'));
  }
  function panelHost() {
    return document.documentElement || document.body;
  }
  function unmountEl(node) {
    if (!node) return;
    if (node.parentNode) node.parentNode.removeChild(node);
  }
  function commitOrgMcFromPanel() {
    if (!panelEl) return;
    var inp = panelEl.querySelector('.ss-org-mc');
    if (!inp) return;
    var n = normMc(inp.value);
    if (n) saveOrgMc(n);
    else setOrgMcNeeded(true);
    syncMcBadge();
  }
  function closePanel() {
    commitOrgMcFromPanel();
    if (panelEl) panelEl.classList.remove('ss-open');
    if (shadeEl) shadeEl.classList.remove('ss-open');
    var p = panelEl;
    var s = shadeEl;
    panelEl = null;
    shadeEl = null;
    setTimeout(function () {
      unmountEl(p);
      unmountEl(s);
    }, 180);
  }
  function togglePanel() {
    var now = Date.now();
    if (now - lastToggle < 350) return;
    lastToggle = now;
    if (isPanelOpen()) closePanel();
    else openPanel();
  }
  function setCheckLook(box, on) {
    box.setAttribute('aria-checked', on ? 'true' : 'false');
    box.textContent = on ? '✓' : '';
    box.style.background = on ? '#1a73e8' : '#fff';
    box.style.borderColor = on ? '#1a73e8' : '#5f6368';
  }
  function renderPanelLists(query) {
    if (!panelEl) return;
    var q = String(query || '').toLowerCase();
    var s = loadSettings();
    s.thresh = mergeThresh(s.thresh);
    function makeNum(value, key, fallback, step) {
      var inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'ss-set-num';
      inp.min = '0';
      inp.step = step || 'any';
      inp.value = String(value);
      function stop(ev) {
        ev.stopPropagation();
      }
      inp.addEventListener('mousedown', stop);
      inp.addEventListener('click', stop);
      inp.addEventListener('keydown', stop);
      inp.addEventListener('input', function (ev) {
        ev.stopPropagation();
        if (inp.value === '' || isNaN(Number(inp.value))) return;
        s.thresh[key] = Number(inp.value);
        saveSettings(s);
      });
      inp.addEventListener('change', function (ev) {
        ev.stopPropagation();
        if (inp.value === '' || isNaN(Number(inp.value))) {
          inp.value = String(fallback);
          s.thresh[key] = fallback;
          saveSettings(s);
        }
      });
      inp.addEventListener('blur', function () {
        if (inp.value === '' || isNaN(Number(inp.value))) {
          inp.value = String(fallback);
          s.thresh[key] = fallback;
        } else {
          s.thresh[key] = Number(inp.value);
        }
        saveSettings(s);
      });
      return inp;
    }
    function labNum(text, inp) {
      var labEl = document.createElement('label');
      labEl.className = 'ss-set-nlab';
      labEl.appendChild(document.createTextNode(text + ' '));
      labEl.appendChild(inp);
      labEl.addEventListener('click', function (ev) {
        ev.stopPropagation();
      });
      return labEl;
    }
    function clearDropMarks(host) {
      if (!host || !host.querySelectorAll) return;
      host.querySelectorAll('.ss-set-drop-before, .ss-set-drop-after').forEach(function (n) {
        n.classList.remove('ss-set-drop-before', 'ss-set-drop-after');
      });
    }
    function fill(which, meta, host) {
      if (!host) return;
      while (host.firstChild) host.removeChild(host.firstChild);
      var list = (s && s[which]) || [];
      list.forEach(function (item) {
        var spec = meta[item.id] || { label: item.id, source: '' };
        var lab = spec.label || item.id;
        var row = el('div', 'ss-set-row');
        row.draggable = true;
        row.setAttribute('data-id', item.id);
        if (q && lab.toLowerCase().indexOf(q) < 0 && item.id.indexOf(q) < 0) {
          row.className += ' ss-hidden-row';
        }
        var grip = el('span', 'ss-set-grip', '⋮⋮');
        grip.title = 'Drag to reorder';
        var box = el('span', 'ss-set-check');
        box.setAttribute('role', 'checkbox');
        setCheckLook(box, !!item.on);
        var name = el('span', 'ss-set-lab', lab);
        row.title = spec.source || lab;
        function toggleRow(ev) {
          if (ev.target === grip) return;
          if (ev.target && ev.target.closest && ev.target.closest('.ss-set-extra, .ss-set-num, .ss-set-nlab')) return;
          ev.preventDefault();
          ev.stopPropagation();
          item.on = !item.on;
          setCheckLook(box, !!item.on);
          saveSettings(s);
        }
        row.addEventListener('click', toggleRow);
        row.appendChild(grip);
        row.appendChild(box);
        row.appendChild(name);
        if (which === 'hwy' && (item.id === 'units' || item.id === 'cargo' || item.id === 'safety')) {
          row.className += ' ss-has-extra';
          var extra = el('div', 'ss-set-extra');
          extra.addEventListener('click', function (ev) {
            ev.stopPropagation();
          });
          extra.addEventListener('mousedown', function (ev) {
            ev.stopPropagation();
          });
          var th = s.thresh;
          if (item.id === 'units') {
            extra.appendChild(labNum('If less than', makeNum(th.unitsMin, 'unitsMin', 10, '1')));
            extra.appendChild(document.createTextNode('units, badge is red'));
          } else if (item.id === 'cargo') {
            extra.appendChild(labNum('If less than', makeNum(th.cargoMinK, 'cargoMinK', 100, '1')));
            extra.appendChild(document.createTextNode('K, badge is red'));
          } else {
            extra.appendChild(labNum('Green ≤', makeNum(th.safetyGreen, 'safetyGreen', 0, 'any')));
            extra.appendChild(labNum('Yellow ≤', makeNum(th.safetyYellow, 'safetyYellow', 3, 'any')));
            extra.appendChild(labNum('Red >', makeNum(th.safetyRed, 'safetyRed', 3, 'any')));
          }
          row.appendChild(extra);
        }
        row.addEventListener('dragstart', function (ev) {
          ev.dataTransfer.setData('text/plain', item.id);
          ev.dataTransfer.effectAllowed = 'move';
          row.classList.add('ss-set-dragging');
        });
        row.addEventListener('dragend', function () {
          row.classList.remove('ss-set-dragging');
          clearDropMarks(host);
        });
        row.addEventListener('dragover', function (ev) {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = 'move';
          clearDropMarks(host);
          var box = row.getBoundingClientRect();
          if (ev.clientY < box.top + box.height / 2) row.classList.add('ss-set-drop-before');
          else row.classList.add('ss-set-drop-after');
        });
        row.addEventListener('dragleave', function (ev) {
          if (row.contains(ev.relatedTarget)) return;
          row.classList.remove('ss-set-drop-before', 'ss-set-drop-after');
        });
        row.addEventListener('drop', function (ev) {
          ev.preventDefault();
          var fromId = ev.dataTransfer.getData('text/plain');
          var after = row.classList.contains('ss-set-drop-after');
          clearDropMarks(host);
          row.classList.remove('ss-set-dragging');
          if (!fromId || fromId === item.id) return;
          var arr = s[which];
          var from = -1;
          var to = -1;
          var k;
          for (k = 0; k < arr.length; k++) {
            if (arr[k].id === fromId) from = k;
            if (arr[k].id === item.id) to = k;
          }
          if (from < 0 || to < 0) return;
          if (after) to += 1;
          var moved = arr.splice(from, 1)[0];
          if (from < to) to -= 1;
          arr.splice(to, 0, moved);
          saveSettings(s);
          renderPanelLists(q);
        });
        host.appendChild(row);
      });
    }
    fill('hwy', HWY_FIELD_META, panelEl._hwyList || panelEl.querySelector('#ss-set-hwy'));
    fill('c411', C411_FIELD_META, panelEl._c411List || panelEl.querySelector('#ss-set-c411'));
    var runHost = panelEl._runList || panelEl.querySelector('#ss-set-run');
    var runSec = runHost && runHost.parentElement;
    if (runSec) {
      if (s.paused) runSec.classList.add('ss-set-sec-off');
      else runSec.classList.remove('ss-set-sec-off');
    }
    if (runHost) {
      while (runHost.firstChild) runHost.removeChild(runHost.firstChild);
      [
        { paused: false, lab: 'On — scan emails and show carrier info' },
        { paused: true, lab: 'Paused — hide badges and stop scanning' }
      ].forEach(function (opt) {
        var row = el('div', 'ss-set-row');
        var box = el('span', 'ss-set-check');
        box.setAttribute('role', 'radio');
        setCheckLook(box, !!s.paused === opt.paused);
        row.appendChild(box);
        row.appendChild(el('span', 'ss-set-lab', opt.lab));
        row.addEventListener('click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          s.paused = opt.paused;
          saveSettings(s);
          renderPanelLists(q);
        });
        runHost.appendChild(row);
      });
    }
    var uiHost = panelEl._uiList || panelEl.querySelector('#ss-set-ui');
    if (uiHost) {
      while (uiHost.firstChild) uiHost.removeChild(uiHost.firstChild);
      [
        { id: 'bar', lab: 'Bar only' },
        { id: 'inline', lab: 'Next to MC' },
        { id: 'both', lab: 'Bar + next to MC' }
      ].forEach(function (opt) {
        var row = el('div', 'ss-set-row');
        var box = el('span', 'ss-set-check');
        box.setAttribute('role', 'radio');
        setCheckLook(box, s.ui === opt.id || (!s.ui && opt.id === 'bar'));
        row.appendChild(box);
        row.appendChild(el('span', 'ss-set-lab', opt.lab));
        row.addEventListener('click', function (ev) {
          ev.preventDefault();
          s.ui = opt.id;
          saveSettings(s);
          renderPanelLists(q);
        });
        uiHost.appendChild(row);
      });
    }
  }
  function openPanel() {
    if (isPanelOpen()) return;
    if (panelEl) {
      unmountEl(panelEl);
      panelEl = null;
    }
    if (shadeEl) {
      unmountEl(shadeEl);
      shadeEl = null;
    }
    shadeEl = el('div', '');
    shadeEl.id = 'ss-hwy-c411-shade';
    shadeEl.addEventListener('mousedown', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      closePanel();
    });
    panelEl = el('div', '');
    panelEl.id = 'ss-hwy-c411-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-label', 'Highway and Carrier411 badge settings');

    var head = el('div', 'ss-set-head');
    head.appendChild(el('div', 'ss-set-title', 'Carrier check'));
    head.appendChild(el('div', 'ss-set-ver', SCRIPT_VERSION));
    var notesPill = el('button', 'ss-notes-pill', 'Release notes');
    notesPill.type = 'button';
    notesPill.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      closePanel();
      showSsCallout('notes', true);
    });
    head.appendChild(notesPill);
    var closer = el('button', 'ss-set-close', '×');
    closer.type = 'button';
    closer.title = 'Close';
    closer.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      closePanel();
    });
    head.appendChild(closer);
    panelEl.appendChild(head);

    var search = document.createElement('input');
    search.type = 'text';
    search.className = 'ss-set-search';
    search.placeholder = 'Search fields';
    search.addEventListener('input', function () {
      renderPanelLists(search.value);
    });
    panelEl.appendChild(search);

    var body = el('div', 'ss-set-body');
    var runSec = el('div', 'ss-set-sec');
    runSec.appendChild(el('h3', '', 'This script'));
    var runList = el('div', '');
    runList.id = 'ss-set-run';
    runSec.appendChild(runList);
    runSec.appendChild(
      el(
        'p',
        'ss-set-hint',
        'Pause turns off scanning and removes carrier info from Gmail until you turn it back on. No page refresh needed.'
      )
    );
    body.appendChild(runSec);
    var uiSec = el('div', 'ss-set-sec');
    uiSec.appendChild(el('h3', '', 'Where to show'));
    var uiList = el('div', '');
    uiList.id = 'ss-set-ui';
    uiSec.appendChild(uiList);
    body.appendChild(uiSec);

    var hwySec = el('div', 'ss-set-sec');
    var hwyH = el('h3', '');
    hwyH.appendChild(logoImg(HWY_LOGO, ''));
    hwyH.appendChild(document.createTextNode('Highway'));
    hwySec.appendChild(hwyH);
    var hwyList = el('div', '');
    hwyList.id = 'ss-set-hwy';
    hwySec.appendChild(hwyList);
    body.appendChild(hwySec);

    var cSec = el('div', 'ss-set-sec');
    var cH = el('h3', '');
    cH.appendChild(logoImg(C411_LOGO, ''));
    cH.appendChild(document.createTextNode('Carrier411'));
    cSec.appendChild(cH);
    var cList = el('div', '');
    cList.id = 'ss-set-c411';
    cSec.appendChild(cList);
    body.appendChild(cSec);

    var orgNeed = orgMcNeeded();
    var orgLast = loadOrgMc();
    var orgBox = el('div', orgNeed ? 'ss-org-box ss-org-box-need' : 'ss-org-box');
    orgBox.appendChild(
      el(
        'p',
        '',
        orgNeed
          ? 'Enter your company MC. This is important. Digits only — no “MC”.'
          : 'Your company’s MC. We never show Highway/Carrier411 results for this number, so your own authority is not treated as a carrier you are vetting. Digits only — no “MC”.'
      )
    );
    var orgRow = el('div', 'ss-org-row');
    orgRow.appendChild(el('b', '', 'MC:'));
    var orgInp = document.createElement('input');
    orgInp.type = 'text';
    orgInp.inputMode = 'numeric';
    orgInp.className = 'ss-org-mc';
    orgInp.maxLength = 8;
    orgInp.value = orgNeed ? '' : orgLast;
    if (orgNeed && orgLast) orgInp.placeholder = orgLast;
    orgInp.setAttribute('aria-label', 'Your company MC number');
    orgRow.appendChild(orgInp);
    orgBox.appendChild(orgRow);
    var orgMsg = el('div', '');
    orgBox.appendChild(orgMsg);
    orgInp.addEventListener('keydown', function (ev) {
      ev.stopPropagation();
    });
    orgInp.addEventListener('input', function (ev) {
      ev.stopPropagation();
      var raw = orgInp.value.replace(/\s+/g, '');
      if (raw && /[^\d]/.test(raw)) {
        orgMsg.className = 'ss-org-err';
        orgMsg.textContent = 'Numbers only.';
        return;
      }
      orgMsg.className = '';
      orgMsg.textContent = '';
    });
    if (orgNeed) body.insertBefore(orgBox, uiSec);
    else body.appendChild(orgBox);
    panelEl.appendChild(body);
    panelEl._hwyList = hwyList;
    panelEl._c411List = cList;
    panelEl._uiList = uiList;
    panelEl._runList = runList;

    var host = panelHost();
    host.appendChild(shadeEl);
    host.appendChild(panelEl);
    shadeEl.classList.add('ss-open');
    panelEl.classList.add('ss-open');
    paintLoginNotes();
    renderPanelLists('');
  }

  function findSettingsSlot() {
    var seed =
      document.querySelector('[aria-label="Settings"]') ||
      document.querySelector('[data-tooltip="Settings"]') ||
      document.querySelector('header svg.Xy') ||
      document.querySelector('svg.Xy');
    if (!seed) return null;
    var n = seed;
    if (n.closest) {
      n =
        n.closest('[aria-label="Settings"]') ||
        n.closest('div[role="button"], a[role="button"], button, a') ||
        n;
    }
    var node = n;
    while (node && node.parentElement && node.parentElement !== document.body) {
      var parent = node.parentElement;
      if (parent.id === 'ss-hwy-c411-set-wrap') {
        node = parent;
        continue;
      }
      var count = 0;
      var i;
      for (i = 0; i < parent.children.length; i++) {
        var c = parent.children[i];
        if (c.id === 'ss-hwy-c411-set-wrap') continue;
        if (c.offsetWidth >= 20 && c.offsetHeight >= 20) count++;
      }
      if (count >= 2) return { parent: parent, before: node };
      node = parent;
    }
    if (!n.parentNode) return null;
    return { parent: n.parentNode, before: n };
  }
  function bindSettingsClicks() {
    if (window.__ssSetBtnBound) return;
    window.__ssSetBtnBound = true;
    function fromBtn(ev) {
      var n = ev.target;
      if (!n) return false;
      if (n.id === 'ss-hwy-c411-set-btn' || n.id === 'ss-hwy-c411-set-wrap') return true;
      if (n.closest && n.closest('#ss-hwy-c411-set-btn, #ss-hwy-c411-set-wrap')) return true;
      return false;
    }
    function intercept(ev) {
      if (!fromBtn(ev)) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if (ev.type === 'click') return;
      if (ev.button && ev.button !== 0) return;
      togglePanel();
    }
    document.addEventListener('pointerdown', intercept, true);
    document.addEventListener('mousedown', intercept, true);
    document.addEventListener('click', intercept, true);
    document.addEventListener(
      'click',
      function (ev) {
        if (!isPanelOpen()) return;
        if (Date.now() - lastToggle < 400) return;
        var n = ev.target;
        if (n && n.closest && n.closest('#ss-hwy-c411-panel, #ss-hwy-c411-set-btn, #ss-ss-callout')) return;
        closePanel();
      },
      true
    );
  }
  function stopCalloutFollow(n) {
    if (!n) return;
    if (n._ssFollow) {
      clearInterval(n._ssFollow);
      n._ssFollow = 0;
    }
    if (n._ssRO && n._ssRO.disconnect) {
      try {
        n._ssRO.disconnect();
      } catch (e) {}
      n._ssRO = null;
    }
    if (n._ssMO && n._ssMO.disconnect) {
      try {
        n._ssMO.disconnect();
      } catch (e2) {}
      n._ssMO = null;
    }
  }
  function hideSsCallout() {
    var n = document.getElementById('ss-ss-callout');
    if (!n) return;
    stopCalloutFollow(n);
    if (n.parentNode) n.parentNode.removeChild(n);
  }
  function placeSsCallout(card) {
    var gear = document.getElementById('ss-hwy-c411-set-btn');
    if (!gear || !card) return;
    var r = gear.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var gx = r.left + r.width / 2;
    var w = card.offsetWidth || 340;
    var h = card.offsetHeight || 160;
    var margin = 8;
    var inset = 20;
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var vh = document.documentElement.clientHeight || window.innerHeight;
    var viewLeft = gx - inset;
    if (viewLeft < margin) viewLeft = margin;
    if (viewLeft + w > vw - margin) {
      var clamped = vw - w - margin;
      if (gx > clamped + 14 && gx < clamped + w - 14) viewLeft = clamped;
    }
    var viewTop = r.bottom + 8;
    var below = true;
    if (viewTop + h > vh - margin && r.top - 8 - h >= margin) {
      viewTop = r.top - 8 - h;
      below = false;
    }
    card.style.left = Math.round(viewLeft) + 'px';
    card.style.top = Math.round(viewTop) + 'px';
    var cardR = card.getBoundingClientRect();
    var shiftX = viewLeft - cardR.left;
    var shiftY = viewTop - cardR.top;
    if (shiftX || shiftY) {
      card.style.left = Math.round(viewLeft + shiftX) + 'px';
      card.style.top = Math.round(viewTop + shiftY) + 'px';
      cardR = card.getBoundingClientRect();
    }
    var caret = card.querySelector('.ss-co-caret');
    if (!caret) return;
    var half = CARET_PX;
    var cx = Math.round(gx - cardR.left - half);
    if (cx < 10 || cx > w - 28) {
      var need = gx - (cardR.left + Math.max(10, Math.min(w - 28, cx)) + half);
      card.style.left = Math.round(parseFloat(card.style.left || '0') + need) + 'px';
      cardR = card.getBoundingClientRect();
      cx = Math.round(gx - cardR.left - half);
    }
    if (cx < 10) cx = 10;
    if (cx > w - 28) cx = w - 28;
    caret.style.left = cx + 'px';
    if (below) {
      caret.style.top = '-' + (half * 2) + 'px';
      caret.style.borderBottomColor = CALLOUT_BG;
      caret.style.borderTopColor = 'transparent';
    } else {
      caret.style.top = '100%';
      caret.style.borderTopColor = CALLOUT_BG;
      caret.style.borderBottomColor = 'transparent';
    }
  }
  function armCalloutFollow(card) {
    var queued = false;
    function tick() {
      queued = false;
      if (!card || !card.parentNode) {
        stopCalloutFollow(card);
        return;
      }
      placeSsCallout(card);
    }
    function ask() {
      if (queued) return;
      queued = true;
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(tick);
      else setTimeout(tick, 16);
    }
    stopCalloutFollow(card);
    var wrap = document.getElementById('ss-hwy-c411-set-wrap');
    var host = wrap && wrap.parentElement;
    var banner = document.querySelector('[role="banner"]');
    if (typeof MutationObserver === 'function') {
      card._ssMO = new MutationObserver(ask);
      if (banner) card._ssMO.observe(banner, { childList: true, subtree: true });
      else if (host) card._ssMO.observe(host, { childList: true, subtree: true });
    }
    if (typeof ResizeObserver === 'function' && wrap) {
      card._ssRO = new ResizeObserver(ask);
      card._ssRO.observe(wrap);
    }
    setTimeout(ask, 280);
    setTimeout(ask, 700);
  }
  function showSsCallout(kind, forceNotes) {
    hideSsCallout();
    var gear = document.getElementById('ss-hwy-c411-set-btn');
    if (!gear) return;
    var card = el('div', '');
    card.id = 'ss-ss-callout';
    var caret = el('div', 'ss-co-caret');
    card.appendChild(caret);
    var x = el('button', 'ss-co-x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    function dismissNotes() {
      ackNotesVersion();
      hideSsCallout();
    }
    if (kind === 'setup') {
      x.addEventListener('click', function (ev) {
        ev.preventDefault();
        window.__ssSetupSnooze = true;
        setOrgMcNeeded(true);
        syncMcBadge();
        hideSsCallout();
      });
      card.appendChild(x);
      card.appendChild(el('h4', '', 'Your company MC'));
      card.appendChild(
        el(
          'div',
          'ss-co-body',
          'Enter your broker MC (digits only). We will never show Highway or Carrier411 results for this number, so your own company is not treated as a carrier you are vetting.'
        )
      );
      var row = el('div', 'ss-co-field');
      row.appendChild(el('b', '', 'MC:'));
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'numeric';
      inp.maxLength = 8;
      inp.setAttribute('aria-label', 'Your company MC number');
      row.appendChild(inp);
      card.appendChild(row);
      var err = el('div', 'ss-co-err');
      card.appendChild(err);
      var go = el('button', 'ss-co-go', 'Save');
      go.type = 'button';
      function saveSetup() {
        var raw = String(inp.value || '').replace(/\s+/g, '');
        if (!raw) {
          err.textContent = 'Enter your MC number.';
          return;
        }
        if (/[^\d]/.test(raw)) {
          err.textContent = 'Numbers only.';
          return;
        }
        var n = normMc(raw);
        if (!n) {
          err.textContent = 'Numbers only.';
          return;
        }
        saveOrgMc(n);
        syncMcBadge();
        ackNotesVersion();
        hideSsCallout();
      }
      go.addEventListener('click', function (ev) {
        ev.preventDefault();
        saveSetup();
      });
      inp.addEventListener('keydown', function (ev) {
        ev.stopPropagation();
        if (ev.key === 'Enter') {
          ev.preventDefault();
          saveSetup();
        }
      });
      card.appendChild(go);
    } else {
      x.addEventListener('click', function (ev) {
        ev.preventDefault();
        dismissNotes();
      });
      card.appendChild(x);
      card.appendChild(el('h4', '', SCRIPT_TITLE));
      card.appendChild(el('div', 'ss-co-ver', 'Version ' + SCRIPT_VERSION));
      card.appendChild(el('div', 'ss-co-body', RELEASE_NOTES));
    }
    (document.body || document.documentElement).appendChild(card);
    placeSsCallout(card);
    armCalloutFollow(card);
    if (kind === 'setup') {
      var fi = card.querySelector('input');
      if (fi) setTimeout(function () { fi.focus(); }, 50);
    }
  }
  function ackNotesVersion() {
    window.__ssNotesAck = SCRIPT_VERSION;
    try {
      GM_setValue(NOTES_VER_KEY, SCRIPT_VERSION);
    } catch (e) {}
  }
  function notesVersionAcked() {
    if (window.__ssNotesAck === SCRIPT_VERSION) return true;
    var seen = '';
    try {
      seen = String(GM_getValue(NOTES_VER_KEY, '') || '');
    } catch (e) {}
    if (seen === SCRIPT_VERSION) {
      window.__ssNotesAck = SCRIPT_VERSION;
      return true;
    }
    return false;
  }
  var notesShowTimer = 0;
  function maybeShowCallout() {
    if (isPaused()) return;
    if (document.getElementById('ss-ss-callout')) {
      pinOpenCallout();
      return;
    }
    if (!document.getElementById('ss-hwy-c411-set-btn')) return;
    if (!loadOrgMc()) {
      if (window.__ssSetupSnooze) {
        setOrgMcNeeded(true);
        syncMcBadge();
        return;
      }
      setOrgMcNeeded(true);
      syncMcBadge();
      showSsCallout('setup');
      return;
    }
    if (notesVersionAcked()) return;
    if (notesShowTimer) return;
    notesShowTimer = setTimeout(function () {
      notesShowTimer = 0;
      if (isPaused() || notesVersionAcked()) return;
      if (!document.getElementById('ss-hwy-c411-set-btn')) return;
      if (document.getElementById('ss-ss-callout')) {
        pinOpenCallout();
        return;
      }
      showSsCallout('notes');
    }, 600);
  }
  function pinOpenCallout() {
    var co = document.getElementById('ss-ss-callout');
    if (co) placeSsCallout(co);
  }
  function injectSettingsBtn() {
    bindSettingsClicks();
    var existing = document.getElementById('ss-hwy-c411-set-wrap');
    if (existing && existing.isConnected && existing.querySelector('img.ss-set-icon')) {
      var existImg = existing.querySelector('img.ss-set-icon');
      if (existImg && existImg.src !== SET_LOGO) existImg.src = SET_LOGO;
      syncMcBadge();
      pinOpenCallout();
      return true;
    }
    var slot = findSettingsSlot();
    if (!slot || !slot.parent || !slot.before) return false;
    var wrap = document.getElementById('ss-hwy-c411-set-wrap');
    if (
      wrap &&
      wrap.isConnected &&
      wrap.parentNode === slot.parent &&
      wrap.nextElementSibling === slot.before &&
      !wrap.contains(slot.before) &&
      wrap.querySelector('img.ss-set-icon')
    ) {
      syncMcBadge();
      return true;
    }
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    wrap = document.createElement('div');
    wrap.id = 'ss-hwy-c411-set-wrap';
    var btn = document.createElement('div');
    btn.id = 'ss-hwy-c411-set-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Highway and Carrier411 badge settings');
    btn.tabIndex = 0;
    bindHoverTip(btn, isPaused() ? 'Paused — open settings to resume' : 'Carrier check settings');
    var logo = document.createElement('img');
    logo.className = 'ss-set-icon';
    logo.src = SET_LOGO;
    logo.alt = '';
    logo.width = 50;
    logo.height = 50;
    logo.draggable = false;
    btn.appendChild(logo);
    wrap.appendChild(btn);
    slot.parent.insertBefore(wrap, slot.before);
    syncMcBadge();
    pinOpenCallout();
    return !wrap.contains(slot.before);
  }

  function startHwyCopy() {
    if (!/^\/broker\/carriers\/\d+/.test(location.pathname)) return;
    GM_addStyle(
      '.ss-hwy-mc{color:#93c5fd!important;text-decoration:underline;cursor:pointer;font-weight:700;}'
    );
    var bound = null;
    var clip = { name: '', mc: '', dot: '' };
    function oneLine(s) {
      return String(s || '').replace(/\s+/g, ' ').trim();
    }
    function apply() {
      if (!/^\/broker\/carriers\/\d+/.test(location.pathname)) return;
      var h1 = document.querySelector('h1.carrier-name');
      if (!h1) return;
      var name = oneLine(h1.innerText);
      var row = null;
      var spans = document.querySelectorAll('span');
      var i;
      for (i = 0; i < spans.length; i++) {
        var t = oneLine(spans[i].textContent);
        if (/^MC\s+\d+$/i.test(t) && spans[i].parentElement && /gap-x-2/.test(spans[i].parentElement.className || '')) {
          row = spans[i].parentElement;
          break;
        }
      }
      if (!name || !row) return;
      var mcEl = null;
      var mcTxt = '';
      var dotTxt = '';
      for (i = 0; i < row.children.length; i++) {
        var label = oneLine(row.children[i].textContent);
        if (/^MC\s+\d+$/i.test(label)) {
          mcEl = row.children[i];
          mcTxt = label;
        } else if (/^DOT\s+\d+$/i.test(label)) {
          dotTxt = label;
        }
      }
      if (!mcEl || !mcTxt) return;
      var leftover = row.parentElement && row.parentElement.querySelector('.ss-hwy-copy');
      if (leftover) leftover.parentNode.removeChild(leftover);
      clip.name = name;
      clip.mc = mcTxt;
      clip.dot = dotTxt;
      mcEl.classList.add('ss-hwy-mc');
      mcEl.removeAttribute('title');
      if (bound === mcEl) return;
      bound = mcEl;
      bindHoverTip(mcEl, 'Copy carrier info to clipboard');
      mcEl.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        clipText(clip.name + '\n' + clip.mc + (clip.dot ? '\n' + clip.dot : ''));
        flashCopied(mcEl, 'Copy carrier info to clipboard');
      });
    }
    var wait = null;
    function scheduleHwy() {
      if (wait) return;
      wait = setTimeout(function () {
        wait = null;
        apply();
      }, 200);
    }
    if (document.body) {
      new MutationObserver(scheduleHwy).observe(document.body, { childList: true, subtree: true });
    }
    apply();
  }

  function refreshPanel() {
    if (!panelEl) return;
    var q = (panelEl.querySelector('.ss-set-search') && panelEl.querySelector('.ss-set-search').value) || '';
    renderPanelLists(q);
  }

  function isOurUiNode(n) {
    if (!n || n.nodeType !== 1) return false;
    var id = n.id || '';
    if (
      id === 'ss-intel-bar' ||
      id === 'ss-hwy-c411-set-wrap' ||
      id === 'ss-hwy-c411-set-btn' ||
      id === 'ss-hwy-c411-panel' ||
      id === 'ss-ss-callout'
    ) {
      return true;
    }
    var cls = n.className ? String(n.className) : '';
    return /(hwy-mc-wrap|ss-rate-wrap|ss-intel-msg|ss-intel-host|ss-intel-tr|ss-intel-card|ss-fast-tip|ss-eq-hi)/.test(
      cls
    );
  }
  function nodeMightHaveMc(n) {
    if (!n) return false;
    if (n.nodeType === 3) {
      var t = n.nodeValue || '';
      return /MC/i.test(t) || /\$\s*\d/.test(t) || /\d(?:\.\d{1,2})?\s*[kK]\b/.test(t);
    }
    if (n.nodeType !== 1) return false;
    if (isOurUiNode(n)) return false;
    if (n.closest && n.closest('tr.zA')) return false;
    if (n.matches && n.matches('.h7, .adn, div.kv, div.a3s, h2.hP')) return true;
    if (n.querySelector && n.querySelector('.h7, .adn, div.kv, div.a3s, h2.hP')) return true;
    var s = n.textContent || '';
    if (s.length > 4000) s = s.slice(0, 4000);
    return /MC/i.test(s) || /\$\s*\d/.test(s) || /\d(?:\.\d{1,2})?\s*[kK]\b/.test(s);
  }
  function removedNeedsScan(n) {
    if (!n || n.nodeType !== 1) return false;
    if (isOurUiNode(n)) return false;
    var cls = n.className ? String(n.className) : '';
    if (/(\bh7\b|\ba3s\b|\bhP\b)/.test(cls)) return true;
    if (n.childElementCount > 15) return true;
    return false;
  }
  function classExpandChanged(oldCls, nowCls) {
    var old = String(oldCls || '');
    var now = String(nowCls || '');
    if (/\bkv\b/.test(old) !== /\bkv\b/.test(now)) return true;
    if (/\bkQ\b/.test(old) !== /\bkQ\b/.test(now)) return true;
    if (/\bh7\b/.test(old) !== /\bh7\b/.test(now)) return true;
    return false;
  }
  var obs = new MutationObserver(function (muts) {
    if (isPaused()) {
      injectSettingsBtn();
      return;
    }
    var i;
    var j;
    for (i = 0; i < muts.length; i++) {
      var m = muts[i];
      var tgt = m.target;
      if (tgt && tgt.nodeType === 3) tgt = tgt.parentElement;
      if (tgt && tgt.closest && tgt.closest('.hwy-mc-wrap, .ss-rate-wrap, .ss-intel-msg, .ss-intel-host, tr.ss-intel-tr, #ss-intel-bar, #ss-hwy-c411-panel, #ss-hwy-c411-set-wrap, #ss-ss-callout, .ss-fast-tip, mark.ss-eq-hi')) {
        continue;
      }
      if (m.type === 'attributes') {
        if (m.attributeName === 'class' && classExpandChanged(m.oldValue, tgt && tgt.className)) {
          kickExpandScan();
          return;
        }
        if (m.attributeName === 'aria-expanded' && String(m.oldValue || '') !== String((tgt && tgt.getAttribute && tgt.getAttribute('aria-expanded')) || '')) {
          kickExpandScan();
          return;
        }
        if (m.attributeName === 'aria-hidden') {
          schedule();
          return;
        }
        continue;
      }
      if (m.addedNodes) {
        for (j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (isOurUiNode(n)) continue;
          if (
            n.nodeType === 1 &&
            n.matches &&
            n.matches('.h7, .adn, div.a3s, div.ii.gt, div.kv, .kQ')
          ) {
            kickExpandScan();
            return;
          }
          if (nodeMightHaveMc(n)) {
            var scanRoot = openThreadRoot();
            var hostMsg =
              n.nodeType === 1 &&
              n.closest &&
              (n.closest('.h7') || n.closest('div.kv') || n.closest('.adn'));
            if (scanRoot && hostMsg && !nodeInScanMessages(hostMsg, hotMessages(scanRoot))) {
              enqueueIdleMsg(hostMsg);
              continue;
            }
            schedule();
            return;
          }
        }
      }
      if (m.removedNodes && m.removedNodes.length) {
        for (j = 0; j < m.removedNodes.length; j++) {
          if (removedNeedsScan(m.removedNodes[j])) {
            schedule();
            return;
          }
        }
      }
    }
  });
  function armObserver() {
    try {
      obs.disconnect();
    } catch (e) {}
    if (isPaused()) {
      var wrap = document.getElementById('ss-hwy-c411-set-wrap');
      var host =
        (wrap && wrap.parentElement) ||
        document.querySelector('[role="banner"]') ||
        document.body;
      if (host) obs.observe(host, { childList: true, subtree: false });
      return;
    }
    var thread = openThreadRoot();
    var main = document.querySelector('[role="main"]');
    var threadOpts = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-expanded', 'aria-hidden'],
      attributeOldValue: true
    };
    if (thread) {
      obs.observe(thread, threadOpts);
      if (main && main !== thread) obs.observe(main, { childList: true, subtree: false });
      return;
    }
    if (main) obs.observe(main, { childList: true, subtree: true });
    else if (document.body) obs.observe(document.body, { childList: true, subtree: true });
  }
  function start() {
    if (/highway\.com$/i.test(location.hostname) || location.hostname.indexOf('highway.com') >= 0) {
      startHwyCopy();
      return;
    }
    if (/carrier411\.com$/i.test(location.hostname) || location.hostname.indexOf('carrier411.com') >= 0) {
      startC411PageHint();
      return;
    }
    if (!document.body) {
      setTimeout(start, 300);
      return;
    }
    function bindCopyFilter() {
      if (window.__ssHwyCopyBound) return;
      window.__ssHwyCopyBound = true;
      document.addEventListener(
        'copy',
        function (ev) {
          var sel = window.getSelection();
          if (!sel || sel.isCollapsed || !sel.rangeCount) return;
          var i;
          var hit = false;
          for (i = 0; i < sel.rangeCount; i++) {
            var range = sel.getRangeAt(i);
            var node = range.commonAncestorContainer;
            if (node.nodeType === 3) node = node.parentNode;
            if (!node) continue;
            if (node.nodeType === 1 && isHwyBadgeSkipClass(node.className)) {
              hit = true;
              break;
            }
            if (node.closest && node.closest('.hwy-mc-badges, .ss-intel-msg, #ss-intel-bar')) {
              hit = true;
              break;
            }
            if (node.querySelector && node.querySelector('.hwy-mc-badges')) {
              hit = true;
              break;
            }
          }
          if (!hit || !ev.clipboardData) return;
          var holder = document.createElement('div');
          for (i = 0; i < sel.rangeCount; i++) {
            holder.appendChild(sel.getRangeAt(i).cloneContents());
          }
          var cleaned = stripBadgeClassChunks(holder.innerHTML);
          var tmp = document.createElement('div');
          tmp.innerHTML = cleaned;
          var text = String(tmp.innerText || tmp.textContent || '')
            .replace(/[ \t\u00a0]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n');
          ev.preventDefault();
          ev.clipboardData.setData('text/plain', text);
          ev.clipboardData.setData('text/html', cleaned);
        },
        true
      );
    }
    bindCopyFilter();
    resetHwyCacheOnUpdate();
    if (!isPaused()) probeSessions();
    window.addEventListener('resize', function () {
      if (isPaused()) return;
      var c = document.getElementById('ss-ss-callout');
      if (c) placeSsCallout(c);
    });
    if (isPaused()) {
      injectSettingsBtn();
      armObserver();
    } else {
      scanNow();
      armObserver();
    }
    window.addEventListener('hashchange', kickScan);
    window.addEventListener('popstate', kickScan);
    document.addEventListener(
      'click',
      function (ev) {
        if (isPaused()) {
          injectSettingsBtn();
          return;
        }
        var n = ev.target;
        if (n && n.closest && n.closest('tr.zA')) kickScan();
        if (clickLooksLikeCollapsedMsg(ev) || clickLooksLikeExpandAll(ev)) kickExpandScan();
      },
      true
    );
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && panelEl) closePanel();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        persistCaches();
        obs.disconnect();
        return;
      }
      if (isPaused()) {
        injectSettingsBtn();
        armObserver();
        return;
      }
      armObserver();
      kickScan();
      probeSessions();
      refreshC411WrapsFromCache();
      retryClickedC411();
    });
  }
  start();
})();
