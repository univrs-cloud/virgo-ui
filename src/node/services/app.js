import Docker from 'stores/docker';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe: subscribeToAppUpdates } = createSubscription({
	stores: [
		{
			store: Docker,
			propertyNames: ['containers', 'imageUpdates']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return {
			hasAppUpdates: _.some(properties?.containers, (container) => { return _.some(properties?.imageUpdates, { containerId: container.id }); })
		};
	}
});

export {
	subscribeToAppUpdates
};
