import appModalPartial from 'modules/apps/partials/modal/app_install.html';
import * as appCenterService from 'modules/apps/services/app_center';

document.querySelector('body').insertAdjacentHTML('beforeend', appModalPartial);

let appForm = document.querySelector('#app-install');
let app;

const validateForm = () => {
	//
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(appForm.querySelectorAll('.is-invalid'));
};

const install = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		id: app.id,
		env: {}
	};
	_.each(app.env, (env) => {
		config.env[env.name] = form.querySelector(`input[name="${env.name}"]`).value;
	});
	
	appCenterService.install(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
	document.querySelector('.toast-container').insertAdjacentHTML('beforeend',
		`<div class="toast bd-green-500 border-0" data-bs-autohide="true">
			<div class="d-flex">
				<div class="toast-body">Installing ${app.name}.</div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
			</div>
		</div>`
	);
	let toast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
	toast.show();
};

const render = (event) => {
	let id = event.relatedTarget.closest('.card').dataset.id;
	let apps = appCenterService.getTemplates();
	app = _.find(apps, { id: Number(id) });
	appForm.querySelector('.modal-title').innerHTML = app.title;
	appForm.querySelector('.description').innerHTML = app.description;
	_.each(app.env, (env) => {
		if (env?.preset === true) {
			return;
		}

		appForm.querySelector('.inputs').innerHTML += `
		<div class="form-floating mb-3">
			<input type="text" name="${env.name}" value="${env.default}" class="form-control" placeholder="">
			<label>${env.label}</label>
			<div class="invalid-feedback"></div>
		</div>
		`;
	});
};

const restore = (event) => {
	app = null;
	_.each(appForm.querySelectorAll('.modal-title, .description, .inputs'), (node) => { node.innerHTML = ''; });
	appForm.reset();
	_.each(appForm.querySelectorAll('button'), (button) => { button.disabled = false });
}

appForm.addEventListener('submit', install);
appForm.addEventListener('show.bs.modal', render);
appForm.addEventListener('hidden.bs.modal', restore)
