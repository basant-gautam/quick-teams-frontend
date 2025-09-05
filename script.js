document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const findBtn = document.getElementById('findBtn');
  const profileDiv = document.getElementById('profile');
  const teammatesDiv = document.getElementById('teammates');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('fullName').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const skills = Array.from(document.getElementById('skills').selectedOptions).map(opt => opt.value);
      const bio = document.getElementById('bio').value;
      const availability = document.getElementById('availability').value;

      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      const user = { fullName, email, password, skills, bio, availability };
      localStorage.setItem('quickteams_user', JSON.stringify(user));
      alert('Signup successful!');
      window.location.href = 'login.html';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const user = JSON.parse(localStorage.getItem('quickteams_user'));
      if (user && user.email === email && user.password === password) {
        localStorage.setItem('quickteams_loggedin', 'true');
        window.location.href = 'dashboard.html';
      } else {
        alert('Invalid credentials');
      }
    });
  }

  if (profileDiv) {
    const user = JSON.parse(localStorage.getItem('quickteams_user'));
    if (user) {
      profileDiv.innerHTML = `
        <h3>${user.fullName}</h3>
        <p><strong>Skills:</strong> ${user.skills.join(', ')}</p>
        <p><strong>Bio:</strong> ${user.bio}</p>
        <p><strong>Availability:</strong> ${user.availability}</p>
      `;
    }
  }

  if (findBtn) {
    findBtn.addEventListener('click', () => {
      const teammates = [
        { name: 'Alice', skills: ['Python', 'AI'], availability: 'Now' },
        { name: 'Bob', skills: ['Web Dev', 'Design'], availability: 'Later Today' },
        { name: 'Charlie', skills: ['AI', 'Design'], availability: 'This Weekend' }
      ];
      teammatesDiv.innerHTML = teammates.map(tm => `
        <div class="card">
          <h3>${tm.name}</h3>
          <p><strong>Skills:</strong> ${tm.skills.join(', ')}</p>
          <p><strong>Availability:</strong> ${tm.availability}</p>
          <button class="btn">Connect</button>
        </div>
      `).join('');
    });
  }
});
