import * as snapshotRuleService from 'node/modules/snapshot_rules/services/snapshot_rule';

const module = document.querySelector('#snapshot-rules');

const deleteRule = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}

	event.preventDefault();
	const name = event.target.closest('.item').dataset.name;
	if (!await confirm(`Are you sure you want to delete the snapshot rule ${_.escape(name)}?`, { buttons: [{ text: 'Yes, delete', class: 'btn-solid theme-danger' }] })) {
		return;
	}

	snapshotRuleService.deleteRule({ name });
};

module.addEventListener('click', deleteRule);
