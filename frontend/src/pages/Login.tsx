import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800">
        <h1 className="text-3xl font-bold font-display text-center mb-8 text-neutral-900 dark:text-white">
          Iniciar Sesión
        </h1>

        {error && (
          <div className="mb-6">
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Entrar
          </Button>

          <div className="text-center text-sm text-neutral-800 dark:text-neutral-300">
            <p>Demo Credentials:</p>
            <p>user@example.com / password</p>
          </div>
        </form>
      </div>
    </div>
  );
}
