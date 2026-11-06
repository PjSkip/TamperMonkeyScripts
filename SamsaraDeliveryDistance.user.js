// ==UserScript==
// @name         Samsara delivery distance
// @namespace    shipsierra.samsara.delivery
// @version      1.13.0
// @description  Pin a confirmed delivery on a Samsara live viewer map and open driving directions from the truck GPS.
// @author       Ivan Karpenko
// @homepageURL  https://github.com/PjSkip/TamperMonkeyScripts
// @updateURL    https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/SamsaraDeliveryDistance.user.js
// @downloadURL  https://raw.githubusercontent.com/PjSkip/TamperMonkeyScripts/main/SamsaraDeliveryDistance.user.js
// @match        https://cloud.samsara.com/o/*/fleet/viewer/*
// @match        https://cloud.samsara.com/o/*/fleet/viewer/
// @match        https://cloud.eu.samsara.com/o/*/fleet/viewer/*
// @match        https://cloud.eu.samsara.com/o/*/fleet/viewer/
// @match        https://cloud.ca.samsara.com/o/*/fleet/viewer/*
// @match        https://cloud.ca.samsara.com/o/*/fleet/viewer/
// @run-at       document-start
// @grant        none
// ==/UserScript==
//
// Runs on any Samsara live fleet viewer link (US, EU, and Canada clouds).
// Uses the Google Maps script Samsara already loaded on that page
// (Geocoder + DirectionsService). No API key is copied into this file.
// The script does not write to Samsara.
//
// Driving distance and time come from that Maps library. If Google refuses
// the route, the panel shows a straight-line distance and does not invent
// a drive time. Google Maps itself still calculates the route when you
// click Open driving directions.

