document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Store in localStorage (placeholder)
    localStorage.setItem('nailreal_user', username);

    // Show coming soon
    document.getElementById('comingSoon').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
});
