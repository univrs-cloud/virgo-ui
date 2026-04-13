import Docker from 'stores/docker';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Docker,
			propertyNames: ['configured', 'containers', 'imageUpdates']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		if (_.isNull(properties.configured) || _.isNull(properties.containers)) {
			return { apps: null };
		}
		return { apps: composeDashboardApps(properties) };
	},
});

function composeDashboardApps(properties) {
	let apps = _.map(properties.configured, (entity) => {
		if (entity.type === 'app') {
			entity.projectContainers = _.orderBy(
				_.filter(properties.containers, (container) => {
					return container.labels && container.labels['comDockerComposeProject'] === entity.name;
				}),
					['labels.comDockerComposeService'],
					['asc']
			);
			entity.hasUpdates = _.some(properties.imageUpdates, ({ containerId }) => {
				return _.some(entity.projectContainers, (container) => {
					return container.id === containerId;
				});
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
		}
		return entity;
	});
	apps = _.groupBy(apps, 'category');
	return _.pick(apps, _.keys(apps));
}

const performAction = (config) => {
	Docker.performAction(config);
};

const setOrder = (config) => {
	Docker.setOrder(config);
};

export {
	subscribe,
	unsubscribe,
	performAction,
	setOrder
};
