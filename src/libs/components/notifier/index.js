import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { sheet } from "../styles.js";

export class Notifier extends LitElement {
	static styles = [sheet];

	static properties = {
		toasts: { state: true }
	};

	#idCounter = 0;

	constructor() {
		super();
		this.toasts = [];
		
		// Make globally accessible
		window.notifier = this;
	}

	add(options = {}) {
		const id = `toast-${++this.#idCounter}`;
		const duration = options.duration ?? 5000;
		const toast = {
			id: options.id || id,
			type: options.type || 'info',
			title: options.title || '',
			message: options.message || '',
			duration,
			dismissible: options.dismissible ?? true,
		};
		
		this.toasts = [...this.toasts, toast];
		
		return {
			id,
			update: (opts) => {
				this.updateToast(id, opts);
				return ref;
			},
			remove: () => this.removeToast(id),
		};
	}

	updateToast(id, options) {
		// Update internal state first (don't trigger re-render, just update the data)
		const index = this.toasts.findIndex((toast) => { return toast.id === id; });
		if (index !== -1) {
			// Mutate in place to avoid triggering full re-render
			Object.assign(this.toasts[index], options);
		}
		
		// Then update the toast item directly
		const toastItem = this.renderRoot.querySelector(`u-toast[toastId="${id}"]`);
		if (toastItem) {
			toastItem.updateOptions(options);
		}
	}

	removeToast(id) {
		const toastItem = this.renderRoot.querySelector(`u-toast[toastId="${id}"]`);
		if (toastItem) {
			toastItem.hide();
		}
	}

	clearAll() {
		const toastItems = this.renderRoot.querySelectorAll('u-toast');
		toastItems.forEach((item) => { item.hide(); });
	}

	render() {
		return html`
			<div class="toast-container position-fixed bottom-0 end-0 p-3 pb-5 pb-md-3 mb-5 mb-md-0">
				${repeat(
					this.toasts,
					toast => toast.id,
					toast => html`
						<u-toast
							toastId=${toast.id}
							.type=${toast.type}
							.title=${toast.title}
							.message=${toast.message}
							.dismissible=${toast.dismissible}
							.duration=${toast.duration}
							@toast-hidden=${this.#handleToastHidden}
						></u-toast>
					`
				)}
			</div>
		`;
	}

	#handleToastHidden = (event) => {
		const id = event.detail.id;
		this.toasts = this.toasts.filter((toast) => { return toast.id !== id; });
	};
}

customElements.define('u-notifier', Notifier);
