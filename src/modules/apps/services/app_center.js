import Docker from 'stores/docker';

let callbackCollection = [];
let subscription = null;

const getTemplates = () => {
	return Docker.getTemplates();
};

const install = (config) => {
	Docker.install(config);
};

const handleSubscription = (properties) => {
	let templates = _.orderBy(properties.templates, ['title'], ['asc']);
	templates = _.map(templates, (template) => {
		template.isInstalled = (_.find(properties.containers, (container) => { return _.includes(container.names, `/${template.name}`) }) !== undefined);
		return template;
	});
	_.each(callbackCollection, (callback) => {
		callback({ templates, progress: properties.progress });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	subscription = Docker.subscribeToProperties(['containers', 'templates', 'progress'], handleSubscription);
};

const unsubscribe = () => {
	if (subscription) {
		subscription();
		subscription = null;
	}
};

export {
	subscribe,
	unsubscribe,
	getTemplates,
	install
};
