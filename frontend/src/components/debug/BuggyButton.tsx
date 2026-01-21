import { useState } from 'react';
import { Button } from '../ui/Button';

export const BuggyButton = () => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('¡Error de prueba simulado!');
  }

  return (
    <Button variant="danger" onClick={() => setShouldError(true)}>
      Simular Error
    </Button>
  );
};
