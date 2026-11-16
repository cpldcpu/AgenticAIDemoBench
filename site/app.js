// front page: sort and filter the grid
const grid = document.getElementById('grid');
if (grid) {
  const cards = [...grid.children], maker = document.getElementById('maker');
  const by = {
    new: (a, b) => b.dataset.date.localeCompare(a.dataset.date) || b.dataset.n - a.dataset.n,
    score: (a, b) => b.dataset.score - a.dataset.score || b.dataset.n - a.dataset.n,
    size: (a, b) => a.dataset.size - b.dataset.size,
    rand: () => Math.random() - .5,
  };
  let mode = 'new';
  const draw = () => {
    cards.sort(by[mode]).forEach(c => {
      c.hidden = !!maker.value && c.dataset.maker !== maker.value;
      grid.append(c);
    });
  };
  document.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => {
    mode = b.dataset.sort;
    document.querySelectorAll('[data-sort]').forEach(x => x.classList.toggle('on', x === b));
    draw();
  });
  maker.onchange = draw;
}

// prod page: tabs
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.pane').forEach(p => p.hidden = p.id !== b.dataset.tab);
  refold(true);
});

// prod page: long nfo and readme are folded, so the comments stay within reach
const fold = document.getElementById('fold'), unfold = document.getElementById('unfold');
function refold(close) {
  if (!fold) return;
  if (close) fold.classList.add('folded');
  const folded = fold.classList.contains('folded');
  unfold.hidden = folded && fold.scrollHeight <= fold.clientHeight + 40;
  if (unfold.hidden) fold.classList.remove('folded');
  unfold.textContent = fold.classList.contains('folded') ? 'show all ↓' : 'show less ↑';
}
if (fold) {
  unfold.onclick = () => {
    const open = fold.classList.toggle('folded');
    refold();
    if (open) fold.scrollIntoView({ block: 'nearest' });
  };
  addEventListener('load', () => refold());
  refold();
}

// prod page: live vote counts, sent by the giscus frame
addEventListener('message', e => {
  if (e.origin !== 'https://giscus.app') return;
  const d = e.data && e.data.giscus && e.data.giscus.discussion;
  if (!d) return;
  const r = d.reactions || {}, n = k => (r[k] && r[k].count) || 0;
  const v = { up: n('THUMBS_UP'), down: n('THUMBS_DOWN'), heart: n('HEART'), comments: d.totalCommentCount || 0 };
  document.querySelectorAll('.votebox [data-k]').forEach(b => b.textContent = v[b.dataset.k]);
});
