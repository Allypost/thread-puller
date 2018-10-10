const web = require('./threadpuller-web.config').apps.pop();
const api = require('./threadpuller-api.config').apps.pop();
const presence = require('./threadpuller-presence.config').apps.pop();

module.exports = {
    apps: [ web, api, presence ],
};
