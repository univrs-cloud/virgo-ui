import Job from 'stores/job';
import Node from 'stores/node';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
        {
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Node,
			propertyNames: ['nodes']
		}
	],
	filters: {
		jobs: isNodesJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

function isNodesJob(job) {
	return _.startsWith(job?.name, 'fleet:node');
}

const getNodes = () => {
	return Node.getNodes();
};

export {
	subscribe,
	getNodes
};
