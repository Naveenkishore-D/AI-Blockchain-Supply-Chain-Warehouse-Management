const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /return fetch\(url, \{\n\s+\.\.\.options,\n\s+headers\n\s+\}\);/,
  `return fetch(url, {
      ...options,
      headers
    }).then(async r => {
      if (!r.ok && r.status === 401) {
        // Logout if token invalid
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        window.location.reload();
      }
      if (!r.ok) {
        throw new Error("HTTP " + r.status);
      }
      return r;
    });`
);
fs.writeFileSync('src/App.tsx', code);
