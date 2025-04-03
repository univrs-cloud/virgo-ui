import modulePartial from 'modules/folders/partials/index.html';
import emptyPartial from 'modules/folders/partials/empty.html';
import folderPartial from 'modules/folders/partials/folder.html';
import * as folderService from 'modules/folders/services/folder';
import copy from 'copy-to-clipboard';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const folderTemplate = _.template(folderPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#folders');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const copyToClipboard = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'copy-to-clipboard') {
		return;
	}

	event.preventDefault();
	let button = event.target.closest('a');
	let text = button.nextElementSibling.innerHTML;
	if (copy(text)) {
		let tooltip = bootstrap.Tooltip.getInstance(button);
		let originalTitle = button.dataset.bsOriginalTitle;
		tooltip.setContent({ '.tooltip-inner': 'Copied!' });
		setTimeout(() => {
			tooltip.hide();
			tooltip.setContent({ '.tooltip-inner': originalTitle });
		}, 1000);
	}
};

const remove = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'remove') {
		return;
	}

	if (event.target.closest('a').classList.contains('disabled')) {
		event.preventDefault();
		return;
	}
	
	event.preventDefault();
	let button = event.target.closest('a');
	let folder = button.closest('.folder');
	if (!confirm(`Are you sure you want to ${button.dataset.action} ${folder.dataset.title}?`)) {
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
	
	let template = document.createElement('template');
	if (_.isEmpty(state.folders)) {
		template.innerHTML = emptyTemplate();
	} else {
		let networkInterface = state.networkInterface;
		_.each(state.folders, (folder) => {
			template.innerHTML += folderTemplate({ folder, networkInterface, bytes });
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

render({ folders: folderService.getFolders(), networkInterface: folderService.getSystem().networkInterface, bytes });

folderService.subscribe([render]);

module.addEventListener('click', copyToClipboard);
module.addEventListener('click', remove);
