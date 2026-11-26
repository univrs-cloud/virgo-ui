import QRCode from 'qrcode';
import modalPartial from 'fleet/profile/partials/modals/authenticator.html';
import * as fleetAuthService from 'libs/services/fleet_auth';

document.body.insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#fleet-user-authenticator');
const form = modal.querySelector('u-form');
const list = form.querySelector('.recovery-codes');
const steps = ['password-step', 'scan-step', 'codes-step'];
const validations = {
	'password-step': [
		{
			selector: '.password',
			rules: {
				isEmpty: `Can't be empty`
			}
		}
	],
	'scan-step': [
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
	],
	'codes-step': []
};
let step = 'password-step';
let codes = [];

const showStep = (name) => {
	step = name;
	_.each(steps, (stepName) => {
		_.each(form.querySelectorAll(`.${stepName}`), (element) => { element.classList.toggle('d-none', stepName !== name); });
	});
	form.validation = validations[name];
};

const begin = async () => {
	const { password } = form.getData();
	const result = await fleetAuthService.authenticatorChange({ password });
	if (result?.status !== 'succeeded') {
		throw new Error(result?.message || 'Failed to start setting up the new app.');
	}
	form.querySelector('.qr').src = await QRCode.toDataURL(result.otpauthUrl, { margin: 1, width: 180 });
	form.querySelector('.secret').textContent = result.secret;
	showStep('scan-step');
	const input = form.querySelector('.code');
	input?.updateComplete?.then(() => input.focus());
};

const verify = async () => {
	const { code } = form.getData();
	const result = await fleetAuthService.authenticatorChangeVerify({ code });
	if (result?.status !== 'succeeded') {
		throw new Error(result?.message || 'Failed to confirm the new app.');
	}
	codes = result.recoveryCodes || [];
	list.replaceChildren(...codes.map((recoveryCode) => {
		const item = document.createElement('li');
		item.textContent = recoveryCode;
		return item;
	}));
	showStep('codes-step');
	notifier.add({ title: 'Your new authenticator app is set up. Save the new recovery codes somewhere safe.', type: 'success' });
};

const submit = async () => {
	const buttons = form.querySelectorAll(`.dialog-footer.${step} u-button`);
	_.each(buttons, (button) => { button.disabled = true; });
	try {
		await (step === 'password-step' ? begin() : verify());
	} catch (error) {
		notifier.add({ title: error.message, type: 'error', duration: 0 });
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
	form.querySelector('.qr').removeAttribute('src');
	form.querySelector('.secret').textContent = '';
	showStep('password-step');
};

const render = () => {
	form.querySelector('.title-email').textContent = account.email || '';
};

showStep('password-step');
form.addEventListener('valid', submit);
form.querySelector('.download').addEventListener('click', download);
modal.addEventListener('show.bs.dialog', render);
modal.addEventListener('hidden.bs.dialog', restore);
