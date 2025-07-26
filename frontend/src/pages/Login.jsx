import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css'; // Importing the styles

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!storedUser || storedUser.email !== email || storedUser.password !== password) {
      setError('Invalid credentials. Please try again.');
      return;
    }

    setError('');
    navigate('/dashboard');
    // Navigate to Home after login
    localStorage.setItem('loggedIn', 'true');
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="submit-button">Login</button>
        </form>
        <p>
          Don't have an account? <a href="/signup" className="link">Sign up here</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
