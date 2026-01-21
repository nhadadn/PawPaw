const path = require('path');

module.exports = {
  // Backend Configuration
  'backend/**/*.ts': (filenames) => {
    // We need to run eslint relative to the backend directory or using prefix
    // Using --prefix allows running the script in the sub-project context
    // We pass absolute paths, which ESLint should handle
    return [
      `npm exec --prefix backend -- eslint --fix ${filenames.map(f => `"${f}"`).join(' ')}`,
      `prettier --write ${filenames.map(f => `"${f}"`).join(' ')}`
    ];
  },

  // Frontend Configuration
  'frontend/**/*.{ts,tsx}': (filenames) => {
    return [
      `npm exec --prefix frontend -- eslint --fix ${filenames.map(f => `"${f}"`).join(' ')}`,
      `prettier --write ${filenames.map(f => `"${f}"`).join(' ')}`
    ];
  }
};
