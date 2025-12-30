import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

const DATA_SIZE = 60;
const WINDOW_MS = 60000;
const UPDATE_INTERVAL = 1000;
const FPS = 10;
let chart = null;
let data = [
	[], // timestamps (ms)
	[], // rxData
	[]  // txData
];
let intervalId = null;


const isVisible = (element) => {
	if (!element) {
		return false;
	}

	const rect = element.getBoundingClientRect();
	return rect.width > 0 && rect.height > 0;
};

// Initialize with 60 seconds of zero data
const initializeData = () => {
	const now = Date.now();
	for (let i = DATA_SIZE; i >= 0; i--) {
		data[0].push(now - (i * UPDATE_INTERVAL));
		data[1].push(0);
		data[2].push(0);
	}
};

const addData = (rx, tx) => {
	if (data[0].length === 0) {
		initializeData();
	}

	// Remove old data points
	if (data[0].length > DATA_SIZE) {
		data[0].shift();
		data[1].shift();
		data[2].shift();
	}

	data[0].push(Date.now());
	data[1].push(rx || 0);
	data[2].push(tx || 0);
};

const hexToRgba = (hex, alpha) => {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getComputedColor = (cssVar) => {
	const style = getComputedStyle(document.documentElement);
	return style.getPropertyValue(cssVar).trim() || '#000';
};

const startAnimation = () => {
	if (intervalId) return;

	const update = () => {
		if (chart && data[0].length > 0) {
			const now = Date.now();
			chart.setData(data, false);
			chart.setScale('x', {
				min: now - WINDOW_MS,
				max: now
			});
		}
	};

	intervalId = setInterval(update, 1000 / FPS);
};

const stopAnimation = () => {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}
};

const render = (iface, yAxisMax = 1000 * 1_000_000 / 8) => {
	if (iface === false || _.isNull(iface) || _.isNull(iface.rx_sec) || _.isNull(iface.tx_sec)) {
		return;
	}

	addData(iface.rx_sec, iface.tx_sec);

	const networkChart = document.querySelector('#resources-monitor .network-chart');
	if (!isVisible(networkChart)) {
		stopAnimation();
		return;
	}

	if (chart) {
		startAnimation();
		return;
	}

	const blueColor = getComputedColor('--bs-blue-500');
	const purpleColor = getComputedColor('--bs-purple-500');

	const makeGradientFill = (color) => {
		return (u, seriesIdx) => {
			const seriesData = u.data[seriesIdx];
			const dataMax = Math.max(...seriesData.filter(v => v !== null)) || 1;
			const scale = u.scales.y;
			const topY = u.valToPos(dataMax, 'y', true);
			const bottomY = u.valToPos(scale.min, 'y', true);
			const gradient = u.ctx.createLinearGradient(0, topY, 0, bottomY);
			gradient.addColorStop(0, hexToRgba(color, 0.6));
			gradient.addColorStop(0.4, hexToRgba(color, 0.35));
			gradient.addColorStop(1, hexToRgba(color, 0.05));
			return gradient;
		};
	};

	function tooltipPlugin() {
		let over, bLeft, bTop;

		function syncBounds() {
			const bbox = over.getBoundingClientRect();
			bLeft = bbox.left;
			bTop = bbox.top;
		}

		const tooltip = document.createElement('div');
		tooltip.className = 'uplot-tooltip';
		tooltip.style.cssText = 'position: absolute; display: none; pointer-events: none; background: rgba(0,0,0,0.9); color: white; padding: 6px 10px; border-radius: 4px; font-size: 11px; z-index: 10000; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
		document.body.appendChild(tooltip);

		return {
			hooks: {
				init: (u) => {
					over = u.over;

					over.onmouseenter = () => {
						tooltip.style.display = 'block';
					};

					over.onmouseleave = () => {
						tooltip.style.display = 'none';
					};
				},
				setSize: () => {
					syncBounds();
				},
				setCursor: (u) => {
					const { left, top, idx } = u.cursor;

					if (idx == null) return;

					const rx = u.data[1][idx];
					const tx = u.data[2][idx];

					tooltip.innerHTML = `
						<div style="line-height: 1.4;">RX: ${prettyBytes(rx || 0, { binary: true })}/s</div>
						<div style="line-height: 1.4;">TX: ${prettyBytes(tx || 0, { binary: true })}/s</div>
					`;

					tooltip.style.left = (left + bLeft + 10) + 'px';
					tooltip.style.top = (top + bTop - tooltip.offsetHeight - 10) + 'px';
				}
			}
		};
	}

	const opts = {
		width: networkChart.offsetWidth,
		height: 100,
		pxAlign: 0,
		ms: 1,
		plugins: [
			tooltipPlugin(),
		],
		series: [
			{},
			{
				label: 'RX',
				stroke: blueColor,
				fill: makeGradientFill(blueColor),
				width: 1,
				spanGaps: true,
				paths: uPlot.paths.spline(),
				points: {
					show: false
				}
			},
			{
				label: 'TX',
				stroke: purpleColor,
				fill: makeGradientFill(purpleColor),
				width: 1,
				spanGaps: true,
				paths: uPlot.paths.spline(),
				points: {
					show: false
				}
			}
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
			x: false,
			y: false,
			lock: true
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
				range: () => [0, yAxisMax]
			}
		}
	};

	chart = new uPlot(opts, data, networkChart);
	startAnimation();
};

const destroy = () => {
	stopAnimation();
	if (chart) {
		chart.destroy();
		chart = null;
	}
	data = [[], [], []];
};

export {
	render,
	destroy
};
