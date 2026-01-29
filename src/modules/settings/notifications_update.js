import notificationModalPartial from 'modules/settings/partials/modals/notifications.html';
import * as configurationService from 'modules/settings/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', notificationModalPartial);

const modal = document.querySelector('#smtp');
const form = modal.closest('u-form');

const updateSmtp = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let config = form.getData();
	config.recipients = _.compact(_.split(_.trim(config.recipients), ','));
	configurationService.updateSmtp(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

const render = (event) => {
	const configuration = configurationService.getConfiguration();
	const encryption = configuration?.smtp?.encryption || '';
	form.querySelector(`.encryption[value="${encryption}"]`).checked = true;
	form.querySelector('.address').value = configuration?.smtp?.address || '';
	form.querySelector('.port').value = configuration?.smtp?.port || '';
	form.querySelector('.username').value = configuration?.smtp?.username || '';
	form.querySelector('.password').value = configuration?.smtp?.password || '';
	form.querySelector('.sender').value = configuration?.smtp?.sender || '';
	form.querySelector('.recipients').tags = configuration?.smtp?.recipients || [];
};

form.validation = [
	{
		selector: '.address',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.port',
		rules: {
			isEmpty: `Can't be empty`,
			isPort: `Between 0 and 65535`
		}
	},
	{
		selector: '.sender',
		rules: {
			isEmpty: `Can't be empty`,
			isEmail: `Invalid email address`
		}
	}
];
form.addEventListener('valid', updateSmtp);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
