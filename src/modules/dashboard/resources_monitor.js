import resourcesMonitorPartial from 'modules/dashboard/partials/resources_monitor.html';
import resourceCpuPartial from 'modules/dashboard/partials/resource_cpu.html';
import resourceMemoryPartial from 'modules/dashboard/partials/resource_memory.html';
import resourceStorageSystemPartial from 'modules/dashboard/partials/resource_storage_system.html';
import resourceStorageDataPartial from 'modules/dashboard/partials/resource_storage_data.html';
import resourceNetworkPartial from 'modules/dashboard/partials/resource_network.html';
import resourceUpsPartial from 'modules/dashboard/partials/resource_ups.html';
import resourceTimePartial from 'modules/dashboard/partials/resource_time.html';
import * as networkUsage from 'modules/dashboard/network_usage';
import * as resourceMonitorService from 'modules/dashboard/services/resource_monitor';
import prettyMilliseconds from 'pretty-ms';

const resourcesMonitorTemplate = _.template(resourcesMonitorPartial);
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
		resourcesMonitorTemplate({
			cpu: cpuTemplate({ state }),
			memory: memoryTemplate({ state, bytes }),
			storageSystem: storageSystemTemplate({ state, bytes }),
			storageData: storageDataTemplate({ state, bytes }),
			network: networkTemplate({ state, bytes }),
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
	networkUsage.render(state.networkStats, (state.system?.networkInterface?.speed * 1_000_000 / 8));
};

resourceMonitorService.subscribe([render]);
