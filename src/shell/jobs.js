import toastPartial from 'shell/partials/toast.html';
import * as jobService from 'shell/services/job';
import morphdom from 'morphdom';
import prettyBytes from 'pretty-bytes';

const toastTemplate = _.template(toastPartial);
const shownJobIds = new Set();

const render = (state) => {
	_.each(state.jobs, (job) => {
		if (job.opts.repeat) {
			return;
		}
		
		if (shownJobIds.has(job.id)) {
			return;
		}
		
		if (job.progress.state !== 'active') {
			shownJobIds.add(job.id);
		}

		const hasToast = !_.isNull(document.querySelector(`#toast-${job.id}`));
		const toast = toastTemplate({ job, hasToast, moment, prettyBytes });
		if (hasToast) {
			if (!document.querySelector(`#toast-${job.id}`).classList.contains('active') || (document.querySelector(`#toast-${job.id}`).classList.contains('active') && job.progress.state === 'active')) {
				morphdom(
					document.querySelector(`#toast-${job.id}`),
					toast
				);
				return;
			}
			if (document.querySelector(`#toast-${job.id}`).classList.contains('active') && job.progress.state !== 'active') {
				const oldToast = bootstrap.Toast.getOrCreateInstance(document.querySelector(`#toast-${job.id}`));
				oldToast.hide();
				document.querySelector('.toast-container').insertAdjacentHTML('beforeend', toast);
				const newToast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
				newToast.show();
			}
		} else {
			document.querySelector('.toast-container').insertAdjacentHTML('beforeend', toast);
			const newToast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
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
