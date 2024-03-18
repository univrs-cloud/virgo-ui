import resourcesMonitorPartial from '../partials/resources_monitor.html';
import resourceCpuPartial from '../partials/resource_cpu.html';
import resourceMemoryPartial from '../partials/resource_memory.html';
import resourceFsSystemPartial from '../partials/resource_filesystem_system.html';
import resourceFsDataPartial from '../partials/resource_filesystem_data.html';
import resourceNetworkPartial from '../partials/resource_network.html';
import resourceUpsPartial from '../partials/resource_ups.html';
import resourceTimePartial from '../partials/resource_time.html';
import * as networkUsage from './network_usage';
import { io } from 'socket.io-client';
import prettyMilliseconds from 'pretty-ms';

let state = {
	cpu: null,
	memory: null,
	filesystem: null,
	network: null,
	ups: null,
	time: null
};
let cpuTemplate = _.template(resourceCpuPartial);
let memoryTemplate = _.template(resourceMemoryPartial);
let fsSystemTemplate = _.template(resourceFsSystemPartial);
let fsDataTemplate = _.template(resourceFsDataPartial);
let networkTemplate = _.template(resourceNetworkPartial);
let upsTemplate = _.template(resourceUpsPartial);
let timeTemplate = _.template(resourceTimePartial);
let container = document.querySelector('#resources-monitor');

const socket = io('https://dash.origin.univrs.cloud');
socket.on('connect', () => {
	render(state);
});
socket.on('disconnect', () => {
	_.each(_.keys(state), (key) => { state[key] = false; });
	render(state);
	_.each(_.keys(state), (key) => { state[key] = null; });
});
socket.on('cpu', (cpu) => {
	state.cpu = cpu;
	morphdom(
		container.querySelector('.list-group-item.cpu'),
		cpuTemplate({ state })
	);
});
socket.on('memory', (memory) => {
	state.memory = memory;
	morphdom(
		container.querySelector('.list-group-item.memory'),
		memoryTemplate({ state, prettyBytes })
	);
});
socket.on('filesystem', (filesystem) => {
	state.filesystem = filesystem;
	morphdom(
		container.querySelector('.list-group-item.filesystem-system'),
		fsSystemTemplate({ state, prettyBytes })
	);
	morphdom(
		container.querySelector('.list-group-item.filesystem-data'),
		fsDataTemplate({ state, prettyBytes })
	);
});
socket.on('network', (network) => {
	state.network = network;
	morphdom(
		container.querySelector('.list-group-item.network'),
		networkTemplate({ state, prettyBytes }),
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
});
socket.on('ups', (ups) => {
	state.ups = ups;
	morphdom(
		container.querySelector('.list-group-item.ups'),
		upsTemplate({ state })
	);
});
socket.on('time', (time) => {
	state.time = time;
	morphdom(
		container.querySelector('.list-group-item.time'),
		timeTemplate({ state, prettyMilliseconds })
	);
});

const render = (state) => {
	container.innerHTML = _.template(resourcesMonitorPartial)({
		cpu: cpuTemplate({ state }),
		memory: memoryTemplate({ state }),
		fsSystem: fsSystemTemplate({ state }),
		fsData: fsDataTemplate({ state }),
		network: networkTemplate({ state }),
		ups: upsTemplate({ state }),
		time: timeTemplate({ state }),
	});
};
