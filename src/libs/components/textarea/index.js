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
			error: { type: String }
		};
	}

	constructor() {
		super();
		this.internals = this.attachInternals();

		this.value = '';
		this.label = '';
		this.placeholder = '';
		this.tip = '';
		this.disabled = false;
		this.readonly = false;
		this.error = '';
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

		this._updateValueFromLightDOM();
	}

	updated(changedProps) {
		const root = this.renderRoot;
		const textarea = root.querySelector('textarea');
		const feedback = root.querySelector('.invalid-feedback');
		textarea.value = this.value;
		textarea.placeholder = this.placeholder;
		textarea.disabled = this.disabled;
		textarea.readOnly = this.readonly;

		if (feedback) {
			if (this.error) {
				textarea.classList.add('is-invalid');
				feedback.textContent = this.error;
			} else {
				textarea.classList.remove('is-invalid');
				feedback.textContent = '';
			}
		}
	}

	render() {
		return html`
			<div class="form-floating mb-3">
				<textarea
					.value=${this.value}
					.placeholder=${this.placeholder}
					.disabled=${this.disabled}
					.readonly=${this.readonly}
					class="form-control"
					@input=${this._onInput}
				></textarea>
				<label>
					${this.label}
					${this.tip ? html`<span class="help-inline ms-1" data-bs-toggle="tooltip" data-bs-original-title=${this.tip}><i class="icon-solid icon-question-circle"></i></span>` : ''}
				</label>
				<div class="invalid-feedback"></div>
			</div>
		`;
	}

	_onInput(event) {
		this.value = event.target.value;
		this.internals.setFormValue(this.value);
		this.dispatchEvent(new CustomEvent('value-changed', { detail: this.value }));
	}

	_updateValueFromLightDOM() {
		this.value = this.textContent.trim();
		this.internals.setFormValue(this.value);
		this.textContent = '';
	}
}

customElements.define('u-textarea', Textarea);
