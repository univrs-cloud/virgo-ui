import resourcesMonitorPartial from 'node/modules/dashboard/partials/resources_monitor.html';
import resourceCpuPartial from 'node/modules/dashboard/partials/resource_cpu.html';
import resourceMemoryPartial from 'node/modules/dashboard/partials/resource_memory.html';
import resourceStorageSystemPartial from 'node/modules/dashboard/partials/resource_storage_system.html';
import resourceStorageDataPartial from 'node/modules/dashboard/partials/resource_storage_data.html';
import resourceNetworkPartial from 'node/modules/dashboard/partials/resource_network.html';
import resourceTimelinePartial from 'node/modules/dashboard/partials/resource_timeline.html';
import resourceUpsPartial from 'node/modules/dashboard/partials/resource_ups.html';
import resourceTimePartial from 'node/modules/dashboard/partials/resource_time.html';
import * as resourceCharts from 'node/modules/dashboard/resource_charts';
import * as resourceMonitorService from 'node/modules/dashboard/services/resource_monitor';

const poolStateColor = (state) => {
	const value = _.toLower(state || '');
	if (_.includes(['online', 'avail'], value)) {
		return 'green';
	}

	if (_.includes(['degraded', 'inuse'], value)) {
		return 'yellow';
	}

	return 'red';
};

const resourcesMonitorTemplate = _.template(resourcesMonitorPartial);
const cpuTemplate = _.template(resourceCpuPartial);
const memoryTemplate = _.template(resourceMemoryPartial);
const storageSystemTemplate = _.template(resourceStorageSystemPartial);
const storageDataTemplate = _.template(resourceStorageDataPartial);
const networkTemplate = _.template(resourceNetworkPartial);
const timelineTemplate = _.template(resourceTimelinePartial);
const upsTemplate = _.template(resourceUpsPartial);
const timeTemplate = _.template(resourceTimePartial);
const container = document.querySelector('#resources-monitor');

const render = (state) => {
	morphdom(
		container,
		resourcesMonitorTemplate({
			cpu: cpuTemplate({ state }),
			memory: memoryTemplate({ state, prettyBytes }),
			storageSystem: storageSystemTemplate({ state, prettyBytes }),
			storageData: storageDataTemplate({ state, poolStateColor, prettyBytes }),
			network: networkTemplate({ state, prettyBytes }),
			timeline: timelineTemplate({ state }),
			ups: upsTemplate({ state }),
			time: timeTemplate({ state, prettyMilliseconds })
		}),
		{
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('resource-chart') || fromEl.classList.contains('resource-timeline')) {
					return false;
				}

				if (fromEl.classList.contains('details-toggle') || fromEl.classList.contains('collapse')) {
					morphdom(fromEl, toEl, { childrenOnly: true });
					return false;
				}

				return true;
			}
		}
	);
	const networkInterface = _.find(state.system?.networkInterfaces, { default: true });
	resourceCharts.render(state.stats, {
		cpu: 100,
		memory: state.memory?.total,
		network: ((networkInterface?.speed || 1000) * 1_000_000 / 8)
	});
};

resourceMonitorService.subscribe([render]);
