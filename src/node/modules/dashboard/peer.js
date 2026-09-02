import peerPartial from 'node/modules/dashboard/partials/peer.html';
import * as peerService from 'node/modules/dashboard/services/peer';

const peerTemplate = _.template(peerPartial);
const container = document.querySelector('#peer');

/** Hidden only when there is nothing to say: nothing adopted and nothing discovered.
 *
 * Adopted and adoptable are shown together — adopting one node does not stop another appearing, and a
 * node that is adopted but no longer advertising is exactly what an operator needs to see. Reachability
 * comes from mDNS rather than a link between the nodes, since avahi already reports a node appearing
 * and disappearing. */
const render = (state) => {
	if (!container) {
		return;
	}

	const system = state.system;
	const adopted = state.peers;
	const discovered = state.discovery;
	morphdom(
		container,
		`<div>${peerTemplate({
			system,
			adopted,
			discovered,
			available: _.reject(discovered, (node) => { return _.some(adopted, { id: node.id }); })
		})}</div>`,
		{ childrenOnly: true }
	);
};

const performActions = (event) => {
	const button = event.target.closest('[data-action]');
	if (!button || !container?.contains(button)) {
		return;
	}

	event.preventDefault();
	const peerId = button.getAttribute('data-peer');
	const actions = {
		adopt: () => { peerService.adoptPeer({ peerId }); },
		remove: async () => {
			if (await confirm(`This node will no longer be adopted. The virtual IP is not affected.`, { buttons: [{ text: 'Remove node', class: 'btn-danger' }] })) {
				peerService.removePeer({ peerId });
			}
		},
		promote: () => { peerService.promoteVirtualIp(); },
		release: () => { peerService.releaseVirtualIp(); }
	};
	actions[button.getAttribute('data-action')]?.();
};

document.addEventListener('click', performActions);
peerService.subscribe([render]);
