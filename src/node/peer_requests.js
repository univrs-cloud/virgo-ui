import * as peerRequestsService from 'node/services/peer_requests';

const toasts = new Map();

const answer = (requestId, action) => {
	toasts.get(requestId)?.remove();
	toasts.delete(requestId);
	action({ requestId });
};

const render = (state) => {
	if (!_.isArray(state.peerRequests)) {
		return;
	}

	const waiting = _.map(state.peerRequests, 'id');
	toasts.forEach((toast, requestId) => {
		if (!_.includes(waiting, requestId)) {
			toast.remove();
			toasts.delete(requestId);
		}
	});

	_.each(state.peerRequests, (request) => {
		if (toasts.has(request.id)) {
			return;
		}

		toasts.set(request.id, notifier.add({
			title: `${_.escape(request.name)} wants this node to keep its backups.`,
			message: `<div>The request comes from ${_.escape(request.address)}.</div><div class="d-flex flex-wrap gap-2 mt-3"><u-button type="button" size="sm" click="accept">Accept</u-button><u-button type="button" variant="secondary" size="sm" click="deny" outline>Deny</u-button><u-button type="button" variant="danger" size="sm" click="block" outline>Block</u-button></div>`,
			type: 'neutral',
			duration: 0,
			dismissible: false,
			callbacks: {
				accept: () => { answer(request.id, peerRequestsService.acceptPeerRequest); },
				deny: () => { answer(request.id, peerRequestsService.denyPeerRequest); },
				block: () => { answer(request.id, peerRequestsService.blockPeerRequest); }
			}
		}));
	});
};

peerRequestsService.subscribe([render]);
