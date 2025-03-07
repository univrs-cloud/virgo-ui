import modulePartial from 'modules/folders/partials/index.html';
import emptyPartial from 'modules/folders/partials/empty.html';
import folderPartial from 'modules/folders/partials/folder.html';
import * as folderService from 'modules/folders/services/folder';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const folderTemplate = _.template(folderPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#folders');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const performAction = (event) => {
	event.preventDefault();
	let button = event.currentTarget;
	let card = button.closest('.card');
	if (button.classList.contains('text-danger') && !confirm(`Are you sure you want to ${button.dataset.action} ${card.dataset.title}?`)) {
		return;
	}

	let config = {
		id: card.dataset.id,
		action: button.dataset.action
	};
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
		_.each(state.folders, (folder) => {
			template.innerHTML += folderTemplate({ folder, bytes });
		});
	}
	
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');

	_.each(module.querySelectorAll('.dropdown-menu a:not(.disabled)'), (button) => {
		button.addEventListener('click', performAction);
	});
};

render({ folders: folderService.getFolders() });

folderService.subscribe([render]);
