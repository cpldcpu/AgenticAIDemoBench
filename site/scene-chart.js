// Canvas plots share HTML controls and data tables with the scene stats views.
export const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format;

function countStep(maximum) {
  const step = Math.max(1, maximum / 4);
  const scale = 10 ** Math.floor(Math.log10(step));
  return ([1, 2, 2.5, 5, 10].find(value => value * scale >= step) || 10) * scale;
}

export function mountChart(host, model) {
  const canvas = document.createElement('canvas');
  canvas.className = 'scene-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', model.description + '. Use left and right arrows to inspect periods.');
  canvas.style.setProperty('--plot-height', model.height || 'clamp(260px, 34vw, 390px)');
  host.append(canvas);
  const context = canvas.getContext('2d');
  const last = model.labels.length - 1;
  let selected = model.initial ?? last;
  let geometry;

  function draw() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    const fullWidth = Math.round(width * dpr), fullHeight = Math.round(height * dpr);
    if (canvas.width !== fullWidth || canvas.height !== fullHeight) {
      canvas.width = fullWidth;
      canvas.height = fullHeight;
    }
    const ctx = context;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const stacked = model.mode === 'stack' || model.mode === 'bars';
    const max = Math.max(1, ...model.labels.map((_, i) => {
      const values = model.series.map(series => series.values[i]);
      return stacked ? values.reduce((total, value) => total + value, 0) : Math.max(...values);
    }));
    const step = model.percent ? 25 : countStep(max);
    const top = model.percent ? 100 : model.peakScale ? max * 1.11 : Math.ceil(max / step) * step;
    const left = width < 390 ? 37 : 47, right = width - 13, upper = 24, base = height - 29;
    const stride = (right - left) / Math.max(1, model.mode === 'bars' ? last + 1 : last);
    const x = i => left + (i + (model.mode === 'bars' || !last ? 0.5 : 0)) * stride;
    const y = v => base - (base - upper) * v / top;
    geometry = { x, stride };

    ctx.save();
    ctx.beginPath();
    ctx.rect(left, upper, right - left, base - upper);
    ctx.clip();
    if (model.milestones) {
      ctx.fillStyle = '#efbc6a17';
      model.milestones.forEach((events, i) => {
        if (events.some(event => event.kind === 'covid')) ctx.fillRect(x(i) - stride / 2, upper, stride, base - upper);
      });
    }
    ctx.strokeStyle = '#393345';
    ctx.lineWidth = 1;
    for (let tick = 0; tick <= top; tick += step) {
      ctx.beginPath();
      ctx.moveTo(left, y(tick));
      ctx.lineTo(right, y(tick));
      ctx.stroke();
    }
    const bottom = Array(last + 1).fill(0);
    for (const series of model.series) {
      ctx.strokeStyle = series.color;
      ctx.fillStyle = series.color;
      if (model.mode === 'bars') {
        const barWidth = Math.max(1, stride * 0.75);
        series.values.forEach((value, i) => {
          ctx.globalAlpha = model.partial[i] ? 0.34 : 0.83;
          ctx.fillRect(x(i) - barWidth / 2, y(bottom[i] + value), barWidth, y(bottom[i]) - y(bottom[i] + value));
          bottom[i] += value;
        });
      } else if (model.mode === 'stack') {
        ctx.globalAlpha = 0.84;
        ctx.beginPath();
        series.values.forEach((value, i) => ctx.lineTo(x(i), y(bottom[i] + value)));
        for (let i = last; i >= 0; i--) ctx.lineTo(x(i), y(bottom[i]));
        ctx.closePath();
        ctx.fill();
        series.values.forEach((value, i) => { bottom[i] += value; });
      } else {
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        for (let i = 1; i <= last; i++) {
          if (series.first != null && i <= series.first) continue;
          ctx.setLineDash(model.partial[i] ? [4, 4] : []);
          ctx.beginPath();
          ctx.moveTo(x(i - 1), y(series.values[i - 1]));
          ctx.lineTo(x(i), y(series.values[i]));
          ctx.stroke();
        }
        ctx.setLineDash([]);
        (series.peaks || []).forEach(i => {
          ctx.beginPath();
          ctx.arc(x(i), y(series.values[i]), 3.2, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    }
    ctx.restore();

    ctx.font = '11px Consolas, monospace';
    ctx.fillStyle = '#afa6bc';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    for (let tick = 0; tick <= top; tick += step) {
      const label = model.percent ? tick + '%' : tick >= 1000 ? number(tick / 1000) + 'k' : number(tick);
      ctx.fillText(label, left - 6, y(tick));
    }
    ctx.textAlign = 'center';
    const every = Math.max(1, Math.ceil(last / Math.max(1, Math.floor((right - left) / 86))));
    for (let i = 0; i <= last; i += every) ctx.fillText(model.shortLabels?.[i] || model.labels[i], x(i), base + 17);

    model.milestones?.forEach((events, i) => {
      if (events.some(event => event.kind === 'party')) {
        ctx.fillStyle = '#b6f36a';
        ctx.fillRect(x(i) - 2, upper - 7, 4, 4);
      }
      if (events.some(event => event.kind === 'llm')) {
        ctx.fillStyle = '#ff6fa8';
        ctx.fillRect(x(i) - 1, upper - 16, 2, 6);
      }
    });
    ctx.strokeStyle = '#f2e9f399';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x(selected), upper);
    ctx.lineTo(x(selected), base);
    ctx.stroke();
  }

  function choose(index) {
    selected = Math.min(last, Math.max(0, index));
    draw();
    model.onPoint(selected);
  }

  function point(event) {
    if (!geometry) return;
    const { left } = canvas.getBoundingClientRect();
    choose(Math.round((event.clientX - left - geometry.x(0)) / geometry.stride));
  }

  canvas.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') point(event); });
  canvas.addEventListener('click', point);
  canvas.addEventListener('focus', () => model.onPoint(selected));
  canvas.addEventListener('keydown', event => {
    const indexes = { ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: 0, End: last };
    if (!(event.key in indexes)) return;
    event.preventDefault();
    choose(indexes[event.key]);
  });
  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  draw();
  return () => observer.disconnect();
}
