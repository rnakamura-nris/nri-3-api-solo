/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("dict", function (table) {
      table.increments();
      table.text("ja").unique().index();
      table.text("en").unique().index();
    })
    .raw(
      `CREATE UNIQUE INDEX i_unique_dict ON dict (ja, (en IS NULL OR en = '')) WHERE en IS NULL OR en = '';`
    )
    .raw(
      `CREATE UNIQUE INDEX i_unique_dict2 ON dict ((ja IS NULL OR ja = ''), en) WHERE ja IS NULL OR ja = '';`
    )
    .raw(
      `CREATE UNIQUE INDEX i_unique_dict3 ON dict ((ja IS NULL OR ja = ''), (en IS NULL OR en = '')) WHERE (ja IS NULL OR ja = '') AND (en IS NULL OR en = '');`
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  knex.schema.dropTable("dict");
};
