const DB = require('../config/database');

module.exports = class User {

    /**
     * @param {Number} id
     *
     * @return {Promise<Object|null>}
     */
    static async findById(id) {
        return await this._getSingleResult('select * from users where id = $1', [ id ]);
    }

    /**
     * @param {String|Number} id
     *
     * @return {Promise<Object|null>}
     */
    static async findByIdentifier(id) {
        return await this.findBy([ 'username', 'email' ], id);
    }

    /**
     * @param {String[]} fields
     * @param {*} value
     *
     * @return {Promise<Object|null>}
     */
    static async findBy(fields, value) {
        const queryFields = fields.map((field) => `${ field } = $1`).join(' or ');

        const query = `
          select *
          from users
          where ${ queryFields }
        `;

        return await this._getSingleResult(query, [ value ]);
    }

    /**
     * @param {String} query
     * @param {Array} params
     *
     * @return {Promise<Array.<Object|null>>}
     * @private
     */
    static async _getResults(query, params) {
        const { rows } = await DB.query(query, params);

        return rows;
    }

    /**
     * @param {String} query
     * @param {Array} params
     *
     * @return {Promise<Object|null>}
     * @private
     */
    static async _getSingleResult(query, params) {
        const [ data = null ] = await this._getResults(query, params);

        return data;
    }

};
