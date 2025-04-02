import morphdom from 'morphdom';
import * as jobService from 'shell/services/job';

const render = (state) => {
	_.each(state.jobs, (job) => {
		let hasToast = !_.isNull(document.querySelector(`#toast-${job.id}`));
		let toastAutoHide = 'false';
		let toastColor = 'blue';
		if (job.progress.state === 'completed') {
			toastAutoHide = 'true';
			toastColor = 'green';
		}
		if (job.progress.state === 'failed') {
			toastColor = 'red';
		}
		let toast = `
		<div id="toast-${job.id}" class="toast ${job.progress.state} bd-${toastColor}-500 border-0 ${(hasToast ? 'fade show' : '')}" data-bs-autohide="${toastAutoHide}">
			<div class="d-flex">
				<div class="toast-body">
					${job.progress.message}
					${(job.progress.state === 'failed' ? job.failedReason : '')}
				</div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto ${(job.progress.state === 'active' ? 'd-none' : '')}" data-bs-dismiss="toast"></button>
			</div>
		</div>
		`;
		if (hasToast) {
			if (!document.querySelector(`#toast-${job.id}`).classList.contains('active') || (document.querySelector(`#toast-${job.id}`).classList.contains('active') && job.progress.state === 'active')) {
				morphdom(
					document.querySelector(`#toast-${job.id}`),
					toast
				);
				return;
			}
			if (document.querySelector(`#toast-${job.id}`).classList.contains('active') && job.progress.state !== 'active') {
				let oldToast = bootstrap.Toast.getOrCreateInstance(document.querySelector(`#toast-${job.id}`));
				oldToast.hide();
				document.querySelector('.toast-container').insertAdjacentHTML('beforeend', toast);
				let newToast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
				newToast.show();
			}
		} else {
			document.querySelector('.toast-container').insertAdjacentHTML('beforeend', toast);
			let newToast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
			newToast.show();
		}
	});
};

const init = () => {
	jobService.subscribe([render]);
};

export {
	init
};
