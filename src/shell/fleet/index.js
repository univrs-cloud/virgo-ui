import headerPartial from 'shell/partials/fleet/header.html';
import mainPartial from 'shell/partials/main.html';
import fleetPartial from 'shell/partials/fleet/fleet.html';
import nodePartial from 'shell/partials/fleet/node.html';
import * as nodeService from 'shell/services/node';

const header = document.querySelector('header');
const container = document.querySelector('main');
const headerTemplate = _.template(headerPartial);
const mainTemplate = _.template(mainPartial);
const fleetTemplate = _.template(fleetPartial);
const nodeTemplate = _.template(nodePartial);

const signOut = async (event) => {
	if (!event.target.closest('a')?.classList.contains('sign-out')) {
		return;
	}

	event.preventDefault();
	await fetch('/auth/logout', { method: 'POST' });
	window.location.reload();
};

morphdom(
	header,
	headerTemplate()
);
morphdom(
	container,
	mainTemplate()
);

const modules = container.querySelector('.modules');

const render = (state) => {
	const nodes = _.isNull(state.nodes)
		? null
		: _.orderBy(state.nodes, [(node) => { return String(node.name ?? '').toLowerCase(); }], ['asc']);
	morphdom(
		modules,
		`<div>${fleetTemplate({ nodes, nodeTemplate })}</div>`,
		{ childrenOnly: true }
	);
};

header.addEventListener('click', signOut);

render({ nodes: null });
nodeService.subscribe([render]);
setInterval(() => render({ nodes: nodeService.getNodes() }), 60000);

import('shell/fleet/admin_add');
import('shell/fleet/node_remove');
