import modalPartial from 'fleet/profile/partials/modals/recovery_codes.html';
import * as fleetAuthService from 'libs/services/fleet_auth';

document.body.insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#fleet-user-recovery-codes');
const form = modal.querySelector('u-form');
const list = form.querySelector('.recovery-codes');
let codes = [];

const showCodes = () => {
	list.replaceChildren(...codes.map((code) => {
		const item = document.createElement('li');
		item.textContent = code;
		return item;
	}));
	_.each(form.querySelectorAll('.verify'), (element) => { element.classList.add('d-none'); });
	_.each(form.querySelectorAll('.codes'), (element) => { element.classList.remove('d-none'); });
};

const regenerate = async () => {
	const buttons = form.querySelectorAll('.dialog-footer.verify u-button');
	_.each(buttons, (button) => { button.disabled = true; });
	const { code } = form.getData();
	try {
		const result = await fleetAuthService.regenerateRecoveryCodes({ code });
		if (result?.status === 'succeeded') {
			codes = result.recoveryCodes || [];
			showCodes();
			notifier.add({ title: 'New recovery codes generated. Save them somewhere safe and throw away your old ones.', type: 'success' });
		} else {
			notifier.add({ title: result?.message || 'Failed to generate new recovery codes.', type: 'error', duration: 0 });
		}
	} catch (error) {
		notifier.add({ title: error.message || 'Failed to generate new recovery codes.', type: 'error', duration: 0 });
	}
	_.each(buttons, (button) => { button.disabled = false; });
};

const download = () => {
	const blob = new Blob([`${codes.join('\n')}\n`], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = 'virgo-fleet-recovery-codes.txt';
	link.click();
	URL.revokeObjectURL(url);
};

const restore = () => {
	form.reset();
	codes = [];
	list.replaceChildren();
	_.each(form.querySelectorAll('.verify'), (element) => { element.classList.remove('d-none'); });
	_.each(form.querySelectorAll('.codes'), (element) => { element.classList.add('d-none'); });
};

const render = () => {
	form.querySelector('.title-email').textContent = account.email || '';
};

form.validation = [
	{
		selector: '.code',
		rules: {
			isEmpty: `Can't be empty`,
			isLength: {
				min: 6,
				max: 6,
				message: `Must be 6 digits`
			}
		}
	}
];
form.addEventListener('valid', regenerate);
form.querySelector('.download').addEventListener('click', download);
modal.addEventListener('show.bs.dialog', render);
modal.addEventListener('hidden.bs.dialog', restore);
