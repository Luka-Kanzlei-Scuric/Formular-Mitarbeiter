// Export a tools config to stdout ONLY inside the container into a protected file.
const password = require('fs').readFileSync('/run/secrets/mongo_admin_password', 'utf8').trim();
print(JSON.stringify({ uri: `mongodb://admin:${encodeURIComponent(password)}@127.0.0.1:27017/?authSource=admin&directConnection=true` }));
