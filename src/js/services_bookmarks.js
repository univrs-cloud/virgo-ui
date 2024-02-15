import categoryPartial from '../partials/category.html';
import servicePartial from '../partials/service.html';
import bookmarkPartial from '../partials/bookmark.html';

const categories = [
	{
		id: 'productivity',
		name: 'Productivity'
	},
	{
		id: 'networking',
		name: 'Networking'
	},
	{
		id: 'system',
		name: 'System'
	}
];

const configuration = [
	{
		id: 'nextcloud',
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'productivity',
		name: 'NextCloud',
		icon: '/assets/img/apps/nextcloud.png',
		url: 'https://nextcloud.origin.univrs.cloud'
	},
	{
		id: 'qbittorrent',
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'productivity',
		name: 'qBittorrent',
		icon: '/assets/img/apps/qbittorrent.png',
		url: 'https://torrent.origin.univrs.cloud'
	},
	{
		id: 'wetty',
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'Terminal',
		icon: '/assets/img/apps/terminal.png',
		url: 'https://terminal.origin.univrs.cloud/wetty'
	},
	{
		id: 'pihole',
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'PiHole',
		icon: '/assets/img/apps/pihole.png',
		url: 'https://pihole.origin.univrs.cloud/admin/'
	},
	{
		id: 'wireguard',
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'WireGuard',
		icon: '/assets/img/apps/wireguard.png',
		url: 'https://vpn.origin.univrs.cloud'
	},
	{
		id: 'nginx-proxy-manager',
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'Proxy Manager',
		icon: '/assets/img/apps/nginx-proxy-manager.png',
		url: 'https://proxy.origin.univrs.cloud'
	},
	{
		id: 'ddclient',
		type: 'service',
		canBeRemoved: true,
		status: 'exited',
		category: 'networking',
		name: 'DDclient',
		icon: '/assets/img/apps/ddns-updater.png',
		url: ''
	},
	{
		id: 'dream-machine-pro',
		type: 'bookmark',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'Dream Machine Pro',
		icon: '/assets/img/apps/ubiquiti.png',
		url: 'https://192.168.100.1'
	},
	{
		id: 'portainer',
		type: 'service',
		canBeRemoved: false,
		status: 'running',
		category: 'system',
		name: 'Portainer',
		icon: '/assets/img/apps/portainer-alt.png',
		url: 'https://portainer.origin.univrs.cloud'
	},
	{
		id: 'authelia',
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'system',
		name: 'Authelia',
		icon: '/assets/img/apps/authelia.png',
		url: 'https://auth.origin.univrs.cloud'
	},
	{
		id: 'watchtower',
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'system',
		name: 'Watchtower',
		icon: '/assets/img/apps/watchtower.png',
		url: ''
	}
];

let container = document.querySelector('main > .container > .row');
_.each(_.reverse(categories), (cat) => {
	let collection = _.filter(configuration, { category: cat.id });
	container.insertAdjacentHTML('afterbegin', _.template(categoryPartial)({ name: cat.name }));
	let category = container.querySelector('.item:first-child');
	_.each(collection, (entity) => {
		if (entity.type === 'service') {
			const template = _.template(servicePartial);
			category.insertAdjacentHTML('beforeend', template({ ...entity }));
		}
		if (entity.type === 'bookmark') {
			const template = _.template(bookmarkPartial);
			category.insertAdjacentHTML('beforeend', template({ ...entity }));
		}
	});
});
