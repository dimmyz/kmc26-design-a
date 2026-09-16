// KINOR strings — shared decorative canvas + logo mark injection. Colours come from the active skin (CSS vars).
(() => {
  const css = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();
  const hexRgb = h => { h = h.replace('#',''); return [0,2,4].map(i => parseInt(h.substr(i,2),16)).join(','); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Logo mark: <span class="mk" data-size="40" data-n="7"></span>
  const sets = { 7:{sw:5,l:[[8,26,38],[16,19,45],[24,12,52],[32,5,59],[40,12,52],[48,19,45],[56,26,38]],c:3,b:8},
                 5:{sw:5.5,l:[[14,27,37],[23,19,45],[32,9,55],[41,19,45],[50,27,37]],c:2,b:9},
                 3:{sw:7,l:[[17,22,42],[32,10,54],[47,22,42]],c:1,b:9} };
  document.querySelectorAll('.mk').forEach(m => {
    const k = sets[m.dataset.n || 7], s = +(m.dataset.size || 40);
    m.innerHTML = `<svg width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true" style="display:block"><g stroke-linecap="round" stroke-width="${k.sw}" fill="none">${k.l.map(([x,a,b],i) => i===k.c ? `<path class="w" d="M${x} ${a} Q${x+k.b} 32 ${x} ${b}"/>` : `<line class="s" x1="${x}" y1="${a}" x2="${x}" y2="${b}"/>`).join('')}</g></svg>`;
  });

  // Line-string: <svg class="ls" data-at="0" data-frets="0,.5,1"></svg>
  document.querySelectorAll('svg.ls').forEach(sv => {
    const W = sv.clientWidth || 600, at = +(sv.dataset.at || 0) * W, len = Math.min(70, W * .12);
    const fr = (sv.dataset.frets || '').split(',').filter(Boolean).map(f => `<circle cx="${Math.min(W-8,Math.max(8,+f*W))}" cy="12" r="6" fill="currentColor" class="base" stroke-width="2.5" style="fill:var(--night)"/>`).join('');
    sv.setAttribute('viewBox', `0 0 ${W} 24`);
    sv.innerHTML = `<line class="base" x1="${at+len}" y1="12" x2="${W-2}" y2="12" stroke-width="2" stroke-linecap="round"/>${at>0?`<line class="base" x1="2" y1="12" x2="${at}" y2="12" stroke-width="2"/>`:''}<path class="pluck" d="M${at} 12 Q${at+len/2} 1 ${at+len} 12" stroke-width="3.5" fill="none" stroke-linecap="round"/>${fr}`;
  });

  // Strings field: <canvas class="strings" data-gap="30" data-warm=".7" data-light></canvas>
  document.querySelectorAll('canvas.strings').forEach(c => {
    const x = c.getContext('2d'), d = c.dataset;
    const col = hexRgb(css(c, d.light !== undefined ? '--accent-ink' : '--accent') || '#8FB9CC');
    const wcol = hexRgb(css(c, d.light !== undefined ? '--lamp-ink' : '--lamp') || '#F2B35B');
    const maxOp = +(d.op || .5), minOp = +(d.min || .06), amp0 = +(d.amp || 7), live = d.static === undefined && !reduce;
    let W, H, gap, n, k, plucks = [];
    function size() {
      const r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = W < 700 ? +(d.gapMobile || 44) : +(d.gap || 30); n = Math.ceil(W / gap) + 1;
      k = Math.round(n * (W < 700 ? +(d.warmMobile || .9) : +(d.warm || .7)));
      const lab = d.label && document.getElementById(d.label);
      if (lab) lab.style.left = W >= 900 ? (k * gap - lab.offsetWidth - 22 - (lab.offsetParent ? lab.offsetParent.getBoundingClientRect().left - r.left : 0)) + 'px' : '';
    }
    function draw(t) {
      x.clearRect(0, 0, W, H);
      for (let i = 0; i < n; i++) {
        const px = i * gap, dist = Math.abs(i - k), one = i === k;
        let off = amp0 * Math.exp(-dist / 4) * Math.sin(t / 1000 * 3.2 - dist * .45);
        for (const p of plucks) { const dt = (t - p.t0) / 1000 - Math.abs(i - p.i) * .055; if (dt > 0) off += p.a * Math.exp(-dt * 1.1) * Math.exp(-Math.abs(i - p.i) / 7) * Math.sin(dt * 9); }
        const ramp = d.ramp === 'flat' ? maxOp : minOp + (maxOp - minOp) * Math.max(0, Math.min(1, (px / W - .35) / .45));
        const g = x.createLinearGradient(0, 0, 0, H), rgb = one ? wcol : col, a = one ? 1 : ramp;
        g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(.5, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
        x.strokeStyle = g; x.lineWidth = one ? 2.8 : 1.2;
        x.beginPath(); x.moveTo(px, 0); x.quadraticCurveTo(px + off * 2, H / 2, px, H); x.stroke();
      }
      if (live) requestAnimationFrame(draw);
    }
    size(); addEventListener('resize', size);
    plucks.push({ i: k, a: 16, t0: performance.now() - 500 });
    if (live) {
      setInterval(() => { plucks.push({ i: k, a: 14, t0: performance.now() }); if (plucks.length > 5) plucks.shift(); }, 4600);
      c.parentElement.addEventListener('pointermove', e => { const i = Math.round((e.clientX - c.getBoundingClientRect().left) / gap); if (!plucks.length || plucks[plucks.length-1].i !== i) { plucks.push({ i, a: 5, t0: performance.now() }); if (plucks.length > 5) plucks.shift(); } });
      requestAnimationFrame(draw);
    } else draw(performance.now());
  });

  // Demo forms: never send data
  document.querySelectorAll('form[data-demo]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault(); const em = f.querySelector('input[type=email]');
    if (em && !em.checkValidity()) { em.reportValidity(); return; }
    f.innerHTML = `<p class="h3">Спасибо!</p><p class="note">Это дизайн-концепт: данные не отправлены и не сохранены.</p>`;
  }));
})();
