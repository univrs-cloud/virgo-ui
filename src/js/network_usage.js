import ApexCharts from 'apexcharts';

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

let chart = new ApexCharts(
	document.querySelector('.chart'),
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
			max: 130
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
			}
		}
	}
);
chart.render();

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

export default {
	updateSeries
};
