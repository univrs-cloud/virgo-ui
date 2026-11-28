import Node from 'stores/node';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Node,
			propertyNames: ['nodes']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		const nodes = properties?.nodes || [];
		const [onlineNodes, offlineNodes] = _.partition(nodes, 'online');
		const poolHealths = _.flatMap(onlineNodes, (node) => {
			return _.map(_.filter(node.storage, (pool) => { return _.toLower(pool?.type) === 'pool'; }), (pool) => { return _.toLower(pool.properties?.health?.value); });
		});
		return {
			hasOfflineNode: _.some(offlineNodes, (node) => { return node.update?.state !== 'running'; }),
			isStorageFaulted: _.some(poolHealths, (health) => { return health && health !== 'online' && health !== 'degraded'; }),
			isStorageDegraded: _.includes(poolHealths, 'degraded'),
			isOnBattery: _.some(onlineNodes, (node) => { return _.isObject(node.ups) && !node.ups.error && node.ups.powerSource === 'battery'; }),
			updates: _.map(_.filter(nodes, (node) => { return _.isObject(node.update); }), (node) => {
				return { nodeId: node.nodeId, state: node.update.state };
			}),
			hasUpdates: _.some(nodes, (node) => { return !_.isEmpty(node.updates?.system) || !_.isEmpty(node.updates?.apps); }),
			appUpdateJobIds: _.flatMap(nodes, (node) => { return _.map(node.appUpdateJobs, 'id'); })
		};
	}
});

export {
	subscribe
};
