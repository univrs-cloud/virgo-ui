import * as nodeService from 'fleet/sites/services/node';

const module = document.querySelector('#sites');

const remove = async (event) => {
	if (
		!event.target.closest('a')?.classList?.contains('dropdown-item') ||
		event.target.closest('a')?.dataset.action !== 'remove'
	) {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const nodeId = button.dataset.nodeId;
	const node = _.find(nodeService.getNodes() ?? [], { nodeId });
	const name = node?.name ?? nodeId;

	const releasesDomain = Boolean(node?.fqdn) && !node?.online;
	const message = (releasesDomain
		? `${name} is offline. Removing it releases ${node.fqdn}, so anyone can claim it. If the node comes back online, its certificates stop renewing until it is registered with the fleet again from its settings.`
		: `Are you sure you want to remove ${name} from inventory?`);
	if (
		button.classList.contains('confirm') &&
		!await confirm(message, { buttons: [{ text: 'Remove', class: 'btn-danger' }], acknowledge: (releasesDomain ? `I understand ${node.fqdn} will be released` : null) })
	) {
		return;
	}

	try {
		const result = await nodeService.deleteNode({ nodeId });
		if (result?.status === 'succeeded') {
			notifier.add({ title: `${name} removed from inventory.`, type: 'success' });
		} else {
			notifier.add({ title: result?.message || `Failed to remove ${name} from inventory.`, type: 'error', duration: 0 });
		}
	} catch (error) {
		notifier.add({ title: `Failed to remove ${name} from inventory.`, type: 'error', duration: 0 });
	}
};

module.addEventListener('click', remove);
