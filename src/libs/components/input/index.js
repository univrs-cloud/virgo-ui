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
			error: { type: String }
		};
	}

	constructor() {
		super();
		this.internals = this.attachInternals();

		this.showPassword = false;
		this.type = 'text';
		this.value = '';
		this.label = '';
		this.placeholder = '';
		this.tip = '';
		this.disabled = false;
		this.readonly = false;
		this.autocomplete = '';
		this.error = '';
	}

	createRenderRoot() {
		const root = super.createRenderRoot();
		root.adoptedStyleSheets = [sheet];
		return root;
	}

	firstUpdated() {
		this.internals.setFormValue(this.value);
		const label = this.renderRoot.querySelector('label');
		if (label) {
			new bootstrap.Tooltip(label);
		}
	}

	updated(changedProps) {
		const root = this.renderRoot;
		const input = root.querySelector('input');
		const feedback = root.querySelector('.invalid-feedback');
		if (this.type === 'password') {
			input.type = this.showPassword ? 'text' : 'password';
		} else {
			input.type = this.type;
		}
		input.value = this.value;
		input.placeholder = this.placeholder;
		input.autocomplete = this.autocomplete;
		input.readOnly = this.readonly;
		input.disabled = this.disabled;

		if (feedback) {
			if (this.error) {
				input.classList.add('is-invalid');
				feedback.textContent = this.error;
			} else {
				input.classList.remove('is-invalid');
				feedback.textContent = '';
			}
		}
	}

	render() {
		if (this.type === 'hidden') {
			return html`
				<input
					.type=${this.type}
					.name=${this.name}
					.value=${this.value}
				/>
			`;
		}

		return html`
			<div class="form-floating mb-3">
				<input
					.type=${this.type}
					.value=${this.value}
					.placeholder=${this.placeholder}
					.disabled=${this.disabled}
					.readonly=${this.readonly}
					.autocomplete=${this.autocomplete}
					class="form-control ${this.type === 'passwprd' ? 'password-input' : ''}"
					@input=${this._onInput}
				/>
				<label>
					${this.label}
					${this.tip ? html`<span class="help-inline ms-1" data-bs-toggle="tooltip" data-bs-original-title=${this.tip}><i class="icon-solid icon-question-circle"></i></span>` : ''}
				</label>
				<div class="invalid-feedback"></div>
				${this.type === 'password' ? html`<button type="button" class="password-toggle" @click=${this._togglePassword}></button>` : ''}
			</div>
		`;
	}

	_onInput(event) {
		this.value = event.target.value || '';
		this.internals.setFormValue(this.value);
		this.dispatchEvent(new CustomEvent('value-changed', { detail: this.value }));
	}

	_togglePassword(event) {
		event.preventDefault();
		this.showPassword = !this.showPassword;
		const input = this.renderRoot.querySelector('input');
		input.type = this.showPassword ? 'text' : 'password';
		input.focus();
	}
}

customElements.define('u-input', Input);
