const knex = require("./knex.js");
const TABLE_NAME = "dict";
const Limit = 256;
const Keys = ["ja", "en"];

module.exports = {
  TABLE_NAME,
  Limit,
  Keys,

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
    if (!Number.isInteger(id)) {
      return {
        recordsArray: null,
        errorCode: -1,
        errorMsg: "query is something wrong.",
      };
    }

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
   * @param {Object} jsonQuery - The item data to select. AN ARRAY IS NOT ACCEPTED.
   * @return {Promise<Object>} A promise that resolves to the item that matches the jsonQuery.
   */
  getByContents(jsonQuery) {
    if (!this.isJson(jsonQuery)) {
      return {
        recordsArray: null,
        errorCode: -1,
        errorMsg: "query is something wrong.",
      };
    }

    let query = knex.select().from(TABLE_NAME);
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
   * @param {Object} queryJson - The item. AN ARRAY AND AND ZERO LENGTH JSON IS NOT ACCEPTED.
   * @return {Object} The parsed item.
   */
  parseJsonQuery(jsonQuery, insertModeEnabled = true) {
    if (!this.isJson(jsonQuery) || Object.keys(jsonQuery).length < 1) {
      return null;
    }

    let newJsonQuery = {},
      hasNotNullValue = false;
    Keys.forEach((key) => {
      if (key in jsonQuery) {
        if (jsonQuery[key] === null || jsonQuery[key] === "") {
          newJsonQuery[key] = null;
        } else {
          newJsonQuery[key] = jsonQuery[key];
          hasNotNullValue = true;
        }
      }
    });

    if (insertModeEnabled && !hasNotNullValue) {
      return null;
    } else if (!insertModeEnabled && Object.keys(newJsonQuery).length < 1) {
      return null;
    }

    return newJsonQuery;
  },

  isJson(target) {
    try {
      let target2;
      if (typeof target !== "string") {
        target2 = JSON.stringify(target);
      } else {
        target2 = target;
      }

      target2 = JSON.parse(target2);
      if (typeof target2 === "object" && target2 !== null) {
        return true;
      }
    } catch {
      return false;
    }

    return false;
  },

  /**
   * de-duplicate items.
   * @param {Array} queryJsonArray - The array of items.
   * @return {Object} The array of deduplicated items.
   */
  deDupJsonQueryArray(jsonQueryArray) {
    if (!Array.isArray(jsonQueryArray)) {
      return null;
    }

    const result = jsonQueryArray.filter((elm, i, self) => {
      if (!this.isJson(elm)) {
        return false;
      }

      const fTmp = self.findIndex((elm2) => {
        if (!this.isJson(elm2)) {
          return false;
        }

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
   * @param {Object | Array} queryJson - The new item data to add. Both array or not is accepted. ZERO LENGTH JSON IS NOT ACCEPTED.
   * @return {Promise<number>} A promise that resolves to the order that was created.
   */
  create(queryJson) {
    let newQueryJsonArray = null;

    if (Array.isArray(queryJson)) {
      newQueryJsonArray = this.deDupJsonQueryArray(
        queryJson.map((elm) => this.parseJsonQuery(elm, true))
      );
    } else {
      const newQueryJson = this.parseJsonQuery(queryJson, true);
      if (newQueryJson) {
        newQueryJsonArray = new Array(newQueryJson);
      }
    }

    // newQueryJsonArrayが空のままinsert句に入力されると成功してしまう可能性があり、違和感のある挙動となりかねないので、事前チェック
    if (!newQueryJsonArray) {
      return {
        recordsArray: null,
        errorCode: -1,
        errorMsg: "query is something wrong.",
      };
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
   * @param {Object} queryJson - The new item data to modify. AN ARRAY AND ZERO LENGTH JSON IS NOT ACCEPTED.
   * @return {Promise<number>} A promise that resolves to the id of the updated item.
   */
  updateById(id, queryJson) {
    const newQueryJson = this.parseJsonQuery(queryJson, false);
    if (!Number.isInteger(id) || !newQueryJson) {
      return {
        recordsArray: null,
        errorCode: -1,
        errorMsg: "query is something wrong.",
      };
    }

    return knex(TABLE_NAME)
      .where("id", "=", id)
      .update(newQueryJson)
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
   * @return {Promise<Object>} A promise that resolves to the item that matches the id.
   */
  deleteById(id) {
    if (!Number.isInteger(id)) {
      return {
        recordsArray: null,
        errorCode: -1,
        errorMsg: "query is something wrong.",
      };
    }

    return knex(TABLE_NAME)
      .delete()
      .where("id", "=", id)
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
          record: null,
          errorCode: Number(err.code),
          errorMsg: err.message,
        };
      });
  },
};
