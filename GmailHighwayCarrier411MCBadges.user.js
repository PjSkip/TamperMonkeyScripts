// ==UserScript==
// @name         Gmail Highway Carrier411 MC badges
// @namespace    shipsierra.highway.gmail
// @version      1.18.13
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
  var SCRIPT_VERSION = '1.18.13';
  var SCRIPT_TITLE = 'ShipSierra.com Carrier Check on Hwy/C411';
  var RELEASE_DATE = 'August 30, 2026';
  var ORG_MC_KEY = 'ss_org_mc';
  var NOTES_VER_KEY = 'ss_notes_ver';
  var CACHE_VER_KEY = 'ss_hwy_cache_ver';
  var CALLOUT_BG = '#fff6d9';
  var CARET_PX = 11;
  var RELEASE_NOTES =
    '• Each reply in a long thread gets its own carrier bar.\n' +
    '• Highway lookups start fresh after this update, then stay saved for the rest of the day.';
  var HWY_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHGSURBVHgB7ZZNTsJQEMdnWqWwqwsjyx5BtxJjOQF6AnoDuYF4MkgMuhRPQNlh3LCyBdOOry2B8j4LYWd/m5fMTOf937yPKUBNzX8HTQHRpD1EpGfOPG3eft2UDfHb1YwNXtlGhC+tzmIIGiwwKUTqC0aCucT2KSRHegIDWgHRa9sHblWFKgh5UwqijQDcTY7jBICdBgpPCBVE5RPY+iooBUSjtoeAfZmPEpwK8xMuFal8GrkuHCoAGuCrXLaVCJPZkExlsdk2rBwngEMFIKTK0jU638JkiWWrKpDRU88jYT25vE7R+gA1ocLuqT5g29Zt3S3GvP1MFpwgDgwPhAcHgjY9sGHM26VbwA7fPZwYtqC+7DAKAtjLF8ARKzSRHcYfp+WDSYD05TsRtuRg7211fvcdmoGeUO0iVmJ0QYOzWl1gd7m9MfuHsAEBGLAofZRdw4zonS2A9AuIG80BG4bbfGVnlfKfr39Dla8Zx7q3oJiQa1BbAcrGU4Lt17JcPsGf+0grgm9QuwqoG0/54xDMQcaYcoPKBegaD5d8bowBrBCza1BFBTSNZz+3eXVphSqVG5RV5E2Nfy4bQmNEBZEbelBTU8P4A46qjYFyL5/4AAAAAElFTkSuQmCC';
  var C411_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAC1UlEQVR4nMSWTUwTQRTHZ5cWqkAopAoVFA2CihEwaow1ICSGg0D0oKLx4MFEL3Iw4SAYY4gQ4sfJePOgXvwIEBWDMR4Uw4cGjdHwWTCBgBJaU8XWUtvd7vp/W7M0bS3hsOs7/Dp9b2by/pl5b9ZQd+sUY2xi1s7+bUFRjvJIbCnLz9oE8kxjM3yeG8cPx3Mxw6FMOSUNn/83aE23gmvSc0D3ghu0fx0FjXxixFr7LPm1VxA/LAZFcNv6ErDlxDUw2ZQaMcfrIx2tbc1gz3A3bcovbqu5Au5AS2nMgBAQwMrt1WD9wQvgT28AvN7eC844f4A5Gcng6ard4LqsdPBqB+l4NvAUTOATdFJQFifc1dgNTjt/gYdbO0DB71ejkt+rju+erwVL8rPBo601oMvjYrrcoqgCCIp0cyqLq5V/FG560E9+iWqCNxrJLfgolkD5ZaaZwK7+IVVBedF+sK33vi4KuOgS5qjzZJqzVMebiTkwxUBTZUVfqBPJEs0szKWZVbZC0PGdTiV1BdWKLMvsf1Uyp+KvyXLMxaFTsVrSGNU8jc0ppsUNlOT1OAMuLKMg5SITR78Mqf4jtnyw8+2Ymlgor2yLGaw/VgG2vfwA7tycCzrm6cx4TpdKNsjKnQkI1GdKt5SDeavpJbIV7FMnXay1gdMO6j/vxmYUH2UmiKT1Sc8gWLO3GPT4PGDnQDtoMq5keigI9byGQ01gxdbKiPCUc1Id3z5HtT00+Q3sG5kCC9dawNKiDeqcszfPgEmJdJdkpVq076YuN2WUkWqJGS67RG+ZOTkDPL7nJLhj4y6wwEp1Oz47Ar6fGADv9d4BA8orEm7aK5CjqtS9MA82P6JXbHD6U0RUFMSYGxk4Y0y/vgpeDb8Abzy/AgbEAFu+SVGLtFcgKR3x8uNGsM/+GkwyGJdcFhTiRaWwL1ftFTQ8rGN0Wz6y5ZskcHGieauoB2uu4A8AAAD//1ZDwTcAAAAGSURBVAMARiLtUypmc+4AAAAASUVORK5CYII=';
  var SET_LOGO = 'data:image/png;base64,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';
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
    cargo: { label: 'Cargo Insurance', source: 'Highway active motor truck cargo policy limit' },
    bipd: { label: 'Auto INS', source: 'Highway active automobile liability limit' },
    gl: { label: 'Gen Liab Ins', source: 'Highway active commercial general liability aggregate limit' },
    connection: { label: 'Connected / No Connect', source: 'Yellow Connected only if Highway status is onboarded/connected. Any other status (Connect, connecting, none) is a red No Connect pill.' },
    dnu: { label: 'Do Not Use (DNU)', source: 'Highway Do Not Use switch (connection.status do_not_dispatch)' },
    domain: { label: 'Email domain match', source: 'Green check: exact Highway email, or same unique company domain. Public (Gmail/Yahoo/iCloud): Unmatched (yellow) if Highway has that brand but a different address; Bad email (red) if Highway does not. Unique domain with no match: Domain NOT Match (red).' }
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
      '#ss-hwy-c411-set-btn .ss-set-icon{display:block;width:32px;height:32px;pointer-events:none;object-fit:contain;}' +
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
      '.ss-rate-wrap{color:#1a73e8;font-weight:700;text-decoration:underline;cursor:pointer;' +
      '-webkit-user-select:text;user-select:text;}' +
      '.ss-notes-pill{margin-left:8px;padding:1px 8px;border-radius:999px;border:1px solid #dadce0;background:#eef3fb;' +
      'color:#1a73e8;font:600 11px/18px inherit;cursor:pointer;flex:none;}' +
      '.ss-notes-pill:hover{background:#d3e3fd;}' +
      '.ss-org-box{margin:10px 4px 8px;padding:10px 10px 8px;border:1px solid #c5ced6;border-radius:10px;background:#e6ebf0;}' +
      '.ss-org-box p{margin:0 0 8px;font-size:12px;line-height:1.4;color:#5f6368;}' +
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
      '#ss-hwy-c411-panel .ss-set-search{margin:10px 12px 8px;padding:8px 10px;border:1px solid #cdd5dc;border-radius:8px;width:auto;font:13px/1.3 inherit;background:#fff;}' +
      '#ss-hwy-c411-panel .ss-set-body{flex:1 1 auto;overflow:auto;padding:8px;min-height:240px;}' +
      '#ss-hwy-c411-panel .ss-set-sec{margin:10px 4px 6px;padding:8px 8px 6px;border:1px solid #c5ced6;border-radius:10px;background:#e6ebf0;}' +
      '#ss-hwy-c411-panel .ss-set-sec h3{display:flex;align-items:center;gap:6px;margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#5f6368;}' +
      '#ss-hwy-c411-panel .ss-set-sec h3 img{width:14px;height:14px;border-radius:3px;}' +
      '#ss-hwy-c411-panel .ss-set-row{display:flex !important;align-items:center;gap:8px;padding:8px 6px;border-radius:6px;cursor:pointer;min-height:36px;color:#202124;font-size:13px;line-height:1.3;}' +
      '#ss-hwy-c411-panel .ss-set-row:hover{background:#d0d8e0;}' +
      '#ss-hwy-c411-panel .ss-set-row.ss-hidden-row{display:none !important;}' +
      '#ss-hwy-c411-panel .ss-set-grip{color:#9aa0a6;font-size:14px;letter-spacing:-1px;user-select:none;cursor:grab;}' +
      '#ss-hwy-c411-panel .ss-set-check{width:18px;height:18px;flex:none;border:2px solid #5f6368;border-radius:4px;background:#fff;color:#fff;text-align:center;font:700 12px/14px sans-serif;box-sizing:border-box;}' +
      '#ss-hwy-c411-panel .ss-set-check[aria-checked="true"]{background:#1a73e8;border-color:#1a73e8;}' +
      '#ss-hwy-c411-panel .ss-set-lab{flex:1;cursor:pointer;color:#202124;font-size:13px;}' +
      '#ss-hwy-c411-panel .ss-set-row.ss-has-extra{flex-wrap:wrap;align-items:flex-start;}' +
      '#ss-hwy-c411-panel .ss-set-extra{flex:1 1 100%;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:2px 0 4px 42px;font-size:12px;color:#5f6368;cursor:default;}' +
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
  function saveOrgMc(mc) {
    var n = normMc(mc);
    try {
      GM_setValue(ORG_MC_KEY, n);
    } catch (e) {}
    return n;
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
  function numOr(v, fb) {
    var n = Number(v);
    if (v === '' || v == null || isNaN(n)) return fb;
    return n;
  }
  function defaultThresh() {
    return { unitsMin: 10, safetyGreen: 0, safetyYellow: 3, safetyRed: 3 };
  }
  function mergeThresh(got) {
    var d = defaultThresh();
    if (!got || typeof got !== 'object') return d;
    return {
      unitsMin: numOr(got.unitsMin, d.unitsMin),
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
        { id: 'domain', on: true }
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
  function cargoPill(amount) {
    if (amount == null || amount === '') return null;
    var s = moneyShort(amount);
    if (s == null) return null;
    var n = Number(amount);
    return {
      text: 'Cargo ' + s,
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
  function lookupC411(mc, force) {
    if (force) {
      forgetC411Cached(mc);
      delete c411Inflight[mc];
    }
    var cached = getC411Cached(mc);
    if (cached) return Promise.resolve(cached);
    if (c411Inflight[mc]) return c411Inflight[mc];
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
            login: !c411WorkerAlive(),
            needTab: !c411WorkerAlive(),
            error: !!c411WorkerAlive()
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
      'https://highway.com/monitor/api/v1/insurance_policies?q%5Bcarrier_id_eq%5D=' +
      encodeURIComponent(id) +
      '&q%5Bstatus_eq%5D=active'
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
        : [];
    var i;
    var p;
    var t;
    var n;
    for (i = 0; i < list.length; i++) {
      p = list[i];
      if (!p || String(p.status || '').toLowerCase() !== 'active') continue;
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
    if (ins) applyHwyInsurance(result, ins);
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
    hwyExtrasInflight[mc] = Promise.all([
      wantDetail
        ? gmGet(detailUrl, mc).catch(function () {
            return null;
          })
        : Promise.resolve(null),
      wantSafety
        ? gmGet(safetyUrl, mc).catch(function () {
            return null;
          })
        : Promise.resolve(null),
      wantConn
        ? gmGet(connectionsUrl(id), mc).catch(function () {
            return null;
          })
        : Promise.resolve(null),
      wantIns
        ? gmGet(insuranceUrl(id), mc).catch(function () {
            return null;
          })
        : Promise.resolve(null)
    ])
      .then(function (pack) {
        applyHwyExtraPack(result, pack);
        setCached(mc, result);
        if (mcStore[mc]) {
          mcStore[mc].hwy = result;
          try {
            notifyMc(mc);
          } catch (e) {}
        }
        return result;
      })
      .catch(function () {
        return result;
      })
      .then(function (out) {
        delete hwyExtrasInflight[mc];
        return out;
      });
    return hwyExtrasInflight[mc];
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
        setCached(mc, result);
        if (mcStore[mc]) {
          mcStore[mc].hwy = result;
          try {
            notifyMc(mc);
          } catch (e0) {}
        }
        if (best.id) loadHwyExtras(mc, best.id, result);
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
  function hideFastTip() {
    if (fastTipTimer) {
      clearTimeout(fastTipTimer);
      fastTipTimer = 0;
    }
    if (fastTipEl && fastTipEl.parentNode) fastTipEl.parentNode.removeChild(fastTipEl);
    fastTipEl = null;
  }
  function showFastTip(anchor, text, delay, force) {
    hideFastTip();
    if (!text || !anchor) return;
    var wait = delay == null ? 0 : delay;
    function place() {
      fastTipTimer = 0;
      if (!anchor || !anchor.isConnected) return;
      if (!force) {
        try {
          if (anchor.matches && !anchor.matches(':hover')) return;
        } catch (eHover) {}
      }
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
  function addPill(parent, cls, text, title) {
    var p = el('span', 'hwy-mc-pill ' + cls, text);
    if (title) bindHoverTip(p, title);
    parent.appendChild(p);
    return p;
  }

  function paintHwyPills(hwyHit, state, fromAddr, compact) {
    hwyHit.appendChild(logoImg(HWY_LOGO, 'Highway'));
    if (state.hwy && state.hwy.login) {
      addPill(hwyHit, 'hwy-mc-wait', 'Sign in', 'Sign in to Highway');
      return;
    }
    if (!state.hwy) {
      addPill(hwyHit, 'hwy-mc-wait', '…', 'Looking up Highway. Click the Highway icon to retry.');
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
    if (state.fg.login || state.fg.needTab) {
      addPill(c411Hit, 'hwy-mc-wait', 'Log in', 'Log in to Carrier411');
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
    if (!mcStore[mc]) mcStore[mc] = { hwy: null, fg: null, subs: [], _hwyGen: 0 };
    var st = mcStore[mc];
    if (!st.hwy) {
      var hit = getCached(mc);
      if (hit) st.hwy = hit;
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
    var cards = document.querySelectorAll('.ss-intel-card[data-ss-mc="' + mc + '"]');
    if (cards.length) {
      var i;
      for (i = 0; i < cards.length; i++) {
        var msg = messageRoot(cards[i]) || cards[i];
        refreshMsgCard(cards[i], msg, mc);
      }
      wrapRatesInOpenThread();
      return;
    }
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
      openHighway(mc);
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
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    function paint() {
      while (hwyBox.firstChild) hwyBox.removeChild(hwyBox.firstChild);
      while (c411Box.firstChild) c411Box.removeChild(c411Box.firstChild);
      var hwyHit = el('span', 'hwy-mc-hit');
      hwyHit.addEventListener('click', openHwy);
      paintHwyPills(hwyHit, st, threadCarrierAddr(wrap), false);
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
    if (mode === 'inline') return;
    schedulePaintBar();
  }
  function makeWrap(fullMatch, mc, opts) {
    opts = opts || {};
    var wrap = el('span', 'hwy-mc-wrap');
    wrap.setAttribute('data-hwy-mc', mc);
    wrap.setAttribute('data-ss-full', '0');

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
  function hasSettledPills(hit) {
    if (!hit || !hit.querySelectorAll) return false;
    var pills = hit.querySelectorAll('.hwy-mc-pill');
    var i;
    for (i = 0; i < pills.length; i++) {
      if (!pills[i].classList.contains('hwy-mc-wait')) return true;
    }
    return false;
  }
  function hwyStateKey(st) {
    var h = st && st.hwy;
    if (!h || h.login) return '';
    return [
      h.name || '',
      h.assessment || '',
      h.fleet == null ? '' : h.fleet,
      h.safety == null ? '' : h.safety,
      h.connStatus || '',
      h.dnu ? '1' : '0',
      h.cargoAmt == null ? '' : h.cargoAmt,
      h.bipdAmt == null ? '' : h.bipdAmt,
      h.glAmt == null ? '' : h.glAmt,
      (h.emails && h.emails.length) || 0
    ].join('|');
  }
  function c411StateKey(st) {
    var f = st && st.fg;
    if (!f || f.login || f.needTab || f.error) return '';
    return [f.hasFg ? '1' : '0', f.date || '', f.loss ? '1' : '0', f.rating || '', f.related ? '1' : '0'].join('|');
  }
  function refreshMsgCard(card, msg, mc) {
    var st = ensureMc(mc);
    if (!msg || !msg.querySelector) msg = messageRoot(card) || card;
    var wrapForMc = msg.querySelector ? msg.querySelector('.hwy-mc-wrap[data-hwy-mc="' + mc + '"]') : null;
    var fromAddr = threadCarrierAddr(wrapForMc || msg);
    card.className = 'ss-intel-card ' + riskClass(st, fromAddr);
    var name = (st.hwy && st.hwy.name) || 'MC ' + mc;
    var nameEl = card.querySelector('.ss-intel-name');
    if (nameEl && nameEl.textContent !== name) nameEl.textContent = name;
    card.setAttribute('data-ss-mc', mc);
    var hwyHit = card.querySelector('.hwy-mc-hit');
    var c411Hit = card.querySelector('.hwy-c411-hit');
    var hwyKey = hwyStateKey(st);
    var c411Key = c411StateKey(st);
    if (hwyHit && hwyKey && card.getAttribute('data-ss-hwy') !== hwyKey) {
      card.setAttribute('data-ss-hwy', hwyKey);
      while (hwyHit.firstChild) hwyHit.removeChild(hwyHit.firstChild);
      paintHwyPills(hwyHit, st, fromAddr, false);
    } else if (hwyHit && !hwyKey && !hasSettledPills(hwyHit)) {
      while (hwyHit.firstChild) hwyHit.removeChild(hwyHit.firstChild);
      paintHwyPills(hwyHit, st, fromAddr, false);
    }
    if (c411Hit && c411Key && card.getAttribute('data-ss-c411') !== c411Key) {
      card.setAttribute('data-ss-c411', c411Key);
      while (c411Hit.firstChild) c411Hit.removeChild(c411Hit.firstChild);
      paintC411Pills(c411Hit, st, mc, false);
    } else if (c411Hit && !c411Key && !hasSettledPills(c411Hit)) {
      while (c411Hit.firstChild) c411Hit.removeChild(c411Hit.firstChild);
      paintC411Pills(c411Hit, st, mc, false);
    }
  }
  function buildMsgCard(msg, mc) {
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
    if (st.hwy && (st.hwy.dnu || isDnuStatus(st.hwy.connStatus)) && st.hwy.dnuNote) {
      head.appendChild(el('span', 'ss-intel-note', 'DNU: ' + st.hwy.dnuNote));
    }
    card.appendChild(head);
    var pills = el('span', 'ss-intel-pills');
    var hwyHit = el('span', 'hwy-mc-hit');
    hwyHit.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      openHighway(mc);
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
  function fillMsgBar(bar, msg, mcs) {
    mcs = uniqMcs(mcs);
    var key = mcs.join(',');
    var same = bar.getAttribute('data-ss-mcs') === key && bar.children.length === mcs.length;
    if (same) {
      if (hasSettledPills(bar)) {
        var j;
        for (j = 0; j < mcs.length; j++) refreshMsgCard(bar.children[j], msg, mcs[j]);
        return;
      }
      var i;
      for (i = 0; i < mcs.length; i++) refreshMsgCard(bar.children[i], msg, mcs[i]);
      return;
    }
    if (hasSettledPills(bar) && bar.children.length) {
      mcs.forEach(function (mc) {
        if (!bar.querySelector('.ss-intel-card[data-ss-mc="' + mc + '"]')) {
          bar.appendChild(buildMsgCard(msg, mc));
        }
      });
      bar.setAttribute('data-ss-mcs', key);
      return;
    }
    hideFastTip();
    while (bar.firstChild) bar.removeChild(bar.firstChild);
    bar.setAttribute('data-ss-mcs', key);
    mcs.forEach(function (mc) {
      bar.appendChild(buildMsgCard(msg, mc));
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
        if (bar && hasSettledPills(bar)) keep.push(bar);
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
      if (keep.indexOf(n) >= 0) return;
      if (hasSettledPills(n)) return;
      dropNode(n);
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
        '.hwy-mc-wrap, .ss-rate-wrap, .ss-intel-msg, #ss-intel-bar, #ss-hwy-c411-panel, #ss-ss-callout, .ss-fast-tip'
      )
    ) {
      return true;
    }
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
  function parseRateNum(raw) {
    var n = Number(String(raw || '').replace(/,/g, ''));
    if (!isFinite(n) || n < 100 || n >= 50000) return null;
    return Math.round(n);
  }
  function findRateMatches(text) {
    var s = String(text || '');
    var out = [];
    var re =
      /\$\s*([0-9]{1,2}(?:,[0-9]{3})+|[1-9][0-9]{2,4})(?:\.\d{1,2})?|([0-9]{1,2}(?:,[0-9]{3})+|[1-9][0-9]{2,4})(?:\.\d{1,2})?\s*\$/g;
    var m;
    while ((m = re.exec(s))) {
      var raw = m[1] || m[2];
      var n = parseRateNum(raw);
      if (n == null) continue;
      out.push({ start: m.index, end: m.index + m[0].length, full: m[0], n: n });
    }
    return out;
  }
  function messageMcForRates(root) {
    var msg = messageRoot(root) || root;
    var mcs = mcsInMessage(msg);
    var i;
    for (i = 0; i < mcs.length; i++) {
      if (!shouldIgnore(mcs[i])) return mcs[i];
    }
    var thread = openThreadRoot();
    if (thread && thread !== msg) {
      mcs = mcsInMessage(thread);
      for (i = 0; i < mcs.length; i++) {
        if (!shouldIgnore(mcs[i])) return mcs[i];
      }
    }
    var subj = (thread && thread.querySelector && thread.querySelector('h2.hP')) || document.querySelector('h2.hP');
    if (subj) {
      var hits = findMcMatches(subj.textContent || '');
      if (hits.length && !shouldIgnore(hits[0].mc)) return hits[0].mc;
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
      if (!n.nodeValue || n.nodeValue.indexOf('$') < 0 && !/\d\s*\$/.test(n.nodeValue)) continue;
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
            clipText(copyMcText(mcNum) + ' $' + amount);
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
    var root = openThreadRoot();
    if (!root || !root.querySelectorAll) return;
    var nodes = root.querySelectorAll('div.a3s, div.ii.gt, h2.hP');
    var i;
    for (i = 0; i < nodes.length; i++) wrapRatesInScope(nodes[i]);
    wrapRatesInScope(root);
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
    var bodies = root.querySelectorAll('div.a3s, div.ii.gt');
    var i;
    for (i = 0; i < bodies.length; i++) add(bodies[i]);
    var msgs = expandedMessages(root);
    for (i = 0; i < msgs.length; i++) add(msgs[i]);
    for (i = 0; i < scopes.length; i++) processScope(scopes[i]);
    for (i = 0; i < scopes.length; i++) wrapRatesInScope(scopes[i]);
  }

  function pruneIdleMc(root) {
    if (root) return;
    Object.keys(mcStore).forEach(function (mc) {
      if (inflight[mc] || c411Inflight[mc] || hwyExtrasInflight[mc]) return;
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
      maybeShowCallout();
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
      if (root.querySelector('.ss-intel-msg') && hasSettledPills(root.querySelector('.ss-intel-msg'))) return;
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
    if (!s.thresh) s.thresh = defaultThresh();
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
        if (which === 'hwy' && (item.id === 'units' || item.id === 'safety')) {
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

    var orgBox = el('div', 'ss-org-box');
    orgBox.appendChild(
      el(
        'p',
        '',
        'Your company’s MC. We never show Highway/Carrier411 results for this number, so your own authority is not treated as a carrier you are vetting. Digits only — no “MC”.'
      )
    );
    var orgRow = el('div', 'ss-org-row');
    orgRow.appendChild(el('b', '', 'MC:'));
    var orgInp = document.createElement('input');
    orgInp.type = 'text';
    orgInp.inputMode = 'numeric';
    orgInp.className = 'ss-org-mc';
    orgInp.maxLength = 8;
    orgInp.value = loadOrgMc();
    orgInp.setAttribute('aria-label', 'Your company MC number');
    orgRow.appendChild(orgInp);
    orgBox.appendChild(orgRow);
    var orgMsg = el('div', '');
    orgBox.appendChild(orgMsg);
    var orgSaved = loadOrgMc();
    function setOrgMsg(kind, text) {
      orgMsg.className = kind === 'err' ? 'ss-org-err' : kind === 'warn' ? 'ss-org-warn' : '';
      orgMsg.textContent = text || '';
      while (orgMsg.firstChild && orgMsg.querySelector('button')) {
        break;
      }
    }
    orgInp.addEventListener('keydown', function (ev) {
      ev.stopPropagation();
    });
    orgInp.addEventListener('input', function (ev) {
      ev.stopPropagation();
      var raw = orgInp.value.replace(/\s+/g, '');
      if (/[^\d]/.test(raw)) {
        setOrgMsg('err', 'Numbers only.');
        return;
      }
      setOrgMsg('', '');
      if (raw === orgSaved) return;
      if (!raw) {
        saveOrgMc('');
        orgSaved = '';
        return;
      }
      orgMsg.className = 'ss-org-warn';
      orgMsg.textContent = 'Are you sure this is your MC? We will not vet this number. ';
      var yes = el('button', 'ss-org-ok', 'Confirm');
      yes.type = 'button';
      var no = el('button', 'ss-org-no', 'Cancel');
      no.type = 'button';
      yes.addEventListener('click', function (e2) {
        e2.preventDefault();
        e2.stopPropagation();
        var n = normMc(orgInp.value);
        if (!n) {
          setOrgMsg('err', 'Numbers only.');
          return;
        }
        orgSaved = saveOrgMc(n);
        orgInp.value = n;
        setOrgMsg('', '');
      });
      no.addEventListener('click', function (e2) {
        e2.preventDefault();
        e2.stopPropagation();
        orgInp.value = orgSaved;
        setOrgMsg('', '');
      });
      orgMsg.appendChild(yes);
      orgMsg.appendChild(no);
    });
    body.appendChild(orgBox);
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
    function tick() {
      if (!card || !card.parentNode) {
        stopCalloutFollow(card);
        return;
      }
      placeSsCallout(card);
    }
    stopCalloutFollow(card);
    card._ssFollow = setInterval(tick, 200);
    var wrap = document.getElementById('ss-hwy-c411-set-wrap');
    var host = wrap && wrap.parentElement;
    if (typeof MutationObserver === 'function' && host) {
      card._ssMO = new MutationObserver(tick);
      card._ssMO.observe(host, { childList: true, subtree: true });
    }
    if (typeof ResizeObserver === 'function' && wrap) {
      card._ssRO = new ResizeObserver(tick);
      card._ssRO.observe(wrap);
      if (host) card._ssRO.observe(host);
    }
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
      card.appendChild(
        el('div', 'ss-co-ver', 'Version ' + SCRIPT_VERSION + ' · Released ' + RELEASE_DATE)
      );
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
  function maybeShowCallout() {
    if (document.getElementById('ss-ss-callout')) return;
    if (!document.getElementById('ss-hwy-c411-set-btn')) return;
    if (!loadOrgMc()) {
      if (window.__ssSetupSnooze) return;
      showSsCallout('setup');
      return;
    }
    if (notesVersionAcked()) return;
    showSsCallout('notes');
  }
  function pinOpenCallout() {
    var co = document.getElementById('ss-ss-callout');
    if (co) placeSsCallout(co);
  }
  function injectSettingsBtn() {
    bindSettingsClicks();
    var existing = document.getElementById('ss-hwy-c411-set-wrap');
    if (existing && existing.isConnected && existing.querySelector('img.ss-set-icon')) {
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
    bindHoverTip(btn, 'Carrier check settings');
    var logo = document.createElement('img');
    logo.className = 'ss-set-icon';
    logo.src = SET_LOGO;
    logo.alt = '';
    logo.width = 32;
    logo.height = 32;
    logo.draggable = false;
    btn.appendChild(logo);
    wrap.appendChild(btn);
    slot.parent.insertBefore(wrap, slot.before);
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
  function isOurUiNode(n) {
    if (!n || n.nodeType !== 1) return false;
    if (n.id === 'ss-intel-bar' || n.id === 'ss-ss-callout' || n.id === 'ss-hwy-c411-panel') return true;
    var cl = n.classList;
    if (!cl) return false;
    return !!(
      cl.contains('ss-intel-msg') ||
      cl.contains('ss-intel-host') ||
      cl.contains('ss-intel-tr') ||
      cl.contains('ss-intel-card') ||
      cl.contains('hwy-mc-wrap') ||
      cl.contains('ss-rate-wrap') ||
      cl.contains('ss-fast-tip')
    );
  }
  function removedNeedsScan(n) {
    if (!n || n.nodeType !== 1) return false;
    if (isOurUiNode(n)) return false;
    var cls = n.className ? String(n.className) : '';
    if (/(\bh7\b|\ba3s\b|\bhP\b)/.test(cls)) return true;
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
      if (tgt && tgt.closest && tgt.closest('.hwy-mc-wrap, .ss-rate-wrap, .ss-intel-msg, .ss-intel-host, tr.ss-intel-tr, #ss-intel-bar, #ss-hwy-c411-panel, #ss-hwy-c411-set-wrap, #ss-ss-callout, .ss-fast-tip')) {
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
          if (isOurUiNode(m.removedNodes[j])) continue;
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
    window.addEventListener('resize', function () {
      var c = document.getElementById('ss-ss-callout');
      if (c) placeSsCallout(c);
    });
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
  start();
})();
