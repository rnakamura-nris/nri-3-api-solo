const { query, json } = require("express");
const knex = require("./knex.js");
const TABLE_NAME = "dict";
const Limit = 256;
const Keys = ["ja", "en"];

module.exports = {
  TABLE_NAME,
  Limit,

  /**
   * @return {Promise<Array>} A promise that resolves to an array of items.
   */
  getAll() {
    return knex
      .select()
      .from(TABLE_NAME)
      .limit(Limit)
      .then((res) => {
        return {
          recordsArray: res,
          errorCode: null,
          errorMsg: null,
        };
      })
      .catch((err) => {
        return {
          recordsArray: null,
          errorCode: Number(err.code),
          errorMsg: err.message,
        };
      });
  },

  /**
   * @param {number} id - The item's id.
   * @return {Promise<Object>} A promise that resolves to the item that matches the id.
   */
  getById(id) {
    return knex
      .select()
      .from(TABLE_NAME)
      .where("id", "=", id)
      .limit(Limit)
      .then((res) => {
        return {
          recordsArray: res,
          errorCode: null,
          errorMsg: null,
        };
      })
      .catch((err) => {
        return {
          recordsArray: null,
          errorCode: Number(err.code),
          errorMsg: err.message,
        };
      });
  },

  /**
   * @param {Object} jsonQuery - The new item data to add. AN ARRAY IS NOT ACCEPTED.
   * @return {Promise<Object>} A promise that resolves to the item that matches the id.
   */
  getByContents(jsonQuery) {
    let query = knex.select().from(TABLE_NAME);

    // 後述のparseJsonQueryと共通の処理あり。可読性優先で、callback利用による共通化は行わない
    Keys.forEach((key) =>
      query.where((qb) => {
        if (key in jsonQuery === false) {
          qb.whereRaw("1=1"); // ループの結果、全件空だとwhere句が空になりエラーが出るため、ダミーで入れておく
        } else if (jsonQuery[key] === null || jsonQuery[key] === "") {
          qb.whereNull(key).orWhere(key, "");
        } else {
          qb.whereLike(key, `%${jsonQuery[key]}%`);
        }
      })
    );

    // SQL周りが若干ややこしいので、コメントアウトでデバッグできるようにしておく
    // console.debug(query.toSQL());

    return query
      .limit(Limit)
      .then((res) => {
        return {
          recordsArray: res,
          errorCode: null,
          errorMsg: null,
        };
      })
      .catch((err) => {
        return {
          recordsArray: null,
          errorCode: Number(err.code),
          errorMsg: err.message,
        };
      });
  },

  /**
   * Parse jsonQuery for INSERT or UPDATE.
   * @param {Object} queryJson - The item. AN ARRAY IS NOT ACCEPTED.
   * @return {Object} The parsed item.
   */
  parseJsonQuery(jsonQuery) {
    let newJsonQuery = {};

    Keys.forEach((key) => {
      if (key in jsonQuery) {
        if (jsonQuery[key] === null || jsonQuery[key] === "") {
          newJsonQuery[key] = null;
        } else {
          newJsonQuery[key] = jsonQuery[key];
        }
      }
    });

    return newJsonQuery;
  },

  /**
   * de-duplicate items.
   * @param {Array} queryJsonArray - The array of items.
   * @return {Object} The array of deduplicated items.
   */
  deDupJsonQueryArray(jsonQueryArray) {
    const result = jsonQueryArray.filter((elm, i, self) => {
      const fTmp = self.findIndex((elm2) => {
        let fiTmp = true;
        Keys.forEach((key) => {
          fiTmp = fiTmp && elm2[key] === elm[key];
        });
        return fiTmp;
      });
      return fTmp === i;
    });

    return result;
  },

  /**
   * Create a new order.
   * @param {Object | Array} queryJson - The new item data to add. Both array or not is accepted.
   * @return {Promise<number>} A promise that resolves to the order that was created.
   */
  create(queryJson) {
    let newQueryJsonArray = new Array();

    if (Array.isArray(queryJson)) {
      newQueryJsonArray = this.deDupJsonQueryArray(
        queryJson.map((elm) => this.parseJsonQuery(elm))
      );

      //newQueryJsonArray = queryJson.map((elm) => this.parseJsonQuery(elm));
    } else {
      newQueryJsonArray.push(this.parseJsonQuery(queryJson));
    }

    return knex(TABLE_NAME)
      .insert(newQueryJsonArray)
      .returning("*")
      .then((res) => {
        return {
          recordsArray: res,
          errorCode: null,
          errorMsg: null,
        };
      })
      .catch((err) => {
        return {
          recordsArray: null,
          errorCode: Number(err.code),
          errorMsg: err.message,
        };
      });
  },

  /**
   * @param {number} id - The item's id.
   * @param {Object} queryJson - The new item data to modify. AN ARRAY IS NOT ACCEPTED.
   * @return {Promise<number>} A promise that resolves to the id of the updated item.
   */
  update(id, queryJson) {},
};
