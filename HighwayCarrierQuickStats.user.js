// ==UserScript==
// @name         Highway Carrier Quick Stats
// @namespace    shipsierra.highway
// @version      2026.41.2.2
// @description  Power units, BASIC score, and Carrier411 on a Highway carrier page. Works on the new layout and the classic view.
// @author       Ivan Karpenko
// @homepageURL  https://github.com/PjSkip/TamperMonkeyScripts
// @updateURL    https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/HighwayCarrierQuickStats.user.js
// @downloadURL  https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/HighwayCarrierQuickStats.user.js
// @match        https://highway.com/broker/carriers/*
// @match        https://*.highway.com/broker/carriers/*
// @match        https://www.carrier411.com/*
// @match        https://carrier411.com/*
// @connect      highway.com
// @connect      www.carrier411.com
// @connect      carrier411.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        GM_addValueChangeListener
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  var HOST = location.hostname || '';
  var ON_C411 = /carrier411\.com$/i.test(HOST) || HOST.indexOf('carrier411.com') >= 0;
  var ON_HWY = /highway\.com$/i.test(HOST) || HOST.indexOf('highway.com') >= 0;
  var C411_CACHE_KEY = 'c411_fg_cache_qs_v1';
  var C411_SHARED_KEY = 'c411_fg_cache_v2';
  var C411_URL = 'https://www.carrier411.com/manager/companydetail.cfm?docket=';
  var LOGO_DATA_URI = 'data:image/png;base64,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';
  var ROOT_ID = 'ss-hwy-quickstats';
  var STYLE_ID = 'ss-hwy-quickstats-style';

  function digits(s) {
    return String(s || '').replace(/\D/g, '');
  }
  function normMc(s) {
    var d = digits(s);
    if (!d) return '';
    return String(Number(d));
  }
  function oneLine(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }
  function docketFromMc(mc) {
    var d = digits(mc);
    if (!d) return '';
    if (d.length < 6) d = ('000000' + d).slice(-6);
    return 'MC' + d;
  }
  function padDot(d) {
    d = digits(d);
    if (!d) return '';
    if (d.length < 8) d = ('00000000' + d).slice(-8);
    return d;
  }
  function formatSafety(n) {
    if (n == null || n === '' || isNaN(Number(n))) return '';
    var num = Number(n);
    if (num === 0) return '0';
    var s = String(num);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  function compactFgDate(s) {
    if (!s) return '';
    var str = String(s).replace(/\s+/g, ' ').trim();
    var months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    var m = str.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{2,4})$/);
    if (m) {
      var mo = months[m[1].slice(0, 3).toLowerCase()];
      if (mo) return mo + '/' + Number(m[2]) + '/' + String(m[3]).slice(-2);
    }
    m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) return Number(m[1]) + '/' + Number(m[2]) + '/' + String(m[3]).slice(-2);
    return str;
  }

  function gmGet(key, fallback) {
    try {
      return GM_getValue(key, fallback);
    } catch (e) {
      return fallback;
    }
  }
  function gmSet(key, value) {
    try {
      GM_setValue(key, value);
    } catch (e) {}
  }
  function readCache(key) {
    try {
      var parsed = JSON.parse(gmGet(key, '{}') || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }
  function sameLocalDay(ts) {
    if (!ts) return false;
    var a = new Date(ts);
    var b = new Date();
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function cacheStillGood(hit) {
    if (!hit || !hit.ts) return false;
    if (hit.login || hit.error) return Date.now() - hit.ts < 2 * 60 * 1000;
    return sameLocalDay(hit.ts);
  }
  function getC411Cached(mc) {
    mc = normMc(mc);
    if (!mc) return null;
    var own = readCache(C411_CACHE_KEY)[mc];
    if (cacheStillGood(own) && !own.login && !own.error) return own;
    var shared = readCache(C411_SHARED_KEY)[mc];
    if (cacheStillGood(shared) && !shared.login && !shared.error) return shared;
    if (cacheStillGood(own)) return own;
    return null;
  }
  function setC411Cached(mc, data) {
    mc = normMc(mc);
    if (!mc || !data) return;
    var all = readCache(C411_CACHE_KEY);
    var prev = all[mc];
    if (prev && cacheStillGood(prev) && prev.ok && !prev.login && !prev.error && (data.login || data.error)) return;
    all[mc] = {
      ok: data.ok !== false && !data.login && !data.error,
      hasFg: !!data.hasFg,
      date: data.date || null,
      type: data.type || null,
      count: data.count || 0,
      items: Array.isArray(data.items) ? data.items.slice(0, 2) : [],
      login: !!data.login,
      error: !!data.error,
      ts: Date.now()
    };
    Object.keys(all).forEach(function (k) {
      if (!cacheStillGood(all[k])) delete all[k];
    });
    gmSet(C411_CACHE_KEY, JSON.stringify(all));
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
  function prettyFgReason(s) {
    var t = String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!t) return '';
    if (/unethical or deceptive business practices/.test(t)) return 'Unethical or deceptive business practices';
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function fgItemsFromPlain(plain) {
    var start = String(plain || '').search(/Reported Items/i);
    if (start < 0) return [];
    var slice = String(plain).slice(start, start + 2500);
    var cut = slice.search(/Carrier Qualification|BASIC PERCENTILE|Insurance Status/i);
    if (cut > 40) slice = slice.slice(0, cut);
    var lines = slice.split(/\n+/);
    var dateRe = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})/i;
    var reasons = [];
    var dates = [];
    var i;
    for (i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/\s+/g, ' ').trim();
      if (!line) continue;
      var dm = line.match(dateRe);
      if (dm) {
        dates.push(dm[1]);
        continue;
      }
      if (/^reported items$/i.test(line) || /view report|freightguard|submitted by|days$/i.test(line)) continue;
      if (!/^[A-Za-z][A-Za-z0-9 /,&'-]{3,70}$/.test(line)) continue;
      var reason = prettyFgReason(line);
      if (reason) reasons.push(reason);
    }
    var out = [];
    var n = Math.max(reasons.length, dates.length);
    for (i = 0; i < n; i++) {
      if (!reasons[i]) continue;
      out.push({ date: dates[i] || '', type: reasons[i] });
    }
    return out;
  }
  function isC411Challenge(html) {
    var t = String(html || '');
    return /Just a moment/i.test(t) || /challenges\.cloudflare\.com/i.test(t);
  }
  function parseC411Page(html) {
    var plain = stripHtml(html);
    var hasUsdot = /USDOT\s+\d+/i.test(plain);
    var loggedOut = /type=["']password["']/i.test(html) && !hasUsdot;
    if (
      loggedOut ||
      (/unauthorized=1/i.test(html) && !hasUsdot) ||
      (/please log in/i.test(plain) && !hasUsdot) ||
      (/member login/i.test(plain) && !hasUsdot && /type=["']password["']/i.test(html))
    ) {
      return { ok: false, login: true, hasFg: false };
    }
    var idx = html.toLowerCase().indexOf('reported items');
    var section = idx >= 0 ? html.slice(idx, idx + 3500) : '';
    var dates = [];
    var dateRe = /\b((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{1,2},\s+\d{4})\b/gi;
    var dm;
    while ((dm = dateRe.exec(section))) dates.push(dm[1]);
    var items = fgItemsFromPlain(plain);
    if (!items.length && dates.length) {
      var tm0 = section.match(/REPORTED ITEMS<\/strong><\/span>\s*(?:<br[^>]*>\s*)+<span[^>]*>([^<]+)/i);
      var rawType = tm0 ? tm0[1].replace(/\s+/g, ' ').trim() : '';
      if (rawType) items.push({ date: dates[0] || '', type: prettyFgReason(rawType) });
    }
    var type = items.length ? items[0].type : null;
    var countM = plain.match(/(\d+)\s+FreightGuard Reports?\s+was submitted/i);
    var count = dates.length;
    if (countM) count = Number(countM[1]);
    var hasFg = idx >= 0 || (countM && count > 0);
    return {
      ok: true,
      login: false,
      hasFg: !!hasFg,
      date: (items[0] && items[0].date) || dates[0] || null,
      type: type,
      items: items.slice(0, 2),
      count: count || (hasFg ? 1 : 0)
    };
  }

  function gmGetJson(url) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        anonymous: false,
        timeout: 12000,
        headers: { Accept: 'application/json' },
        onload: function (res) {
          var text = String((res && res.responseText) || '');
          var status = res && res.status;
          if (status === 401 || /\/broker\/login|\/users\/sign_in/i.test(String((res && res.finalUrl) || ''))) {
            reject(new Error('login'));
            return;
          }
          if (status < 200 || status >= 300) {
            reject(new Error('HTTP ' + status));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch (e) {
            reject(e);
          }
        },
        onerror: function () { reject(new Error('network')); },
        ontimeout: function () { reject(new Error('timeout')); }
      });
    });
  }
  function gmGetHtml(url) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        anonymous: false,
        timeout: 15000,
        cookiePartition: { topLevelSite: 'https://carrier411.com' },
        headers: { Accept: 'text/html' },
        onload: function (res) {
          var html = String((res && res.responseText) || '');
          if (res.status === 429) {
            reject(new Error('429'));
            return;
          }
          if (res.status < 200 || res.status >= 300) {
            if (!isC411Challenge(html) && parseC411Page(html).login) {
              resolve(html);
              return;
            }
            reject(new Error('HTTP ' + res.status));
            return;
          }
          resolve(html);
        },
        onerror: function () { reject(new Error('network')); },
        ontimeout: function () { reject(new Error('timeout')); }
      });
    });
  }

  var c411Inflight = {};
  function lookupC411(mc, force) {
    mc = normMc(mc);
    if (!mc) return Promise.resolve({ ok: false, hasFg: false, error: true });
    if (force) delete c411Inflight[mc];
    if (!force) {
      var cached = getC411Cached(mc);
      if (cached && !cached.login && !cached.error) return Promise.resolve(cached);
    }
    if (c411Inflight[mc]) return c411Inflight[mc];
    var url = C411_URL + encodeURIComponent(docketFromMc(mc));
    c411Inflight[mc] = gmGetHtml(url)
      .then(function (html) {
        if (isC411Challenge(html)) return { ok: false, hasFg: false, error: true, challenge: true };
        var parsed = parseC411Page(html);
        setC411Cached(mc, parsed);
        return getC411Cached(mc) || parsed;
      })
      .catch(function () {
        return { ok: false, hasFg: false, error: true };
      })
      .then(function (fg) {
        delete c411Inflight[mc];
        return fg;
      });
    return c411Inflight[mc];
  }

  function numField(v) {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v)) return Number(v);
    return null;
  }
  function pickUnits(obj) {
    if (!obj || typeof obj !== 'object') return null;
    var summary = obj.equipment && obj.equipment.summary;
    var spots = [
      summary && summary.total_observed_power_units,
      obj.equipment_portfolio && obj.equipment_portfolio.total_observed_power_units,
      obj.equipment && obj.equipment.total_observed_power_units,
      obj.carrier && obj.carrier.equipment_portfolio && obj.carrier.equipment_portfolio.total_observed_power_units
    ];
    var i;
    for (i = 0; i < spots.length; i++) {
      var n = numField(spots[i]);
      if (n != null) return n;
    }
    var raw = '';
    try { raw = JSON.stringify(obj); } catch (e) { raw = ''; }
    var m = raw.match(/"total_observed_power_units"\s*:\s*"?(\d+)"?/);
    return m ? Number(m[1]) : null;
  }
  function pickUnsafe(obj) {
    var list = obj && obj.sms_basics;
    if (!Array.isArray(list) || !list.length) return null;
    var copy = list.slice().sort(function (a, b) {
      return String((b && b.file_date) || '').localeCompare(String((a && a.file_date) || ''));
    });
    var n = numField(copy[0] && copy[0].unsafe_driving_measure);
    return n;
  }
  function pickDomUnits() {
    var nodes = document.querySelectorAll('div, span, p, td');
    var i;
    for (i = 0; i < nodes.length && i < 4000; i++) {
      var t = oneLine(nodes[i].textContent);
      if (!t || t.length > 40) continue;
      var m = t.match(/^(\d+)\s+Power Units?$/i) || t.match(/^Power Units?\s+(\d+)$/i);
      if (m) return Number(m[1]);
    }
    var body = (document.body && document.body.innerText) || '';
    var m2 = body.match(/Power Units?\s+(\d+)/i) || body.match(/(\d+)\s+Power Units?/i);
    return m2 ? Number(m2[1]) : null;
  }
  function pickDomBasic() {
    var body = (document.body && document.body.innerText) || '';
    var m = body.match(/BASIC Score:?\s*([\d.]+)/i);
    if (!m) return null;
    var n = Number(m[1]);
    return isNaN(n) ? null : n;
  }

  function carrierId() {
    var m = String(location.pathname || '').match(/\/broker\/carriers\/(\d+)/);
    return m ? m[1] : null;
  }
  function onCarrierPage() {
    return !!carrierId();
  }
  function topBar() {
    var named = document.querySelector('header[aria-label="Top navigation"]');
    if (named) return named;
    var list = document.querySelectorAll('header');
    var best = null;
    var i;
    for (i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      if (r.top <= 4 && r.height >= 36 && r.height <= 140 && r.width > 320) {
        if (!best || r.width > best.getBoundingClientRect().width) best = list[i];
      }
    }
    return best;
  }
  function readUiExperience() {
    var raw = '';
    try { raw = sessionStorage.getItem('highway:ui-experience:v1') || ''; } catch (e) {}
    if (!raw) {
      try { raw = localStorage.getItem('highway:ui-experience:v1') || ''; } catch (e2) {}
    }
    if (/classic/i.test(raw)) return 'classic';
    if (/redesign/i.test(raw)) return 'new';
    var current = document.querySelector('[data-ui-experience-option][aria-current="true"]');
    if (current) {
      var opt = current.getAttribute('data-ui-experience-option') || '';
      if (opt === 'classic') return 'classic';
      if (opt === 'redesign') return 'new';
    }
    if (document.querySelector('a.floating-nav-item, h1.carrier-name')) return 'classic';
    return 'new';
  }
  function isNewUi() {
    return readUiExperience() !== 'classic';
  }
  function tabButton(label) {
    var buttons = document.querySelectorAll('button[role="tab"], button');
    var i;
    var fallback = null;
    for (i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      var t = oneLine(b.innerText || b.textContent);
      if (t !== label) continue;
      if (b.getAttribute('role') === 'tab' || b.getAttribute('data-tabs-tab') != null) return b;
      if (!fallback) fallback = b;
    }
    return fallback;
  }
  function clickSection(which) {
    var label = which === 'safety' ? 'Safety' : 'Equipment';
    if (isNewUi()) {
      var btn = tabButton(label);
      if (btn) {
        btn.click();
        return true;
      }
    }
    var value = which === 'safety' ? 'safety' : 'equipment';
    var el = document.querySelector('a.floating-nav-item[data-value="' + value + '"]') || document.getElementById('toc-' + value);
    if (el) {
      el.click();
      return true;
    }
    var items = document.querySelectorAll('a.floating-nav-item, a');
    var want = label.toLowerCase();
    var i;
    for (i = 0; i < items.length; i++) {
      if (oneLine(items[i].textContent).toLowerCase() === want && items[i].className && String(items[i].className).indexOf('floating-nav') >= 0) {
        items[i].click();
        return true;
      }
    }
    var late = tabButton(label);
    if (late) {
      late.click();
      return true;
    }
    return false;
  }

  function nameEl() {
    return document.querySelector('h1.carrier-name') || document.querySelector('h1');
  }
  function mcEl() {
    var classic = document.querySelectorAll('span');
    var i;
    for (i = 0; i < classic.length; i++) {
      var t = oneLine(classic[i].textContent);
      if (/^MC\s*#?\s*\d{3,8}$/i.test(t) && classic[i].parentElement && /gap-x-2/.test(classic[i].parentElement.className || '')) {
        return classic[i];
      }
    }
    var nodes = document.querySelectorAll('div, span, a');
    for (i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest && el.closest('#' + ROOT_ID)) continue;
      var text = oneLine(el.textContent);
      if (!/^MC\s*#?\s*\d{3,8}$/i.test(text)) continue;
      if (el.children.length > 6) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 20 || r.height < 8) continue;
      return el;
    }
    return null;
  }
  function dotNear(el) {
    var row = el && el.parentElement;
    if (!row) return '';
    var i;
    for (i = 0; i < row.children.length; i++) {
      var t = oneLine(row.children[i].textContent);
      var m = t.match(/^(?:US)?DOT\s*#?\s*(\d{5,10})$/i);
      if (m) return m[1];
    }
    return '';
  }
  function copyText() {
    var name = oneLine(nameEl() && nameEl().innerText) || lastName || '';
    var mcNode = mcEl();
    var mc = normMc((mcNode && mcNode.textContent) || lastMc);
    var dot = digits(dotNear(mcNode) || lastDot);
    var lines = [];
    if (name) lines.push(name);
    if (mc) lines.push('MC ' + (mc.length < 6 ? ('000000' + mc).slice(-6) : mc));
    if (dot) lines.push('DOT ' + padDot(dot));
    return lines.join('\n');
  }
  function writeClipboard(text) {
    try {
      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(text, 'text');
        return;
      }
    } catch (e) {}
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
    } catch (e2) {}
  }
  var TIP_ID = 'ss-hwy-copytip';
  var COPIED_ID = 'ss-hwy-copied';
  var COPY_ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<rect x="8" y="7" width="11" height="14" rx="2" stroke="currentColor" stroke-width="1.8"></rect>' +
    '<path d="M9 7.2V5.6A1.6 1.6 0 0 1 10.6 4h5.2A1.6 1.6 0 0 1 17.4 5.6V7.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>' +
    '</svg>';
  var TIP_TEXT = 'Click the carrier name to copy the name, MC, and DOT.';
  var copyWatchOn = false;
  var copiedTimer = 0;
  function pageIsDark() {
    var bg = '';
    try { bg = getComputedStyle(document.body).backgroundColor || ''; } catch (e) {}
    var m = bg.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return false;
    return (0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3])) < 90;
  }
  function ensureTip() {
    var tip = document.getElementById(TIP_ID);
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = TIP_ID;
    tip.setAttribute('role', 'tooltip');
    tip.innerHTML = COPY_ICON + '<span></span>';
    document.documentElement.appendChild(tip);
    return tip;
  }
  function placeTip(el, message) {
    var tip = ensureTip();
    tip.querySelector('span').textContent = message || TIP_TEXT;
    tip.classList.add('ss-show');
    var r = el.getBoundingClientRect();
    var left = Math.max(8, Math.round(r.left));
    var top = Math.round(r.top - tip.offsetHeight - 8);
    if (top < 8) top = Math.round(r.bottom + 8);
    if (left + tip.offsetWidth > window.innerWidth - 8) left = Math.max(8, window.innerWidth - tip.offsetWidth - 8);
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() {
    var tip = document.getElementById(TIP_ID);
    if (tip) tip.classList.remove('ss-show');
  }
  function showCopied(el) {
    var chip = document.getElementById(COPIED_ID);
    if (!chip) {
      chip = document.createElement('div');
      chip.id = COPIED_ID;
      chip.innerHTML = '<span aria-hidden="true">\u2713</span> Copied';
      document.documentElement.appendChild(chip);
    }
    var r = el.getBoundingClientRect();
    chip.style.left = Math.max(8, Math.round(r.left)) + 'px';
    chip.style.top = Math.round(r.bottom + 6) + 'px';
    chip.classList.add('ss-show');
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(function () {
      if (chip) chip.classList.remove('ss-show');
    }, 1400);
  }
  function carrierNameHit(node) {
    var el = nameEl();
    if (!el || !node) return null;
    var n = node.nodeType === 1 ? node : node.parentElement;
    if (n && el.contains(n)) return el;
    return null;
  }
  function watchNameCopy() {
    if (copyWatchOn) return;
    copyWatchOn = true;
    document.addEventListener('mouseover', function (ev) {
      var el = carrierNameHit(ev.target);
      if (!el) return;
      placeTip(el, TIP_TEXT);
    }, true);
    document.addEventListener('mouseout', function (ev) {
      var el = carrierNameHit(ev.target);
      if (!el) return;
      var next = ev.relatedTarget;
      if (next && el.contains(next)) return;
      hideTip();
    }, true);
    document.addEventListener('click', function (ev) {
      var el = carrierNameHit(ev.target);
      if (!el) return;
      ev.preventDefault();
      ev.stopPropagation();
      var text = copyText();
      if (!text) return;
      writeClipboard(text);
      showCopied(el);
      placeTip(el, 'Copied to clipboard.');
      setTimeout(function () {
        var still = nameEl();
        if (still && still.matches(':hover')) placeTip(still, TIP_TEXT);
        else hideTip();
      }, 1400);
    }, true);
  }
  function bindCopy() {
    var oldHot = document.getElementById('ss-hwy-copyhot');
    if (oldHot) oldHot.remove();
    var el = nameEl();
    if (!el || !onCarrierPage()) {
      hideTip();
      var chip = document.getElementById(COPIED_ID);
      if (chip) chip.classList.remove('ss-show');
      return;
    }
    el.classList.add('ss-hwy-name');
    el.classList.toggle('ss-hwy-name-on-dark', pageIsDark());
    watchNameCopy();
    var tip = document.getElementById(TIP_ID);
    if (tip && tip.classList.contains('ss-show')) placeTip(el, tip.querySelector('span').textContent);
    var copied = document.getElementById(COPIED_ID);
    if (copied && copied.classList.contains('ss-show')) {
      var r = el.getBoundingClientRect();
      copied.style.left = Math.max(8, Math.round(r.left)) + 'px';
      copied.style.top = Math.round(r.bottom + 6) + 'px';
    }
  }

  function injectStyles() {
    var s = document.getElementById(STYLE_ID);
    if (s && s.getAttribute('data-ss-ver') === '2026.41.2.2') return;
    if (!s) {
      s = document.createElement('style');
      s.id = STYLE_ID;
      document.documentElement.appendChild(s);
    }
    s.setAttribute('data-ss-ver', '2026.41.2.2');
    s.textContent =
      '#' + ROOT_ID + '{position:fixed;z-index:2147483646;display:flex;align-items:stretch;gap:6px;height:40px;pointer-events:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}' +
      '#' + ROOT_ID + ' .ss-box,#' + ROOT_ID + ' a.ss-btn{pointer-events:auto;box-sizing:border-box;height:40px;display:flex;flex-direction:column;justify-content:center;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.28);}' +
      '#' + ROOT_ID + ' .ss-box{width:112px;min-width:112px;padding:2px 8px;border:1px solid rgba(0,0,0,.14);color:#0f172a;background:#e2e8f0;line-height:1.05;cursor:pointer;}' +
      '#' + ROOT_ID + ' .ss-box .ss-label{font-size:8px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.8;}' +
      '#' + ROOT_ID + ' .ss-box .ss-value{font-size:14px;font-weight:800;line-height:1.1;}' +
      '#' + ROOT_ID + ' .ss-box .ss-sub{font-size:9px;font-weight:650;opacity:.9;}' +
      '#' + ROOT_ID + ' .ss-green{background:#bbf7d0;border-color:#16a34a;color:#14532d;}' +
      '#' + ROOT_ID + ' .ss-yellow{background:#fef08a;border-color:#ca8a04;color:#713f12;}' +
      '#' + ROOT_ID + ' .ss-red{background:#fecaca;border-color:#dc2626;color:#7f1d1d;}' +
      '#' + ROOT_ID + ' .ss-gray{background:#e2e8f0;border-color:#94a3b8;color:#334155;}' +
      '#' + ROOT_ID + ' .ss-box:hover{filter:brightness(.97);}' +
      '#' + ROOT_ID + ' a.ss-btn{width:112px;min-width:112px;max-width:112px;padding:3px 8px 2px;border:1px solid rgba(0,0,0,.16);background:#fff;color:#0f172a;text-decoration:none;align-items:center;}' +
      '#' + ROOT_ID + ' a.ss-btn:hover{background:#f8fafc;}' +
      '#' + ROOT_ID + ' a.ss-btn img{display:block;height:15px;width:auto;max-width:96px;object-fit:contain;}' +
      '#' + ROOT_ID + ' .hwy-mc-pill{display:inline-block;margin-top:2px;border-radius:999px;padding:0 6px;font-size:10px;font-weight:700;line-height:14px;border:1px solid transparent;white-space:nowrap;max-width:132px;overflow:hidden;text-overflow:ellipsis;}' +
      '#' + ROOT_ID + ' .hwy-mc-fail{background:#F8D0D6;color:#9B1B30;border-color:#F0A8B4;}' +
      '#' + ROOT_ID + ' .hwy-mc-partial{background:#D1E7DD;color:#0F5132;border-color:#A3CFBB;}' +
      '#' + ROOT_ID + ' .hwy-mc-wait{background:#EEF2F6;color:#4B5563;border-color:#D0D7DE;}' +
      'span.ss-hwy-mc,a.ss-hwy-mc{color:inherit !important;text-decoration:none !important;cursor:text !important;font-weight:inherit !important;}' +
      'h1.ss-hwy-name{color:#3B6EA5 !important;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;cursor:pointer;}' +
      'h1.ss-hwy-name:hover{color:#2F5E90 !important;}' +
      'h1.ss-hwy-name.ss-hwy-name-on-dark{color:#A9C7E8 !important;}' +
      'h1.ss-hwy-name.ss-hwy-name-on-dark:hover{color:#C5D9F0 !important;}' +
      '#' + TIP_ID + '{position:fixed;z-index:2147483646;display:none;align-items:flex-start;gap:8px;max-width:250px;padding:8px 10px;border-radius:8px;background:#243044;color:#f8fafc;box-shadow:0 8px 20px rgba(15,23,42,.28);font:12px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;pointer-events:none;}' +
      '#' + TIP_ID + '.ss-show{display:flex;}' +
      '#' + TIP_ID + ' svg{flex:none;margin-top:1px;color:#d6e4f5;}' +
      '#' + COPIED_ID + '{position:fixed;z-index:2147483646;display:none;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;background:#e7f6ee;color:#166534;border:1px solid #b7e4c7;font:12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-weight:700;box-shadow:0 4px 12px rgba(15,23,42,.16);pointer-events:none;}' +
      '#' + COPIED_ID + '.ss-show{display:inline-flex;}';
  }
  function ensureRoot() {
    var root = document.getElementById(ROOT_ID);
    if (root) return root;
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('aria-live', 'polite');
    document.documentElement.appendChild(root);
    return root;
  }
  function unitsColor(n) {
    if (n == null || isNaN(Number(n))) return 'ss-gray';
    return Number(n) >= 10 ? 'ss-green' : 'ss-red';
  }
  function basicColor(score) {
    if (score == null || isNaN(Number(score))) return 'ss-gray';
    var n = Number(score);
    if (n === 0) return 'ss-green';
    if (n > 0 && n <= 3) return 'ss-yellow';
    if (n > 3) return 'ss-red';
    return 'ss-gray';
  }
  function basicLabel(score) {
    if (score == null || isNaN(Number(score))) return 'Looking';
    var n = Number(score);
    if (n === 0) return 'Best (0)';
    if (n > 0 && n <= 3) return 'OK (\u2264 3)';
    if (n > 3) return 'High (> 3)';
    return '';
  }
  function unitsLabel(n) {
    if (n == null) return 'Looking';
    return Number(n) >= 10 ? '10+ pass' : 'Under 10';
  }
  function fgKey(fg) {
    if (!fg) return 'loading';
    if (fg.login) return 'login';
    if (fg.hasFg) return 'fg:' + (fg.date || '') + ':' + (fg.count || 0);
    if (fg.error) return 'err';
    return 'nofg';
  }
  function pill(mc, fg) {
    var span = document.createElement('span');
    span.className = 'hwy-mc-pill hwy-mc-wait';
    if (!mc) {
      span.textContent = 'No MC';
      return span;
    }
    if (!fg) {
      span.textContent = 'Loading';
      return span;
    }
    if (fg.login) {
      span.textContent = 'Sign in';
      span.title = 'Sign in to Carrier411';
      return span;
    }
    if (fg.hasFg) {
      var when = compactFgDate(fg.date);
      span.className = 'hwy-mc-pill hwy-mc-fail';
      span.textContent = when ? 'FG ' + when : 'FG';
      span.title = (fg.type || 'FreightGuard report') + (fg.count > 1 ? ' (' + fg.count + ')' : '');
      return span;
    }
    if (fg.error) {
      span.textContent = 'Click to load';
      span.title = 'Could not load Carrier411. Click to open it.';
      return span;
    }
    span.className = 'hwy-mc-pill hwy-mc-partial';
    span.textContent = 'No FG';
    span.title = 'No FreightGuard report';
    return span;
  }

  var lastKey = '';
  var lastUnits = null;
  var lastBasic = null;
  var lastMc = null;
  var lastDot = '';
  var lastName = '';
  var lastFg = null;
  var lastId = null;
  var loadToken = 0;

  function logoLink(bar) {
    if (!bar) return null;
    return (
      bar.querySelector('a[aria-label="Go to homepage"]') ||
      bar.querySelector('a[aria-label*="homepage" i]') ||
      bar.querySelector('a svg.h-4') && bar.querySelector('a svg.h-4').closest('a')
    );
  }
  function searchWrap(bar) {
    if (!bar) return null;
    var input = bar.querySelector('input[aria-label*="Search" i]') || bar.querySelector('input');
    if (!input) return null;
    var box = input.parentElement;
    var guard = 0;
    while (box && box !== bar && guard++ < 6) {
      var br = box.getBoundingClientRect();
      if (br.height >= 32 && br.width >= 160) return box;
      box = box.parentElement;
    }
    return input;
  }
  function classicAnchor() {
    var input = document.querySelector('input.global-search-input');
    if (!input) return null;
    var search = input;
    var ir = input.getBoundingClientRect();
    var el = input.parentElement;
    var guard = 0;
    while (el && guard++ < 4) {
      var r = el.getBoundingClientRect();
      if (r.width > ir.width + 24 || r.top > 80) break;
      if (r.height >= 28) search = el;
      el = el.parentElement;
    }
    var sr = search.getBoundingClientRect();
    var right = null;
    var nodes = document.querySelectorAll('a, button');
    var i;
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.closest && n.closest('#' + ROOT_ID)) continue;
      var nr = n.getBoundingClientRect();
      if (nr.top > 70 || nr.height < 12 || nr.width < 24) continue;
      if (nr.left < sr.right + 4) continue;
      if (!right || nr.left < right.left) right = nr;
    }
    return { search: sr, right: right };
  }
  function place(root) {
    var bar = topBar();
    var logo = logoLink(bar);
    var search = searchWrap(bar);
    root.style.right = 'auto';
    if (!isNewUi()) {
      var classic = classicAnchor();
      root.style.visibility = 'visible';
      root.style.transform = 'none';
      root.style.transformOrigin = 'left center';
      if (!classic) {
        root.style.top = '6px';
        root.style.left = '50%';
        root.style.transform = 'translateX(-50%)';
        return;
      }
      var natural = root.offsetWidth || 348;
      var naturalH = root.offsetHeight || 40;
      var gapL = Math.round(classic.search.right) + 8;
      var gapR = classic.right ? Math.round(classic.right.left) - 8 : Math.round(window.innerWidth - 12);
      var available = gapR - gapL;
      if (available < 72) {
        root.style.visibility = 'hidden';
        return;
      }
      var scale = natural > 0 ? Math.min(1, available / natural) : 1;
      var visualH = naturalH * scale;
      root.style.top = Math.round(classic.search.top + (classic.search.height - visualH) / 2) + 'px';
      root.style.left = gapL + 'px';
      root.style.transform = scale < 0.995 ? 'scale(' + scale.toFixed(3) + ')' : 'none';
      return;
    }
    if (!logo || !search) {
      root.style.visibility = 'visible';
      root.style.transformOrigin = 'center top';
      root.style.top = '6px';
      root.style.left = '50%';
      root.style.transform = 'translateX(-50%)';
      return;
    }
    root.style.transformOrigin = 'left center';
    root.style.transform = 'none';
    var lr = logo.getBoundingClientRect();
    var sr = search.getBoundingClientRect();
    var gapL = Math.round(lr.right) + 12;
    var gapR = Math.round(sr.left) - 12;
    var available = gapR - gapL;
    var natural = root.offsetWidth || 348;
    var naturalH = root.offsetHeight || 40;
    if (available < 72) {
      root.style.visibility = 'hidden';
      return;
    }
    root.style.visibility = 'visible';
    var scale = natural > 0 ? Math.min(1, available / natural) : 1;
    var visualH = naturalH * scale;
    var top = Math.round(sr.top + (sr.height - visualH) / 2);
    root.style.top = top + 'px';
    root.style.left = gapL + 'px';
    root.style.transform = scale < 0.995 ? 'scale(' + scale.toFixed(3) + ')' : 'none';
  }

  function render() {
    if (!onCarrierPage()) {
      var old = document.getElementById(ROOT_ID);
      if (old) old.remove();
      hideTip();
      var copied = document.getElementById(COPIED_ID);
      if (copied) copied.remove();
      return;
    }
    injectStyles();
    var root = ensureRoot();
    var key = [lastId, lastUnits, lastBasic, lastMc, fgKey(lastFg)].join('|');
    var fresh = key !== lastKey || !root.childElementCount;
    if (fresh) {
      lastKey = key;
      var mc = normMc(lastMc);
      var href = mc ? C411_URL + encodeURIComponent(docketFromMc(mc)) : 'https://www.carrier411.com/';
      root.innerHTML = '';
      var units = document.createElement('div');
      units.className = 'ss-box ' + unitsColor(lastUnits);
      units.title = 'Open Equipment';
      units.innerHTML = '<div class="ss-label">Power Units</div><div class="ss-value">' +
        (lastUnits != null ? String(lastUnits) : '\u2026') + '</div><div class="ss-sub">' + unitsLabel(lastUnits) + '</div>';
      units.addEventListener('click', function () { clickSection('equipment'); });
      var basic = document.createElement('div');
      basic.className = 'ss-box ' + basicColor(lastBasic);
      basic.title = 'Open Safety';
      basic.innerHTML = '<div class="ss-label">BASIC Score</div><div class="ss-value">' +
        (lastBasic != null ? formatSafety(lastBasic) : '\u2026') + '</div><div class="ss-sub">' + basicLabel(lastBasic) + '</div>';
      basic.addEventListener('click', function () { clickSection('safety'); });
      var btn = document.createElement('a');
      btn.className = 'ss-btn';
      btn.href = href;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.title = mc ? 'Open Carrier411 for MC ' + mc : 'Carrier411';
      var img = document.createElement('img');
      img.src = LOGO_DATA_URI;
      img.alt = 'Carrier411';
      btn.appendChild(img);
      btn.appendChild(pill(mc, lastFg));
      btn.addEventListener('click', function () {
        if (mc && lastFg && (lastFg.error || lastFg.login)) lookupC411(mc, true).then(applyFg);
      });
      root.appendChild(units);
      root.appendChild(basic);
      root.appendChild(btn);
    }
    place(root);
    bindCopy();
  }
  function applyFg(fg) {
    lastFg = fg || { error: true };
    render();
  }
  function loadCarrier(id) {
    var token = ++loadToken;
    lastId = id;
    lastUnits = null;
    lastBasic = null;
    lastMc = null;
    lastDot = '';
    lastName = '';
    lastFg = null;
    lastKey = '';
    render();
    var detailUrl = 'https://highway.com/monitor/api/v1/carriers/' + encodeURIComponent(id) + '/detail_for_highway_broker';
    var safetyUrl = 'https://highway.com/monitor/api/v1/carriers/' + encodeURIComponent(id) + '/safety';
    gmGetJson(detailUrl).then(function (data) {
      if (token !== loadToken) return;
      var units = pickUnits(data);
      if (units != null) lastUnits = units;
      if (data) {
        if (data.legal_name || data.name) lastName = data.legal_name || data.name;
        if (data.mc_number) lastMc = normMc(data.mc_number);
        if (data.dot_number) lastDot = digits(data.dot_number);
      }
      render();
      if (lastMc) startFg(lastMc);
    }).catch(function () {
      if (token !== loadToken) return;
      var domUnits = pickDomUnits();
      if (domUnits != null) lastUnits = domUnits;
      render();
    });
    gmGetJson(safetyUrl).then(function (data) {
      if (token !== loadToken) return;
      var n = pickUnsafe(data);
      if (n != null) lastBasic = n;
      else {
        var dom = pickDomBasic();
        if (dom != null) lastBasic = dom;
      }
      render();
    }).catch(function () {
      if (token !== loadToken) return;
      var dom = pickDomBasic();
      if (dom != null) lastBasic = dom;
      render();
    });
  }
  function startFg(mc) {
    var cached = getC411Cached(mc);
    if (cached && !cached.login && !cached.error) {
      lastFg = cached;
      render();
      return;
    }
    lookupC411(mc, false).then(function (fg) {
      if (normMc(mc) !== normMc(lastMc)) return;
      applyFg(fg);
    });
  }
  function syncFromDom() {
    bindCopy();
    var el = mcEl();
    var mc = el ? normMc(el.textContent) : '';
    if (mc && mc !== normMc(lastMc)) {
      lastMc = mc;
      lastKey = '';
      startFg(mc);
    }
    if (lastUnits == null) {
      var u = pickDomUnits();
      if (u != null) lastUnits = u;
    }
    if (lastBasic == null) {
      var b = pickDomBasic();
      if (b != null) lastBasic = b;
    }
    var dot = digits(dotNear(el));
    if (dot) lastDot = dot;
    var name = oneLine(nameEl() && nameEl().innerText);
    if (name) lastName = name;
    render();
  }

  function startC411PageHint() {
    function cacheLive() {
      try {
        var m = String(location.search || '').match(/docket=MC0*(\d+)/i);
        if (!m) return;
        var html = document.documentElement.innerHTML || '';
        if (isC411Challenge(html)) return;
        var live = parseC411Page(html);
        if (!live.login) setC411Cached(String(Number(m[1])), live);
      } catch (e) {}
    }
    cacheLive();
    window.addEventListener('pageshow', cacheLive);
  }

  if (ON_C411) {
    startC411PageHint();
    return;
  }
  if (!ON_HWY) return;

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      var id = carrierId();
      if (!id) {
        lastId = null;
        render();
        return;
      }
      if (id !== lastId) loadCarrier(id);
      syncFromDom();
    }, 200);
  }

  function hookHistory() {
    var push = history.pushState;
    history.pushState = function () {
      var r = push.apply(this, arguments);
      schedule();
      return r;
    };
    window.addEventListener('popstate', schedule);
  }

  function start() {
    hookHistory();
    schedule();
    var root = document.body || document.documentElement;
    if (root) {
      new MutationObserver(function () { schedule(); }).observe(root, { childList: true, subtree: true });
    }
    window.addEventListener('resize', function () { render(); });
    window.addEventListener('scroll', function () { bindCopy(); }, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () { render(); });
    }
    setInterval(function () {
      if (onCarrierPage()) render();
    }, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
