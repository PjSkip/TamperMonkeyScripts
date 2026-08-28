// ==UserScript==
// @name         Gmail Highway Carrier411 MC badges
// @namespace    shipsierra.highway.gmail
// @version      1.17.14
// @description  Conversation bar + compact MC chips in Gmail from Highway and Carrier411. DNU, identity, domain match (never your logged-in domain), FreightGuard. Settings on the bar. Click MC copies the number. Open C411 tab fills FreightGuard after sign-in.
// @author       Ivan Karpenko
// @homepageURL  https://github.com/PjSkip/TamperMonkeyScripts
// @updateURL    https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/GmailHighwayCarrier411MCBadges.user.js
// @downloadURL  https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/GmailHighwayCarrier411MCBadges.user.js
// @match        https://mail.google.com/*
// @match        https://inbox.google.com/*
// @match        https://www.carrier411.com/*
// @match        https://carrier411.com/*
// @match        https://highway.com/broker/carriers/*
// @match        https://*.highway.com/broker/carriers/*
// @connect      highway.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_addValueChangeListener
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  var IGNORE_MC = { '137469': true };
  var IGNORE_DOT = { '3192183': true };
  var CACHE_KEY = 'hwy_mc_cache_v9';
  var C411_CACHE_KEY = 'c411_fg_cache_v1';
  var SETTINGS_KEY = 'hwy_c411_badge_settings_v3';
  var HWY_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHGSURBVHgB7ZZNTsJQEMdnWqWwqwsjyx5BtxJjOQF6AnoDuYF4MkgMuhRPQNlh3LCyBdOOry2B8j4LYWd/m5fMTOf937yPKUBNzX8HTQHRpD1EpGfOPG3eft2UDfHb1YwNXtlGhC+tzmIIGiwwKUTqC0aCucT2KSRHegIDWgHRa9sHblWFKgh5UwqijQDcTY7jBICdBgpPCBVE5RPY+iooBUSjtoeAfZmPEpwK8xMuFal8GrkuHCoAGuCrXLaVCJPZkExlsdk2rBwngEMFIKTK0jU638JkiWWrKpDRU88jYT25vE7R+gA1ocLuqT5g29Zt3S3GvP1MFpwgDgwPhAcHgjY9sGHM26VbwA7fPZwYtqC+7DAKAtjLF8ARKzSRHcYfp+WDSYD05TsRtuRg7211fvcdmoGeUO0iVmJ0QYOzWl1gd7m9MfuHsAEBGLAofZRdw4zonS2A9AuIG80BG4bbfGVnlfKfr39Dla8Zx7q3oJiQa1BbAcrGU4Lt17JcPsGf+0grgm9QuwqoG0/54xDMQcaYcoPKBegaD5d8bowBrBCza1BFBTSNZz+3eXVphSqVG5RV5E2Nfy4bQmNEBZEbelBTU8P4A46qjYFyL5/4AAAAAElFTkSuQmCC';
  var C411_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAC1UlEQVR4nMSWTUwTQRTHZ5cWqkAopAoVFA2CihEwaow1ICSGg0D0oKLx4MFEL3Iw4SAYY4gQ4sfJePOgXvwIEBWDMR4Uw4cGjdHwWTCBgBJaU8XWUtvd7vp/W7M0bS3hsOs7/Dp9b2by/pl5b9ZQd+sUY2xi1s7+bUFRjvJIbCnLz9oE8kxjM3yeG8cPx3Mxw6FMOSUNn/83aE23gmvSc0D3ghu0fx0FjXxixFr7LPm1VxA/LAZFcNv6ErDlxDUw2ZQaMcfrIx2tbc1gz3A3bcovbqu5Au5AS2nMgBAQwMrt1WD9wQvgT28AvN7eC844f4A5Gcng6ard4LqsdPBqB+l4NvAUTOATdFJQFifc1dgNTjt/gYdbO0DB71ejkt+rju+erwVL8rPBo601oMvjYrrcoqgCCIp0cyqLq5V/FG560E9+iWqCNxrJLfgolkD5ZaaZwK7+IVVBedF+sK33vi4KuOgS5qjzZJqzVMebiTkwxUBTZUVfqBPJEs0szKWZVbZC0PGdTiV1BdWKLMvsf1Uyp+KvyXLMxaFTsVrSGNU8jc0ppsUNlOT1OAMuLKMg5SITR78Mqf4jtnyw8+2Ymlgor2yLGaw/VgG2vfwA7tycCzrm6cx4TpdKNsjKnQkI1GdKt5SDeavpJbIV7FMnXay1gdMO6j/vxmYUH2UmiKT1Sc8gWLO3GPT4PGDnQDtoMq5keigI9byGQ01gxdbKiPCUc1Id3z5HtT00+Q3sG5kCC9dawNKiDeqcszfPgEmJdJdkpVq076YuN2WUkWqJGS67RG+ZOTkDPL7nJLhj4y6wwEp1Oz47Ar6fGADv9d4BA8orEm7aK5CjqtS9MA82P6JXbHD6U0RUFMSYGxk4Y0y/vgpeDb8Abzy/AgbEAFu+SVGLtFcgKR3x8uNGsM/+GkwyGJdcFhTiRaWwL1ftFTQ8rGN0Wz6y5ZskcHGieauoB2uu4A8AAAD//1ZDwTcAAAAGSURBVAMARiLtUypmc+4AAAAASUVORK5CYII=';
  var SEARCH_URL = 'https://highway.com/broker/carriers/search-results?q=';
  var C411_URL = 'https://www.carrier411.com/manager/companydetail.cfm?docket=';
  var API_SEARCH_BASE =
    'https://highway.com/monitor/api/v1/carriers/global_search?page=1' +
    '&q%5Bs%5D=legal_name_search+asc';
  var MC_GAP = '[\\s\\u00a0\\u2007\\u202f\\u200b\\u200c\\u200d\\ufeff\\-#.:\\uFF1A]*';
  var MC_FILL = '(?:is|no|num(?:ber)?)?';
  var MC_LEAD = '^[\\s\\u00a0\\u2007\\u202f\\u200b\\u200c\\u200d\\ufeff\\-#.:\\uFF1A]*';
  var MC_RE = new RegExp('\\bMC' + MC_GAP + MC_FILL + MC_GAP + '([0-9]{4,8})\\b', 'gi');
  var MC_TEST = new RegExp('\\bMC' + MC_GAP + MC_FILL + MC_GAP + '[0-9]{4,8}\\b', 'i');
  var MC_AFTER_RE = new RegExp('\\b([0-9]{4,8})' + MC_GAP + 'MC\\b', 'gi');
  var MC_AFTER_TEST = new RegExp('\\b[0-9]{4,8}' + MC_GAP + 'MC\\b', 'i');
  var MC_ASK = /\bmc(?:\s*(?:#|no\.?|num(?:ber)?))?\b|\bmotor\s*carrier\b/i;
  var BARE_MC_REPLY = /^\s*#?\s*([0-9]{5,8})\s*\.?\s*$/;
  var HWY_CHECK =
    "data:image/svg+xml,%3csvg%20width='13'%20height='13'%20viewBox='0%200%2013%2013'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M6.30466%2012.2119C9.35139%2012.2119%2011.8212%209.74201%2011.8212%206.69529C11.8212%205.8144%2011.6148%204.98173%2011.2476%204.24303L6.49714%208.99348L5.93988%209.55074L5.38262%208.99348L2.95534%206.56621L4.06986%205.45169L5.93988%207.32171L10.3341%202.92748C9.32739%201.8513%207.89458%201.17871%206.30466%201.17871C3.25794%201.17871%200.788086%203.64857%200.788086%206.69529C0.788086%209.74201%203.25794%2012.2119%206.30466%2012.2119Z'%20fill='%2354C774'/%3e%3c/svg%3e";
  var MC_END = new RegExp('MC(?:\\b' + MC_GAP + MC_FILL + MC_GAP + ')$', 'i');
  var MC_NEXT = new RegExp(MC_LEAD + '([0-9]{4,8})\\b');
  var NUM_END = /([0-9]{4,8})[ \u00a0\u2007\u202f\u200b]*$/;
  var MC_ONLY = new RegExp(MC_LEAD + 'MC\\b', 'i');
  var MC_PUNCT = new RegExp('^[\\s\\u00a0\\u2007\\u202f\\u200b\\u200c\\u200d\\ufeff\\-#.:\\uFF1A]*$');

  var HWY_FIELD_META = {
    assessment: { label: 'Pass / Fail', source: 'Highway rules_assessment.summary.overall_result' },
    units: { label: 'Power units', source: 'Highway equipment_portfolio.total_observed_power_units' },
    safety: { label: 'Safety (BASIC)', source: 'Highway sms_basics.unsafe_driving_measure (Unsafe Driving)' },
    alerts: { label: 'Identity alerts (ID OK / DB)', source: 'Highway identity_alerts — open alerts and type' },
    cargo: { label: 'Cargo insurance (C.INS 250k)', source: 'Highway COI cargo coverage limit' },
    bipd: { label: 'Auto liability (BIPD 1M)', source: 'Highway COI auto / BIPD coverage limit' },
    connection: { label: 'Connected / No Connect', source: 'Yellow Connected only if Highway status is onboarded/connected. Any other status (Connect, connecting, none) is a red No Connect pill.' },
    dnu: { label: 'Do Not Use (DNU)', source: 'Highway Do Not Use switch (connection.status do_not_dispatch)' },
    domain: { label: 'Email domain match', source: 'Green check: exact Highway email, or same unique company domain. Public (Gmail/Yahoo/iCloud): Unmatched (yellow) if Highway has that brand but a different address; Bad email (red) if Highway does not. Unique domain with no match: Domain NOT Match (red).' }
  };
  var C411_FIELD_META = {
    fg: { label: 'FreightGuard (FG 8/12/26)', source: 'Carrier411 Reported Items date' },
    rating: { label: 'Safety rating (SAT/COND/UNSAT)', source: 'Carrier411 Safety Rating' },
    related: { label: 'Related companies (Related cos)', source: 'Carrier411 “Related companies detected” on the company page' }
  };

  GM_addStyle(
    '.hwy-mc-wrap{display:inline-block;white-space:nowrap;vertical-align:middle;}' +
      '.hwy-mc-link{color:#1a73e8;text-decoration:underline;font-weight:600;cursor:pointer;' +
      '-webkit-user-select:text;user-select:text;}' +
      '.hwy-mc-copied{display:inline-block;margin:0 2px 0 4px;color:#15803d;font-weight:800;font-size:13px;vertical-align:middle;}' +
      '.hwy-mc-badges,.hwy-mc-badges *,.hwy-mc-copied{' +
      '-webkit-user-select:none !important;user-select:none !important;}' +
      '.hwy-mc-badges{display:inline-flex;align-items:center;gap:5px;margin:0 0 0 6px;vertical-align:middle;}' +
      '.hwy-mc-box{display:inline-flex;align-items:center;gap:5px;margin:0;padding:2px 7px 2px 6px;vertical-align:middle;' +
      'font:11px/1.2 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
      'background:#F3F6F9;border:1px solid #C5CDD6;border-radius:8px;box-shadow:0 1px 2px rgba(16,24,40,.08);}' +
      '.hwy-mc-hit,.hwy-c411-hit{display:inline-flex;align-items:center;gap:4px;cursor:pointer;}' +
      '.hwy-mc-hit:hover,.hwy-c411-hit:hover{opacity:.85;}' +
      '.hwy-mc-logo{display:block;width:16px;height:16px;object-fit:contain;flex-shrink:0;border-radius:3px;}' +
      '.hwy-mc-pill{display:inline-flex;align-items:center;gap:3px;border-radius:999px;padding:1px 6px;font-weight:700;border:1px solid transparent;white-space:nowrap;}' +
      '.hwy-mc-pill .hwy-check{width:13px;height:13px;display:block;flex:none;}' +
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
      '#ss-hwy-c411-set-wrap{display:inline-flex;align-items:center;justify-content:center;flex:none;position:static;' +
      'z-index:auto;margin:0 4px 0 0;vertical-align:middle;}' +
      '#ss-hwy-c411-set-btn{width:40px;height:40px;min-width:40px;min-height:40px;border-radius:50%;cursor:pointer;flex:none;' +
      'display:inline-flex;align-items:center;justify-content:center;position:relative;margin:0;' +
      'background:transparent;border:0;padding:0;outline:none;z-index:auto;box-sizing:border-box;color:#5f6368;}' +
      '#ss-hwy-c411-set-btn:hover{background:rgba(60,64,67,.08);}' +
      '#ss-hwy-c411-set-btn .ss-set-gear{display:block;width:24px;height:24px;}' +
      '#ss-hwy-c411-set-btn img{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:0;' +
      'transform:translate(-50%,-50%);pointer-events:none;border-radius:2px;}' +
      '.ss-intel-host{display:block;margin:1px 0 0;padding:0;text-align:right;max-width:100%;}' +
      'tr.ss-intel-tr td{padding:0 calc(2px + var(--ss-time-pad, 0px)) 1px 0 !important;text-align:right !important;vertical-align:top;' +
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
      '.ss-copy-btn{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;margin:0 1px 0 2px;' +
      'border:0;background:transparent;color:#5f6368;cursor:pointer;flex:none;vertical-align:middle;line-height:0;' +
      'transition:color .12s ease,transform .12s ease;}' +
      '.ss-copy-btn:hover{color:#1a73e8;}' +
      '.ss-copy-btn.ss-copied{color:#15803d;}' +
      '.ss-copy-btn.ss-copied svg{animation:ss-copy-pop .28s ease;}' +
      '@keyframes ss-copy-pop{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}' +
      '.ss-intel-msg .ss-intel-mc{color:#1a73e8;font-weight:700;cursor:pointer;}' +
      '.ss-intel-msg .ss-intel-note{color:#9b1b30;font-weight:700;font-size:10px;}' +
      '.ss-intel-msg .ss-intel-pills{display:inline-flex;flex-wrap:wrap;justify-content:flex-start;gap:3px;align-items:center;margin:0;min-width:0;}' +
      '.ss-intel-msg .hwy-mc-hit,.ss-intel-msg .hwy-c411-hit{display:inline-flex;align-items:center;gap:3px;flex-wrap:wrap;min-width:0;}' +
      '.ss-fast-tip{position:fixed;z-index:2147483647;max-width:360px;padding:6px 8px;border-radius:6px;' +
      'background:#202124;color:#fff;font:12px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
      'white-space:pre-wrap;box-shadow:0 6px 18px rgba(15,23,42,.28);pointer-events:none;}' +
      '#ss-hwy-c411-panel{position:fixed !important;top:0 !important;right:0 !important;bottom:0 !important;left:auto !important;' +
      'width:360px !important;max-width:92vw !important;height:100vh !important;height:100dvh !important;' +
      'margin:0 !important;border:0 !important;padding:0 !important;transform:none !important;' +
      'z-index:2147483647 !important;background:#fff !important;color:#202124 !important;' +
      'box-shadow:-8px 0 28px rgba(15,23,42,.22) !important;display:flex !important;flex-direction:column !important;' +
      'font:13px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif !important;' +
      'visibility:visible !important;opacity:1 !important;pointer-events:auto !important;overflow:hidden !important;}' +
      '#ss-hwy-c411-panel:not(.ss-open){right:-380px !important;}' +
      '#ss-hwy-c411-panel.ss-open,#ss-hwy-c411-panel:popover-open{right:0 !important;inset:0 0 0 auto !important;}' +
      '#ss-hwy-c411-panel .ss-set-head{display:flex;align-items:center;gap:8px;padding:12px 12px 10px;border-bottom:1px solid #e8eaed;}' +
      '#ss-hwy-c411-panel .ss-set-head img{width:16px;height:16px;border-radius:3px;}' +
      '#ss-hwy-c411-panel .ss-set-title{font-weight:700;font-size:14px;flex:1;}' +
      '#ss-hwy-c411-panel .ss-set-close{width:28px;height:28px;border:0;background:#f1f3f4;border-radius:50%;cursor:pointer;font-size:16px;line-height:28px;color:#3c4043;}' +
      '#ss-hwy-c411-panel .ss-set-close:hover{background:#e8eaed;}' +
      '#ss-hwy-c411-panel .ss-set-search{margin:10px 12px 8px;padding:8px 10px;border:1px solid #dadce0;border-radius:8px;width:auto;font:13px/1.3 inherit;}' +
      '#ss-hwy-c411-panel .ss-set-body{flex:1 1 auto;overflow:auto;padding:8px;min-height:240px;}' +
      '#ss-hwy-c411-panel .ss-set-sec{margin:10px 4px 6px;padding:8px 8px 6px;border:1px solid #e8eaed;border-radius:10px;background:#fafbfc;}' +
      '#ss-hwy-c411-panel .ss-set-sec h3{display:flex;align-items:center;gap:6px;margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#5f6368;}' +
      '#ss-hwy-c411-panel .ss-set-sec h3 img{width:14px;height:14px;border-radius:3px;}' +
      '#ss-hwy-c411-panel .ss-set-row{display:flex !important;align-items:center;gap:8px;padding:8px 6px;border-radius:6px;cursor:pointer;min-height:36px;color:#202124;font-size:13px;line-height:1.3;}' +
      '#ss-hwy-c411-panel .ss-set-row:hover{background:#eef2f6;}' +
      '#ss-hwy-c411-panel .ss-set-row.ss-hidden-row{display:none !important;}' +
      '#ss-hwy-c411-panel .ss-set-grip{color:#9aa0a6;font-size:14px;letter-spacing:-1px;user-select:none;cursor:grab;}' +
      '#ss-hwy-c411-panel .ss-set-check{width:18px;height:18px;flex:none;border:2px solid #5f6368;border-radius:4px;background:#fff;color:#fff;text-align:center;font:700 12px/14px sans-serif;box-sizing:border-box;}' +
      '#ss-hwy-c411-panel .ss-set-check[aria-checked="true"]{background:#1a73e8;border-color:#1a73e8;}' +
      '#ss-hwy-c411-panel .ss-set-lab{flex:1;cursor:pointer;color:#202124;font-size:13px;}' +
      '#ss-hwy-c411-shade{position:fixed;inset:0;z-index:2147483646;background:rgba(15,23,42,.12);display:none;}' +
      '#ss-hwy-c411-shade.ss-open{display:block;}'
  );

  /* ---test-export-start--- */
  function digits(s) {
    return String(s || '').replace(/\D/g, '');
  }
  function normMc(s) {
    var d = digits(s);
    if (!d) return '';
    return String(Number(d));
  }
  function shouldIgnore(mc) {
    return !!(IGNORE_MC[mc] || IGNORE_DOT[mc]);
  }
  function copyMcText(mc) {
    var n = normMc(mc);
    return n ? 'MC ' + n : '';
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
  function defaultSettings() {
    return {
      ui: 'both',
      hwy: [
        { id: 'assessment', on: true },
        { id: 'units', on: true },
        { id: 'safety', on: true },
        { id: 'alerts', on: true },
        { id: 'cargo', on: false },
        { id: 'bipd', on: false },
        { id: 'connection', on: true },
        { id: 'dnu', on: true },
        { id: 'domain', on: true }
      ],
      c411: [
        { id: 'fg', on: true },
        { id: 'rating', on: false },
        { id: 'related', on: false }
      ]
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
    var ui = saved.ui === 'bar' || saved.ui === 'inline' || saved.ui === 'both' ? saved.ui : 'both';
    return { ui: ui, hwy: merge(d.hwy, saved.hwy), c411: merge(d.c411, saved.c411) };
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
    if (v === 0) return '0';
    if (v >= 1000000) {
      var m = v / 1000000;
      var ms = m % 1 === 0 ? String(m) : String(Math.round(m * 10) / 10);
      return ms.replace(/\.0$/, '') + 'M';
    }
    if (v >= 1000) {
      var k = v / 1000;
      var ks = k % 1 === 0 ? String(k) : String(Math.round(k));
      return ks + 'k';
    }
    return String(Math.round(v));
  }
  function cargoPill(amount) {
    if (amount == null || amount === '') return null;
    var s = moneyShort(amount);
    if (s == null) return null;
    var n = Number(amount);
    return {
      text: 'C.INS ' + s,
      cls: n > 0 ? 'hwy-mc-pass' : 'hwy-mc-fail',
      title: 'Cargo insurance ' + (n > 0 ? '$' + Number(n).toLocaleString() : 'none on file')
    };
  }
  function bipdPill(amount) {
    if (amount == null || amount === '') return null;
    var s = moneyShort(amount);
    if (s == null) return null;
    var n = Number(amount);
    return {
      text: 'BIPD ' + s,
      cls: n >= 750000 ? 'hwy-mc-pass' : n > 0 ? 'hwy-mc-basic-mid' : 'hwy-mc-fail',
      title: 'Auto liability (BIPD) ' + (n > 0 ? '$' + Number(n).toLocaleString() : 'none on file')
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
    var line1;
    if (!from || kind === 'none') line1 = 'No carrier email in this message';
    else if (kind === 'team') line1 = from + ' is a team email';
    else if (kind === 'exact') line1 = from + ' matches Highway email';
    else if (kind === 'domain') line1 = from + ' domain matches Highway';
    else if (kind === 'unmatched') line1 = from + ' is not the Highway address';
    else if (kind === 'bad') line1 = from + ' is not on Highway';
    else line1 = from + ' does not match Highway email';
    if (!list.length) return line1;
    return line1 + '\n' + list.join(', ');
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
    return /(^|\s)(hwy-mc-badges|hwy-mc-copied)(\s|$)/.test(String(cls || ''));
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
    stripOne('hwy-mc-copied');
    return s.replace(/[ \t\u00a0]{2,}/g, ' ');
  }
  /* ---test-export-end--- */

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
    if (n === 0) return 'hwy-mc-pass';
    if (n > 0 && n <= 3) return 'hwy-mc-basic-mid';
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
    try {
      var raw = GM_getValue(SETTINGS_KEY, 'null');
      if (!raw || raw === 'null') raw = GM_getValue('hwy_c411_badge_settings_v2', 'null');
      settingsMem = mergeSettings(JSON.parse(raw));
    } catch (e) {
      settingsMem = defaultSettings();
    }
    return settingsMem;
  }
  function saveSettings(s) {
    settingsMem = s;
    try {
      GM_setValue(SETTINGS_KEY, JSON.stringify(s));
    } catch (e) {}
    try {
      if (typeof applyUiMode === 'function') applyUiMode();
    } catch (e2) {}
  }
  function extrasOn(which, ids) {
    var list = loadSettings()[which] || [];
    return list.some(function (x) {
      return x.on && ids.indexOf(x.id) >= 0;
    });
  }

  var hwyCacheMem = null;
  var c411CacheMem = null;
  var cacheWriteTimer = 0;
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
    if (extrasOn('hwy', ['connection', 'dnu']) && hit.connStatus === undefined) return true;
    if (extrasOn('hwy', ['domain']) && !Array.isArray(hit.emails)) return true;
    if (hit.name && hit.dot == null) return true;
    return false;
  }
  function getCached(mc) {
    var all = readCache();
    var hit = all[mc];
    if (!hit || !hit.ts || hit.login) return null;
    if (!sameLocalDay(hit.ts)) return null;
    if (cacheNeedsHwyExtras(hit)) return null;
    return hit;
  }
  function setCached(mc, data) {
    var all = readCache();
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
      connStatus: data.connStatus == null ? null : data.connStatus,
      dnu: !!data.dnu,
      dnuNote: data.dnuNote || '',
      emails: Array.isArray(data.emails) ? data.emails : [],
      id: data.id || null,
      dot: data.dot ? String(data.dot) : '',
      ts: Date.now()
    };
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
  function gmGet(url) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        anonymous: false,
        headers: { Accept: 'application/json' },
        onload: function (res) {
          if (looksLikeHwyLogin(res)) {
            reject(hwyLoginError());
            return;
          }
          if (res.status < 200 || res.status >= 300) {
            reject(new Error('HTTP ' + res.status));
            return;
          }
          try {
            resolve(JSON.parse(res.responseText));
          } catch (e) {
            if (looksLikeHwyLogin(res) || /<html|<!doctype/i.test(res.responseText || '')) {
              reject(hwyLoginError());
              return;
            }
            reject(e);
          }
        },
        onerror: function () {
          reject(new Error('network'));
        }
      });
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

  function readC411Jobs() {
    try {
      return JSON.parse(GM_getValue('c411_jobs', '{}') || '{}');
    } catch (e) {
      return {};
    }
  }
  function writeC411Jobs(jobs) {
    GM_setValue('c411_jobs', JSON.stringify(jobs || {}));
  }
  function jobIsPending(v) {
    return v === 'pending' || (v && typeof v === 'object' && v.status === 'pending');
  }
  function enqueueC411Job(mc) {
    var jobs = readC411Jobs();
    jobs[mc] = 'pending';
    writeC411Jobs(jobs);
    GM_setValue('c411_wake', Date.now());
  }
  function dropC411Job(mc) {
    var jobs = readC411Jobs();
    delete jobs[mc];
    writeC411Jobs(jobs);
  }

  function c411WorkerAlive() {
    var ping = Number(GM_getValue('c411_worker_ping', 0) || 0);
    return ping && Date.now() - ping < 3 * 60 * 1000;
  }
  function requestOpenC411(mc) {
    GM_setValue(
      'c411_open',
      JSON.stringify({ docket: docketFromMc(mc), ts: Date.now() })
    );
  }

  var c411Inflight = {};
  var c411Waiters = {};
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
  function notifyC411Waiters() {
    Object.keys(c411Waiters).forEach(function (mc) {
      var hit = getC411Cached(mc);
      if (!hit) return;
      var fn = c411Waiters[mc];
      delete c411Waiters[mc];
      fn(hit);
    });
  }
  if (typeof GM_addValueChangeListener === 'function') {
    GM_addValueChangeListener(C411_CACHE_KEY, function () {
      c411CacheMem = null;
      notifyC411Waiters();
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
  function lookupC411(mc, force) {
    if (force) {
      forgetC411Cached(mc);
      delete c411Inflight[mc];
    }
    var cached = getC411Cached(mc);
    if (cached) return Promise.resolve(cached);
    if (c411Inflight[mc]) return c411Inflight[mc];
    if (!force && !c411WorkerAlive()) {
      return Promise.resolve({
        ok: false,
        hasFg: false,
        login: true,
        needTab: true,
        error: false
      });
    }
    enqueueC411Job(mc);
    c411Inflight[mc] = new Promise(function (resolve) {
      var start = Date.now();
      var lastKick = 0;
      var tid;
      var maxMs = force ? 45000 : 20000;
      function done(val) {
        if (tid) clearTimeout(tid);
        delete c411Waiters[mc];
        delete c411Inflight[mc];
        resolve(val);
      }
      function check() {
        var hit = getC411Cached(mc);
        if (hit) {
          done(hit);
          return true;
        }
        var now = Date.now();
        if (now - start > maxMs) {
          dropC411Job(mc);
          done({
            ok: false,
            hasFg: false,
            login: false,
            error: true
          });
          return true;
        }
        if (now - lastKick > 2500) {
          lastKick = now;
          enqueueC411Job(mc);
        }
        return false;
      }
      c411Waiters[mc] = function (hit) {
        done(hit);
      };
      function poll() {
        if (check()) return;
        var elapsed = Date.now() - start;
        var wait = elapsed < 4000 ? 250 : force ? 900 : 600;
        tid = setTimeout(poll, wait);
      }
      poll();
    });
    return c411Inflight[mc];
  }

  function startC411Worker() {
    var busy = false;
    var heartbeatTimer = null;
    var workTimer = null;
    function heartbeat() {
      GM_setValue('c411_worker_ping', Date.now());
    }
    function startHeartbeat() {
      if (heartbeatTimer) return;
      heartbeat();
      heartbeatTimer = setInterval(heartbeat, 5000);
    }
    function stopWorkTimer() {
      if (!workTimer) return;
      clearInterval(workTimer);
      workTimer = null;
    }
    function armWorkTimer() {
      if (workTimer) return;
      workTimer = setInterval(function () {
        if (!nextPending()) {
          stopWorkTimer();
          return;
        }
        tick();
      }, 1000);
    }
    startHeartbeat();

    function nextPending() {
      var jobs = readC411Jobs();
      var keys = Object.keys(jobs);
      for (var i = 0; i < keys.length; i++) {
        if (jobIsPending(jobs[keys[i]])) return keys[i];
      }
      return null;
    }
    function finish(mc) {
      var jobs = readC411Jobs();
      delete jobs[mc];
      writeC411Jobs(jobs);
    }
    function tick() {
      heartbeat();
      if (busy) return;
      var mc = nextPending();
      if (!mc) {
        stopWorkTimer();
        return;
      }
      armWorkTimer();
      if (getC411Cached(mc)) {
        finish(mc);
        return;
      }
      busy = true;
      var url = 'https://www.carrier411.com/manager/companydetail.cfm?docket=' + encodeURIComponent(docketFromMc(mc));
      fetch(url, { credentials: 'include', headers: { Accept: 'text/html' } })
        .then(function (r) {
          if (r.status === 429) throw new Error('429');
          return r.text();
        })
        .then(function (html) {
          var parsed = parseC411Page(html);
          if (/unauthorized=1|link\.cfm/i.test(html) || (/unauthorized/i.test(html) && !/USDOT\s+\d+/i.test(html))) {
            parsed = { ok: false, hasFg: false, login: true };
          }
          setC411Cached(mc, parsed.login ? { hasFg: false, login: true, ok: false } : parsed);
          finish(mc);
        })
        .catch(function () {
          finish(mc);
          setC411Cached(mc, { hasFg: false, login: false, ok: false, error: true });
        })
        .then(function () {
          busy = false;
          setTimeout(tick, 500);
        });
    }

    function handleOpenRequest() {
      var raw = GM_getValue('c411_open', '');
      if (!raw) return;
      var req = null;
      try {
        req = JSON.parse(raw);
      } catch (e) {
        return;
      }
      if (!req || !req.docket || !req.ts) return;
      if (Date.now() - req.ts > 8000) return;
      if (req.done) return;
      req.done = true;
      GM_setValue('c411_open', JSON.stringify(req));
      window.open(
        'https://www.carrier411.com/manager/companydetail.cfm?docket=' + encodeURIComponent(req.docket),
        '_blank'
      );
    }

    if (typeof GM_addValueChangeListener === 'function') {
      GM_addValueChangeListener('c411_jobs', function () {
        armWorkTimer();
        tick();
      });
      GM_addValueChangeListener('c411_wake', function () {
        armWorkTimer();
        tick();
      });
      GM_addValueChangeListener('c411_open', function () {
        handleOpenRequest();
      });
    } else {
      armWorkTimer();
    }
    tick();

    function cacheLiveDocket() {
      try {
        var m = String(location.search || '').match(/docket=MC0*(\d+)/i);
        if (!m) return;
        var liveMc = String(Number(m[1]));
        var live = parseC411Page(document.documentElement.innerHTML || '');
        if (!live.login) setC411Cached(liveMc, live);
      } catch (e) {}
    }
    cacheLiveDocket();
    window.addEventListener('pageshow', function () {
      cacheLiveDocket();
      tick();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      cacheLiveDocket();
      tick();
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
    var cargo = pickCargoLimit(obj);
    if (cargo != null) result.cargoAmt = cargo;
    var bipd = pickBipdLimit(obj);
    if (bipd != null) result.bipdAmt = bipd;
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
  function fetchHwy(mc) {
    return gmGet(searchUrlExact(mc))
      .then(function (data) {
        var best = pickCarrierByMc(data, mc);
        if (best) return best;
        return gmGet(searchUrlPrefix(mc)).then(function (data2) {
          return pickCarrierByMc(data2, mc);
        });
      })
      .then(function (best) {
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
          connStatus: null,
          dnu: false,
          emails: [],
          id: best.id || null,
          dot: pickDot(best) || ''
        };
        applyHwyExtras(result, best);
        applyHwyConn(result, best);
        if (best.id) {
          var detailUrl = 'https://highway.com/monitor/api/v1/carriers/' + best.id;
          var safetyUrl = detailUrl + '/safety';
          var wantConn = extrasOn('hwy', ['connection', 'dnu']);
          var wantSafety = extrasOn('hwy', ['safety']);
          return Promise.all([
            gmGet(detailUrl).catch(function () {
              return null;
            }),
            wantSafety
              ? gmGet(safetyUrl).catch(function () {
                  return null;
                })
              : Promise.resolve(null),
            wantConn
              ? gmGet(connectionsUrl(best.id)).catch(function () {
                  return null;
                })
              : Promise.resolve(null)
          ]).then(function (pair) {
            var detail = pair[0];
            var safety = pair[1];
            var conns = pair[2];
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
            var sdet = pickSafetyDetail(safety) || pickSafetyDetail(detail);
            if (sdet) {
              result.safety = sdet.value;
              result.safetyParts = sdet.parts;
              result.safetyDate = sdet.date;
            }
            setCached(mc, result);
            return result;
          });
        }
        setCached(mc, result);
        return result;
      })
      .catch(function (err) {
        var login = !!(err && err.code === 'login');
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
          connStatus: null,
          dnu: false,
          emails: [],
          id: null,
          dot: '',
          nocache: true
        };
      });
  }
  function lookupMc(mc) {
    var cached = getCached(mc);
    if (cached) return Promise.resolve(cached);
    if (inflight[mc]) return inflight[mc];
    inflight[mc] = new Promise(function (resolve) {
      function start() {
        hwyActive += 1;
        fetchHwy(mc).then(function (res) {
          hwyActive -= 1;
          delete inflight[mc];
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
    return n >= 10 ? 'hwy-mc-units-ok' : 'hwy-mc-units-low';
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var fastTipEl = null;
  var fastTipTimer = 0;
  function hideFastTip() {
    if (fastTipTimer) {
      clearTimeout(fastTipTimer);
      fastTipTimer = 0;
    }
    if (fastTipEl && fastTipEl.parentNode) fastTipEl.parentNode.removeChild(fastTipEl);
    fastTipEl = null;
  }
  function showFastTip(anchor, text, delay) {
    hideFastTip();
    if (!text || !anchor) return;
    var wait = delay == null ? 160 : delay;
    function place() {
      fastTipTimer = 0;
      if (fastTipEl && fastTipEl.parentNode) fastTipEl.parentNode.removeChild(fastTipEl);
      fastTipEl = el('div', 'ss-fast-tip', text);
      (document.documentElement || document.body).appendChild(fastTipEl);
      var r = anchor.getBoundingClientRect();
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
  document.addEventListener('scroll', hideFastTip, true);
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
  function addPill(parent, cls, text, title, fast) {
    var p = el('span', 'hwy-mc-pill ' + cls, text);
    if (title && fast) {
      p.addEventListener('mouseenter', function () {
        showFastTip(p, title);
      });
      p.addEventListener('mouseleave', hideFastTip);
    } else if (title) {
      p.title = title;
    }
    parent.appendChild(p);
    return p;
  }

  function paintHwyPills(hwyHit, state, fromAddr, compact) {
    hwyHit.appendChild(logoImg(HWY_LOGO, 'Highway'));
    if (state.hwy && state.hwy.login) {
      addPill(hwyHit, 'hwy-mc-wait', 'Sign in', 'Sign in to Highway');
      hwyHit.title = 'Sign in to Highway';
      return;
    }
    if (!state.hwy) {
      addPill(hwyHit, 'hwy-mc-wait', '…');
      return;
    }
    var order = loadSettings().hwy;
    var i;
    for (i = 0; i < order.length; i++) {
      if (!order[i].on) continue;
      var id = order[i].id;
      if (id === 'assessment') {
        var label = state.hwy.assessment || 'No assessment';
        addPill(hwyHit, pillClass(label), compactAssessment(label), label);
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
      } else if (id === 'connection') {
        if (connKind(state.hwy.connStatus) === 'connected') {
          addPill(hwyHit, 'hwy-mc-conn', 'Connected', 'Connected with this carrier on Highway');
        } else {
          addPill(
            hwyHit,
            'hwy-mc-noconn',
            'No Connect',
            'Not connected on Highway (Connect / connecting counts as not connected)'
          );
        }
      } else if (id === 'dnu') {
        if (state.hwy.dnu || isDnuStatus(state.hwy.connStatus)) {
          addPill(hwyHit, 'hwy-mc-dnu', 'DNU', 'Highway Do Not Use is on');
        }
      } else if (id === 'domain') {
        var db = domainBadge(fromAddr, state.hwy.emails || []);
        if (db) {
          var dPill = addPill(hwyHit, db.cls, db.text, db.title, !!db.fast);
          if (db.check && dPill) dPill.appendChild(hwyCheckEl());
        }
      }
    }
    if (state.hwy.name) hwyHit.title = state.hwy.name + ' (open Highway)';
  }

  function paintC411Pills(c411Hit, state, mc, compact) {
    c411Hit.appendChild(logoImg(C411_LOGO, 'Carrier411'));
    if (!state.fg || state.fg.login || state.fg.error || state.fg.needTab) {
      addPill(c411Hit, 'hwy-mc-wait', 'Log in', 'Log in to Carrier411');
      c411Hit.title = 'Log in to Carrier411';
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
      }
    }
    if (state.fg.loss) addPill(c411Hit, 'hwy-mc-dnu', 'Freight loss', 'Carrier411: unjustified loss of freight reported');
    c411Hit.title = 'Open Carrier411 for ' + docketFromMc(mc);
  }

  var mcStore = {};
  function uiMode() {
    var s = loadSettings();
    return s.ui === 'bar' || s.ui === 'inline' ? s.ui : 'both';
  }
  function inQuoted(node) {
    var el = node && node.nodeType === 3 ? node.parentElement : node;
    return !!(el && el.closest && el.closest('.gmail_quote, .gmail_extra, .gmail_attr, blockquote'));
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
        n.querySelector && (n.querySelector('.h7') || n.querySelector('.adn.ads'));
      if (hasMsg) best = n;
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
    if (!mcStore[mc]) mcStore[mc] = { hwy: null, fg: null, subs: [] };
    var st = mcStore[mc];
    if (!st._gotHwy) {
      st._gotHwy = true;
      lookupMc(mc).then(function (info) {
        st.hwy = info || {};
        notifyMc(mc);
      });
    }
    if (!st._gotFg) {
      st._gotFg = true;
      lookupC411(mc).then(function (fg) {
        st.fg = fg || { error: true };
        notifyMc(mc);
      });
    }
    return st;
  }
  var barPaintQueued = false;
  function schedulePaintBar() {
    if (barPaintQueued) return;
    barPaintQueued = true;
    var kick = function () {
      barPaintQueued = false;
      paintBar();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(kick);
    else setTimeout(kick, 16);
  }
  function notifyMc(mc) {
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
    return node.closest('.h7') || node.closest('.adn') || node.closest('.gs');
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
      if (!st.hwy || st.hwy.login || st.hwy.nocache) {
        st._gotHwy = false;
        st.hwy = null;
        ensureMc(mc);
      }
      window.open(hwyPageUrl(mc), '_blank', 'noopener');
    }
    function openC411(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      markC411Clicked(mc);
      if (!st.fg || st.fg.login || st.fg.error || st.fg.needTab) {
        st._gotFg = false;
        st.fg = null;
        ensureMc(mc);
      }
      var url = C411_URL + encodeURIComponent(docketFromMc(mc));
      requestOpenC411(mc);
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: 'open_c411_window', url: url }, function () {
            if (chrome.runtime.lastError) window.open(url, '_blank', 'noopener,noreferrer');
          });
          return;
        }
      } catch (e) {}
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    function paint() {
      while (hwyBox.firstChild) hwyBox.removeChild(hwyBox.firstChild);
      while (c411Box.firstChild) c411Box.removeChild(c411Box.firstChild);
      var hwyHit = el('span', 'hwy-mc-hit');
      hwyHit.title = 'Open Highway for MC ' + mc;
      hwyHit.addEventListener('click', openHwy);
      paintHwyPills(hwyHit, st, threadCarrierAddr(wrap), false);
      hwyBox.appendChild(hwyHit);
      var c411Hit = el('span', 'hwy-c411-hit');
      c411Hit.title = 'Open Carrier411 for ' + docketFromMc(mc);
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

    var a = el('span', 'hwy-mc-link', fullMatch);
    a.title = 'Click to copy MC ' + mc;
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      clipText(copyMcText(mc));
      var old = wrap.querySelector('.hwy-mc-copied');
      if (old) old.parentNode.removeChild(old);
      var check = el('span', 'hwy-mc-copied', '✓');
      check.title = 'Copied';
      if (a.nextSibling) wrap.insertBefore(check, a.nextSibling);
      else wrap.appendChild(check);
      setTimeout(function () {
        if (check.parentNode) check.parentNode.removeChild(check);
      }, 1600);
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
    if (fg && fg.loss) return 'ss-risk';
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
    if (msg.classList && msg.classList.contains('kv')) return false;
    var body = msg.querySelector('div.a3s, div.ii.gt');
    return !!(body && isShown(body));
  }
  function expandedMessages(root) {
    if (!root || !root.querySelectorAll) return [];
    var out = [];
    var list = root.querySelectorAll('.h7');
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
      if (!acz) acz = table.querySelector('tr.acZ');
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
  function mcsInMessage(msg) {
    var seen = {};
    var out = [];
    if (!msg || !msg.querySelectorAll) return out;
    msg.querySelectorAll('.hwy-mc-wrap[data-hwy-mc]').forEach(function (w) {
      var mc = w.getAttribute('data-hwy-mc');
      if (!mc || seen[mc] || shouldIgnore(mc)) return;
      seen[mc] = true;
      out.push(mc);
    });
    return out;
  }
  function svgEl(name, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', name);
    var k;
    for (k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    }
    return n;
  }
  function copyIconBtn() {
    var b = el('button', 'ss-copy-btn');
    b.type = 'button';
    b.setAttribute('aria-label', 'Copy');
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
    b.addEventListener('mouseenter', function () {
      if (!b.classList.contains('ss-copied')) showFastTip(b, 'Copy');
    });
    b.addEventListener('mouseleave', hideFastTip);
    return b;
  }
  function copyCarrierToClipboard(name, mc, dot, btn) {
    clipText(carrierClipboardText(name, mc, dot));
    if (btn) {
      btn.classList.add('ss-copied');
      showFastTip(btn, 'Copied!', 0);
      setTimeout(function () {
        btn.classList.remove('ss-copied');
        if (btn.matches && btn.matches(':hover')) showFastTip(btn, 'Copy');
        else hideFastTip();
      }, 1400);
    }
  }
  function fillMsgBar(bar, msg, mcs) {
    while (bar.firstChild) bar.removeChild(bar.firstChild);
    mcs.forEach(function (mc) {
      var st = ensureMc(mc);
      var wrapForMc = msg.querySelector('.hwy-mc-wrap[data-hwy-mc="' + mc + '"]');
      var fromAddr = threadCarrierAddr(wrapForMc || msg);
      var rc = riskClass(st, fromAddr);
      var card = el('div', 'ss-intel-card ' + rc);
      var head = el('span', 'ss-intel-row');
      var name = (st.hwy && st.hwy.name) || 'MC ' + mc;
      head.appendChild(el('span', 'ss-intel-name', name));
      var copyBtn = copyIconBtn();
      copyBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        copyCarrierToClipboard(name, mc, st.hwy && st.hwy.dot, copyBtn);
      });
      head.appendChild(copyBtn);
      var mcEl = el('span', 'ss-intel-mc', 'MC ' + mc);
      mcEl.title = 'Copy MC ' + mc;
      mcEl.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        clipText(copyMcText(mc));
      });
      head.appendChild(mcEl);
      if (st.hwy && (st.hwy.dnu || isDnuStatus(st.hwy.connStatus)) && st.hwy.dnuNote) {
        head.appendChild(el('span', 'ss-intel-note', 'DNU: ' + st.hwy.dnuNote));
      }
      card.appendChild(head);
      var pills = el('span', 'ss-intel-pills');
      var hwyHit = el('span', 'hwy-mc-hit');
      hwyHit.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        window.open(hwyPageUrl(mc), '_blank', 'noopener');
      });
      paintHwyPills(hwyHit, st, fromAddr, false);
      pills.appendChild(hwyHit);
      var c411Hit = el('span', 'hwy-c411-hit');
      c411Hit.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        markC411Clicked(mc);
        requestOpenC411(mc);
        window.open(C411_URL + encodeURIComponent(docketFromMc(mc)), '_blank', 'noopener,noreferrer');
      });
      paintC411Pills(c411Hit, st, mc, false);
      pills.appendChild(c411Hit);
      card.appendChild(pills);
      bar.appendChild(card);
    });
  }
  function paintBar() {
    dropNode(document.getElementById('ss-intel-bar'));
    var root = openThreadRoot();
    if (uiMode() === 'inline' || !root) {
      document.querySelectorAll('.ss-intel-msg').forEach(dropNode);
      document.querySelectorAll('tr.ss-intel-tr, .ss-intel-host').forEach(dropNode);
      return;
    }
    var msgs = expandedMessages(root);
    if (!msgs.length) {
      var wrapMsg = root.querySelector('.hwy-mc-wrap');
      var fromWrap = wrapMsg && (wrapMsg.closest('.h7') || wrapMsg.closest('.adn') || wrapMsg.closest('.gs'));
      if (fromWrap) msgs = [fromWrap];
    }
    var keep = [];
    var i;
    var subjMcs = mcsInMessage(root.querySelector('h2.hP'));
    for (i = 0; i < msgs.length; i++) {
      var msg = msgs[i];
      var mcs = mcsInMessage(msg);
      if (i === msgs.length - 1 && subjMcs.length) {
        var seenMc = {};
        var k;
        for (k = 0; k < mcs.length; k++) seenMc[mcs[k]] = true;
        for (k = 0; k < subjMcs.length; k++) {
          if (!seenMc[subjMcs[k]]) mcs.push(subjMcs[k]);
        }
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
      fillMsgBar(bar, msg, mcs);
      keep.push(bar);
    }
    root.querySelectorAll('.ss-intel-msg').forEach(function (n) {
      if (keep.indexOf(n) < 0) dropNode(n);
    });
    root.querySelectorAll('tr.ss-intel-tr, .ss-intel-host').forEach(function (n) {
      if (!n.querySelector('.ss-intel-msg')) dropNode(n);
    });
  }

  function repaintAll() {
    applyUiMode();
  }

  function isSkippable(node) {
    var eln = node.parentElement;
    if (!eln) return true;
    if (eln.closest('.hwy-mc-wrap, .ss-intel-msg, #ss-intel-bar, #ss-hwy-c411-panel')) return true;
    var tag = eln.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return true;
    if (eln.isContentEditable) return true;
    return false;
  }

  function collectTextNodes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue) return NodeFilter.FILTER_REJECT;
        if (isSkippable(n)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var all = [];
    while (walker.nextNode()) {
      all.push(walker.currentNode);
      if (all.length >= 600) break;
    }
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
  function unquotedMessageText(a3s) {
    if (!a3s) return '';
    var t = '';
    var walker = document.createTreeWalker(a3s, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      var p = walker.currentNode.parentElement;
      if (p && p.closest && p.closest('.gmail_quote, .gmail_extra, .gmail_attr, .hwy-mc-wrap')) continue;
      t += walker.currentNode.nodeValue + ' ';
    }
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
    if (!root || !root.querySelectorAll) return;
    var scopes = [];
    function add(node) {
      if (!node) return;
      if (node.closest && node.closest('.zA, .ss-intel-msg, #ss-intel-bar, .hwy-mc-wrap')) return;
      if (scopes.indexOf(node) >= 0) return;
      scopes.push(node);
    }
    add(root.querySelector('h2.hP'));
    var msgs = expandedMessages(root);
    var i;
    for (i = 0; i < msgs.length; i++) {
      add(
        msgs[i].querySelector('div.a3s') ||
          msgs[i].querySelector('div.ii.gt') ||
          msgs[i]
      );
    }
    for (i = 0; i < scopes.length; i++) processScope(scopes[i]);
  }

  function pruneIdleMc(root) {
    var keep = {};
    wrapsInOpenMail(root).forEach(function (w) {
      var mc = w.getAttribute('data-hwy-mc');
      if (mc) keep[mc] = true;
    });
    Object.keys(mcStore).forEach(function (mc) {
      if (keep[mc] || inflight[mc] || c411Inflight[mc]) return;
      delete mcStore[mc];
    });
  }
  var scanning = false;
  function scanNow() {
    if (scanning) return;
    scanning = true;
    try {
      obs.disconnect();
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
    } catch (e) {
    } finally {
      scanning = false;
      armObserver();
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
    if (scheduled) return;
    scheduled = true;
    var kick = function () {
      scheduled = false;
      schedHandle = 0;
      scanNow();
    };
    if (typeof requestIdleCallback === 'function') {
      schedIdle = true;
      schedHandle = requestIdleCallback(kick, { timeout: 220 });
    } else {
      schedIdle = false;
      schedHandle = setTimeout(kick, 160);
    }
  }
  function kickScan() {
    cancelSched();
    scanNow();
    if (openRetry) return;
    openRetry = setTimeout(function () {
      openRetry = 0;
      var root = openThreadRoot();
      if (!root) return;
      if (!root.querySelector('.hwy-mc-wrap')) {
        scanNow();
        return;
      }
      if (uiMode() !== 'inline' && !root.querySelector('.ss-intel-msg')) applyUiMode();
    }, 400);
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
    try {
      if (typeof node.hidePopover === 'function' && node.matches && node.matches(':popover-open')) {
        node.hidePopover();
      }
    } catch (e) {}
    if (node.parentNode) node.parentNode.removeChild(node);
  }
  function closePanel() {
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
        row.addEventListener('dragstart', function (ev) {
          ev.dataTransfer.setData('text/plain', item.id);
          ev.dataTransfer.effectAllowed = 'move';
          row.style.opacity = '0.5';
        });
        row.addEventListener('dragend', function () {
          row.style.opacity = '';
        });
        row.addEventListener('dragover', function (ev) {
          ev.preventDefault();
        });
        row.addEventListener('drop', function (ev) {
          ev.preventDefault();
          var fromId = ev.dataTransfer.getData('text/plain');
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
          var moved = arr.splice(from, 1)[0];
          arr.splice(to, 0, moved);
          saveSettings(s);
          renderPanelLists(q);
        });
        host.appendChild(row);
      });
    }
    fill('hwy', HWY_FIELD_META, panelEl._hwyList || panelEl.querySelector('#ss-set-hwy'));
    fill('c411', C411_FIELD_META, panelEl._c411List || panelEl.querySelector('#ss-set-c411'));
    var uiHost = panelEl._uiList || panelEl.querySelector('#ss-set-ui');
    if (uiHost) {
      while (uiHost.firstChild) uiHost.removeChild(uiHost.firstChild);
      [
        { id: 'both', lab: 'Bar + first MC chip' },
        { id: 'bar', lab: 'Bar only (MC in body stays a link)' },
        { id: 'inline', lab: 'Chips only (no bar)' }
      ].forEach(function (opt) {
        var row = el('div', 'ss-set-row');
        var box = el('span', 'ss-set-check');
        box.setAttribute('role', 'radio');
        setCheckLook(box, s.ui === opt.id || (!s.ui && opt.id === 'both'));
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
    panelEl.appendChild(body);
    panelEl._hwyList = hwyList;
    panelEl._c411List = cList;
    panelEl._uiList = uiList;

    var host = panelHost();
    host.appendChild(shadeEl);
    host.appendChild(panelEl);
    shadeEl.classList.add('ss-open');
    panelEl.classList.add('ss-open');
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
        if (n && n.closest && n.closest('#ss-hwy-c411-panel, #ss-hwy-c411-set-btn')) return;
        closePanel();
      },
      true
    );
  }
  function injectSettingsBtn() {
    bindSettingsClicks();
    var existing = document.getElementById('ss-hwy-c411-set-wrap');
    if (existing && existing.isConnected) return true;
    var slot = findSettingsSlot();
    if (!slot || !slot.parent || !slot.before) return false;
    var wrap = document.getElementById('ss-hwy-c411-set-wrap');
    if (
      wrap &&
      wrap.isConnected &&
      wrap.parentNode === slot.parent &&
      wrap.nextElementSibling === slot.before &&
      !wrap.contains(slot.before)
    ) {
      return true;
    }
    if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
    wrap = document.createElement('div');
    wrap.id = 'ss-hwy-c411-set-wrap';
    var btn = document.createElement('div');
    btn.id = 'ss-hwy-c411-set-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Highway and Carrier411 badge settings');
    btn.title = 'Carrier check settings';
    btn.tabIndex = 0;
    var gear = svgEl('svg', {
      class: 'ss-set-gear',
      viewBox: '0 0 24 24',
      width: '24',
      height: '24'
    });
    gear.appendChild(
      svgEl('path', {
        fill: 'currentColor',
        'fill-rule': 'evenodd',
        d:
          'M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.61l-1.92-3.32a.5.5 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81a.5.5 0 0 0-.48-.41h-3.84a.5.5 0 0 0-.47.41L9.25 5.35c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.59.22L2.73 8.87a.5.5 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.61l1.92 3.32c.12.22.37.3.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.23.41.47.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.12-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.5.5 0 0 0-.12-.61l-2.03-1.58zM12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z'
      })
    );
    btn.appendChild(gear);
    var logo = document.createElement('img');
    logo.src = HWY_LOGO;
    logo.alt = '';
    logo.width = 12;
    logo.height = 12;
    logo.draggable = false;
    btn.appendChild(logo);
    wrap.appendChild(btn);
    slot.parent.insertBefore(wrap, slot.before);
    return !wrap.contains(slot.before);
  }

  function startHwyCopy() {
    if (!/^\/broker\/carriers\/\d+/.test(location.pathname)) return;
    GM_addStyle(
      '.ss-hwy-mc{position:relative;color:#93c5fd!important;text-decoration:underline;cursor:pointer;font-weight:700;}' +
        '.ss-hwy-tip{position:absolute;left:0;bottom:calc(100% + 9px);z-index:50;padding:6px 10px;' +
        'font:12px/1.3 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-weight:500;letter-spacing:.01em;' +
        'color:#f8fafc;background:#0f172a;border-radius:8px;white-space:nowrap;pointer-events:none;' +
        'opacity:0;transform:translateY(4px);transition:opacity .14s ease,transform .14s ease;' +
        'box-shadow:0 8px 24px rgba(15,23,42,.28);}' +
        '.ss-hwy-tip:after{content:"";position:absolute;top:100%;left:14px;border:5px solid transparent;border-top-color:#0f172a;}' +
        '.ss-hwy-mc:hover .ss-hwy-tip{opacity:1;transform:translateY(0);}' +
        '.ss-hwy-ok{color:#4ade80;font-weight:800;margin-left:5px;font-size:13px;}'
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
      if (!mcEl.querySelector('.ss-hwy-tip')) {
        var tip = document.createElement('span');
        tip.className = 'ss-hwy-tip';
        tip.textContent = 'Copy carrier info to clipboard';
        mcEl.insertBefore(tip, mcEl.firstChild);
      }
      if (bound === mcEl) return;
      bound = mcEl;
      mcEl.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        clipText(clip.name + '\n' + clip.mc + (clip.dot ? '\n' + clip.dot : ''));
        var old = mcEl.querySelector('.ss-hwy-ok');
        if (old) old.parentNode.removeChild(old);
        var ck = document.createElement('span');
        ck.className = 'ss-hwy-ok';
        ck.textContent = '✓';
        mcEl.appendChild(ck);
        setTimeout(function () {
          if (ck.parentNode) ck.parentNode.removeChild(ck);
        }, 1600);
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

  function nodeMightHaveMc(n) {
    if (!n) return false;
    if (n.nodeType === 3) {
      var t = n.nodeValue || '';
      return t.length >= 4 && (/MC/i.test(t) || /\d{4,8}/.test(t));
    }
    if (n.nodeType !== 1) return false;
    if (n.id === 'ss-intel-bar' || (n.classList && (n.classList.contains('hwy-mc-wrap') || n.classList.contains('ss-intel-msg')))) {
      return false;
    }
    if (n.childElementCount > 40) return true;
    var s = n.textContent || '';
    if (s.length > 4000) s = s.slice(0, 4000);
    return /MC/i.test(s) || /\d{4,8}/.test(s);
  }
  function removedNeedsScan(n) {
    if (!n || n.nodeType !== 1) return false;
    var cls = n.className ? String(n.className) : '';
    if (/(hwy-mc-wrap|ss-intel|\bh7\b|\ba3s\b|\bhP\b)/.test(cls)) return true;
    if (n.childElementCount > 15) return true;
    return false;
  }
  var obs = new MutationObserver(function (muts) {
    var i;
    var j;
    for (i = 0; i < muts.length; i++) {
      var m = muts[i];
      var tgt = m.target;
      if (tgt && tgt.nodeType === 3) tgt = tgt.parentElement;
      if (tgt && tgt.closest && tgt.closest('.hwy-mc-wrap, .ss-intel-msg, .ss-intel-host, tr.ss-intel-tr, #ss-intel-bar, #ss-hwy-c411-panel, #ss-hwy-c411-set-wrap')) {
        continue;
      }
      if (m.addedNodes) {
        for (j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.id === 'ss-intel-bar' || (n.classList && (n.classList.contains('hwy-mc-wrap') || n.classList.contains('ss-intel-msg')))) continue;
          if (nodeMightHaveMc(n) || (n.nodeType === 1 && n.childElementCount > 8)) {
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
    var thread = openThreadRoot();
    var main = document.querySelector('[role="main"]');
    try {
      obs.disconnect();
    } catch (e) {}
    if (thread) {
      obs.observe(thread, { childList: true, subtree: true });
      if (main && main !== thread) obs.observe(main, { childList: true, subtree: false });
      return;
    }
    if (main) obs.observe(main, { childList: true, subtree: false });
    else if (document.body) obs.observe(document.body, { childList: true, subtree: false });
  }
  function start() {
    if (/highway\.com$/i.test(location.hostname) || location.hostname.indexOf('highway.com') >= 0) {
      startHwyCopy();
      return;
    }
    if (/carrier411\.com$/i.test(location.hostname) || location.hostname.indexOf('carrier411.com') >= 0) {
      startC411Worker();
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
            if (node.closest && node.closest('.hwy-mc-badges, .hwy-mc-copied, .ss-intel-msg, #ss-intel-bar')) {
              hit = true;
              break;
            }
            if (node.querySelector && node.querySelector('.hwy-mc-badges, .hwy-mc-copied')) {
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
    scanNow();
    armObserver();
    window.addEventListener('hashchange', kickScan);
    window.addEventListener('popstate', kickScan);
    document.addEventListener(
      'click',
      function (ev) {
        var n = ev.target;
        if (n && n.closest && n.closest('tr.zA')) kickScan();
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
      armObserver();
      kickScan();
      refreshC411WrapsFromCache();
      retryClickedC411();
    });
  }
  if (window.__ssGmReady && typeof window.__ssGmReady.then === 'function') {
    window.__ssGmReady.then(start);
  } else {
    start();
  }
})();
