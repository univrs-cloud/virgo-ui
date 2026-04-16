import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

const DATA_SIZE = 60;
const WINDOW_MS = 60000;
const UPDATE_INTERVAL = 1000;
const FRAMES_PER_SECOND = 10;
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
	for (let sampleIndex = DATA_SIZE; sampleIndex >= 0; sampleIndex--) {
		data[0].push(now - (sampleIndex * UPDATE_INTERVAL));
		data[1].push(0);
		data[2].push(0);
	}
};

const addData = (receiveBytesPerSecond, transmitBytesPerSecond) => {
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
	data[1].push(receiveBytesPerSecond || 0);
	data[2].push(transmitBytesPerSecond || 0);
};

const hexToRgba = (hex, alpha) => {
	const red = parseInt(hex.slice(1, 3), 16);
	const green = parseInt(hex.slice(3, 5), 16);
	const blue = parseInt(hex.slice(5, 7), 16);
	return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const getComputedColor = (cssVariableName) => {
	const style = getComputedStyle(document.documentElement);
	return style.getPropertyValue(cssVariableName).trim() || '#000';
};

const startAnimation = () => {
	if (intervalId) {
		return;
	}

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

	intervalId = setInterval(update, 1000 / FRAMES_PER_SECOND);
};

const stopAnimation = () => {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}
};

const render = (networkInterface, yAxisMax = 1000 * 1_000_000 / 8) => {
	if (networkInterface === false || _.isNull(networkInterface) || _.isNull(networkInterface.rx_sec) || _.isNull(networkInterface.tx_sec)) {
		return;
	}

	addData(networkInterface.rx_sec, networkInterface.tx_sec);

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
		return (plot, seriesIndex) => {
			const seriesData = plot.data[seriesIndex];
			const numericValues = seriesData.filter((value) => {
				return value != null && Number.isFinite(Number(value));
			});
			const dataMaximum = numericValues.length > 0 ? Math.max(...numericValues) : 1;
			const yScale = plot.scales.y;
			const scaleMinimum = Number.isFinite(yScale?.min) ? yScale.min : 0;
			let gradientTopY = plot.valToPos(dataMaximum, 'y', true);
			let gradientBottomY = plot.valToPos(scaleMinimum, 'y', true);
			if (!Number.isFinite(gradientTopY) || !Number.isFinite(gradientBottomY)) {
				gradientTopY = 0;
				gradientBottomY = plot.height || 1;
			}
			const gradient = plot.ctx.createLinearGradient(0, gradientTopY, 0, gradientBottomY);
			gradient.addColorStop(0, hexToRgba(color, 0.6));
			gradient.addColorStop(0.4, hexToRgba(color, 0.35));
			gradient.addColorStop(1, hexToRgba(color, 0.05));
			return gradient;
		};
	};

	function tooltipPlugin() {
		let plotOverlayElement;
		let overlayBoundsLeft;
		let overlayBoundsTop;

		function syncBounds() {
			const overlayBoundingRect = plotOverlayElement.getBoundingClientRect();
			overlayBoundsLeft = overlayBoundingRect.left;
			overlayBoundsTop = overlayBoundingRect.top;
		}

		const tooltip = document.createElement('div');
		tooltip.className = 'uplot-tooltip';
		tooltip.style.cssText = 'position: absolute; display: none; pointer-events: none; background: rgba(0,0,0,0.9); color: white; padding: 6px 10px; border-radius: 4px; font-size: 11px; z-index: 10000; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
		document.body.appendChild(tooltip);

		return {
			hooks: {
				init: (plot) => {
					plotOverlayElement = plot.over;

					plotOverlayElement.onmouseenter = () => {
						tooltip.style.display = 'block';
					};

					plotOverlayElement.onmouseleave = () => {
						tooltip.style.display = 'none';
					};
				},
				setSize: () => {
					syncBounds();
				},
				setCursor: (plot) => {
					const cursorLeft = plot.cursor.left;
					const cursorTop = plot.cursor.top;
					const dataIndex = plot.cursor.idx;

					if (dataIndex == null) {
						return;
					}

					const receiveBytesPerSecond = plot.data[1][dataIndex];
					const transmitBytesPerSecond = plot.data[2][dataIndex];

					tooltip.innerHTML = `
						<div style="line-height: 1.4;">RX: ${prettyBytes(receiveBytesPerSecond || 0, { binary: true })}/s</div>
						<div style="line-height: 1.4;">TX: ${prettyBytes(transmitBytesPerSecond || 0, { binary: true })}/s</div>
					`;

					tooltip.style.left = (cursorLeft + overlayBoundsLeft + 10) + 'px';
					tooltip.style.top = (cursorTop + overlayBoundsTop - tooltip.offsetHeight - 10) + 'px';
				}
			}
		};
	}

	const chartOptions = {
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
				range: () => {
					return [0, yAxisMax];
				}
			}
		}
	};

	chart = new uPlot(chartOptions, data, networkChart);
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