(function () {
  "use strict";

  var PANEL_ID = "ss-delivery-card";
  var STALE_MS = 20 * 60 * 1000;
  var MOVE_DEG = 0.0004;

  var state = {
    timer: null,
    marker: null,
    info: null,
    map: null,
    delivery: null,
    origin: null,
    lastRouted: null,
    candidates: [],
    allowStale: false,
    autocomplete: null,
    routeLine: null,
    routeCasing: null,
    suggestTimer: null,
    suggestGen: 0,
    org: "",
    watch: null,
    booted: false
  };

  function asleep() {
    return document.hidden || document.visibilityState === "hidden";
  }

  function stopWatch() {
    if (!state.watch) return;
    state.watch.disconnect();
    state.watch = null;
  }

  function stopLoops() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    if (state.suggestTimer) {
      clearTimeout(state.suggestTimer);
      state.suggestTimer = null;
    }
    if (state.watchTimer) {
      clearTimeout(state.watchTimer);
      state.watchTimer = null;
    }
    stopWatch();
  }

  function orgFromPath() {
    var match = location.pathname.match(/^\/o\/(\d+)\/fleet\/viewer(?:\/|$)/);
    return match ? match[1] : "";
  }

  function historyKey() {
    return "ss-delivery-history-" + orgFromPath();
  }

  function legacyKey() {
    return "ss-delivery-" + orgFromPath();
  }

  function onViewer() {
    return /^cloud(?:\.[a-z]{2})?\.samsara\.com$/i.test(location.hostname) && !!orgFromPath();
  }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "style") node.style.cssText = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    if (text != null) node.textContent = text;
    return node;
  }

  function loadHistory() {
    var list = [];
    try {
      var raw = localStorage.getItem(historyKey());
      var parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) list = parsed;
    } catch (e) {
      list = [];
    }
    try {
      var oldRaw = localStorage.getItem(legacyKey());
      if (oldRaw) {
        var old = JSON.parse(oldRaw);
        localStorage.removeItem(legacyKey());
        if (old && old.formatted && typeof old.lat === "number") {
          old.usedAt = old.usedAt || Date.now();
          list.unshift(old);
        }
      }
    } catch (e2) {}
    var seen = {};
    var clean = [];
    list.forEach(function (item) {
      if (!item || !item.formatted || typeof item.lat !== "number" || seen[item.formatted]) return;
      seen[item.formatted] = true;
      clean.push(item);
    });
    clean = clean.slice(0, 3);
    try { localStorage.setItem(historyKey(), JSON.stringify(clean)); } catch (e3) {}
    return clean;
  }

  function remember(delivery) {
    var list = loadHistory().filter(function (item) {
      return item.formatted !== delivery.formatted;
    });
    list.unshift({
      formatted: delivery.formatted,
      lat: delivery.lat,
      lng: delivery.lng,
      precision: delivery.precision,
      usedAt: Date.now()
    });
    try { localStorage.setItem(historyKey(), JSON.stringify(list.slice(0, 3))); } catch (e) {}
    renderHistory();
  }

  function precisionOf(result) {
    var types = result.types || [];
    var locType = result.geometry && result.geometry.location_type;
    if (types.indexOf("street_address") >= 0 || types.indexOf("premise") >= 0 || types.indexOf("subpremise") >= 0 || locType === "ROOFTOP" || locType === "RANGE_INTERPOLATED") {
      return "street";
    }
    if (types.indexOf("postal_code") >= 0) return "postal";
    if (types.indexOf("locality") >= 0 || types.indexOf("administrative_area_level_3") >= 0 || types.indexOf("administrative_area_level_1") >= 0) {
      return "locality";
    }
    return "approximate";
  }

  function precisionLabel(code) {
    if (code === "street") return "Street address";
    if (code === "postal") return "ZIP center only";
    if (code === "locality") return "City center only";
    return "Approximate";
  }

  function gpsLines(formatted) {
    var text = String(formatted || "").replace(/,\s*(USA|United States)$/i, "");
    var parts = text.split(",").map(function (part) { return part.trim(); }).filter(Boolean);
    if (parts.length < 2) return [text || "Waiting for truck GPS"];
    var head = parts[0];
    var rest = parts.slice(1);
    var offset = rest[0].match(/^(\d+(?:\.\d+)?\s+mi\s+[NSEW]{1,3})\s+(.+)$/i);
    if (offset) {
      head = head + ", " + offset[1];
      rest = [offset[2]].concat(rest.slice(1));
    }
    rest = rest.filter(function (part) { return !/county$/i.test(part); });
    return rest.length ? [head, rest.join(", ")] : [head];
  }

  function placeLines(formatted) {
    var text = String(formatted || "").replace(/,\s*(USA|United States)$/i, "");
    var parts = text.split(",").map(function (part) { return part.trim(); }).filter(Boolean);
    if (parts.length < 2) return [text];
    return [parts[0], parts.slice(1).join(", ")];
  }

  function formatDuration(seconds) {
    var total = Math.round((Number(seconds) || 0) / 60);
    if (seconds > 0 && total < 1) total = 1;
    var hours = Math.floor(total / 60);
    var mins = total % 60;
    if (hours && mins) return hours + " hr " + mins + " min";
    if (hours) return hours + " hr";
    return mins + " min";
  }

  function walkFiber(start, visit) {
    if (!start) return;
    var fk = Object.keys(start).find(function (k) { return k.indexOf("__reactFiber$") === 0; });
    var fiber = fk && start[fk];
    var seen = new Set();
    var steps = 0;
    while (fiber && steps < 40) {
      if (seen.has(fiber)) break;
      seen.add(fiber);
      steps++;
      [fiber.memoizedProps, fiber.memoizedState].forEach(function (src) {
        if (!src || typeof src !== "object") return;
        var stack = [src];
        var inner = new Set();
        var n = 0;
        while (stack.length && n < 500) {
          var cur = stack.pop();
          if (!cur || typeof cur !== "object" || inner.has(cur)) continue;
          inner.add(cur);
          n++;
          if (visit(cur) === true) return;
          Object.keys(cur).forEach(function (key) {
            if (key === "window" || key === "parent" || key === "children") return;
            var val = cur[key];
            if (val && typeof val === "object") stack.push(val);
          });
        }
      });
      fiber = fiber.return;
    }
  }

  function findMap() {
    var host = document.querySelector("div.map");
    var found = null;
    if (!window.google || !google.maps || !google.maps.Map) return null;
    walkFiber(host, function (cur) {
      try {
        if (cur instanceof google.maps.Map) {
          found = cur;
          return true;
        }
      } catch (e) {}
    });
    return found;
  }

  function findGps() {
    var host = document.querySelector("div.map") || document.querySelector(".FleetViewerV2");
    var best = null;
    walkFiber(host, function (cur) {
      if (typeof cur.latitude !== "number" || typeof cur.longitude !== "number" || typeof cur.time !== "number") return;
      if (cur.locationSource && cur.locationSource !== "LOCATION_SOURCE_GPS_FIX") return;
      if (!best || cur.time > best.time) best = cur;
    });
    if (!best) return null;
    return {
      lat: best.latitude,
      lng: best.longitude,
      time: best.time,
      formatted: best.formatted || ""
    };
  }

  function formatClock(date) {
    try {
      return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function formatWhen(ms) {
    try {
      return new Date(ms).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "numeric", day: "numeric", timeZoneName: "short" });
    } catch (e) {
      return String(ms);
    }
  }

  function milesBetween(a, b) {
    var r = 6371000;
    var p1 = a.lat * Math.PI / 180;
    var p2 = b.lat * Math.PI / 180;
    var dlat = (b.lat - a.lat) * Math.PI / 180;
    var dlng = (b.lng - a.lng) * Math.PI / 180;
    var h = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dlng / 2) * Math.sin(dlng / 2);
    return (2 * r * Math.asin(Math.min(1, Math.sqrt(h)))) / 1609.344;
  }

  function mapsUrl(origin, dest) {
    var url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("origin", origin.lat.toFixed(6) + "," + origin.lng.toFixed(6));
    url.searchParams.set("destination", dest.lat.toFixed(6) + "," + dest.lng.toFixed(6));
    url.searchParams.set("travelmode", "driving");
    return url.toString();
  }

  function moved(a, b) {
    if (!a || !b) return true;
    return Math.abs(a.lat - b.lat) > MOVE_DEG || Math.abs(a.lng - b.lng) > MOVE_DEG;
  }

  function ui() {
    return document.getElementById(PANEL_ID);
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "\u0026quot;" }[ch];
    });
  }

  function copyText(plain, html) {
    if (navigator.clipboard && window.ClipboardItem) {
      var item = new ClipboardItem({
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" })
      });
      return navigator.clipboard.write([item]).catch(function () {
        return copyTextFallback(plain);
      });
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(plain).catch(function () {
        return copyTextFallback(plain);
      });
    }
    return copyTextFallback(plain);
  }

  function copyTextFallback(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    area.remove();
    return ok ? Promise.resolve() : Promise.reject();
  }

  function summaryText() {
    var where = (state.origin && state.origin.formatted) || "not available";
    var miles = "not available";
    if (state.delivery && state.delivery.drive && state.delivery.drive.distance) {
      miles = state.delivery.drive.distance;
      if (!/mi\b/i.test(miles)) miles += " mi";
    } else if (state.delivery && state.delivery.straight != null) {
      miles = state.delivery.straight.toFixed(1) + " mi straight-line";
    }
    return {
      plain: "Truck's Current Location: " + where + "\n" +
        "Distance to Delivery: " + miles + "\n\n" +
        "Tracking Link: " + location.href,
      html: "Truck's Current Location: <b>" + escapeHtml(where) + "</b><br>" +
        "Distance to Delivery: <b>" + escapeHtml(miles) + "</b><br><br>" +
        "Tracking Link: " + escapeHtml(location.href)
    };
  }

  function copySummary() {
    var summary = summaryText();
    copyText(summary.plain, summary.html).then(function () {
      setStatus("Copied current location.");
    }).catch(function () {
      setStatus("Could not copy. Select the text and copy it manually.");
    });
  }

  function renderLocation() {
    var node = ui() && ui().querySelector("[data-ss='where']");
    if (!node) return;
    node.textContent = "";
    var text = state.origin && state.origin.formatted;
    if (!text) {
      node.textContent = "Waiting for truck GPS";
      return;
    }
    gpsLines(text).forEach(function (line) {
      node.appendChild(el("div", { style: "white-space:nowrap;overflow:hidden;text-overflow:ellipsis" }, line));
    });
  }

  function setStatus(text) {
    var node = ui() && ui().querySelector("[data-ss='status']");
    if (node) node.textContent = text || "";
  }

  function renderResults() {
    var box = ui() && ui().querySelector("[data-ss='results']");
    if (!box) return;
    box.textContent = "";
    var delivery = state.delivery;
    var origin = state.origin;
    if (!delivery) return;

    var lines = placeLines(delivery.formatted);
    lines.forEach(function (line, index) {
      var last = index === lines.length - 1;
      box.appendChild(el("div", {
        style: (index === 0
          ? "font-weight:650;font-size:13px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
          : "font-size:12px;line-height:1.35;color:#344054;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")
          + (last ? ";margin-bottom:8px" : "")
      }, line));
    });
    box.appendChild(el("div", { style: "color:#667085;font-size:12px;margin:-6px 0 12px" }, precisionLabel(delivery.precision)));
    if (!origin) {
      box.appendChild(el("div", { style: "color:#667085" }, "Truck GPS is not available yet."));
      return;
    }
    var stale = Date.now() - origin.time > STALE_MS;
    var tiles = el("div", { style: "display:grid;grid-template-columns:minmax(0,0.9fr) minmax(0,1.25fr) minmax(0,0.85fr);gap:6px" });
    function tile(label, value) {
      var card = el("div", { style: "background:#f4f7fb;border-radius:10px;padding:6px 8px;min-width:0" });
      card.appendChild(el("div", { style: "color:#667085;font-size:10px;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap" }, label));
      card.appendChild(el("div", { style: "font-size:13px;font-weight:700;margin-top:1px;letter-spacing:-0.02em;white-space:nowrap" }, value));
      tiles.appendChild(card);
    }
    if (stale && !state.allowStale) {
      tile("Distance", "Paused");
      tile("Drive time", "Paused");
      tile("ETA", "Paused");
    } else if (delivery.drive) {
      tile("Distance", delivery.drive.distance);
      tile("Drive time", delivery.drive.duration);
      tile("ETA", formatClock(new Date(delivery.drive.etaAt)));
    } else if (delivery.straight != null) {
      tile("Direct", delivery.straight.toFixed(1) + " mi");
      tile("Drive time", "None");
      tile("ETA", "None");
    } else {
      tile("Distance", "...");
      tile("Drive time", "...");
      tile("ETA", "...");
    }
    box.appendChild(tiles);
    var note = stale ? "GPS " + formatWhen(origin.time) + ", stale" : "GPS " + formatWhen(origin.time);
    if (delivery.drive) note += delivery.drive.traffic ? " · Live traffic" : " · No live traffic";
    box.appendChild(el("div", { style: "color:#667085;font-size:12px;margin-top:8px;white-space:nowrap" }, note));
  }

  function syncButtons() {
    var panel = ui();
    if (!panel) return;
    var open = panel.querySelector("[data-ss='open']");
    var origin = state.origin;
    var delivery = state.delivery;
    var stale = origin && (Date.now() - origin.time > STALE_MS);
    var ok = !!(origin && delivery && (!stale || state.allowStale));
    open.disabled = !ok;
  }

  function placeMarker() {
    if (!state.map || !state.delivery || !window.google || !google.maps) return;
    if (state.marker) state.marker.setMap(null);
    state.marker = new google.maps.Marker({
      map: state.map,
      position: { lat: state.delivery.lat, lng: state.delivery.lng },
      title: "Delivery",
      label: { text: "D", color: "#fff", fontSize: "12px" },
      zIndex: 999999
    });
    if (!state.info) state.info = new google.maps.InfoWindow();
    state.marker.addListener("click", function () {
      var wrap = el("div", { style: "font:13px/1.4 Arial,sans-serif;max-width:240px" });
      wrap.appendChild(el("strong", null, "Delivery"));
      wrap.appendChild(el("div", null, state.delivery.formatted));
      wrap.appendChild(el("div", null, precisionLabel(state.delivery.precision)));
      var link = el("button", { type: "button", style: "margin-top:6px" }, "Open driving directions");
      link.addEventListener("click", openDirections);
      wrap.appendChild(link);
      state.info.setContent(wrap);
      state.info.open(state.map, state.marker);
    });
  }

  function clearRoute() {
    if (state.routeLine) {
      state.routeLine.setMap(null);
      state.routeLine = null;
    }
    if (state.routeCasing) {
      state.routeCasing.setMap(null);
      state.routeCasing = null;
    }
  }

  function showRoute(result) {
    if (!state.map || !window.google || !google.maps) return;
    var route = result && result.routes && result.routes[0];
    var path = route && route.overview_path;
    if (!path || !path.length) return;
    var firstDraw = !state.routeLine;
    if (!state.routeCasing) {
      state.routeCasing = new google.maps.Polyline({
        strokeColor: "#ffffff",
        strokeWeight: 9,
        strokeOpacity: 0.95,
        zIndex: 1000,
        clickable: false
      });
    }
    if (!state.routeLine) {
      state.routeLine = new google.maps.Polyline({
        strokeColor: "#155eef",
        strokeWeight: 5,
        strokeOpacity: 1,
        zIndex: 1001,
        clickable: false
      });
    }
    state.routeCasing.setPath(path);
    state.routeLine.setPath(path);
    state.routeCasing.setMap(state.map);
    state.routeLine.setMap(state.map);
    if (firstDraw && route.bounds) {
      state.map.fitBounds(route.bounds, 64);
    }
  }

  function clearMarker() {
    if (state.marker) {
      state.marker.setMap(null);
      state.marker = null;
    }
    if (state.info) state.info.close();
    clearRoute();
  }

  function route() {
    var panel = ui();
    if (!panel || !state.delivery || !state.origin) {
      renderResults();
      syncButtons();
      return;
    }
    var stale = Date.now() - state.origin.time > STALE_MS;
    if (stale && !state.allowStale) {
      state.delivery.drive = null;
      state.delivery.straight = milesBetween(state.origin, state.delivery);
      renderResults();
      syncButtons();
      return;
    }
    if (!moved(state.lastRouted, state.origin) && state.delivery.drive) {
      renderResults();
      syncButtons();
      return;
    }
    setStatus("Getting the driving route...");
    var svc = new google.maps.DirectionsService();
    svc.route({
      origin: { lat: state.origin.lat, lng: state.origin.lng },
      destination: { lat: state.delivery.lat, lng: state.delivery.lng },
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.IMPERIAL,
      drivingOptions: { departureTime: new Date() }
    }, function (res, status) {
      var leg = res && res.routes && res.routes[0] && res.routes[0].legs && res.routes[0].legs[0];
      if (status === "OK" && leg && leg.distance && leg.duration) {
        var timed = leg.duration_in_traffic || leg.duration;
        state.delivery.drive = {
          distance: leg.distance.text,
          duration: formatDuration(timed.value),
          seconds: timed.value,
          etaAt: Date.now() + (timed.value * 1000),
          traffic: !!leg.duration_in_traffic
        };
        state.delivery.straight = null;
        state.lastRouted = { lat: state.origin.lat, lng: state.origin.lng };
        showRoute(res);
        setStatus("");
      } else {
        state.delivery.drive = null;
        state.delivery.straight = milesBetween(state.origin, state.delivery);
        clearRoute();
        setStatus("Driving route is unavailable (" + status + "). Straight-line distance is shown instead.");
      }
      renderResults();
      syncButtons();
    });
  }

  function openDirections() {
    if (!state.origin || !state.delivery) return;
    var stale = Date.now() - state.origin.time > STALE_MS;
    if (stale && !state.allowStale) {
      setStatus("Truck GPS is stale. Allow that reading before opening directions.");
      return;
    }
    var opened = window.open(mapsUrl(state.origin, state.delivery), "_blank", "noopener");
    if (!opened) setStatus("The browser blocked the Google Maps tab. Click Open driving directions again.");
  }

  function clearSuggest() {
    var box = ui() && ui().querySelector("[data-ss='suggest']");
    if (!box) return;
    box.textContent = "";
    box.style.display = "none";
  }

  function showSuggest(preds) {
    var box = ui() && ui().querySelector("[data-ss='suggest']");
    if (!box) return;
    box.textContent = "";
    box.style.display = "block";
    preds.slice(0, 5).forEach(function (pred) {
      var btn = el("button", { type: "button", style: "display:block;width:100%;text-align:left;padding:8px 10px;border:0;border-bottom:1px solid #f2f4f7;background:#fff;cursor:pointer" }, pred.description);
      btn.addEventListener("click", function () { choosePlace(pred); });
      box.appendChild(btn);
    });
  }

  function choosePlace(pred) {
    if (!window.google || !google.maps || !google.maps.places) return;
    setStatus("Checking that place...");
    var host = state.map || document.createElement("div");
    var svc = new google.maps.places.PlacesService(host);
    svc.getDetails({
      placeId: pred.place_id,
      fields: ["formatted_address", "geometry", "name", "types"]
    }, function (place, status) {
      if (status !== "OK" || !place || !place.geometry || !place.geometry.location) {
        setStatus("Could not place that result.");
        return;
      }
      clearSuggest();
      applyCandidate({
        formatted_address: place.formatted_address || place.name || pred.description,
        types: place.types || pred.types || [],
        geometry: place.geometry
      });
    });
  }

  function preferQueryWords(preds, original) {
    var parts = original.toLowerCase().split(/\s+/);
    var words = parts.filter(function (w, i) { return i > 0 && w.length >= 5; });
    if (!words.length) return preds;
    var every = preds.filter(function (p) {
      var d = (p.description || "").toLowerCase();
      return words.every(function (w) { return d.indexOf(w) !== -1; });
    });
    if (every.length) return every;
    var any = preds.filter(function (p) {
      var d = (p.description || "").toLowerCase();
      return words.some(function (w) { return d.indexOf(w) !== -1; });
    });
    return any.length ? any : preds;
  }

  function fetchSuggest(query, usedFallback, original, gen) {
    var svc = new google.maps.places.AutocompleteService();
    svc.getPlacePredictions({
      input: query,
      componentRestrictions: { country: "us" }
    }, function (preds, status) {
      if (gen !== state.suggestGen) return;
      var current = ui() && ui().querySelector("[data-ss='input']");
      if (!current || current.value.trim() === "") return;
      if (status === "OK" && preds && preds.length) {
        showSuggest(usedFallback ? preferQueryWords(preds, original) : preds);
        setStatus("");
        return;
      }
      var firstWord = original.split(/\s+/)[0];
      if (!usedFallback && firstWord && firstWord.length >= 3 && firstWord.toLowerCase() !== original.toLowerCase()) {
        fetchSuggest(firstWord, true, original, gen);
        return;
      }
      clearSuggest();
    });
  }

  function bindSuggest(input) {
    if (input.getAttribute("data-ss-bound") === "1") return;
    if (!window.google || !google.maps || !google.maps.places) return;
    input.setAttribute("data-ss-bound", "1");
    input.addEventListener("input", function () {
      clearTimeout(state.suggestTimer);
      state.suggestGen += 1;
      var gen = state.suggestGen;
      var query = input.value.trim();
      if (query.length < 3) {
        clearSuggest();
        return;
      }
      state.suggestTimer = setTimeout(function () { fetchSuggest(query, false, query, gen); }, 250);
    });
  }

  function applyCandidate(result) {
    var loc = result.geometry.location;
    state.delivery = {
      formatted: result.formatted_address,
      lat: loc.lat(),
      lng: loc.lng(),
      precision: precisionOf(result),
      drive: null,
      straight: null
    };
    state.lastRouted = null;
    remember(state.delivery);
    var input = ui().querySelector("[data-ss='input']");
    input.value = result.formatted_address;
    clearCandidates();
    placeMarker();
    setStatus("Delivery confirmed.");
    route();
  }

  function clearCandidates() {
    state.candidates = [];
    var box = ui() && ui().querySelector("[data-ss='candidates']");
    if (box) {
      box.textContent = "";
      box.style.display = "none";
    }
  }

  function showCandidates(results) {
    var box = ui().querySelector("[data-ss='candidates']");
    box.textContent = "";
    box.style.display = "block";
    state.candidates = results.slice(0, 5);
    box.appendChild(el("div", null, "Choose a match:"));
    state.candidates.forEach(function (result, index) {
      var btn = el("button", { type: "button", style: "display:block;margin:4px 0;text-align:left" }, result.formatted_address + " (" + precisionLabel(precisionOf(result)) + ")");
      btn.addEventListener("click", function () { applyCandidate(result); });
      box.appendChild(btn);
      box.appendChild(el("span", { style: "display:none" }, String(index)));
    });
  }

  function validate() {
    var input = ui().querySelector("[data-ss='input']");
    var query = input.value.trim();
    if (!query) {
      setStatus("Enter a delivery location.");
      return;
    }
    if (!window.google || !google.maps || !google.maps.Geocoder) {
      setStatus("Google Maps is not ready on this page yet.");
      return;
    }
    setStatus("Checking that address...");
    clearCandidates();
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query, componentRestrictions: { country: "US" } }, function (results, status) {
      if (status !== "OK" || !results || !results.length) {
        setStatus("No precise match for that text. The pin was not moved. (" + status + ")");
        return;
      }
      var streetish = results.filter(function (r) { return precisionOf(r) === "street"; });
      if (results.length > 1 && streetish.length !== 1) {
        showCandidates(results);
        setStatus("More than one match. Choose one.");
        return;
      }
      applyCandidate(streetish.length === 1 ? streetish[0] : results[0]);
    });
  }

  function clearDelivery() {
    state.delivery = null;
    state.lastRouted = null;
    clearMarker();
    clearCandidates();
    var input = ui().querySelector("[data-ss='input']");
    if (input) input.value = "";
    setStatus("Delivery cleared.");
    renderResults();
    syncButtons();
  }

  function mount() {
    var existing = document.getElementById(PANEL_ID);
    if (existing && !existing.querySelector("[data-ss='pin']")) existing.remove();
    if (document.getElementById(PANEL_ID)) return;
    var header = document.querySelector(".FleetViewerV2-header");
    if (!header) return;

    var panel = el("section", {
      id: PANEL_ID,
      "data-ss-version": "1.13.0",
      style: "box-sizing:border-box;height:100%;min-height:0;display:flex;flex-direction:column;overflow:hidden;margin:12px 0 12px 12px;padding:16px;border:0;border-radius:18px;background:#fff;font:13px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#101828;box-shadow:0 10px 30px rgba(16,24,40,.08)"
    });
    var pin = el("div", { "data-ss": "pin", style: "flex:0 0 auto" });
    var whereRow = el("div", { style: "position:relative;z-index:3;display:flex;align-items:flex-start;gap:8px;margin-bottom:14px" });
    var whereText = el("div", { style: "flex:1;min-width:0" });
    whereText.appendChild(el("div", { style: "font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#98a2b3;font-weight:700" }, "Current location"));
    whereText.appendChild(el("div", { "data-ss": "where", style: "font-weight:650;margin-top:2px;font-size:13px;line-height:1.35;text-wrap:balance" }, "Waiting for truck GPS"));
    var copy = el("button", {
      type: "button",
      "data-ss": "copy",
      "aria-label": "Copies location, miles, and tracking link",
      style: "flex:0 0 auto;width:32px;height:32px;border:0;border-radius:10px;background:#f2f4f7;color:#344054;cursor:pointer;padding:0"
    });
    copy.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>';
    var tip = el("span", {
      role: "tooltip",
      style: "display:none;position:absolute;right:0;top:calc(100% + 6px);z-index:4;width:176px;padding:6px 8px;border-radius:8px;background:#101828;color:#fff;font:12px/1.35 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-weight:600;letter-spacing:0;text-transform:none;box-shadow:0 8px 18px rgba(16,24,40,.16);pointer-events:none"
    }, "Copies location, miles, and tracking link");
    function showTip() { tip.style.display = "block"; }
    function hideTip() { tip.style.display = "none"; }
    copy.addEventListener("mouseenter", showTip);
    copy.addEventListener("mouseleave", hideTip);
    copy.addEventListener("focus", showTip);
    copy.addEventListener("blur", hideTip);
    copy.addEventListener("click", copySummary);
    whereRow.appendChild(whereText);
    whereRow.appendChild(copy);
    whereRow.appendChild(tip);
    pin.appendChild(whereRow);
    pin.appendChild(el("div", { style: "font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#98a2b3;font-weight:700;margin-bottom:8px" }, "Delivery location"));
    var input = el("input", {
      "data-ss": "input",
      type: "text",
      "aria-label": "Delivery location",
      placeholder: "Address or business name",
      autocomplete: "off",
      style: "width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #e4e7ec;border-radius:12px;margin:0 0 10px;background:#f8fafc;outline:none"
    });
    pin.appendChild(input);
    pin.appendChild(el("div", { "data-ss": "suggest", style: "display:none;margin:-4px 0 10px;border:1px solid #e4e7ec;border-radius:12px;overflow:auto;max-height:180px;background:#fff" }));
    var row = el("div", { style: "display:flex;gap:8px;margin-bottom:10px" });
    var clear = el("button", { type: "button", style: "flex:1;padding:8px 10px;border:0;border-radius:12px;background:#f2f4f7;color:#344054;cursor:pointer" }, "Clear");
    var open = el("button", { type: "button", "data-ss": "open", style: "flex:1;padding:8px 10px;border:0;border-radius:12px;background:#155eef;color:#fff;font-weight:650;cursor:pointer" }, "Directions");
    row.appendChild(clear);
    row.appendChild(open);
    pin.appendChild(row);
    pin.appendChild(el("div", { "data-ss": "results" }));
    panel.appendChild(pin);
    var scroll = el("div", { "data-ss": "scroll", style: "flex:1 1 auto;min-height:0;overflow:auto;margin-top:10px" });
    var stale = el("label", { "data-ss": "stale", style: "display:none;align-items:center;gap:4px;margin-bottom:8px" });
    var check = el("input", { type: "checkbox", "data-ss": "allow" });
    stale.appendChild(check);
    stale.appendChild(document.createTextNode("Use stale GPS"));
    scroll.appendChild(stale);
    scroll.appendChild(el("div", { "data-ss": "status", style: "min-height:16px;color:#667085;margin-bottom:8px" }));
    scroll.appendChild(el("div", { style: "margin-top:8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#98a2b3;font-weight:700" }, "Recent"));
    scroll.appendChild(el("div", { "data-ss": "history", style: "display:grid;gap:6px;margin-top:8px" }));
    scroll.appendChild(el("div", { "data-ss": "candidates", style: "margin-top:6px;display:none" }));
    panel.appendChild(scroll);

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        var first = ui().querySelector("[data-ss='suggest'] button");
        if (first) first.click();
      }
    });
    clear.addEventListener("click", clearDelivery);
    open.addEventListener("click", openDirections);
    check.addEventListener("change", function () {
      state.allowStale = check.checked;
      state.lastRouted = null;
      route();
    });

    var wrap = document.querySelector(".FleetViewerV2-wrapper") || header.parentNode;
    wrap.appendChild(panel);
    input.value = "";
    bindSuggest(input);
    renderHistory();
    layout();
  }

  function layout() {
    var wrap = document.querySelector(".FleetViewerV2-wrapper");
    var header = document.querySelector(".FleetViewerV2-header");
    var map = document.querySelector("div.map");
    var panel = document.getElementById(PANEL_ID);
    if (!wrap || !header || !map || !panel) return;
    wrap.style.display = "grid";
    wrap.style.gridTemplateColumns = "372px minmax(0,1fr)";
    wrap.style.columnGap = "20px";
    wrap.style.background = "";
    wrap.style.gridTemplateRows = "auto minmax(0,1fr)";
    wrap.style.height = "100%";
    wrap.style.minHeight = "0";
    header.style.gridColumn = "2";
    header.style.gridRow = "1";
    header.style.width = "auto";
    map.style.gridColumn = "2";
    map.style.gridRow = "2";
    map.style.width = "100%";
    map.style.height = "100%";
    map.style.minHeight = "0";
    panel.style.gridColumn = "1";
    panel.style.gridRow = "1 / span 2";
    if (state.map && window.google && google.maps && google.maps.event) {
      google.maps.event.trigger(state.map, "resize");
    }
  }

  function renderHistory() {
    var box = ui() && ui().querySelector("[data-ss='history']");
    if (!box) return;
    box.textContent = "";
    var list = loadHistory();
    if (!list.length) {
      box.appendChild(el("div", { style: "color:#8b949e" }, "None yet"));
      return;
    }
    list.forEach(function (item) {
      var when = item.usedAt ? formatWhen(item.usedAt) : "";
      var btn = el("button", { type: "button", style: "text-align:left;padding:8px 10px;border:0;border-radius:12px;background:#f8fafc;cursor:pointer;min-width:0;max-width:100%" });
      placeLines(item.formatted).forEach(function (line, index) {
        btn.appendChild(el("div", {
          style: index === 0
            ? "font-weight:600;font-size:12px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
            : "font-size:12px;line-height:1.35;color:#475467;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
        }, line));
      });
      if (when) btn.appendChild(el("div", { style: "color:#656d76;font-size:11px" }, when));
      btn.addEventListener("click", function () { useHistory(item); });
      box.appendChild(btn);
    });
  }

  function useHistory(item) {
    var input = ui().querySelector("[data-ss='input']");
    input.value = item.formatted;
    state.delivery = {
      formatted: item.formatted,
      lat: item.lat,
      lng: item.lng,
      precision: item.precision || "approximate",
      drive: null,
      straight: null
    };
    state.lastRouted = null;
    remember(state.delivery);
    clearCandidates();
    placeMarker();
    setStatus("");
    route();
  }

  function mapStillThere() {
    if (!state.map || !state.map.getDiv) return false;
    try {
      var div = state.map.getDiv();
      return !!(div && document.documentElement.contains(div));
    } catch (e) {
      return false;
    }
  }

  function tick() {
    if (asleep()) {
      stopLoops();
      return;
    }
    if (!onViewer()) {
      state.org = "";
      cleanup(false);
      stopLoops();
      return;
    }
    var org = orgFromPath();
    if (state.org && state.org !== org) {
      state.delivery = null;
      state.lastRouted = null;
      clearMarker();
      var input = ui() && ui().querySelector("[data-ss='input']");
      if (input) input.value = "";
      clearSuggest();
      var results = ui() && ui().querySelector("[data-ss='results']");
      if (results) results.textContent = "";
    }
    state.org = org;
    var legacy = document.getElementById("ss-delivery-panel");
    if (legacy) legacy.remove();
    if (!document.querySelector(".FleetViewerV2-header")) return;
    mount();
    var field = ui() && ui().querySelector("[data-ss='input']");
    if (field) bindSuggest(field);
    layout();
    if (!mapStillThere()) {
      var map = findMap();
      if (map) {
        if (state.map && state.map !== map) clearMarker();
        state.map = map;
        if (state.delivery && !state.marker) placeMarker();
      }
    }
    var gps = findGps();
    state.origin = gps;
    var staleBox = ui() && ui().querySelector("[data-ss='stale']");
    if (staleBox) staleBox.style.display = gps && (Date.now() - gps.time > STALE_MS) ? "flex" : "none";
    renderLocation();
    if (state.delivery && gps) route();
    else {
      renderResults();
      syncButtons();
    }
    if (document.getElementById(PANEL_ID)) stopWatch();
    else armWatch();
  }

  function cleanup(keepStore) {
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
    clearMarker();
    state.map = null;
    state.origin = null;
    if (!keepStore) state.delivery = null;
  }

  function armWatch() {
    if (state.watch || asleep() || document.getElementById(PANEL_ID)) return;
    state.watch = new MutationObserver(function () {
      if (asleep() || document.getElementById(PANEL_ID)) {
        stopWatch();
        return;
      }
      if (state.watchTimer) return;
      state.watchTimer = setTimeout(function () {
        state.watchTimer = null;
        if (!asleep() && !document.getElementById(PANEL_ID)) tick();
      }, 250);
    });
    state.watch.observe(document.documentElement, { childList: true, subtree: true });
  }

  function startLoops() {
    if (asleep() || !onViewer()) {
      stopLoops();
      return;
    }
    armWatch();
    if (!state.timer) state.timer = setInterval(tick, 4000);
    tick();
  }

  function onPageState() {
    if (asleep() || !onViewer()) {
      stopLoops();
      return;
    }
    if (!state.timer) startLoops();
    else if (!document.getElementById(PANEL_ID)) tick();
  }

  function hookHistory() {
    if (state.historyHooked) return;
    state.historyHooked = true;
    ["pushState", "replaceState"].forEach(function (name) {
      var orig = history[name];
      if (!orig) return;
      history[name] = function () {
        var result = orig.apply(this, arguments);
        onPageState();
        return result;
      };
    });
    window.addEventListener("popstate", onPageState);
  }

  function boot() {
    if (state.booted) return;
    state.booted = true;
    if (!document.getElementById("ss-delivery-style")) {
      var css = document.createElement("style");
      css.id = "ss-delivery-style";
      css.textContent = ".pac-container{z-index:100000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}";
      document.documentElement.appendChild(css);
    }
    document.addEventListener("visibilitychange", onPageState);
    document.addEventListener("freeze", stopLoops);
    document.addEventListener("resume", onPageState);
    window.addEventListener("pagehide", stopLoops);
    window.addEventListener("pageshow", onPageState);
    hookHistory();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onPageState);
    }
    onPageState();
  }

  boot();
})();
