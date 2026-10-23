import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

const HISTORY_MS = 60 * 60 * 1000;
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const MINIMUM_WINDOW_MS = 60 * 1000;
const SAMPLE_INTERVAL_MS = 1000;
const CHART_HEIGHT = 90;
const FRAMES_PER_SECOND = 10;
const LIVE_SNAP_PX = 4;
const HANDLE_HIT_PX = 8;
const SYNC_KEY = 'resources-monitor';
const CHARTS = {
	cpu: {
		series: [{ key: 'cpu', label: 'CPU', color: '--blue-500' }],
		format: (value) => { return `${value.toFixed(0)}%`; }
	},
	memory: {
		series: [{ key: 'memory', label: 'RAM', color: '--blue-500' }],
		format: (value) => { return prettyBytes(value, { binary: true }); }
	},
	network: {
		series: [
			{ key: 'rx', label: 'RX', color: '--blue-500' },
			{ key: 'tx', label: 'TX', color: '--purple-500' }
		],
		format: (value) => { return `${prettyBytes(value, { binary: true })}/s`; }
	}
};
let charts = {};
let timeline = null;
let maxima = {};
let stats = [];
let clockOffset = 0;
let intervalId = null;
let timeframe = { end: null, size: DEFAULT_WINDOW_MS };

const isVisible = (element) => {
	if (!element) {
		return false;
	}

	const rect = element.getBoundingClientRect();
	return rect.width > 0 && rect.height > 0;
};

const withAlpha = (color, alpha) => {
	return `color-mix(in srgb, ${color} ${alpha * 100}%, transparent)`;
};

const getComputedColor = (cssVariableName) => {
	const style = getComputedStyle(document.documentElement);
	return style.getPropertyValue(cssVariableName).trim() || '#000';
};

const getElementWidth = (element) => {
	return Math.max(1, element.offsetWidth || element.clientWidth);
};

const getNow = () => {
	return Date.now() + clockOffset;
};

const getRange = () => {
	const end = timeframe.end ?? getNow();
	return { start: end - timeframe.size, end };
};

const getBucketMs = (width, windowMs) => {
	return Math.max(1, Math.ceil(windowMs / SAMPLE_INTERVAL_MS / width)) * SAMPLE_INTERVAL_MS;
};

const toColumns = (series, start, end, bucketMs) => {
	const firstBucket = Math.floor(start / bucketMs);
	const buckets = Array.from({ length: Math.max(Math.floor(end / bucketMs) - firstBucket + 1, 0) }, () => { return []; });
	_.each(stats, (sample) => {
		const index = Math.floor(sample.time / bucketMs) - firstBucket;
		if (index >= 0 && index < buckets.length) {
			buckets[index].push(sample);
		}
	});

	const columns = [buckets.map((bucket, index) => { return (firstBucket + index) * bucketMs; })];
	series.forEach(({ key }) => {
		columns.push(buckets.map((bucket) => { return (bucket.length > 0 ? _.maxBy(bucket, key)[key] : 0); }));
	});
	return columns;
};

const makeGradientFill = (color) => {
	return (plot, seriesIndex) => {
		const seriesData = plot.data[seriesIndex];
		const positiveValues = _.sortBy(seriesData.filter((value) => {
			return Number.isFinite(value) && value > 0;
		}));
		const typicalMaximum = (positiveValues[Math.floor(positiveValues.length * 0.9)] ?? 1);
		const yScale = plot.scales.y;
		const scaleMinimum = Number.isFinite(yScale?.min) ? yScale.min : 0;
		let gradientTopY = plot.valToPos(typicalMaximum, 'y', true);
		let gradientBottomY = plot.valToPos(scaleMinimum, 'y', true);
		if (!Number.isFinite(gradientTopY) || !Number.isFinite(gradientBottomY)) {
			gradientTopY = 0;
			gradientBottomY = plot.height || 1;
		}
		const gradient = plot.ctx.createLinearGradient(0, gradientTopY, 0, gradientBottomY);
		gradient.addColorStop(0, withAlpha(color, 0.6));
		gradient.addColorStop(0.4, withAlpha(color, 0.35));
		gradient.addColorStop(1, withAlpha(color, 0.05));
		return gradient;
	};
};

const makeSeries = (series) => {
	return series.map(({ label, color }) => {
		const computedColor = getComputedColor(color);
		return {
			label,
			stroke: computedColor,
			fill: makeGradientFill(computedColor),
			width: 1,
			paths: uPlot.paths.spline(),
			points: {
				show: false
			}
		};
	});
};

