import modulePartial from 'modules/folders/partials/index.html';
import emptyPartial from 'modules/folders/partials/empty.html';
import folderPartial from 'modules/folders/partials/folder.html';
import * as folderService from 'modules/folders/services/folder';
import copy from 'copy-to-clipboard';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const folderTemplate = _.template(folderPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#folders');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const copyToClipboard = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'copy-to-clipboard') {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const text = button.nextElementSibling.innerHTML;
	if (copy(text)) {
		const tooltip = bootstrap.Tooltip.getInstance(button);
		const originalTitle = button.dataset.bsOriginalTitle;
		tooltip.setContent({ '.tooltip-inner': 'Copied!' });
		setTimeout(() => {
			tooltip.hide();
			tooltip.setContent({ '.tooltip-inner': originalTitle });
		}, 1000);
	}
};

const remove = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}

	if (event.target.closest('a')?.classList.contains('disabled')) {
		return;
	}
	
	event.preventDefault();
	const button = event.target.closest('a');
	const folder = button.closest('.folder');
	if (!await confirm(`Are you sure you want to delete ${folder.dataset.title}?`, { buttons: [{ text: 'Delete', class: 'btn-danger' }] })) {
		return;
	}

	// let config = {
	// 	id: folder.dataset.id,
	// 	action: button.dataset.action
	// };
	// folderService.performAction(config);	
};

const render = (state) => {
	if (_.isNull(state.folders)) {
		return;
	}
	
	const template = document.createElement('template');
	if (_.isEmpty(state.folders)) {
		template.innerHTML = emptyTemplate();
	} else {
		const networkInterface = state.networkInterface;
		_.each(state.folders, (folder) => {
			template.innerHTML += folderTemplate({ folder, networkInterface, prettyBytes });
		});
	}
	
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

module.addEventListener('click', copyToClipboard);
module.addEventListener('click', remove);

folderService.subscribe([render]);
