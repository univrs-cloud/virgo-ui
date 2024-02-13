import resourceUsagePartial from '../partials/resource_usage.html';
import prettyBytes from 'pretty-bytes';
//import './network_usage';

let fetchRetries = 5;
let fetchDelay = 2000;

const fetchStats = () => {
	Promise.allSettled([
		fetch(`https://192.168.100.102:3000/api/3/cpu`),
		fetch(`https://192.168.100.102:3000/api/3/mem`),
		fetch(`https://192.168.100.102:3000/api/3/fs`),
		fetch(`https://192.168.100.102:3000/api/v1/devices/ups`)
	])
		.then(async ([responseCpu, responseMemory, responseFilesystem, responseUps]) => {
			return { 
				cpu: await responseCpu.value.json(),
				memory: await responseMemory.value.json(),
				filesystem: await responseFilesystem.value.json(),
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
	morphdom(document.querySelector('#resource-usage'), template({ ...state, prettyBytes: prettyBytes }));
};

fetchStats();
