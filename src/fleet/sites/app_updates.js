import modalPartial from 'fleet/sites/partials/modals/app_updates.html';
import updatesPartial from 'fleet/sites/partials/modals/app_updates_list.html';
import * as nodeService from 'fleet/sites/services/node';

document.body.insertAdjacentHTML('beforeend', modalPartial);

// How long an app keeps the spinner it gets on click before the node has reported an update job for
// it. The relay only confirms the request reached the node, so without this a request the node never
// turned into a job would spin for as long as the modal stays open.
const PENDING_TIMEOUT_MS = 30000;
const updatesTemplate = _.template(updatesPartial);
const modal = document.querySelector('#node-app-updates');
const updates = modal.querySelector('.updates');
const pending = new Map();
let nodeId = null;
let unsubscribe = null;

const clearPending = (name) => {
	clearTimeout(pending.get(name));
	pending.delete(name);
};

const hasJob = (jobs, name) => {
	return _.some(jobs, (job) => { return job.data?.config?.name === name; });
};

const render = () => {
	if (_.isNull(nodeId)) {
		return;
	}

	const node = _.find(nodeService.getNodes() ?? [], { nodeId });
	const jobs = node?.appUpdateJobs || [];
	// Once the node reports its own job for an app, that job drives the spinner.
	_.each([...pending.keys()], (name) => {
		if (hasJob(jobs, name)) {
			clearPending(name);
		}
	});
	morphdom(
		updates,
		`<div>${updatesTemplate({
			apps: node?.updates?.apps || [],
			jobs,
			pending: [...pending.keys()],
			// An app can't be updated through a system update, which stays in flight until it is
			// acknowledged, so the button says why rather than looking available.
			isUpdatingSystem: !_.isEmpty(node?.update)
		})}</div>`,
		{ childrenOnly: true }
	);
};

const show = (event) => {
	nodeId = event.relatedTarget?.dataset.nodeId ?? null;
	render();
	unsubscribe?.();
	unsubscribe = nodeService.subscribe([render]);
};

const restore = () => {
	unsubscribe?.();
	unsubscribe = null;
	nodeId = null;
	_.each([...pending.keys()], (name) => { clearPending(name); });
	updates.innerHTML = '';
};

const update = async (event) => {
	const button = event.target.closest('u-button.update');
	if (_.isNull(button) || _.isNull(nodeId)) {
		return;
	}

	const name = button.dataset.name;
	const node = _.find(nodeService.getNodes() ?? [], { nodeId });
	const title = _.find(node?.updates?.apps || [], { name })?.title ?? name;
	clearTimeout(pending.get(name));
	pending.set(name, setTimeout(() => { clearPending(name); render(); }, PENDING_TIMEOUT_MS));
	render();
	try {
		const result = await nodeService.startAppUpdate({ nodeId, name });
		if (result?.status === 'succeeded') {
			return;
		}

		notifier.add({ title: result?.message || `Failed to update ${title}.`, type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: error.message || `Failed to update ${title}.`, type: 'error', duration: 0 });
	}
	clearPending(name);
	render();
};

updates.addEventListener('click', update);
modal.addEventListener('show.bs.modal', show);
modal.addEventListener('hidden.bs.modal', restore);
