import Host from 'stores/host';
import Docker from 'stores/docker';
import Job from 'stores/job';

let callbackCollection = [];

const getFQDN = () => {
	const system = Host.getSystem();
	return system.osInfo.fqdn;
};

const getTemplates = () => {
	return Docker.getTemplates();
};

const install = (config) => {
	Docker.install(config);
};

const handleSubscription = (properties) => {
	let templates = _.orderBy(
		properties.templates,
		[(entity) => { return entity.title.toLowerCase(); }],
		['asc']
	);
	templates = _.map(templates, (template) => {
		template.isInstalled = (_.find(properties.containers, (container) => { return _.includes(container.names, `/${template.name}`) }) !== undefined);
		return template;
	});
	_.each(callbackCollection, (callback) => {
		callback({ templates, jobs: properties.jobs });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	return  Docker.subscribeToProperties(['containers', 'templates', 'jobs'], handleSubscription);
};

const unsubscribe = (subscription) => {
	if (subscription) {
		subscription();
	}
};

export {
	subscribe,
	unsubscribe,
	getFQDN,
	getTemplates,
	install
};
