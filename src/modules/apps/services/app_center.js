import Job from 'stores/job'; // need to init store
import Host from 'stores/host';
import Docker from 'stores/docker';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Docker,
	propertyNames: ['containers', 'templates', 'jobs'],
	filters: {
		jobs: isAppInstallJob,
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return { templates: mapTemplates(properties), jobs: properties.jobs };
	},
});

function isAppInstallJob(job) {
	return job?.name === 'app:install';
}

function mapTemplates(properties) {
	let templates = _.orderBy(
		properties.templates,
		[(entity) => { return entity.title.toLowerCase(); }],
		['asc']
	);
	return _.map(templates, (template) => {
		template.isInstalled = (_.find(properties.containers, (container) => {
			return template.name === container.labels?.comDockerComposeProject;
		}) !== undefined);
		return template;
	});
}

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isAppInstallJob);
};

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

export {
	subscribe,
	unsubscribe,
	getJobs,
	getFQDN,
	getTemplates,
	install
};
