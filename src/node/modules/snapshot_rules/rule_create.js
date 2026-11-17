import modalPartial from 'node/modules/snapshot_rules/partials/modals/rule_create.html';
import formPartial from 'node/modules/snapshot_rules/partials/modals/rule_form.html';
import * as snapshotRuleService from 'node/modules/snapshot_rules/services/snapshot_rule';
import * as ruleForm from 'node/modules/snapshot_rules/services/rule_form';

const formTemplate = _.template(formPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#snapshot-rule-create');
const form = modal.querySelector('u-form');
const body = modal.querySelector('.dialog-body');

const createRule = () => {
	if (!ruleForm.checkKinds(form)) {
		return;
	}

	_.each(form.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	const { rule } = ruleForm.readRule(form);
	snapshotRuleService.createRule({ rule });
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const render = () => {
	body.innerHTML = formTemplate({ rule: ruleForm.defaultRule(), previousName: '' });
	ruleForm.renderHours(body);
	_.each(body.querySelectorAll('.keep-unit'), (select) => { select.addEventListener('click', (event) => { event.stopPropagation(); }); });
	requestAnimationFrame(() => { ruleForm.renderPreview(form); });
};

const restore = () => {
	form.reset();
	body.innerHTML = '';
};

form.validation = ruleForm.validation(form, snapshotRuleService.getRules);

form.addEventListener('submit', () => { ruleForm.checkKinds(form); });
form.addEventListener('valid', createRule);
body.addEventListener('click', (event) => {
	if (event.target.closest('.schedule-day, [data-days-preset]')) {
		ruleForm.toggleDay(event);
		form.validateField('.keep-amount');
	}
	ruleForm.renderPreview(form);
});
body.addEventListener('checked-changed', (event) => {
	ruleForm.toggleKind(event);
	ruleForm.renderPreview(form);
});
body.addEventListener('value-changed', () => { ruleForm.renderPreview(form); });
body.addEventListener('change', (event) => {
	if (event.target.closest('.keep-unit')) {
		form.validateField('.keep-amount');
		ruleForm.renderPreview(form);
	}
});
body.addEventListener('input', (event) => {
	if (event.target.closest('.hour-range')) {
		ruleForm.moveHours(event);
		form.validateField('.keep-amount');
	}
	ruleForm.renderPreview(form);
});
modal.addEventListener('show.bs.dialog', render);
modal.addEventListener('hidden.bs.dialog', restore);
