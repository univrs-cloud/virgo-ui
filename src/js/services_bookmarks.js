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
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'productivity',
		name: 'NextCloud',
		icon: '/assets/img/apps/nextcloud.png',
		url: 'https://nextcloud.origin.univrs.cloud'
	},
	{
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'productivity',
		name: 'qBittorrent',
		icon: '/assets/img/apps/qbittorrent.png',
		url: 'https://torrent.origin.univrs.cloud'
	},
	{
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'Terminal',
		icon: '/assets/img/apps/terminal.png',
		url: 'https://terminal.origin.univrs.cloud/wetty'
	},
	{
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'PiHole',
		icon: '/assets/img/apps/pihole.png',
		url: 'https://pihole.origin.univrs.cloud/admin/'
	},
	{
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'WireGuard',
		icon: '/assets/img/apps/wireguard.png',
		url: 'https://vpn.origin.univrs.cloud'
	},
	{
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'Proxy Manager',
		icon: '/assets/img/apps/nginx-proxy-manager.png',
		url: 'https://proxy.origin.univrs.cloud'
	},
	{
		type: 'service',
		canBeRemoved: true,
		status: 'exited',
		category: 'networking',
		name: 'DDclient',
		icon: '/assets/img/apps/ddns-updater.png',
		url: ''
	},
	{
		type: 'bookmark',
		canBeRemoved: true,
		status: 'running',
		category: 'networking',
		name: 'Dream Machine Pro',
		icon: '/assets/img/apps/ubiquiti.png',
		url: 'https://192.168.100.1'
	},
	{
		type: 'service',
		canBeRemoved: false,
		status: 'running',
		category: 'system',
		name: 'Portainer',
		icon: '/assets/img/apps/portainer-alt.png',
		url: 'https://portainer.origin.univrs.cloud'
	},
	{
		type: 'service',
		canBeRemoved: true,
		status: 'running',
		category: 'system',
		name: 'Authelia',
		icon: '/assets/img/apps/authelia.png',
		url: 'https://auth.origin.univrs.cloud'
	},
	{
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
_.each(categories, (cat) => {
	let collection = _.filter(configuration, { category: cat.id });
	container.insertAdjacentHTML('beforeend', categoryPartial);
	let category = container.querySelector('.item:last-child');
	category.querySelector('h5').innerHTML = cat.name;
	_.each(collection, (entity) => {
		if (entity.type === 'service') {
			let template = _.template(servicePartial);
			category.insertAdjacentHTML('beforeend', template({ service: entity }));
		}
		if (entity.type === 'bookmark') {
			let template = _.template(bookmarkPartial);
			category.insertAdjacentHTML('beforeend', template({ bookmark: entity }));
		}
	});
});
