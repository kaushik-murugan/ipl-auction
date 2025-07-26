import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css'; // Importing the styles

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Please fill all fields');
      return;
    }

    // Simulate user signup and move to login page on successful signup
    const user = { email, password, name };
    localStorage.setItem('user', JSON.stringify(user)); // Store user data
    setError('');
    navigate('/login'); // Navigate to login page after signup
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2>Sign Up</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
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
          <button type="submit" className="submit-button">Sign Up</button>
        </form>
        <p>
          Already have an account? <a href="/login" className="link">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
