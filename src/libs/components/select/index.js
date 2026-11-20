import { LitElement, html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { size } from '@floating-ui/dom';
import { sheet } from '../styles.js';

export class Select extends LitElement {
	static formAssociated = true;
	static styles = [sheet];

	static get properties() {
		return {
			value: { type: String },
			label: { type: String, reflect: true },
			tip: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true },
			required: { type: Boolean, reflect: true },
			multiple: { type: Boolean, reflect: true },
			options: { type: Array },
			error: { type: String }
		};
	}

	#value = '';
	#options = [];
	#error = '';
	#initialTip = '';
	#initialDisabled = false;
	#formDisabled = false;
	#tooltip = null;
	#menu = null;
	#observer = null;
	#search = '';
	#searchTimeout = null;

	constructor() {
		super();
		this.internals = this.attachInternals();
		this.label = '';
		this.tip = '';
		this.disabled = false;
		this.required = false;
		this.multiple = false;
		this.options = [];
	}

	set value(value) {
		const oldValue = this.#value;
		this.#value = this.multiple ? (Array.isArray(value) ? value : (value === '' || value === null || value === undefined ? [] : [value])) : (value ?? '');
		this.requestUpdate('value', oldValue);
		this.internals.setFormValue(this.#value);
		this.#updateValidity();
		this.dispatchEvent(new CustomEvent('value-changed', { detail: this.#value, bubbles: true, composed: true }));
	}

	get value() {
		if (this.multiple && !Array.isArray(this.#value)) {
			return this.#value === '' ? [] : [this.#value];
		}
		return this.#value;
	}

	set options(value) {
		const oldValue = this.#options;
		this.#options = value || [];
		this.requestUpdate('options', oldValue);
		this.#applySelectedness();
	}

	get options() {
		return this.#options;
	}

	set error(value) {
		const oldValue = this.#error;
		this.#error = value;
		this.classList.toggle('is-invalid', Boolean(value));
		this.requestUpdate('error', oldValue);
	}

	get error() {
		return this.#error;
	}

	get name() {
		return this.getAttribute('name') || '';
	}

	get type() {
		return this.multiple ? 'select-multiple' : 'select-one';
	}

	get form() {
		return this.internals.form;
	}

	get labels() {
		return this.internals.labels;
	}

	get validity() {
		return this.internals.validity;
	}

	get validationMessage() {
		return this.internals.validationMessage;
	}

	get willValidate() {
		return this.internals.willValidate;
	}

	get selectedOptions() {
		return this.#flatOptions().filter((option) => { return this.#isSelected(option); });
	}

	get selectedIndex() {
		return this.#flatOptions().findIndex((option) => { return this.#isSelected(option); });
	}

	set selectedIndex(index) {
		const option = this.#flatOptions()[index];
		this.value = option ? (this.multiple ? [option.value] : option.value) : '';
	}

	connectedCallback() {
		super.connectedCallback();
		this.#initialTip = this.tip;
		this.#initialDisabled = this.hasAttribute('disabled');
		if (this.children.length) {
			this.options = this.#readLightOptions();
		}
		this.#observer = new MutationObserver((mutations) => {
			if (mutations.some((mutation) => { return mutation.target !== this || mutation.type !== 'attributes'; })) {
				this.options = this.#readLightOptions();
			}
		});
		this.#observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
		this.internals.setFormValue(this.value);
		this.#updateValidity();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#observer?.disconnect();
		this.#observer = null;
		this.#menu?.dispose();
		this.#menu = null;
		this.#tooltip?.dispose();
		this.#tooltip = null;
	}

	formResetCallback() {
		this.value = this.#defaultValue();
		this.tip = this.#initialTip;
		this.disabled = this.#initialDisabled;
		this.error = '';
	}

	formDisabledCallback(disabled) {
		this.#formDisabled = disabled;
		this.requestUpdate();
	}

	formStateRestoreCallback(state) {
		this.value = state;
	}

	willUpdate(changedProperties) {
		if (changedProperties.has('required') || changedProperties.has('multiple')) {
			this.#updateValidity();
		}
	}

	firstUpdated() {
		const label = this.renderRoot.querySelector('label');
		if (label) {
			this.#tooltip = new bootstrap.Tooltip(label, { container: this.closest('dialog') ?? 'body' });
		}
	}

	renderOptGroup(group) {
		return html`
			<div class="menu-header">${group.label}</div>
			${group.options.map((option) => { return this.renderOption(option, group.disabled); })}
		`;
	}

	renderOption(option, groupDisabled = false) {
		if (option.hidden) {
			return nothing;
		}

		return html`
			<button
				type="button"
				class="menu-item ${classMap({ selected: this.#isSelected(option) })}"
				data-value=${option.value}
				tabindex="-1"
				?disabled=${groupDisabled || option.disabled || false}
			>
				<span class="menu-item-content">
					<span>${option.label}</span>
					${option.content ? html`<span class="d-block">${unsafeHTML(option.content)}</span>` : ''}
				</span>
				<i class="icon-check menu-item-check"></i>
			</button>
		`;
	}

	render() {
		const selected = this.selectedOptions;
		const display = this.multiple && selected.length > 1 ? `${selected.length} selected` : (selected[0]?.label ?? '');

		return html`
			<div class="mb-7">
				<div class="form-floating form-floating-always">
					<label>
						${this.label}
						${this.tip ? html`<span class="help-inline ms-1" data-bs-toggle="tooltip" data-bs-original-title="${this.tip}"><i class="icon-circle-help"></i></span>` : ''}
					</label>
					<button
						type="button"
						class="form-control form-control-caret text-start ${classMap({ 'is-invalid': this.error })}"
						?disabled=${this.disabled || this.#formDisabled}
						@click=${this.#onToggleClick}
						@keydown=${this.#onToggleKeydown}
					>
						<span class="d-block text-truncate">${display}</span>
					</button>
					<div
						class="menu"
						@click=${this.#onMenuClick}
						@keydown=${this.#onMenuKeydown}
						@wheel=${this.#onMenuWheel}
					>
						<div class="menu-options">
							${this.options.map((option) => { return option.options ? this.renderOptGroup(option) : this.renderOption(option); })}
						</div>
					</div>
					<div class="invalid-feedback lh-1 z-1 position-absolute top-100 start-0 end-0 ${classMap({ 'd-block': this.error })}">${this.error || ''}</div>
				</div>
			</div>
		`;
	}

	focus(options) {
		this.renderRoot.querySelector('.form-control')?.focus(options);
	}

	blur() {
		this.renderRoot.querySelector('.form-control')?.blur();
	}

	showPicker() {
		this.#open();
	}

	checkValidity() {
		return this.internals.checkValidity();
	}

	reportValidity() {
		return this.internals.reportValidity();
	}

	setCustomValidity(message) {
		this.internals.setValidity(message ? { customError: true } : {}, message);
	}

	#getMenu() {
		if (!this.#menu) {
			this.#menu = new bootstrap.Menu(this.renderRoot.querySelector('.form-control'), {
				menu: this.renderRoot.querySelector('.menu'),
				strategy: 'fixed',
				autoClose: this.multiple ? 'outside' : true,
				floatingConfig: (defaultConfig) => {
					return {
						middleware: [
							...defaultConfig.middleware,
							size({
								padding: 8,
								apply: ({ rects, elements, availableHeight }) => {
									elements.floating.style.minWidth = `${rects.reference.width}px`;
									elements.floating.style.maxHeight = `min(var(--menu-max-height), ${Math.max(availableHeight, 0)}px)`;
								}
							})
						]
					};
				}
			});
		}
		return this.#menu;
	}

	#isOpen() {
		return this.renderRoot.querySelector('.menu')?.classList.contains('show') ?? false;
	}

	#open(edge = 'first') {
		if (this.disabled || this.#formDisabled) {
			return;
		}

		this.#getMenu().show();
		const items = this.#items();
		const target = items.find((item) => { return item.classList.contains('selected'); }) ?? (edge === 'last' ? items.at(-1) : items[0]);
		target?.focus();
	}

	#close() {
		this.#menu?.hide();
		this.focus();
	}

	#items() {
		return Array.from(this.renderRoot.querySelectorAll('.menu-item:not(:disabled)'));
	}

	#flatOptions() {
		return this.options.flatMap((option) => {
			return option.options ? option.options.map((child) => { return { ...child, disabled: option.disabled || child.disabled || false }; }) : [option];
		});
	}

	#matches(first, second) {
		return String(first ?? '').toLowerCase() === String(second ?? '').toLowerCase();
	}

	#isSelected(option) {
		if (this.multiple) {
			return (this.value || []).some((value) => { return this.#matches(value, option.value); });
		}
		return this.#matches(option.value, this.value);
	}

	#defaultValue() {
		const options = this.#flatOptions();
		if (this.multiple) {
			return options.filter((option) => { return option.default; }).map((option) => { return option.value; });
		}
		const option = options.findLast((current) => { return current.default; }) ?? options.find((current) => { return !current.disabled; });
		return option?.value ?? '';
	}

	#applySelectedness() {
		const options = this.#flatOptions();
		if (this.multiple) {
			const value = (this.value || []).filter((current) => { return options.some((option) => { return this.#matches(option.value, current); }); });
			if (value.length !== (this.value || []).length) {
				this.value = value;
			}
			return;
		}

		if (options.some((option) => { return this.#isSelected(option); })) {
			return;
		}

		const value = this.#defaultValue();
		if (!this.#matches(value, this.value)) {
			this.value = value;
		}
	}

	#pick(value) {
		if (this.multiple) {
			const isSelected = this.value.some((current) => { return this.#matches(current, value); });
			this.value = isSelected ? this.value.filter((current) => { return !this.#matches(current, value); }) : [...this.value, value];
		} else {
			if (this.#matches(value, this.value)) {
				this.#close();
				return;
			}
			this.value = value;
		}

		this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
		this.dispatchEvent(new Event('change', { bubbles: true }));

		if (!this.multiple) {
			this.#close();
		}
	}

	#typeahead(key) {
		clearTimeout(this.#searchTimeout);
		this.#searchTimeout = setTimeout(() => { this.#search = ''; }, 1000);
		const isRepeat = this.#search.length === 1 && this.#matches(this.#search, key);
		this.#search = isRepeat ? this.#search : `${this.#search}${key}`;
		const query = this.#search.toLowerCase();

		const options = this.#flatOptions().filter((option) => { return !option.disabled && !option.hidden; });
		const current = this.#isOpen()
			? options.findIndex((option) => { return this.#matches(option.value, this.renderRoot.activeElement?.dataset.value); })
			: options.findIndex((option) => { return this.#isSelected(option); });
		const start = isRepeat || this.#search.length === 1 ? current + 1 : Math.max(current, 0);
		const ordered = [...options.slice(start), ...options.slice(0, start)];
		return ordered.find((option) => { return String(option.label ?? '').toLowerCase().startsWith(query); });
	}

	#isTypeaheadKey(event) {
		return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key !== ' ' || this.#search !== '');
	}

	#onToggleClick() {
		if (this.#isOpen()) {
			this.#menu.hide();
			return;
		}
		this.#open();
	}

	#onToggleKeydown(event) {
		if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key) && !this.#isTypeaheadKey(event)) {
			event.preventDefault();
			this.#open(event.key === 'ArrowUp' ? 'last' : 'first');
			return;
		}

		if (!this.multiple && this.#isTypeaheadKey(event)) {
			event.preventDefault();
			const option = this.#typeahead(event.key);
			if (option && !this.#matches(option.value, this.value)) {
				this.value = option.value;
				this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
				this.dispatchEvent(new Event('change', { bubbles: true }));
			}
		}
	}

	#onMenuKeydown(event) {
		const items = this.#items();
		const index = items.indexOf(this.renderRoot.activeElement);

		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.#close();
			return;
		}

		if (event.key === 'Tab') {
			this.#close();
			return;
		}

		if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) {
			event.preventDefault();
			const steps = { ArrowDown: 1, ArrowUp: -1, PageDown: 10, PageUp: -10 };
			const target = event.key === 'Home' ? 0 : (event.key === 'End' ? items.length - 1 : Math.min(Math.max(index + steps[event.key], 0), items.length - 1));
			items[target]?.focus();
			return;
		}

		if (this.#isTypeaheadKey(event)) {
			event.preventDefault();
			const option = this.#typeahead(event.key);
			items.find((item) => { return this.#matches(item.dataset.value, option?.value); })?.focus();
			return;
		}

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (index > -1) {
				this.#pick(items[index].dataset.value);
			}
		}
	}

	#onMenuClick(event) {
		const item = event.target.closest('.menu-item');
		if (!item || item.disabled) {
			return;
		}
		event.stopPropagation();
		this.#pick(item.dataset.value);
	}

	#onMenuWheel(event) {
		event.stopPropagation();
	}

	#updateValidity() {
		const isMissing = this.required && (this.multiple ? !(this.value || []).length : this.value === '');
		this.internals.setValidity(isMissing ? { valueMissing: true } : {}, isMissing ? 'Select an item in the list.' : '');
	}

	#readLightOptions() {
		const readOption = (element) => {
			const hasContent = element.hasAttribute('label') && element.children.length > 0;
			return {
				value: element.hasAttribute('value') ? element.getAttribute('value') : element.textContent.trim(),
				label: element.getAttribute('label') ?? element.textContent.trim(),
				content: hasContent ? element.innerHTML : '',
				default: element.hasAttribute('selected'),
				disabled: element.hasAttribute('disabled'),
				hidden: element.hasAttribute('hidden')
			};
		};

		return Array.from(this.children).flatMap((element) => {
			const tagName = element.tagName.toLowerCase();
			if (tagName === 'optgroup') {
				return [{
					label: element.getAttribute('label') ?? '',
					disabled: element.hasAttribute('disabled'),
					options: Array.from(element.children).filter((child) => { return child.tagName.toLowerCase() === 'option'; }).map(readOption)
				}];
			}
			if (tagName === 'option') {
				return [readOption(element)];
			}
			return [];
		});
	}
}

customElements.define('u-select', Select);
