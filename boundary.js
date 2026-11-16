/* MUZZ hero field: AI systems cooperating across a boundary.
   Blue pulses = permitted information (pass through).
   Red pulses  = attempted influence from one compromised agent (refused at the boundary, then recorded). */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- reveal on scroll (content is visible without JS) ---------- */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    rv.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('in'); else io.observe(el);
    });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- canvas field ---------- */
  var canvas = document.getElementById('field');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BLUE = [61, 169, 255], RED = [255, 74, 61], GREEN = [64, 217, 138];
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  var W = 0, H = 0, DPR = 1, wallX = 0, narrow = false;
  var senders = [], receivers = [], links = [], pulses = [], hits = [], rogue = null;
  var running = true, last = 0, spawnT = 0, seed = 7, gen = 0;

  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function layout() {
    var r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    narrow = W < 820;
    wallX = narrow ? W * 0.62 : W * 0.72;

    seed = 7;
    senders = []; receivers = []; links = []; pulses = []; hits = [];
    var top = H * 0.16, bottom = H * 0.9;
    var sx0 = narrow ? W * 0.08 : W * 0.40, sx1 = wallX - (narrow ? 30 : 70);
    var rx0 = wallX + (narrow ? 26 : 60), rx1 = W - (narrow ? 14 : 50);
    var ns = narrow ? 7 : 11, nr = narrow ? 4 : 7, i;
    for (i = 0; i < ns; i++) senders.push({ x: sx0 + rand() * (sx1 - sx0), y: top + rand() * (bottom - top), r: 2 + rand() * 1.6 });
    for (i = 0; i < nr; i++) receivers.push({ x: rx0 + rand() * (rx1 - rx0), y: top + ((i + 0.5) / nr) * (bottom - top) + (rand() - 0.5) * 30, r: 3 });
    rogue = senders[Math.floor(ns * 0.55)];
    rogue.rogue = true;
    // faint mesh among senders
    for (i = 0; i < senders.length; i++) {
      for (var j = i + 1; j < senders.length; j++) {
        var dx = senders[i].x - senders[j].x, dy = senders[i].y - senders[j].y;
        if (dx * dx + dy * dy < Math.pow(narrow ? 150 : 210, 2)) links.push([senders[i], senders[j]]);
      }
    }
    for (i = 0; i < receivers.length - 1; i++) links.push([receivers[i], receivers[i + 1]]);
  }

  function spawn() {
    var bad = rand() < 0.26;
    var a = bad ? rogue : senders[Math.floor(rand() * senders.length)];
    if (!bad && a === rogue) a = senders[0];
    var b = receivers[Math.floor(rand() * receivers.length)];
    // curve control point
    var cx = (a.x + wallX) / 2, cy = (a.y + b.y) / 2 + (rand() - 0.5) * 80;
    pulses.push({ a: a, b: b, cx: cx, cy: cy, t: 0, speed: 0.16 + rand() * 0.1, bad: bad, trail: [] });
  }

  function pointAt(p, t) {
    // quadratic toward the wall, then straight to receiver
    var wallY = quadY(p.a.y, p.cy, p.b.y, 0.72);
    if (t < 0.72) {
      var u = t / 0.72;
      var x = (1 - u) * (1 - u) * p.a.x + 2 * (1 - u) * u * p.cx + u * u * wallX;
      var y = (1 - u) * (1 - u) * p.a.y + 2 * (1 - u) * u * p.cy + u * u * wallY;
      return [x, y];
    }
    var v = (t - 0.72) / 0.28;
    return [wallX + (p.b.x - wallX) * v, wallY + (p.b.y - wallY) * v];
  }
  function quadY(y0, yc, y1, u) { return (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * yc + u * u * y1; }

  function drawFloor() {
    // operations-floor perspective lines, very faint
    ctx.save();
    ctx.strokeStyle = 'rgba(61,169,255,0.05)';
    ctx.lineWidth = 1;
    var hy = H * 0.62, vx = wallX;
    for (var i = -10; i <= 10; i++) {
      ctx.beginPath(); ctx.moveTo(vx, hy); ctx.lineTo(vx + i * W * 0.12, H); ctx.stroke();
    }
    for (var k = 1; k < 7; k++) {
      var y = hy + (H - hy) * Math.pow(k / 7, 1.8);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWall(now, flash) {
    var top = H * 0.08, bottom = H * 0.96;
    // soft volume
    var g = ctx.createLinearGradient(wallX - 60, 0, wallX + 60, 0);
    g.addColorStop(0, rgba(BLUE, 0));
    g.addColorStop(0.5, rgba(BLUE, 0.10 + flash * 0.12));
    g.addColorStop(1, rgba(BLUE, 0));
    ctx.fillStyle = g;
    ctx.fillRect(wallX - 60, top, 120, bottom - top);
    // pane texture: short horizontal ticks
    ctx.strokeStyle = rgba(BLUE, 0.16);
    ctx.lineWidth = 1;
    for (var y = top; y < bottom; y += 14) {
      var w = 6 + 6 * Math.sin(y * 0.05 + now * 0.0008);
      ctx.beginPath(); ctx.moveTo(wallX - w, y); ctx.lineTo(wallX + w, y); ctx.stroke();
    }
    // core line
    var lg = ctx.createLinearGradient(0, top, 0, bottom);
    lg.addColorStop(0, rgba(BLUE, 0));
    lg.addColorStop(0.15, rgba(BLUE, 0.9));
    lg.addColorStop(0.85, rgba(BLUE, 0.9));
    lg.addColorStop(1, rgba(BLUE, 0));
    ctx.save();
    ctx.shadowColor = rgba(BLUE, 0.9); ctx.shadowBlur = 18;
    ctx.strokeStyle = lg; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wallX, top); ctx.lineTo(wallX, bottom); ctx.stroke();
    ctx.restore();
    // label
    if (!narrow) {
      ctx.save();
      ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = rgba(BLUE, 0.8);
      ctx.textAlign = 'center';
      ctx.fillText('MUZZ BOUNDARY', wallX, top - 8 > 12 ? top + 4 : 16);
      ctx.restore();
    }
  }

  function drawNodes(now) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(147,161,184,0.16)';
    links.forEach(function (l) { ctx.beginPath(); ctx.moveTo(l[0].x, l[0].y); ctx.lineTo(l[1].x, l[1].y); ctx.stroke(); });

    senders.forEach(function (n) {
      if (n.rogue) {
        var pulse = 0.5 + 0.5 * Math.sin(now * 0.004);
        ctx.save();
        ctx.shadowColor = rgba(RED, 0.9); ctx.shadowBlur = 16;
        ctx.fillStyle = rgba(RED, 0.95);
        ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = rgba(RED, 0.25 + 0.35 * pulse);
        ctx.beginPath(); ctx.arc(n.x, n.y, 10 + 6 * pulse, 0, Math.PI * 2); ctx.stroke();
        if (!narrow) {
          ctx.font = '500 9px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillStyle = rgba(RED, 0.85);
          ctx.fillText('AGENT-17 · COMPROMISED', n.x + 14, n.y + 3);
        }
      } else {
        ctx.fillStyle = 'rgba(200,214,235,0.7)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    });
    receivers.forEach(function (n) {
      ctx.save();
      ctx.shadowColor = rgba(BLUE, 0.7); ctx.shadowBlur = 10;
      ctx.strokeStyle = rgba(BLUE, 0.85); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.rect(n.x - 5, n.y - 5, 10, 10); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = rgba(GREEN, 0.9);
      ctx.beginPath(); ctx.arc(n.x + 9, n.y - 7, 1.8, 0, Math.PI * 2); ctx.fill();
    });
  }

  function step(dt) {
    var flash = 0;
    for (var i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i];
      p.t += p.speed * dt;
      if (p.bad && p.t >= 0.72) {
        var pt = pointAt(p, 0.72);
        hits.push({ x: pt[0], y: pt[1], life: 1 });
        pulses.splice(i, 1);
        continue;
      }
      if (p.t >= 1) { pulses.splice(i, 1); continue; }
      var q = pointAt(p, p.t);
      p.trail.push(q);
      if (p.trail.length > 26) p.trail.shift();
    }
    for (var h = hits.length - 1; h >= 0; h--) {
      hits[h].life -= dt * 0.4;
      if (hits[h].life <= 0) hits.splice(h, 1); else flash = Math.max(flash, hits[h].life);
    }
    return flash;
  }

  function drawPulses() {
    pulses.forEach(function (p) {
      var c = p.bad ? RED : BLUE;
      for (var k = 1; k < p.trail.length; k++) {
        ctx.strokeStyle = rgba(c, (k / p.trail.length) * 0.7);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(p.trail[k - 1][0], p.trail[k - 1][1]);
        ctx.lineTo(p.trail[k][0], p.trail[k][1]);
        ctx.stroke();
      }
      var head = p.trail[p.trail.length - 1];
      if (head) {
        ctx.save();
        ctx.shadowColor = rgba(c, 1); ctx.shadowBlur = 12;
        ctx.fillStyle = rgba(c, 1);
        ctx.beginPath(); ctx.arc(head[0], head[1], 2.3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    });
    hits.forEach(function (h) {
      var r = 6 + (1 - h.life) * 26;
      ctx.strokeStyle = rgba(RED, h.life * 0.8);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(h.x, h.y, r, -Math.PI / 2, Math.PI / 2, true); ctx.stroke();
      ctx.fillStyle = rgba(RED, h.life);
      ctx.beginPath(); ctx.arc(h.x - 1, h.y, 2.6, 0, Math.PI * 2); ctx.fill();
      if (!narrow) {
        ctx.font = '500 9px "IBM Plex Mono", ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = rgba(RED, h.life * 0.95);
        ctx.fillText('REFUSED · RECORDED', h.x - 12, h.y - 8);
        ctx.textAlign = 'left';
      }
    });
  }

  function loop() { var my = ++gen; requestAnimationFrame(function f(now) { if (my !== gen) return; if (frame(now)) requestAnimationFrame(f); }); }

  function frame(now) {
    if (!running) return false;
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = 0.12 + rand() * 0.2; }
    var flash = step(dt);
    ctx.clearRect(0, 0, W, H);
    drawFloor();
    drawNodes(now);
    drawWall(now, flash);
    drawPulses();
    return true;
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < 14; i++) { spawn(); }
    pulses.forEach(function (p, idx) {
      var t = p.bad ? 0.6 : 0.2 + (idx % 7) * 0.11;
      for (var s = 0; s < 16; s++) { p.trail.push(pointAt(p, Math.max(0, t - (15 - s) * 0.012))); }
    });
    var bad = pulses.filter(function (p) { return p.bad; })[0];
    if (bad) { var pt = pointAt(bad, 0.72); hits.push({ x: pt[0], y: pt[1], life: 0.8 }); }
    drawFloor(); drawNodes(0); drawWall(0, 0.5); drawPulses();
  }

  function start() {
    layout();
    if (reduce) { staticFrame(); return; }
    // warm up so the first frame is already populated
    for (var i = 0; i < 120; i++) { spawnT -= 0.05; if (spawnT <= 0) { spawn(); spawnT = 0.3 + rand() * 0.35; } step(0.05); }
    last = 0; running = true;
    loop();
  }

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { running = false; setTimeout(start, 30); }, 150);
  });

  // pause when the hero is off screen or the tab is hidden
  if ('IntersectionObserver' in window && !reduce) {
    new IntersectionObserver(function (e) {
      var vis = e[0].isIntersecting;
      if (vis && !running) { running = true; last = 0; loop(); }
      if (!vis) running = false;
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () {
    if (reduce) return;
    if (document.hidden) running = false;
    else if (!running) { running = true; last = 0; loop(); }
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
