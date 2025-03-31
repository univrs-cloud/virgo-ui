import appModalPartial from 'modules/apps/partials/modal/app_install.html';
import inputHiddenPartial from 'modules/apps/partials/modal/app_install/input_hidden.html';
import inputTextPartial from 'modules/apps/partials/modal/app_install/input_text.html';
import selectPartial from 'modules/apps/partials/modal/app_install/select.html';
import * as appCenterService from 'modules/apps/services/app_center';

const inputHiddenTemplate = _.template(inputHiddenPartial);
const inputTextTemplate = _.template(inputTextPartial);
const selectTemplate = _.template(selectPartial);
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
		config.env[env.name] = form.querySelector(`[name="${env.name}"]`).value;
	});
	
	appCenterService.install(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
	document.querySelector('.toast-container').insertAdjacentHTML('beforeend',
		`<div class="toast bd-green-500 border-0" data-bs-autohide="true">
			<div class="d-flex">
				<div class="toast-body">Installing new app: <strong>${app.title}</strong>.</div>
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
			appForm.querySelector('.inputs').innerHTML += inputHiddenTemplate({ env });
			return;
		}

		if (env?.select) {
			appForm.querySelector('.inputs').innerHTML += selectTemplate({ env });
			return;
		}

		appForm.querySelector('.inputs').innerHTML += inputTextTemplate({ env });
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
