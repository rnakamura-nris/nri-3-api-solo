const chai = require("chai");

const fixtures = require("./fixtures.js");
const config = require("../knexfile.js");
const knex = require("knex")(config);
const serverModel = require("../src/server_model.js");
const TABLE_NAME = serverModel.TABLE_NAME;

// this enables us to use .should assertions instead of expecct. Personal Preference
chai.should();

/*
 * This sprint you will have to create all tests yourself, TDD style.
 * For this you will want to get familiar with chai-http https://www.chaijs.com/plugins/chai-http/
 * The same kind of structure that you encountered in lecture.express will be provided here.
 */

// TODO: テスト後に何故かコンソールが無応答になるが、後ほど直す
describe("Model", () => {
  before(async () => {
    await knex(TABLE_NAME).insert(fixtures.getSample1());
    await knex(TABLE_NAME).insert(fixtures.getSample2());
    await knex(TABLE_NAME).insert(fixtures.getSample3());
    await knex(TABLE_NAME).insert(fixtures.getSample4());
    await knex(TABLE_NAME).insert(fixtures.getSample5());
  });

  after(async () => {
    await knex
      .from(TABLE_NAME)
      .del()
      .catch((error) => console.error(error));
  });

  describe("setup", () => {
    it("should connect to database", () => {
      knex.raw("select 1 as result").catch(() => {
        assert.fail("unable to connect to database");
      });
    });

    it("has run the initial migration", () => {
      knex(TABLE_NAME)
        .select()
        .catch(() => assert.fail("dict table is not found."));
    });
  });
});
