import Configuration from 'js/stores/configuration';
import { map, distinctUntilChanged } from 'rxjs/operators';

let callbackCollection = [];

const getConfiguration = () => {
	return Configuration.getConfiguration();
};

const setLocation = (config) => {
	Configuration.setLocation(config);
};

const handleSubscription = (updatedProperties) => {
	_.each(callbackCollection, (callback) => {
		callback(updatedProperties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Configuration.subscribeToProperties(['configuration'], handleSubscription);
};

export {
	subscribe,
	getConfiguration,
	setLocation
};
