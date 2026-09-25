import identifierModalPartial from 'node/modules/network/partials/modals/identifier.html';
import * as networkService from 'node/modules/network/services/network';

const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const FLEET_ZONE = 'univrs.cloud';
const RESERVED_CLUSTER_NAMES = ['fleet', 'apps', 'packages', 'www', 'api', 'auth', 'admin', 'mail', 'smtp', 'imap', 'ns', 'ns1', 'ns2', 'mx', 'traefik', 'status', 'docs', 'blog', 'cdn', 'static'];
const RESERVED_NODE_NAMES = ['analytics', 'auth', 'autoconfig', 'autodiscover', 'dockhand', 'euro-office', 'gitea', 'mail', 'nextcloud', 'pihole', 'rspamd', 'talk', 'terminal', 'torrent', 'traefik', 'vpn'];

document.querySelector('body').insertAdjacentHTML('beforeend', identifierModalPartial);

const modal = document.querySelector('#network-identifier');
const form = modal.querySelector('u-form');

const splitDomainName = (domainName) => {
	const labels = _.split(domainName || '', '.');
	if (labels.length < 3) {
		return { cluster: '', domainName: domainName || '' };
	}

	return { cluster: _.head(labels), domainName: _.join(_.tail(labels), '.') };
};

const currentIdentifier = () => {
	const system = networkService.getSystem();
	return { hostname: system?.osInfo?.hostname, ...splitDomainName(_.replace(system?.osInfo?.fqdn, `${system?.osInfo?.hostname}.`, '')) };
};

const lockedCluster = () => {
	const { cluster, domainName } = currentIdentifier();
	return (cluster && !_.isEmpty(networkService.getPeers()) ? { cluster, domainName } : null);
};

const getFormData = () => {
	return { ...form.getData(), ...(lockedCluster() || {}) };
};

const updateIdentifier = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	networkService.updateHostIdentifier(getFormData());
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const { hostname, cluster, domainName } = currentIdentifier();
	const locked = Boolean(lockedCluster());
	const clusterInput = form.querySelector('.cluster');
	form.querySelector('.hostname').value = hostname;
	clusterInput.value = cluster;
	form.querySelector('.domain-name').value = domainName;
	clusterInput.disabled = locked;
	form.querySelector('.domain-name').disabled = locked;
	clusterInput.tip = (locked ? `Shared with <strong>${_.join(_.map(networkService.getPeers(), (peer) => { return peer.name || peer.address; }), ', ')}</strong>. Remove the adopted nodes to change the cluster.` : '');
};

const restore = (event) => {
	form.reset();
	form.querySelector('.cluster').disabled = false;
	form.querySelector('.domain-name').disabled = false;
	form.querySelector('.cluster').tip = '';
};

form.validation = [
	{
		selector: '.hostname',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => {
					if (!HOSTNAME_PATTERN.test(value)) {
						return 'Letters, digits and hyphens only';
					}

					return (!_.includes(RESERVED_NODE_NAMES, _.toLower(value)) || 'Used by an app, choose another hostname');
				},
				message: 'Letters, digits and hyphens only'
			}
		}
	},
	{
		selector: '.cluster',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => {
					if (!HOSTNAME_PATTERN.test(value)) {
						return 'Letters, digits and hyphens only';
					}

					const isFleetZone = (_.toLower(_.trim(getFormData().domainName)) === FLEET_ZONE);
					return (!isFleetZone || !_.includes(RESERVED_CLUSTER_NAMES, _.toLower(value)) || `${value}.${FLEET_ZONE} is already taken`);
				},
				message: 'Letters, digits and hyphens only'
			}
		}
	},
	{
		selector: '.domain-name',
		rules: {
			isEmpty: `Can't be empty`,
			isFQDN: { message: 'Must be a domain with a TLD, like example.com' },
			custom: {
				validate: (value) => {
					return !_.endsWith(_.toLower(_.trim(value)), `.${FLEET_ZONE}`);
				},
				message: `Use ${FLEET_ZONE} itself, without a sub-domain`
			}
		}
	}
];
form.addEventListener('valid', updateIdentifier);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
