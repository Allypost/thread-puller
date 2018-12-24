const { Pool } = require('pg');

const pool = new Pool();

module.exports = {
    /**
     * @param {String} text
     * @param {Array} params
     * @return {*}
     */
    query: (text, params = []) => pool.query(text, params),
};
