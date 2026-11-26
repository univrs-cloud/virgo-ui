import * as userService from 'fleet/profile/services/user';

const module = document.querySelector('#profile');

const onClick = async (event) => {
	if (!event.target.closest('a')?.classList.contains('delete-account')) {
		return;
	}

	event.preventDefault();
	if (!await confirm('Are you sure you want to delete your account? The nodes you own are removed from Fleet and their univrs.cloud addresses are released. The groups you created are deleted, and everyone you shared nodes with loses access.', { buttons: [{ text: 'Delete', class: 'btn-solid theme-danger' }], acknowledge: 'I understand this cannot be undone' })) {
		return;
	}

	try {
		const result = await userService.deleteAccount();
		if (result?.status === 'succeeded') {
			window.location.replace('/');
			return;
		}
		notifier.add({ title: result?.message || 'Failed to delete your account.', type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: error.message || 'Failed to delete your account.', type: 'error', duration: 0 });
	}
};

module.addEventListener('click', onClick);
