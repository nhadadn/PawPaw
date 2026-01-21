const path = require('path');

module.exports = {
  // Backend Configuration
  'backend/**/*.ts': (filenames) => {
    // Resolve absolute path to backend's local eslint binary
    // This ensures we use ESLint 8.x with legacy config support
    const cwd = process.cwd();
    const backendDir = path.join(cwd, 'backend');
    const eslintCmd = path.join(backendDir, 'node_modules', '.bin', 'eslint.cmd');
    const configPath = path.join(backendDir, '.eslintrc.json');
    
    return [
      `"${eslintCmd}" --config "${configPath}" --fix ${filenames.map(f => `"${f}"`).join(' ')}`,
      `prettier --write ${filenames.map(f => `"${f}"`).join(' ')}`
    ];
  },

  // Frontend Configuration
  'frontend/**/*.{ts,tsx}': (filenames) => {
    // Resolve absolute path to frontend's local eslint binary
    // This ensures we use ESLint 9.x with flat config support
    const cwd = process.cwd();
    const frontendDir = path.join(cwd, 'frontend');
    const eslintCmd = path.join(frontendDir, 'node_modules', '.bin', 'eslint.cmd');
    const configPath = path.join(frontendDir, 'eslint.config.js');
    
    return [
      `"${eslintCmd}" --config "${configPath}" --fix ${filenames.map(f => `"${f}"`).join(' ')}`,
      `prettier --write ${filenames.map(f => `"${f}"`).join(' ')}`
    ];
  }
};
