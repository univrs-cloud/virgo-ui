async function signup({ email, password, fullname }) {
	const response = await fetch('/auth/signup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'same-origin',
		body: JSON.stringify({ email, password, displayName: fullname })
	});
	const data = await response.json();
	if (!response.ok || !data?.ok) {
		throw new Error(data?.error || 'Signup failed');
	}
}

async function login(email, password) {
	const response = await fetch('/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'same-origin',
		body: JSON.stringify({ email, password })
	});
	const data = await response.json();
	if (!response.ok || !data?.ok) {
		throw new Error(data?.error || 'Login failed');
	}
}

async function logout() {
	await fetch('/auth/logout', {
		method: 'POST',
		credentials: 'same-origin'
	});
}

export {
	signup,
	login,
	logout
};
