import resourceUsagePartial from '../partials/resource_usage.html';
import * as networkUsage from './network_usage';
import prettyMilliseconds from 'pretty-ms';

let fetchRetries = 5;
let fetchDelay = 2000;

const fetchStats = () => {
	Promise.allSettled([
		axios.get('/api/v1/cpu'),
		axios.get('/api/v1/mem'),
		axios.get('/api/v1/fs'),
		axios.get('/api/v1/network'),
		axios.get('/api/v1/ups'),
		axios.get('/api/v1/time')
	])
		.then(([responseCpu, responseMemory, responseFilesystem, responseNetwork, responseUps, responseTime]) => {
			let data = {
				cpu: (responseCpu.status === 'fulfilled' ? responseCpu.value.data : false),
				memory: (responseMemory.status === 'fulfilled' ? responseMemory.value.data : false),
				filesystem: (responseFilesystem.status === 'fulfilled' ? responseFilesystem.value.data : false),
				network: (responseNetwork.status === 'fulfilled' ? responseNetwork.value.data : false),
				ups: (responseUps.status === 'fulfilled' ? responseUps.value.data : false),
				time: (responseTime.status === 'fulfilled' ? responseTime.value.data : false)
			};

			fetchRetries = 5;
			fetchDelay = 2000;
			render(data);
		})
		.catch((error) => {
			console.log(error);
			fetchRetries--;
			fetchDelay = 1000;
		})
		.then(() => {
			if (fetchRetries > 0) {
				setTimeout(() => {
					fetchStats();
				}, fetchDelay);
			}
		});
};

const render = (state) => {
	const template = _.template(resourceUsagePartial);
	morphdom(
		document.querySelector('#resource-usage'),
		template({ ...state, prettyBytes, prettyMilliseconds }),
		{
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('network-chart')) {
					return false;
				}

				return true;
			}
		}
	);
	networkUsage.render(state.network);
};

fetchStats();
