import ApexCharts from 'apexcharts/dist/apexcharts.esm.js';

let rendered = false;
let chart = null;
let series = [
	{
		name: 'RX',
		data: Array.from({ length: 20 }, () => { return 0 })
	},
	{
		name: 'TX',
		data: Array.from({ length: 20 }, () => { return 0 })
	}
];

const cleanupSeries = () => {
	if (series[0].data.length < 100) {
		return;
	}

	series[0].data = _.takeRight(series[0].data, 20);
	series[1].data = _.takeRight(series[1].data, 20);
};

const updateSeries = (data) => {
	_.each(data, (value, key) => {
		series[key].data.push(value);
	});
	chart.updateSeries(series);
	cleanupSeries();
};

const render = (iface, yAxisMax) => {
	if (iface === false || _.isNull(iface) || _.isNull(iface.rx_sec) || _.isNull(iface.tx_sec)) {
		return;
	}
	
	if (rendered) {
		updateSeries([
			iface.rx_sec,
			iface.tx_sec
		]);
		return;
	}

	chart = new ApexCharts(
		document.querySelector('#resources-monitor .network-chart'),
		{
			noData: {
				text: 'Loading...'
			},
			series: series,
			colors: ['var(--bs-gray-600)', 'var(--bs-gray-400)'],
			chart: {
				sparkline: {
					enabled: true,
				},
				type: 'area',
				width: '100%',
				height: 100
			},
			xaxis: {
				type: 'numeric',
				range: 10
			},
			yaxis: {
				max: yAxisMax
			},
			dataLabels: {
				enabled: false
			},
			stroke: {
				curve: 'smooth',
				width: 1
			},
			tooltip: {
				x: {
					show: false
				},
				y: {
					formatter: (value) => {
						return `${bytes(value)}/s`;
					}
				}
			}
		}
	);
	chart.render();
	rendered = true;
}

export {
	render
};
