import notificationModalPartial from 'modules/settings/partials/modals/notifications.html';
import * as configurationService from 'modules/settings/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', notificationModalPartial);

const modal = document.querySelector('#smtp');
const form = modal.closest('u-form');

const updateSmtp = (event) => {
	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	
	let config = form.getData();
	config.recipients = _.compact(_.split(_.trim(config.recipients), '\n'));
	
	configurationService.updateSmtp(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
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
	form.querySelector('.recipients').value = configuration?.smtp?.recipients?.join('\n') || '';
};

// form.querySelector('.address').addEventListener('input', validateAddress);
// form.querySelector('.port').addEventListener('input', validatePort);
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
			isEmpty: `Can't be empty`
		}
	}
];
form.addEventListener('valid', updateSmtp);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
