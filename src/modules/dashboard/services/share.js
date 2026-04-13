import Share from 'stores/share';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Share,
			propertyNames: ['shares']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => ({
		shares: _.orderBy(
			properties.shares || [],
			[(entity) => { return entity.comment.toLowerCase(); }],
			['asc']
		),
	}),
});

export {
	subscribe
};