const tooltipPlugin = () => {
	let plotOverlayElement;
	let overlayBoundsLeft;
	let overlayBoundsTop;

	const syncBounds = () => {
		const overlayBoundingRect = plotOverlayElement.getBoundingClientRect();
		overlayBoundsLeft = overlayBoundingRect.left;
		overlayBoundsTop = overlayBoundingRect.top;
	};

	const tooltip = document.createElement('div');
	tooltip.className = 'uplot-tooltip position-absolute d-none pe-none text-nowrap rounded shadow bd-black px-2 py-1 fs-xs';
	document.body.appendChild(tooltip);

	return {
		hooks: {
			init: (plot) => {
				plotOverlayElement = plot.over;

				plotOverlayElement.onmouseenter = () => {
					tooltip.classList.remove('d-none');
				};

				plotOverlayElement.onmouseleave = () => {
					tooltip.classList.add('d-none');
				};
			},
			setSize: () => {
				syncBounds();
			},
			setCursor: (plot) => {
				const dataIndex = plot.cursor.idx;
				if (tooltip.classList.contains('d-none') || dataIndex == null) {
					return;
				}

				const times = plot.data[0];
				const start = times[dataIndex];
				const end = start + (times.length > 1 ? times[1] - times[0] : SAMPLE_INTERVAL_MS) - SAMPLE_INTERVAL_MS;
				const range = (end > start ? `${moment(start).format('HH:mm:ss')} to ${moment(end).format('HH:mm:ss')}` : moment(start).format('HH:mm:ss'));
				const values = _.flatMap(CHARTS, ({ series, format }, name) => {
					if (!charts[name]) {
						return [];
					}

					return series.map(({ label }, seriesIndex) => {
						return `<div>${label}: ${format(charts[name].data[seriesIndex + 1]?.[dataIndex] ?? 0)}</div>`;
					});
				});
				tooltip.innerHTML = `
					<div class="opacity-75">${range}</div>
					${values.join('')}
				`;
				syncBounds();
				tooltip.style.left = (plot.cursor.left + overlayBoundsLeft + 10) + 'px';
				tooltip.style.top = (plot.cursor.top + overlayBoundsTop - tooltip.offsetHeight - 10) + 'px';
			},
			destroy: () => {
				tooltip.remove();
			}
		}
	};
};

const createChart = (name, element) => {
	const { series } = CHARTS[name];
	return new uPlot({
		width: getElementWidth(element),
		height: CHART_HEIGHT,
		pxAlign: 0,
		ms: 1,
		plugins: [
			tooltipPlugin()
		],
		series: [
			{},
			...makeSeries(series)
		],
		axes: [
			{
				show: false
			},
			{
				show: false
			}
		],
		cursor: {
			show: true,
			x: true,
			y: false,
			drag: {
				x: false,
				y: false
			},
			sync: {
				key: SYNC_KEY
			}
		},
		legend: {
			show: false
		},
		focus: {
			alpha: 1
		},
		scales: {
			x: {
				time: true,
				auto: false
			},
			y: {
				range: (plot, dataMinimum, dataMaximum) => {
					return [0, maxima[name] || dataMaximum || 1];
				}
			}
		}
	}, [[], ...series.map(() => { return []; })], element);
};

const toTimelineX = (time) => {
	return ((time - (getNow() - HISTORY_MS)) / HISTORY_MS) * timeline.track.clientWidth;
};

const toTimelineTime = (x) => {
	return getNow() - HISTORY_MS + ((x / timeline.track.clientWidth) * HISTORY_MS);
};

const formatTimeframe = () => {
	const { start, end } = getRange();
	if (timeframe.end !== null) {
		return `${moment(start).format('HH:mm')} to ${moment(end).format('HH:mm')}`;
	}

	const minutes = Math.round(timeframe.size / 60000);
	if (minutes >= 60) {
		return 'Last hour';
	}

	return (minutes === 1 ? 'Last minute' : `Last ${minutes} minutes`);
};

const positionTimeline = () => {
	const { start, end } = getRange();
	const left = toTimelineX(start);
	timeline.box.style.left = `${left}px`;
	timeline.box.style.width = `${Math.max(toTimelineX(end) - left, 2)}px`;
	timeline.label.textContent = formatTimeframe();
};

const setScales = () => {
	const { start, end } = getRange();
	_.each(charts, (chart) => {
		chart.setScale('x', { min: start, max: end });
	});

	if (timeline) {
		positionTimeline();
	}
};

const updateData = () => {
	const latest = _.last(stats);
	if (!latest) {
		return;
	}

	const { start, end } = getRange();
	_.each(charts, (chart, name) => {
		const bucketMs = getBucketMs(chart.width, timeframe.size);
		chart.setData(toColumns(CHARTS[name].series, start - bucketMs, Math.min(end, latest.time), bucketMs), false);
	});
};

