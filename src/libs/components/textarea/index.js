import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from "../styles.js";

export class Textarea extends LitElement {
	static formAssociated = true;
	static styles = [sheet];

	static get properties() {
		return {
			value: { type: String },
			label: { type: String, reflect: true },
			placeholder: { type: String, reflect: true },
			tip: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true },
			readonly: { type: Boolean, reflect: true },
			error: { type: String }
		};
	}

	#value = '';
	#error = '';
	#initialValue = '';
	#initialDisabled = false;
	#initialReadonly = false;

	constructor() {
		super();
		this.internals = this.attachInternals();
		this.label = '';
		this.placeholder = '';
		this.tip = '';
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
	}

	firstUpdated() {
		const label = this.renderRoot.querySelector('label');
		if (label) {
			new bootstrap.Tooltip(label);
		}

		this.#updateValueFromLightDOM();
	}

	render() {
		return html`
			<div class="mb-4">
				<div class="form-floating">
					<textarea
						class="form-control ${classMap({ 'is-invalid': this.error })}"
						placeholder=${this.placeholder}
						.value=${this.value}
						?disabled=${this.disabled}
						?readonly=${this.readonly}
						@input=${this.#onInput}
					></textarea>
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
		this.renderRoot.querySelector('textarea').focus();
	}

	#onInput(event) {
		this.value = event.target.value;
	}

	#updateValueFromLightDOM() {
		this.value = this.textContent.trim();
		this.textContent = '';
	}
}

customElements.define('u-textarea', Textarea);
