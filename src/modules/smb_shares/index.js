import modulePartial from 'modules/smb_shares/partials/index.html';
import emptyPartial from 'modules/smb_shares/partials/empty.html';
import smbSharePartial from 'modules/smb_shares/partials/smb_share.html';
import * as smbShareService from 'modules/smb_shares/services/smb_share';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const smbShareTemplate = _.template(smbSharePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#smb-shares');
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
	// smbShareService.performAction(config);
};

const render = (state) => {
	if (_.isNull(state.smbShares)) {
		return;
	}
	
	let template = document.createElement('template');
	if (_.isEmpty(state.smbShares)) {
		template.innerHTML = emptyTemplate();
	} else {
		_.each(state.smbShares, (smbShare) => {
			template.innerHTML += smbShareTemplate({ smbShare });
		});
	}
	loading.classList.add('d-none');
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);
	_.each(module.querySelectorAll('.dropdown-menu a:not(.disabled)'), (button) => {
		button.addEventListener('click', performAction);
	});
};

render({ smbShares: smbShareService.getShares() });

smbShareService.subscribe([render]);
