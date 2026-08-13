import jobProgressPartial from 'node/partials/job_progress.html';
import * as jobService from 'setup/services/job';

const jobProgressTemplate = _.template(jobProgressPartial);
const acknowledgedJobIds = new Set();
const toasts = {};

// Every job the node runs is reported here, whoever asked for it — the wizard is not the only way to
// reach a node being set up, and a second tab watching the same node should see the same work.
const render = (state) => {
	_.each(state.jobs, (job) => {
		if (job.opts?.repeat || acknowledgedJobIds.has(job.id)) {
			return;
		}

		if (job.progress.state !== 'active') {
			acknowledgedJobIds.add(job.id);
		}

		const title = job.progress.message;
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

		let message = jobProgressTemplate({ job });
		message += `<div>${(job.progress.state === 'failed' ? job.failedReason : '')}</div>`;
		if (_.isUndefined(toasts[job.id])) {
			toasts[job.id] = notifier.add({ title, message, type, dismissible, duration });
			return;
		}

		toasts[job.id].update({ title, message, type, dismissible, duration });
	});
};

jobService.subscribe([render]);
