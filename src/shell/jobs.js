import jobProgressPartial from 'shell/partials/job_progress.html';
import * as jobService from 'shell/services/job';

const jobProgressTemplate = _.template(jobProgressPartial);
const acknowledgedJobIds = new Set();
const toasts = {};

const render = (state) => {
	_.each(state.jobs, (job) => {
		if (job.opts.repeat) {
			return;
		}
		
		if (acknowledgedJobIds.has(job.id)) {
			return;
		}
		
		if (job.progress.state !== 'active') {
			acknowledgedJobIds.add(job.id);
		}

		const hasToast = !_.isUndefined(toasts[job.id]);
		const title =  job.progress.message;
		let type = 'info';
		let dismissible = false;
		let duration = 0;
		if (job.progress.state === 'completed') {
			type = 'success';
			dismissible = true;
			duration = 5000;
		}
		if (job.progress.state === 'failed') {
			type = 'error';
			dismissible = true;
		}
		let message = '';
		message += jobProgressTemplate({ job });
		message += `<div>${(job.progress.state === 'failed' ? job.failedReason : '')}</div>`;
		if (!hasToast) {
			toasts[job.id] = notifier.add({ title, message, type, dismissible, duration });
		} else {
			const toast = toasts[job.id];
			toast.update({ title, message, type, dismissible, duration });
		}
	});
};

const init = () => {
	jobService.subscribe([render]);

	// const ref = window.notifier.add({
	// 	type: 'info',
	// 	title: 'Processing...',
	// 	message: 'Starting operation (0%)',
	// 	duration: 0,
	// 	dismissible: false
	//   });
	  
	//   let progress = 0;
	//   const interval = setInterval(() => {
	// 	progress += 20;
		
	// 	if (progress < 100) {
	// 	  ref.update({
	// 		message: `Processing... (${progress}%)`
	// 	  });
	// 	} else {
	// 	  ref.update({
	// 		type: 'success',
	// 		title: 'Complete!',
	// 		message: 'Operation finished successfully.',
	// 		dismissible: true,
	// 		duration: 3000
	// 	  });
	// 	  clearInterval(interval);
	// 	}
	//   }, 800);
};

export {
	init
};
