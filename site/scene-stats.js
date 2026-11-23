import { mountChart, number } from './scene-chart.js';

const view = document.getElementById('scene-view');
const tabs = [...document.querySelectorAll('[data-scene-tab]')];
const formats = [
  ['demo', 'Demo', '#79bedb'],
  ['size_limited', 'Size-limited', '#ff6fa8'],
  ['intro', 'Intro without size tag', '#b6f36a'],
  ['wild', 'Coded wild', '#edb56c'],
  ['other', 'Other coded', '#8e819f'],
];
const sizeTags = ['256b', '1k', '4k', '8k', '64k'];
const palette = ['#ff6fa8', '#79bedb', '#b6f36a', '#d19dee', '#edb56c', '#8bd6be', '#ea8f87', '#94a9fa'];
const eventKinds = [['party', 'Major parties'], ['covid', 'COVID period'], ['llm', 'LLM launches']];
const formatShare = (start, end, format) => {
  let releases = 0, matching = 0;
  for (let year = start; year <= end; year++) {
    releases += rawValue('all_coded', year, 'total');
    matching += rawValue('all_coded', year, format);
  }
  return releases ? Math.round(100 * matching / releases) : 0;
};
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const textDate = date => dateFormat.format(new Date(date + 'T00:00:00Z'));
const formatSize = tag => tag.toUpperCase();
const state = {
  tab: tabs.find(tab => '#' + tab.dataset.sceneTab === location.hash)?.dataset.sceneTab || 'platforms',
  platforms: [], layout: 'lines', period: 'all',
  formatPlatform: 'all_coded', formatView: 'share', formatSize: '4k',
  eventPlatform: 'top5_unique', eventGrain: 'season', events: new Set(['party', 'covid']),
  peakFormat: 'total', peakSize: '', peakPlatform: 'all_coded',
};
let data;
let mounts = [];
let disposePeak;

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function button(text, action) {
  const node = element('button', '', text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function chooseOption(label, options, value, onChange) {
  const field = element('label', 'scene-field');
  const select = element('select');
  for (const [id, text] of options) select.add(new Option(text, id));
  select.value = value;
  select.addEventListener('change', () => {
    onChange(select.value);
    view.querySelector(`select[aria-label="${label}"]`)?.focus();
  });
  select.setAttribute('aria-label', label);
  field.append(element('span', 'scene-field-label', label), select);
  return field;
}

function buttons(label, options, value, onChange) {
  const field = element('div', 'sort scene-switch');
  field.setAttribute('role', 'group');
  field.setAttribute('aria-label', label);
  for (const [id, text] of options) {
    const control = button(text, () => {
      onChange(id);
      [...view.querySelectorAll('.scene-switch')].find(node => node.getAttribute('aria-label') === label)
        ?.querySelector('[aria-pressed="true"]')?.focus();
    });
    control.classList.toggle('on', id === value);
    control.setAttribute('aria-pressed', String(id === value));
    field.append(control);
  }
  return field;
}

const platformName = id => ({ all_coded: 'All platforms', top5_unique: 'Top five combined' }[id] || data.platforms[id]);
const platformOptions = () => Object.keys(data.platforms).filter(id => data.annual[id]).map(id => [id, platformName(id)]);
const set = (key, value) => { state[key] = value; render(); };
const snapshotYear = () => Number(data.snapshot.slice(0, 4));

function history(ids = ['all_coded'], completeOnly = false) {
  const start = state.period === 'all'
    ? Math.min(...ids.flatMap(id => Object.keys(data.annual[id] || {}).map(Number)))
    : Number(state.period);
  const end = snapshotYear() - Number(completeOnly);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => String(start + index));
}

function rawValue(id, year, format) {
  if (format.startsWith('size:')) return data.sizes[id]?.[format.slice(5)]?.[year] || 0;
  const column = format === 'total' ? 0 : 1 + formats.findIndex(([key]) => key === format);
  return data.annual[id]?.[year]?.[column] || 0;
}

function peak(id, format) {
  const counts = Object.keys(data.annual[id] || {}).filter(year => Number(year) < snapshotYear())
    .map(year => [year, rawValue(id, year, format)]);
  const max = Math.max(0, ...counts.map(([, count]) => count));
  return { count: max, years: max ? counts.filter(([, count]) => count === max).map(([year]) => year) : [] };
}

function annualSeries(id, years, format, color, peaks = false) {
  const values = years.map(year => rawValue(id, year, format));
  const highlight = peaks ? peak(id, format).years.map(year => years.indexOf(year)).filter(i => i >= 0) : [];
  return { label: platformName(id), color, values, peaks: highlight, first: values.findIndex(value => value > 0) };
}

function controlRow(...children) {
  const controls = element('div', 'scene-controls');
  controls.append(...children);
  return controls;
}

function rangeControl() {
  return chooseOption('Years', [['all', 'All years'], ['2000', 'Since 2000'], ['2015', 'Since 2015']],
    state.period, value => set('period', value));
}

function addLegend(host, series) {
  const legend = element('ul', 'scene-legend');
  for (const { label, color } of series) {
    const item = element('li');
    const swatch = element('span');
    swatch.style.backgroundColor = color;
    item.append(swatch, document.createTextNode(label));
    legend.append(item);
  }
  host.append(legend);
}

function addDataTable(host, labels, series, partial, percent) {
  const details = element('details', 'scene-data-table');
  details.append(element('summary', '', 'View chart data'));
  details.addEventListener('toggle', () => {
    if (!details.open || details.querySelector('table')) return;
    const frame = element('div', 'scene-table-scroll');
    const table = element('table', 'scene-table');
    const heading = table.createTHead().insertRow();
    heading.append(element('th', '', 'Period'), ...series.map(s => element('th', '', s.label)));
    const body = table.createTBody();
    for (let i = labels.length - 1; i >= 0; i--) {
      const row = body.insertRow();
      row.append(element('th', '', labels[i] + (partial[i] ? ' (partial)' : '')));
      series.forEach(s => row.append(element('td', '', number(s.values[i]) + (percent ? '%' : ''))));
    }
    frame.append(table);
    details.append(frame);
  });
  host.append(details);
}

function addPlot(host, model, cleanup = mounts) {
  const panel = element('div', 'box scene-plot');
  const readout = element('div', 'scene-readout');
  const note = element('div', 'scene-event-readout');
  readout.setAttribute('aria-live', 'polite');
  let shown;
  const onPoint = index => {
    if (shown === index) return;
    shown = index;
    readout.replaceChildren(element('strong', '', model.labels[index] + (model.partial[index] ? ' · partial' : '')));
    for (const { label, values, color } of model.series) {
      const item = element('span', '', label + ' ');
      const value = element('b', '', number(values[index]) + (model.percent ? '%' : ''));
      value.style.color = color;
      item.append(value);
      readout.append(item);
    }
    note.replaceChildren();
    for (const event of model.milestones?.[index] || []) {
      const link = element('a', '', event.name);
      link.href = event.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const dates = textDate(event.start) + (event.end === event.start ? '' : ' – ' + textDate(event.end));
      note.append(link, element('span', '', dates));
    }
    note.hidden = !note.childElementCount;
  };
  if (model.title) panel.append(element('h2', 'scene-chart-title', model.title));
  if (!model.labels.length) {
    panel.append(element('p', 'scene-caption', 'No complete years in this selection.'));
    host.append(panel);
    return;
  }
  cleanup.push(mountChart(panel, { ...model, onPoint }));
  if (model.series.length > 1) addLegend(panel, model.series);
  panel.append(readout, note);
  onPoint(model.initial ?? model.labels.length - 1);
  if (model.table !== false) addDataTable(panel, model.labels, model.series, model.partial, model.percent);
  host.append(panel);
}

function renderPlatforms(parent) {
  const additions = platformOptions().filter(([id]) => !state.platforms.includes(id));
  const addPlatform = chooseOption('Compare platform', [['', 'Add a platform…'], ...additions], '', id => {
    if (id) set('platforms', [...state.platforms, id]);
  });
  parent.append(controlRow(
    buttons('Platform layout', [['lines', 'Lines'], ['peaks', 'Peak-scaled panels']], state.layout, id => set('layout', id)),
    rangeControl(), addPlatform,
    button('Reset platforms', () => set('platforms', [...data.main])),
  ));
  const chips = element('div', 'scene-chips');
  for (const id of state.platforms) {
    const chip = button(platformName(id) + ' ×', () => {
      if (state.platforms.length > 1) set('platforms', state.platforms.filter(item => item !== id));
    });
    chip.setAttribute('aria-label', 'Remove ' + platformName(id));
    chip.disabled = state.platforms.length === 1;
    chips.append(chip);
  }
  parent.append(chips);

  const scaled = state.layout === 'peaks';
  const labels = history(state.platforms, scaled);
  const partial = labels.map(year => Number(year) === snapshotYear());
  const series = state.platforms.map((id, i) => annualSeries(id, labels, 'total', palette[i % palette.length], true));
  if (!scaled) {
    addPlot(parent, { title: 'Annual coded releases', description: 'Platform releases by year', labels, series, partial });
  } else {
    const panels = element('div', 'scene-panels');
    parent.append(panels);
    series.forEach((line, index) => {
      const result = peak(state.platforms[index], 'total');
      addPlot(panels, { title: line.label, description: line.label + ' releases by year', height: '190px',
        labels, series: [line], partial, peakScale: true, table: false,
        initial: Math.max(0, labels.indexOf(result.years[0])) });
    });
    addDataTable(parent, labels, series, partial, false);
  }
  parent.append(element('p', 'scene-caption', scaled
    ? 'Each panel uses its own release-count axis. Peak markers use complete years.'
    : 'Dots mark complete-year peaks. Dashed lines show the partial snapshot year.'));
}

function renderFormats(parent) {
  const viewKind = state.formatView;
  const platform = state.formatPlatform;
  const controls = controlRow(
    buttons('Format measure', [['share', 'Share'], ['count', 'Count'], ['size', 'Size tag']], viewKind, id => set('formatView', id)),
    chooseOption('Platform', [['all_coded', 'All platforms'], ...platformOptions()], platform, id => set('formatPlatform', id)),
    rangeControl(),
  );
  if (viewKind === 'size') controls.append(chooseOption('Size tag', sizeTags.map(tag => [tag, formatSize(tag)]),
    state.formatSize, tag => set('formatSize', tag)));
  parent.append(controls);
  const labels = history([platform]);
  const partial = labels.map(year => Number(year) === snapshotYear());
  const percent = viewKind === 'share';
  let series;
  if (viewKind === 'size') {
    series = [{ ...annualSeries(platform, labels, 'size:' + state.formatSize, palette[0], true), label: formatSize(state.formatSize) }];
  } else {
    series = formats.map(([id, label, color]) => ({
      label, color, values: labels.map(year => {
        const count = rawValue(platform, year, id);
        return percent ? 100 * count / (rawValue(platform, year, 'total') || 1) : count;
      }),
    }));
  }
  addPlot(parent, { title: viewKind === 'size' ? formatSize(state.formatSize) + ' releases' : 'Annual format mix',
    description: 'Release formats on ' + platformName(platform), mode: viewKind === 'size' ? 'line' : 'bars',
    series, labels, partial, percent });
  const lastComplete = snapshotYear() - 1;
  if (lastComplete >= 2020) {
    parent.append(element('p', 'scene-caption',
      `Size-limited releases account for ${formatShare(2020, lastComplete, 'size_limited')}% of coded releases `
      + `in 2020–${lastComplete}, up from ${formatShare(2000, 2009, 'size_limited')}% in 2000–2009.`));
  }
}

function periodRange(label) {
  if (/^\d{4}-\d{2}$/.test(label)) return [label, label];
  const [year, season] = label.split('-');
  const range = {
    Winter: [Number(year) - 1 + '-12', year + '-02'],
    Spring: [year + '-03', year + '-05'],
    Summer: [year + '-06', year + '-08'],
    Autumn: [year + '-09', year + '-11'],
  };
  return range[season];
}

function renderEvents(parent) {
  const grain = state.eventGrain;
  const platform = state.eventPlatform;
  const filters = element('div', 'scene-chips scene-event-filters');
  for (const [kind, label] of eventKinds) {
    const item = element('label', 'scene-check');
    item.dataset.eventKind = kind;
    const input = element('input');
    input.type = 'checkbox';
    input.checked = state.events.has(kind);
    input.value = kind;
    input.addEventListener('change', () => {
      if (input.checked) state.events.add(kind);
      else state.events.delete(kind);
      render();
      view.querySelector(`input[value="${kind}"]`)?.focus();
    });
    item.append(input, document.createTextNode(label));
    filters.append(item);
  }
  parent.append(controlRow(
    buttons('Event resolution', [['season', 'Seasonal'], ['month', 'Monthly']], grain, id => set('eventGrain', id)),
    chooseOption('Platform', [['top5_unique', 'Top five combined'], ...data.main.map(id => [id, platformName(id)])],
      platform, id => set('eventPlatform', id)),
  ), filters);
  const labels = Object.keys(data.activity[grain]);
  const values = labels.map(label => data.activity[grain][label][platform] || [0, 0]);
  const milestones = labels.map(label => {
    const [start, end] = periodRange(label);
    return data.events.filter(event =>
      state.events.has(event.kind) && event.start.slice(0, 7) <= end && event.end.slice(0, 7) >= start);
  });
  const series = [
    { label: 'Without a party tag', color: '#a398b5', values: values.map(([, untagged]) => untagged) },
    { label: 'Party-tagged', color: '#79bedb', values: values.map(([total, untagged]) => total - untagged) },
  ];
  const shortLabels = labels.map(label => grain === 'month'
    ? monthFormat.format(new Date(label + '-01T00:00:00Z'))
    : label.slice(5, 8) + ' ’' + label.slice(2, 4));
  addPlot(parent, { title: 'Releases and events', description: 'Coded releases by party status', mode: 'bars',
    labels, shortLabels, series, milestones, partial: labels.map(label => data.activity[grain][label].partial) });
  parent.append(element('p', 'scene-caption', 'Major-party months show more releases. The association fades when entries tagged to those parties are excluded.'));
}

function renderPeaks(parent) {
  const selectedSize = state.peakSize ? 'size:' + state.peakSize : 'size_limited';
  const columns = [
    ['total', 'All releases'], ['demo', 'Demo'], ['intro', 'Intro'], [selectedSize, state.peakSize ? formatSize(state.peakSize) : 'Size-limited'], ['wild', 'Coded wild'],
  ];
  const controls = controlRow(
    chooseOption('Size column', [['', 'All size-limited'], ...sizeTags.map(tag => [tag, formatSize(tag)])], state.peakSize, tag => {
      const oldSize = state.peakSize ? 'size:' + state.peakSize : 'size_limited';
      if (state.peakFormat === oldSize) state.peakFormat = tag ? 'size:' + tag : 'size_limited';
      set('peakSize', tag);
    }),
  );
  const mobile = chooseOption('Format', columns, state.peakFormat, id => set('peakFormat', id));
  mobile.classList.add('scene-peak-mobile');
  controls.append(mobile);
  parent.append(controls);
  const frame = element('div', 'box scene-peak-frame');
  const table = element('table', 'scene-table scene-peak-table');
  const header = table.createTHead().insertRow();
  header.append(element('th', '', 'Platform'));
  for (const [id, label] of columns) {
    const cell = element('th', id === state.peakFormat ? 'scene-peak-active' : 'scene-peak-column', label);
    cell.dataset.format = id;
    header.append(cell);
  }
  const body = table.createTBody();
  const extras = new Set(['javascript', 'flash', 'tic80', 'pico8', 'microw8', 'zxspectrum', 'atarixlxe', 'linux']);
  const defaults = ['all_coded', ...data.main, ...[...extras].filter(id => data.annual[id])];
  const extra = chooseOption('Explore platform', [['', 'More platforms…'], ...platformOptions().filter(([id]) => !defaults.includes(id))],
    defaults.includes(state.peakPlatform) ? '' : state.peakPlatform, id => { if (id) set('peakPlatform', id); });
  const key = element('div', 'scene-peak-key');
  key.append(document.createTextNode('Earlier peaks'), element('span'), document.createTextNode('Later peaks'));
  controls.append(extra, key);
  const platforms = defaults.includes(state.peakPlatform) ? defaults : [...defaults, state.peakPlatform];
  const detail = element('div', 'scene-peak-detail');

  function select(id, format, updateColumns = true) {
    state.peakPlatform = id;
    state.peakFormat = format;
    if (updateColumns) mobile.querySelector('select').value = format;
    table.querySelectorAll('th[data-format], td[data-format]').forEach(cell => {
      cell.className = cell.dataset.format === format ? 'scene-peak-active' : 'scene-peak-column';
    });
    table.querySelectorAll('button').forEach(cell => {
      cell.setAttribute('aria-pressed', String(cell.dataset.platform === id && cell.dataset.format === format));
    });
    disposePeak?.();
    const disposers = [];
    disposePeak = () => disposers.forEach(dispose => dispose());
    detail.replaceChildren();
    const labels = history([id], true);
    const series = annualSeries(id, labels, format, palette[0], true);
    const result = peak(id, format);
    const label = columns.find(([key]) => key === format)?.[1] || 'All releases';
    series.label = label;
    addPlot(detail, { title: platformName(id) + ' · ' + label,
      description: label + ' by year on ' + platformName(id), labels, series: [series],
      partial: labels.map(() => false), height: '220px', initial: Math.max(0, labels.indexOf(result.years[0])) }, disposers);
  }

  for (const id of platforms) {
    const row = body.insertRow();
    const heading = element('th', '', platformName(id));
    heading.scope = 'row';
    row.append(heading);
    for (const [format, label] of columns) {
      const cell = row.insertCell();
      cell.dataset.format = format;
      const result = peak(id, format);
      if (!result.count) {
        cell.textContent = '—';
        continue;
      }
      const years = result.years.join(', ');
      const action = button('', () => select(id, format));
      action.dataset.platform = id;
      action.dataset.format = format;
      const firstYear = Number(Object.keys(data.annual.all_coded)[0]);
      const fraction = (Number(result.years[0]) - firstYear) / Math.max(1, snapshotYear() - firstYear);
      action.style.setProperty('--peak-hue', String(236 + 110 * fraction));
      action.append(element('strong', '', years), element('small', '', number(result.count)));
      action.setAttribute('aria-label', `${platformName(id)} ${label}, ${years}, ${number(result.count)} releases`);
      cell.append(action);
    }
  }
  frame.append(table);
  parent.append(frame, element('p', 'scene-caption', 'Each cell shows the complete year with the most releases and its count. Select a cell to see the annual trend.'), detail);
  select(state.peakPlatform, state.peakFormat, false);
}

const views = { platforms: renderPlatforms, formats: renderFormats, events: renderEvents, peaks: renderPeaks };
function render() {
  if (!data) return;
  mounts.forEach(dispose => dispose());
  mounts = [];
  disposePeak?.();
  disposePeak = undefined;
  view.replaceChildren();
  views[state.tab](view);
}

function activate(id) {
  state.tab = id;
  tabs.forEach(tab => {
    const active = tab.dataset.sceneTab === id;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    tab.classList.toggle('on', active);
  });
  view.setAttribute('aria-labelledby', 'scene-tab-' + id);
  if (location.hash !== '#' + id) window.history.replaceState(null, '', '#' + id);
  render();
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activate(tab.dataset.sceneTab));
  tab.addEventListener('keydown', event => {
    const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0, End: tabs.length - 1 }[event.key];
    if (next == null) return;
    event.preventDefault();
    tabs[next].focus();
    activate(tabs[next].dataset.sceneTab);
  });
});

try {
  const response = await fetch(new URL('./scene-data.json', import.meta.url));
  if (!response.ok) throw new Error('Scene data: ' + response.status);
  data = await response.json();
  state.platforms = [...data.main];
  document.getElementById('scene-snapshot').textContent = 'Snapshot ' + textDate(data.snapshot) + '.';
  activate(state.tab);
} catch (error) {
  view.replaceChildren(element('p', 'scene-caption', 'The release data could not be loaded.'));
  console.error(error);
}
