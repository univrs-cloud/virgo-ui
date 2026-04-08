import Share from 'stores/share';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Share,
	propertyNames: ['shares'],
	mapState: (properties) => ({
		shares: _.orderBy(
			properties.shares || [],
			[(entity) => { return entity.comment.toLowerCase(); }],
			['asc']
		),
	}),
	attachStore: storeAttach.beforeCallbacks,
});

export {
	subscribe,
	unsubscribe
};
