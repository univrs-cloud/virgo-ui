import siteAccessModalPartial from 'modules/sites/partials/modals/site_access.html';
import siteMemberPartial from 'modules/sites/partials/site_member.html';
import * as nodeService from 'modules/sites/services/node';

document.querySelector('body').insertAdjacentHTML('beforeend', siteAccessModalPartial);

const siteMemberTemplate = _.template(siteMemberPartial);
const modal = document.querySelector('#site-access');
const membersContainer = modal.querySelector('.members');
const form = modal.querySelector('u-form');
const errorEl = modal.querySelector('.site-access-error');
let nodeId = null;

const showError = (message) => {
	errorEl.textContent = message;
	errorEl.classList.remove('d-none');
};

const renderMembers = ({ users, groups }) => {
	const rows = _.join(_.map(users, (member) => { return siteMemberTemplate({ member }); }), '');
	const groupsNote = _.isEmpty(groups) ? '' : `
		<div class="list-group-item py-2">
			<small class="text-body-tertiary">Also shared via groups: ${_.escape(_.map(groups, 'name').join(', '))}</small>
		</div>
	`;
	morphdom(
		membersContainer,
		`<div>${rows}${groupsNote}</div>`,
		{ childrenOnly: true }
	);
};

const loadMembers = async () => {
	if (!nodeId) {
		return;
	}

	try {
		const { users, groups } = await nodeService.getMembers({ nodeId });
		renderMembers({ users, groups });
	} catch (error) {
		showError(error.message);
	}
};

const submitInvite = async () => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	errorEl.classList.add('d-none');

	try {
		const data = form.getData();
		await nodeService.inviteToNode({ nodeId, email: data.email });
		form.reset();
		await loadMembers();
	} catch (error) {
		showError(error.message);
	} finally {
		_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = false; });
	}
};

const revokeMember = async (event) => {
	const button = event.target.closest('.revoke');
	if (!button) {
		return;
	}

	const row = button.closest('[data-email]');
	const email = row?.dataset.email;
	if (!email) {
		return;
	}

	if (!await confirm(`Are you sure you want to revoke access for ${email}?`, { buttons: [{ text: 'Yes, revoke', class: 'btn-danger' }] })) {
		return;
	}

	errorEl.classList.add('d-none');
	try {
		await nodeService.revokeFromNode({ nodeId, email });
		await loadMembers();
	} catch (error) {
		showError(error.message);
	}
};

const render = (event) => {
	nodeId = event.relatedTarget?.dataset.manageNodeId || null;
	loadMembers();
};

const restore = () => {
	nodeId = null;
	errorEl.classList.add('d-none');
	form.reset();
	membersContainer.innerHTML = '';
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = false; });
};

form.validation = [
	{
		selector: '.email',
		rules: {
			isEmpty: `Can't be empty`,
			isEmail: 'Invalid email address'
		}
	}
];
form.addEventListener('valid', submitInvite);
membersContainer.addEventListener('click', revokeMember);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
