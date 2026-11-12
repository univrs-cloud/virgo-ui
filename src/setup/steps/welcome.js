import page from 'page';
import { stepPath } from 'setup/wizard';

const step = document.querySelector('#welcome');
const start = step.querySelector('[data-action="start"]');
const waiting = step.querySelector('.waiting');

const proceed = () => {
	page(stepPath('eula'));
};

const enableStart = () => {
	start.classList.remove('invisible');
	waiting.classList.add('d-none');
};

start.addEventListener('click', proceed);
step.onRoute = enableStart;
