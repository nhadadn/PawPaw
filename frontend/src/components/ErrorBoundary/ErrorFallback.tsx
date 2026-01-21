import { Button } from '../ui/Button';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm m-4 animate-in fade-in zoom-in duration-300">
      <div className="p-4 bg-red-50 rounded-full mb-6">
        <AlertTriangle className="w-12 h-12 text-red-500" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mb-2">¡Ups! Algo salió mal</h2>

      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
        Lo sentimos, ha ocurrido un error inesperado. Hemos registrado el problema y nuestro equipo
        técnico lo revisará.
      </p>

      {/* Solo mostramos el error técnico en desarrollo */}
      {import.meta.env.DEV && error && (
        <div className="w-full max-w-lg p-4 mb-6 bg-red-50 border border-red-100 rounded-lg text-left overflow-auto max-h-60 mx-auto shadow-inner">
          <p className="font-mono text-xs text-red-800 break-words whitespace-pre-wrap">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {resetErrorBoundary && (
          <Button
            onClick={resetErrorBoundary}
            variant="primary"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Intentar de nuevo
          </Button>
        )}

        <Button
          onClick={() => (window.location.href = '/')}
          variant="outline"
          leftIcon={<Home className="w-4 h-4" />}
        >
          Ir al inicio
        </Button>
      </div>
    </div>
  );
};
