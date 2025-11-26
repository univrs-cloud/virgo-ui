import { LitElement, html } from 'lit';
import { sheet } from "../styles.js";

export class Textarea extends LitElement {
	static formAssociated = true;

	static get properties() {
		return {
			value: { type: String },
			label: { type: String, reflect: true },
			placeholder: { type: String, reflect: true },
			tip: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true },
			readonly: { type: Boolean, reflect: true },
			error: { type: String },
			isInvalid: { type: Boolean, reflect: true }
		};
	}

	#value = '';
	#error = '';

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
		this.#error = value;
		this.classList.toggle('is-invalid', Boolean(value));
	}
	
	get error() {
		return this.#error;
	}

	formResetCallback() {
		this.value = this.getAttribute('value') ?? '';
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

		this.#updateValueFromLightDOM();
	}

	render() {
		return html`
			<div class="form-floating mb-3">
				<textarea
					.value=${this.value}
					.placeholder=${this.placeholder}
					.disabled=${this.disabled}
					.readonly=${this.readonly}
					class="form-control ${this.error ? 'is-invalid' : ''}"
					@input=${this.#onInput}
				></textarea>
				<label>
					${this.label}
					${this.tip ? html`<span class="help-inline ms-1" data-bs-toggle="tooltip" data-bs-original-title=${this.tip}><i class="icon-solid icon-question-circle"></i></span>` : ''}
				</label>
				<div class="invalid-feedback">${this.error || ''}</div>
			</div>
		`;
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
