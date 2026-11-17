import modalPartial from 'node/modules/snapshot_rules/partials/modals/rule_update.html';
import formPartial from 'node/modules/snapshot_rules/partials/modals/rule_form.html';
import * as snapshotRuleService from 'node/modules/snapshot_rules/services/snapshot_rule';
import * as ruleForm from 'node/modules/snapshot_rules/services/rule_form';

const formTemplate = _.template(formPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#snapshot-rule-update');
const form = modal.querySelector('u-form');
const body = modal.querySelector('.dialog-body');

const updateRule = () => {
	if (!ruleForm.checkKinds(form)) {
		return;
	}

	_.each(form.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	const { previousName, rule } = ruleForm.readRule(form);
	snapshotRuleService.updateRule({ name: previousName, rule });
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const render = (event) => {
	const name = event.relatedTarget.closest('.item').dataset.name;
	const rule = _.find(snapshotRuleService.getRules(), (current) => { return _.toLower(current.name) === _.toLower(name); });
	body.innerHTML = formTemplate({ rule, previousName: rule.name });
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
form.addEventListener('valid', updateRule);
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
