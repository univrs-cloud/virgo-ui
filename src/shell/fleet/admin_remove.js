import * as nodeService from 'shell/services/node';

const module = document.querySelector('#fleet');

const revoke = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'revoke') {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const nodeId = button.dataset.nodeId;
	const email = button.dataset.email;

	if (
		button.classList.contains('confirm') &&
		!await confirm(`Are you sure you want to remove access for ${email}?`, { buttons: [{ text: 'Remove', class: 'btn-danger' }] })
	) {
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

const revokeGroup = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'revoke-group') {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const nodeId = button.dataset.nodeId;
	const groupId = button.dataset.groupId;
	const groupName = button.dataset.groupName;

	if (
		button.classList.contains('confirm') &&
		!await confirm(`Are you sure you want to revoke access for group ${groupName}?`, { buttons: [{ text: 'Revoke', class: 'btn-danger' }] })
	) {
		return;
	}

	try {
		const result = await nodeService.revokeGroup({ nodeId, groupId });
		if (result?.status === 'succeeded') {
			notifier.add({ title: `Access removed for group ${groupName}.`, type: 'success' });
		} else {
			notifier.add({ title: result?.message || `Failed to remove access for group ${groupName}.`, type: 'error', duration: 0 });
		}
	} catch (error) {
		notifier.add({ title: `Failed to remove access for group ${groupName}.`, type: 'error', duration: 0 });
	}
};

// Keep the invited-admins dropdown open when clicking a row; only the action control (which
// bubbles through) should let Bootstrap close it.
const keepOpen = (event) => {
	if (event.target.closest('li') && !event.target.closest('[data-action]')) {
		event.stopPropagation();
	}
};

module.addEventListener('click', keepOpen);
module.addEventListener('click', revoke);
module.addEventListener('click', revokeGroup);
