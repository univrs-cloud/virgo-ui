import Docker from 'stores/docker';

let callbackCollection = [];

const install = (config) => {
	Docker.install(config);
};

const handleSubscription = (properties) => {
	let templates = _.orderBy(properties.templates, ['title'], ['asc']);
	_.each(callbackCollection, (callback) => {
		callback({ templates });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Docker.subscribeToProperties(['templates'], handleSubscription);
};

export {
	subscribe,
	install
};
