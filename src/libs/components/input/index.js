import { LitElement, html } from 'lit';
import { sheet } from "../styles.js";

export class Input extends LitElement {
	static formAssociated = true;

	static get properties() {
		return {
			type: { type: String, reflect: true },
			value: { type: String },
			label: { type: String, reflect: true },
			placeholder: { type: String, reflect: true },
			tip: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true },
			readonly: { type: Boolean, reflect: true },
			autocomplete: { type: String, reflect: true },
			error: { type: String },
			showPassword: { type: Boolean }
		};
	}

	#value = '';
	#error = '';
	#initialValue = '';
	#initialDisabled = false;
	#initialReadonly = false;
	#hasPrefix = false;
	#hasSuffix = false;

	constructor() {
		super();
		this.internals = this.attachInternals();

		this.showPassword = false;
		this.type = 'text';
		this.label = '';
		this.placeholder = '';
		this.tip = '';
		this.autocomplete = '';
		this.disabled = false;
		this.readonly = false;
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
		this.#initialDisabled = this.hasAttribute('disabled');
  		this.#initialReadonly = this.hasAttribute('readonly');
		this.internals.setFormValue(this.value);
	}

	formResetCallback() {
		this.value = this.#initialValue;
		this.disabled = this.#initialDisabled;
		this.readonly = this.#initialReadonly;
		this.error = '';
		this.showPassword = false;
	}

	createRenderRoot() {
		const root = super.createRenderRoot();
		root.adoptedStyleSheets = [sheet];
		return root;
	}

	firstUpdated() {
		const label = this.renderRoot.querySelector('label');
		if (label) {
			new bootstrap.Tooltip(label);
		}
		
		this.#hasPrefix = this.renderRoot.querySelector('slot[name="prefix"]')?.assignedNodes().length > 0 ?? false;
		this.#hasSuffix = this.renderRoot.querySelector('slot[name="suffix"]')?.assignedNodes().length > 0 ?? false;
		if (this.#hasPrefix || this.#hasSuffix) {
			this.requestUpdate();
		}
	}

	render() {
		if (this.type === 'hidden') {
			return html`
				<input
					type=${this.type}
					.value=${this.value}
				/>
			`;
		}

		const inputType = this.type === 'password' ? (this.showPassword ? 'text' : 'password') : this.type;
		const hasInputGroup = this.#hasPrefix || this.#hasSuffix;
		
		return html`
			<div class="mb-3">
				<div class="${hasInputGroup ? 'input-group' : ''} ${hasInputGroup && this.error ? 'has-validation' : ''}">
					<slot name="prefix" class="input-group-text ${!this.#hasPrefix ? 'd-none' : ''}" @slotchange=${this.#onSlotChange}></slot>
					<div class="form-floating">
						<input
							type=${inputType}
							.value=${this.value}
							.placeholder=${this.placeholder}
							?disabled=${this.disabled}
							?readonly=${this.readonly}
							?autocomplete=${this.autocomplete}
							class="form-control ${this.type === 'password' ? 'password-input' : ''} ${this.error ? 'is-invalid' : ''}"
							@input=${this.#onInput}
						>
						<label>
							${this.label}
							${this.tip ? html`<span class="help-inline ms-1" data-bs-toggle="tooltip" data-bs-original-title=${this.tip}><i class="icon-solid icon-question-circle"></i></span>` : ''}
						</label>
						${this.type === 'password' ? html`<button type="button" class="password-toggle" @click=${this.#togglePassword}></button>` : ''}
					</div>
					<slot name="suffix" class="input-group-text ${!this.#hasSuffix ? 'd-none' : ''}" @slotchange=${this.#onSlotChange}></slot>
				</div>
				<div class="invalid-feedback ${this.error ? 'd-block' : ''}">${this.error || ''}</div>
			</div>
		`;
	}

	focus() {
		this.renderRoot.querySelector('input').focus();
	}

	#onInput(event) {
		this.value = event.target.value || '';
	}

	#togglePassword(event) {
		event.preventDefault();
		this.showPassword = !this.showPassword;
		this.focus();
	}

	#onSlotChange(event) {
		const slot = event.target;
		const hasContent = slot.assignedNodes().length > 0;
		if (slot.name === 'prefix') {
			this.#hasPrefix = hasContent;
		} else if (slot.name === 'suffix') {
			this.#hasSuffix = hasContent;
		}
		this.requestUpdate();
	}
}

customElements.define('u-input', Input);
