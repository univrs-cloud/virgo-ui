import * as shortcutService from 'node/modules/shortcuts/services/shortcut';

const module = document.querySelector('#shortcuts');

const deleteShortcut = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.item');
	const shortcut = _.find(shortcutService.getShortcuts(), { name: row.dataset.name });

	if (!await confirm(`Are you sure you want to delete the shortcut ${shortcut.title}?`, { buttons: [{ text: 'Yes, delete', class: 'btn-danger' }] })) {
		return;
	}

	const data = {
		name: shortcut.name
	}
	shortcutService.deleteShortcut(data);
};

module.addEventListener('click', deleteShortcut);
