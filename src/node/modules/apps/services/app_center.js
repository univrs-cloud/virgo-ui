import Job from 'stores/job'; // need to init store
import Host from 'stores/host';
import Docker from 'stores/docker';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Docker,
			propertyNames: ['containers', 'templates']
		}
	],
	filters: {
		jobs: isAppInstallJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			templates: mapTemplates(properties),
			jobs: properties?.jobs || []
		};
	}
});

function isAppInstallJob(job) {
	return _.startsWith(job?.name, 'app:install');
}

function isInstallable(template) {
	return template.multiple !== true || _.some(template.env, (env) => { return env?.name?.toLowerCase() === 'instance'; });
}

function mapTemplates(properties) {
	let templates = _.orderBy(
		_.filter(properties?.templates, isInstallable),
		[(entity) => { return entity.title.toLowerCase(); }],
		['asc']
	);
	return _.map(templates, (template) => {
		template.isInstalled = (template.multiple !== true && _.find(properties?.containers, (container) => {
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
	return system.osInfo?.fqdn || '';
};

const getDomainName = () => {
	return _.replace(getFQDN(), `${Host.getSystem().osInfo?.hostname}.`, '');
};

const getCertresolver = () => {
	return Host.getCertificate()?.resolver;
};

const getTemplates = () => {
	return Docker.getTemplates();
};

const getApps = () => {
	return _.filter(Docker.getConfigured(), { type: 'app' });
};

const install = (data) => {
	Docker.install(data);
};

export {
	subscribe,
	getJobs,
	getFQDN,
	getDomainName,
	getCertresolver,
	getTemplates,
	getApps,
	install
};
