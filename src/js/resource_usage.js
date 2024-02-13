import resourceUsagePartial from '../partials/resource_usage.html';
import * as networkUsage from './network_usage';
import prettyBytes from 'pretty-bytes';

let fetchRetries = 5;
let fetchDelay = 2000;

const fetchStats = () => {
	Promise.allSettled([
		fetch(`/api/v1/cpu`),
		fetch(`/api/v1/mem`),
		fetch(`/api/v1/fs`),
		fetch(`/api/v1/network`),
		fetch(`/api/v1/devices/ups`)
	])
		.then(async ([responseCpu, responseMemory, responseFilesystem, responseNetwork, responseUps]) => {
			return { 
				cpu: await responseCpu.value.json(),
				memory: await responseMemory.value.json(),
				filesystem: await responseFilesystem.value.json(),
				network: await responseNetwork.value.json(),
				ups: await responseUps.value.json()
			};
		})
		.then((data) => {
			fetchRetries = 5;
			fetchDelay = 2000;
			render(data);
		})
		.catch((error) => {
			console.log('error:', error);
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
		template({ ...state, prettyBytes: prettyBytes }),
		{
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('network-chart')) {
					return false;
				}

				return true;
			}
		}
	);
	networkUsage.render(_.find(state.network, { iface: 'wlan0' }));
};

fetchStats();