const setTimeframe = (end, size) => {
	const isLive = (((getNow() - end) / HISTORY_MS) * timeline.track.clientWidth <= LIVE_SNAP_PX);
	timeframe = { end: (isLive ? null : end), size };
	updateData();
	setScales();
};

const clampTimeframe = () => {
	if (timeframe.end === null) {
		return;
	}

	const now = getNow();
	timeframe.end = _.clamp(timeframe.end, now - HISTORY_MS + timeframe.size, now);
};

const startDrag = (event) => {
	const { track } = timeline;
	const bounds = track.getBoundingClientRect();
	const valueAt = (clientX) => { return toTimelineTime(clientX - bounds.left); };
	const pointer = event.clientX - bounds.left;
	const range = getRange();
	const left = toTimelineX(range.start);
	const right = toTimelineX(range.end);
	let mode = 'move';
	if (Math.abs(pointer - left) <= HANDLE_HIT_PX) {
		mode = 'start';
	} else if (Math.abs(pointer - right) <= HANDLE_HIT_PX) {
		mode = 'end';
	} else if (pointer < left || pointer > right) {
		const now = getNow();
		setTimeframe(_.clamp(valueAt(event.clientX) + (timeframe.size / 2), now - HISTORY_MS + timeframe.size, now), timeframe.size);
	}

	const origin = { ...getRange(), value: valueAt(event.clientX) };
	const onMove = (moveEvent) => {
		const value = valueAt(moveEvent.clientX);
		const now = getNow();
		if (mode === 'start') {
			const start = _.clamp(value, now - HISTORY_MS, origin.end - MINIMUM_WINDOW_MS);
			setTimeframe(origin.end, origin.end - start);
		} else if (mode === 'end') {
			const end = _.clamp(value, origin.start + MINIMUM_WINDOW_MS, now);
			setTimeframe(end, end - origin.start);
		} else {
			setTimeframe(_.clamp(origin.end + value - origin.value, now - HISTORY_MS + timeframe.size, now), timeframe.size);
		}
	};
	const onUp = () => {
		track.removeEventListener('pointermove', onMove);
		track.removeEventListener('pointerup', onUp);
		track.removeEventListener('pointercancel', onUp);
	};

	event.preventDefault();
	track.setPointerCapture(event.pointerId);
	track.addEventListener('pointermove', onMove);
	track.addEventListener('pointerup', onUp);
	track.addEventListener('pointercancel', onUp);
};

const createTimeline = (element) => {
	const track = element.querySelector('.resource-timeline-track');
	track.onpointerdown = startDrag;
	track.ondblclick = () => {
		setTimeframe(getNow(), DEFAULT_WINDOW_MS);
	};
	return {
		label: element.querySelector('.resource-timeline-label'),
		track,
		box: element.querySelector('.resource-timeline-window')
	};
};

const startAnimation = () => {
	if (intervalId) {
		return;
	}

	intervalId = setInterval(setScales, 1000 / FRAMES_PER_SECOND);
};

const stopAnimation = () => {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}
};

const destroyChart = (name) => {
	charts[name]?.destroy();
	delete charts[name];
};

const destroyTimeline = () => {
	timeline = null;
};

const render = (nextStats, limits) => {
	maxima = _.pickBy(limits, (limit) => { return Number.isFinite(limit) && limit > 0; });
	stats = nextStats || [];
	const latest = _.last(stats);
	if (latest) {
		clockOffset = latest.time - Date.now();
	}

	_.each(CHARTS, (definition, name) => {
		const element = document.querySelector(`#resources-monitor .resource-chart[data-chart="${name}"]`);
		if (charts[name] && !element?.contains(charts[name].root)) {
			destroyChart(name);
		}

		if (!charts[name] && latest && isVisible(element)) {
			charts[name] = createChart(name, element);
		}
	});

	const timelineElement = document.querySelector('#resources-monitor .resource-timeline');
	if (timeline && !timelineElement?.contains(timeline.track)) {
		destroyTimeline();
	}

	if (!timeline && latest && isVisible(timelineElement)) {
		timeline = createTimeline(timelineElement);
	}

	const isAnimated = (latest && (timeline || !_.isEmpty(charts)) && _.some([timelineElement, ..._.map(charts, 'root')], isVisible));
	if (!isAnimated) {
		stopAnimation();
		return;
	}

	clampTimeframe();
	updateData();
	setScales();
	startAnimation();
};

const destroy = () => {
	stopAnimation();
	_.each(_.keys(charts), destroyChart);
	charts = {};
	destroyTimeline();
};

document.addEventListener('update-mode', destroy);

export {
	render,
	destroy
};
