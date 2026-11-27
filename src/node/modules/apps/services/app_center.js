import Job from 'stores/job'; // need to init store
import Host from 'stores/host';
import Docker from 'stores/docker';
import Shortcut from 'stores/shortcut';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';
import { getPortConflictTip } from 'node/modules/apps/services/port_conflicts';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Docker,
			propertyNames: ['configured', 'containers', 'templates']
		},
		{
			store: Host,
			propertyNames: ['system']
		}
	],
	filters: {
		jobs: isAppInstallJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			templates: mapTemplates(properties),
			jobs: properties?.jobs || [],
			isVirtualIpHolder: Boolean(properties?.system?.virtualIp?.holding)
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
	const templates = _.filter(properties?.templates, isInstallable);
	const cards = _.flatMap(templates, (template) => {
		template.portConflictTip = getPortConflictTip(template.ports, properties?.containers, properties?.configured, null, 'installing this app');
		if (template.multiple !== true) {
			template.isInstalled = (_.find(properties?.containers, (container) => {
				return template.name === container.labels?.comDockerComposeProject;
			}) !== undefined);
			template.instances = 0;
			return [template];
		}

		const instances = _.filter(properties?.configured, (app) => {
			const name = app.name?.toLowerCase();
			return app.type === 'app' && _.startsWith(name, `${template.name.toLowerCase()}-`) && !_.some(templates, (other) => { return other.name.toLowerCase() === name; });
		});
		template.isInstalled = false;
		template.instances = _.size(instances);
		return [
			template,
			..._.map(instances, (app) => {
				return { ...template, name: app.name, title: app.title || template.title, isInstalled: true };
			})
		];
	});
	return _.orderBy(
		cards,
		[(entity) => { return entity.title.toLowerCase(); }],
		['asc']
	);
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

const getContainers = () => {
	return Docker.getContainers();
};

const getSnapshotRules = () => {
	return Host.getSnapshotRules();
};

const getShortcuts = () => {
	return Shortcut.getConfigured();
};

const install = (data) => {
	Docker.install(data);
};

const installCustom = (data) => {
	Docker.installCustom(data);
};

const update = (data) => {
	Docker.update(data);
};

const updateCustom = (data) => {
	Docker.updateCustom(data);
};

export {
	subscribe,
	getJobs,
	getFQDN,
	getDomainName,
	getCertresolver,
	getTemplates,
	getApps,
	getContainers,
	getShortcuts,
	getSnapshotRules,
	install,
	installCustom,
	update,
	updateCustom
};
