import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      login(data.user, data.token);
      toast.success('Welcome back!');
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
          <h1 style={{margin: '0 0 8px', fontSize: 24}}>Welcome Back</h1>
          <p style={{margin: 0, color: 'var(--text-secondary)'}}>Sign in to your trading account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.form && (
            <div style={{background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 8, padding: 12, marginBottom: 16, color: 'var(--danger)', fontSize: 14}}>
              {errors.form}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            style={{marginTop: 16}}
          />

          <Button type="submit" variant="primary" fullWidth loading={loading} style={{marginTop: 24}}>
            Sign In
          </Button>
        </form>

        <p style={{textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14}}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </Card>
    </div>
  );
}