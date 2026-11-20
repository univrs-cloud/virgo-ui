import modulePartial from 'fleet/node_unavailable/partials/index.html';
import nodeUnavailablePartial from 'fleet/node_unavailable/partials/node_unavailable.html';
import errorImage from 'assets/img/illustrations/error.svg';
import * as nodeService from 'fleet/node_unavailable/services/node';

const moduleTemplate = _.template(modulePartial);
const nodeUnavailableTemplate = _.template(nodeUnavailablePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#node-unavailable');
const container = module.querySelector('.no-content');
let nodeId = null;
let reason = null;

const render = (state) => {
	const node = _.find(state.nodes, { nodeId });
	morphdom(
		container,
		nodeUnavailableTemplate({ errorImage, name: (node?.name || 'This node'), reason })
	);
};

const onRoute = (ctx) => {
	nodeId = ctx.params.nodeId;
	reason = (new URLSearchParams(ctx.querystring).get('reason') || document.querySelector('meta[name="node-unavailable"]')?.content || null);
	render({ nodes: nodeService.getNodes() });
};

nodeService.subscribe([render]);

module.onRoute = onRoute;
