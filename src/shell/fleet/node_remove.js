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

	nodeService.deleteNode({ nodeId });
};

modules.addEventListener('click', remove);
