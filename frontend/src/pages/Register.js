import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    if (password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      login(data.user, data.token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      setErrors({ form: err.message });
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20}}>
      <Card style={{width: '100%', maxWidth: 420}}>
        <div style={{textAlign: 'center', marginBottom: 24}}>
          <div className="logo" style={{margin: '0 auto 16px', width: 48, height: 48, fontSize: 24}}>TP</div>
          <h1 style={{margin: '0 0 8px', fontSize: 24}}>Create Account</h1>
          <p style={{margin: 0, color: 'var(--text-secondary)'}}>Start trading with TradePro</p>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.form && (
            <div style={{background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: 12, marginBottom: 16, color: 'var(--danger)', fontSize: 14}}>
              {errors.form}
            </div>
          )}

          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            error={errors.name}
            placeholder="John Doe"
            required
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
            required
            autoComplete="email"
            style={{marginTop: 16}}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            minLength={8}
            style={{marginTop: 16}}
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            style={{marginTop: 16}}
          />

          <Button type="submit" variant="primary" fullWidth loading={loading} style={{marginTop: 24}}>
            Create Account
          </Button>
        </form>

        <p style={{textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14}}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}