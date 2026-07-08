import * as nodeService from 'shell/services/node';

const modules = document.querySelector('main .modules');

const remove = async (event) => {
	const item = event.target.closest('.dropdown-item.confirm[data-action="remove"]');
	if (_.isNull(item)) {
		return;
	}

	event.preventDefault();
	const nodeId = item.dataset.nodeId;
	const node = _.find(nodeService.getNodes() ?? [], { nodeId });
	const name = node?.name ?? nodeId;
	if (!await confirm(`Are you sure you want to remove ${name} from inventory?`, { buttons: [{ text: 'Remove', class: 'btn-danger' }] })) {
		return;
	}

	try {
		const result = await nodeService.deleteNode({ nodeId });
		if (result?.ok) {
			notifier.add({ title: `${name} removed from inventory`, type: 'success' });
		} else {
			notifier.add({ title: result?.error || `Failed to remove ${name} from inventory`, type: 'error', duration: 0 });
		}
	} catch (error) {
		notifier.add({ title: `Failed to remove ${name} from inventory`, type: 'error', duration: 0 });
	}
};

modules.addEventListener('click', remove);
