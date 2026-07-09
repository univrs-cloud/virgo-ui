import * as nodeService from 'shell/services/node';

const modules = document.querySelector('main .modules');

const revoke = async (event) => {
	const button = event.target.closest('[data-action="revoke"]');
	if (_.isNull(button)) {
		return;
	}

	event.preventDefault();
	const nodeId = button.dataset.nodeId;
	const email = button.dataset.email;
	if (!await confirm(`Are you sure you want to remove access for ${email}?`, { buttons: [{ text: 'Remove', class: 'btn-danger' }] })) {
		return;
	}

	try {
		const result = await nodeService.revokeAdmin({ nodeId, email });
		if (result?.status === 'succeeded') {
			notifier.add({ title: `Access removed for ${email}.`, type: 'success' });
		} else {
			notifier.add({ title: result?.message || `Failed to remove access for ${email}.`, type: 'error', duration: 0 });
		}
	} catch (error) {
		notifier.add({ title: `Failed to remove access for ${email}.`, type: 'error', duration: 0 });
	}
};

modules.addEventListener('click', revoke);
