import morphdom from 'morphdom';
import * as jobService from 'shell/services/job';

const shownJobIds = new Set();

const render = (state) => {
	_.each(state.jobs, (job) => {
		if (shownJobIds.has(job.id)) {
			return;
		}
		
		if (job.progress.state !== 'active') {
			shownJobIds.add(job.id);
		}

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
		<div id="toast-${job.id}" class="toast ${job.progress.state} bd-${toastColor}-500 border-0 ${(hasToast ? 'fade show' : '')}" data-bs-autohide="${toastAutoHide}" data-bs-delay="8000">
			<div class="d-flex">
				<div class="toast-body">
					<strong>${job.progress.message}</strong>
					<div>${(job.progress.state === 'failed' ? job.failedReason : '')}</div>
					<div><small class="text-${toastColor}-100">${(job.progress.state === 'active' ? moment(job.processedOn).format('LLL') : moment(job.finishedOn).format('LLL'))}</small></div>
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
