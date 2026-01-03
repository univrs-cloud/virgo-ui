import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from '../styles.js';
import Tagify from '@yaireo/tagify';

export class Input extends LitElement {
	static formAssociated = true;
	static styles = [sheet];

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
			showPassword: { type: Boolean, state: true, attribute: false }
		};
	}

	#value = '';
	#error = '';
	#initialValue = '';
	#initialTip = '';
	#initialDisabled = false;
	#initialReadonly = false;
	#hasPrefix = false;
	#hasSuffix = false;
	#tooltip = null;
	#tagify = null;

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

	set tags(value) {
		if (this.#tagify) {
			this.#tagify.removeAllTags();
			this.#tagify.addTags(value);
		}
	}

	connectedCallback() {
		super.connectedCallback();
		this.#initialValue = this.value;
		this.#initialTip = this.tip;
		this.#initialDisabled = this.hasAttribute('disabled');
		this.#initialReadonly = this.hasAttribute('readonly');
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
		this.readonly = this.#initialReadonly;
		this.error = '';
		this.showPassword = false;
		if (this.#tagify) {
			this.#tagify.removeAllTags();
		}
	}

	firstUpdated() {
		const label = this.renderRoot.querySelector('label');
		if (label) {
			this.#tooltip = new bootstrap.Tooltip(label);
		}

		const input = this.renderRoot.querySelector('input');
		input.addEventListener('keypress', (event) => {
			if (event.code.toLowerCase() === 'enter') {
				this.closest('form')?.dispatchEvent(new event.constructor('submit', event));
			}
		});

		if (this.type === 'tags') {
			this.#tagify = new Tagify(input, {
				delimiters: ' |,|\n|\r',
				editTags: 1
			});
			this.#tagify.on('change', (event) => {
				try {
					const value = JSON.parse(event.detail.value || '[]');
					this.value = value.map((entry) => { return entry.value; });
				} catch (error) {
					this.value = [];
				}
			});
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
			<div class="mb-4">
				<div class="${classMap({ 'input-group': hasInputGroup })} has-validation">
					<slot name="prefix" class="input-group-text ${classMap({ 'd-none': !this.#hasPrefix  })}" @slotchange=${this.#onSlotChange}></slot>
					<div class="form-floating">
						<input
							type=${inputType}
							class="form-control ${classMap({ 'password-input': this.type === 'password', 'is-invalid': this.error })}"
							placeholder=${this.placeholder}
							autocomplete=${this.autocomplete}
							.value=${this.value}
							?disabled=${this.disabled}
							?readonly=${this.readonly}
							@input=${this.#onInput}
						>
						<label>
							${this.label}
							${this.tip ? html`<span class="help-inline ms-1" data-bs-toggle="tooltip" data-bs-original-title="${this.tip}"><i class="icon-solid icon-question-circle"></i></span>` : ''}
						</label>
						${this.type === 'password' ? html`<button type="button" class="password-toggle" @click=${this.#togglePassword}></button>` : ''}
						<div class="invalid-feedback lh-1 z-1 position-absolute top-100 start-0 end-0 ${classMap({ 'd-block': this.error })}">${this.error || ''}</div>
					</div>
					<slot name="suffix" class="input-group-text ${classMap({ 'd-none':!this.#hasSuffix  })}" @slotchange=${this.#onSlotChange}></slot>
				</div>
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
