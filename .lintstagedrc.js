const path = require('path');

module.exports = {
  // Backend Configuration
  'backend/**/*.ts': (filenames) => {
    // Resolve absolute path to backend's local eslint binary
    // This ensures we use ESLint 8.x with legacy config support
    const cwd = process.cwd();
    const eslintCmd = path.join(cwd, 'backend', 'node_modules', '.bin', 'eslint.cmd');
    
    return [
      `"${eslintCmd}" --fix ${filenames.map(f => `"${f}"`).join(' ')}`,
      `prettier --write ${filenames.map(f => `"${f}"`).join(' ')}`
    ];
  },

  // Frontend Configuration
  'frontend/**/*.{ts,tsx}': (filenames) => {
    // Resolve absolute path to frontend's local eslint binary
    // This ensures we use ESLint 9.x with flat config support
    const cwd = process.cwd();
    const eslintCmd = path.join(cwd, 'frontend', 'node_modules', '.bin', 'eslint.cmd');
    
    return [
      `"${eslintCmd}" --fix ${filenames.map(f => `"${f}"`).join(' ')}`,
      `prettier --write ${filenames.map(f => `"${f}"`).join(' ')}`
    ];
  }
};
