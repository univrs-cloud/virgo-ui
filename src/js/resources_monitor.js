import resourcesMonitorPartial from '../partials/resources_monitor.html';
import resourceCpuPartial from '../partials/resource_cpu.html';
import resourceMemoryPartial from '../partials/resource_memory.html';
import resourceStorageSystemPartial from '../partials/resource_storage_system.html';
import resourceStorageDataPartial from '../partials/resource_storage_data.html';
import resourceNetworkPartial from '../partials/resource_network.html';
import resourceUpsPartial from '../partials/resource_ups.html';
import resourceTimePartial from '../partials/resource_time.html';
import * as networkUsage from './network_usage';
import * as resourceMonitorService from './services/resource_monitor';
import prettyMilliseconds from 'pretty-ms';

const cpuTemplate = _.template(resourceCpuPartial);
const memoryTemplate = _.template(resourceMemoryPartial);
const storageSystemTemplate = _.template(resourceStorageSystemPartial);
const storageDataTemplate = _.template(resourceStorageDataPartial);
const networkTemplate = _.template(resourceNetworkPartial);
const upsTemplate = _.template(resourceUpsPartial);
const timeTemplate = _.template(resourceTimePartial);
let container = document.querySelector('#resources-monitor');

const render = (state) => {
	morphdom(
		container,
		 _.template(resourcesMonitorPartial)({
			cpu: cpuTemplate({ state }),
			memory: memoryTemplate({ state, prettyBytes }),
			storageSystem: storageSystemTemplate({ state, prettyBytes }),
			storageData: storageDataTemplate({ state, prettyBytes }),
			network: networkTemplate({ state, prettyBytes }),
			ups: upsTemplate({ state }),
			time: timeTemplate({ state, prettyMilliseconds })
		}),
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

resourceMonitorService.subscribe([render]);
