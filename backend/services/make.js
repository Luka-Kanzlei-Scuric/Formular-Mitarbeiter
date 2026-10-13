const axios = require('axios');

async function deliver(config, kind, data) {
    if (!config.webhooksEnabled) return { status: 'disabled' };
    try {
        const response = await axios.post(kind === 'update' ? config.updateWebhook : config.pkontoWebhook, data, {
            timeout: 15000, maxRedirects: 0, maxContentLength: 64 * 1024, maxBodyLength: 512 * 1024,
            headers: { 'Content-Type': 'application/json' },
        });
        return { status: 'accepted', httpStatus: response.status };
    } catch {
        // Axios error objects can contain URL secrets and complete form bodies.
        console.error(JSON.stringify({ event: 'make_delivery_failed', kind }));
        return { status: 'failed' };
    }
}
module.exports = { deliver };
