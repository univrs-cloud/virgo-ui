import Job from 'stores/job';
import Docker from 'stores/docker';
import Host from 'stores/host';
import Indexer from 'stores/indexer';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Docker,
			propertyNames: ['configured', 'containers', 'imageUpdates', 'appsResourceMetrics']
		},
		{
			store: Host,
			propertyNames: ['snapshots']
		},
		{
			store: Indexer,
			propertyNames: ['indexerDatasets']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isAppModuleJob,
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			apps: composeApps(properties.configured, properties.containers, properties.appsResourceMetrics, properties.imageUpdates, properties.snapshots, properties.indexerDatasets),
			jobs: properties.jobs,
		};
	},
});

function isAppModuleJob(job) {
	return job?.name && _.startsWith(job.name, 'app');
}

function composeApps(configured, containers, appsResourceMetrics, imageUpdates, snapshots, indexerDatasets) {
	if (_.isNull(configured) || _.isNull(containers)) {
		return null;
	}

	return _.map(
		_.orderBy(
			_.filter(configured, { type: 'app' }),
			[(entity) => { return entity.title.toLowerCase(); }],
			['asc']
		),
		(entity) => {
			entity.projectContainers = _.orderBy(
				_.filter(containers, (container) => {
					return container.labels && container.labels['comDockerComposeProject'] === entity.name;
				}),
					['labels.comDockerComposeService'],
					['asc']
			);
			entity.hasUpdates = _.some(imageUpdates, ({ containerId }) => {
				return _.some(entity.projectContainers, (container) => {
					return container.id === containerId;
				});
			});
			entity.projectContainers = _.map(entity.projectContainers, (container) => {
				container.hasUpdates = !_.isEmpty(_.filter(imageUpdates, { containerId: container.id }));
				return container;
			});
			let activeCount = _.size(_.filter(entity.projectContainers, (container) => { return _.includes(['running', 'restarting'], container.state); }));
			if (activeCount === _.size(entity.projectContainers)) {
				entity.state = 'success'; // All containers are running or restarting
			} else if (activeCount === 0) {
				entity.state = 'danger'; // No containers are running or restarting
			} else {
				entity.state = 'warning'; // Some containers are running/restarting, others are not
			}
			entity.urls = Docker.composeUrlFromLabels(entity.projectContainers);
			entity.resourceMetrics = _.find(appsResourceMetrics, { name: entity.name });
			entity.snapshots = _.filter(_.values(snapshots), (snapshot) => {
				return snapshot.dataset === entity.dataset;
			});
			entity.indexer = _.isArray(indexerDatasets) && _.includes(indexerDatasets, entity.dataset);
			return entity;
		});
}

const getSocket = () => {
	return Docker.socket;
};

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isAppModuleJob);
};

const getApps = () => {
	return composeApps(Docker.getConfigured(), Docker.getContainers(), Docker.getAppsResourceMetrics(), Docker.getImageUpdates(), Host.getSnapshots(), Indexer.getDatasets());
};

const update = (config) => {
	Docker.update(config);
};

const performAppAction = (config) => {
	Docker.performAppAction(config);
};

const performServiceAction = (config) => {
	Docker.performServiceAction(config);
};

const updateIndexerConfig = (config) => {
	Indexer.updateDatasets(config);
};

export {
	subscribe,
	unsubscribe,
	getSocket,
	getJobs,
	getApps,
	update,
	performAppAction,
	performServiceAction,
	updateIndexerConfig
};
