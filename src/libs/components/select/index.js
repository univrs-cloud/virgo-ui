import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from "../styles.js";

export class Select extends LitElement {
	static formAssociated = true;
	static styles = [sheet];

	static get properties() {
		return {
			value: { type: String },
			label: { type: String, reflect: true },
			tip: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true },
			options: { type: Array }, // [{ value, text, disabled, default } or { label, disabled, options: [...] }]
			error: { type: String }
		};
	}

	#value = '';
	#error = '';
	#initialValue = '';
	#initialTip = '';
	#initialDisabled = false;
	#tooltip = null;

	constructor() {
		super();
		this.internals = this.attachInternals();
		this.label = '';
		this.tip = '';
		this.disabled = false;
		this.options = [];
	}

	set value(value) {
		const oldValue = this.#value;
		this.#value = value;
		this.requestUpdate('value', oldValue);
		this.internals.setFormValue(value);
		this.dispatchEvent(new CustomEvent('value-changed', { detail: value, bubbles: true, composed: true }));
	}

	get value() {
		return this.#value;
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

	connectedCallback() {
		super.connectedCallback();
		this.#initialValue = this.value;
		this.#initialTip = this.tip;
		this.#initialDisabled = this.hasAttribute('disabled');
		this.internals.setFormValue(this.value);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#tooltip?.dispose();
		this.#tooltip = null;
	}

	formResetCallback() {
		this.value = this.#initialValue;
		this.tip = this.#initialTip;
		this.disabled = this.#initialDisabled;
		this.error = '';
	}

	firstUpdated() {
		const label = this.renderRoot.querySelector('label');
		if (label) {
			this.#tooltip = new bootstrap.Tooltip(label);
		}

		this.#updateOptionsFromLightDOM();
	}

	renderOptGroup(group) {
		return html`
			<optgroup
				.label=${group.label}
				.disabled=${group.disabled || false}
			>
				${group.options.map((option) => { return this.renderOption(option); })}
			</optgroup>
		`;
	}

	renderOption(option) {
		return html`
			<option
				.value=${option.value}
				?selected=${option.default || option.value === this.value}
				?disabled=${option.disabled || false}
			>
				${option.label}
			</option>
		`;
	}

	render() {
		return html`
			<div class="mb-4">
				<div class="form-floating">
					<select
						.value=${this.value}
						?disabled=${this.disabled}
						class="form-select ${classMap({ 'is-invalid': this.error })}"
						@change=${this.#onChange}
					>
						${this.options.map((option) => { return option.options ? this.renderOptGroup(option) : this.renderOption(option); })}
					</select>
					<label>
						${this.label}
						${this.tip ? html`<span class="help-inline ms-1" data-bs-toggle="tooltip" data-bs-original-title="${this.tip}"><i class="icon-solid icon-question-circle"></i></span>` : ''}
					</label>
					<div class="invalid-feedback lh-1 z-1 position-absolute top-100 start-0 end-0 ${classMap({ 'd-block': this.error })}">${this.error || ''}</div>
				</div>
			</div>
		`;
	}

	focus() {
		this.renderRoot.querySelector('select').focus();
	}

	#onChange(event) {
		this.value = event.target.value;
	}

	#updateOptionsFromLightDOM() {
		const lightOptions = Array.from(this.children);
		this.options = lightOptions.map((element) => {
			if (element.tagName.toLowerCase() === 'optgroup') {
				return {
					label: element.label,
					disabled: element.disabled,
					options: Array.from(element.children).map((opt) => ({
						value: opt.value,
						label: opt.textContent,
						default: opt.selected,
						disabled: opt.disabled
					}))
				};
			} else if (element.tagName.toLowerCase() === 'option') {
				return {
					value: element.value,
					label: element.textContent,
					default: element.selected,
					disabled: element.disabled,
				};
			}
		});
		this.textContent = '';

		if (!this.value) {
			const defaultOption = this.options.find(o => !o.options && o.default) || (this.options.find(o => o.options)?.options.find(opt => opt.default));
			if (defaultOption) {
				this.value = defaultOption.value;
			}
		}
	}
}

customElements.define('u-select', Select);
