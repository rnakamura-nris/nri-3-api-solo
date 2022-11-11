const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;

const fixtures = require("./fixtures.js");
const config = require("../knexfile.js");
const knex = require("knex")(config);
const serverModel = require("../src/server_model.js");
const TABLE_NAME = serverModel.TABLE_NAME;
let LastIdNum;

// this enables us to use .should assertions instead of expecct. Personal Preference
chai.should();

/*
 * This sprint you will have to create all tests yourself, TDD style.
 * For this you will want to get familiar with chai-http https://www.chaijs.com/plugins/chai-http/
 * The same kind of structure that you encountered in lecture.express will be provided here.
 */

describe("Model", () => {
  beforeEach(async () => {
    LastIdNum = await knex
      .raw("SELECT nextval('dict_id_seq')")
      .then((req) => {
        return Number(req.rows[0].nextval);
      })
      .catch(() => {
        return 0;
      });
    await knex(TABLE_NAME).insert(fixtures.getSamples());
  });

  afterEach(async () => {
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

  describe("getAll", () => {
    it("should return an array of orders", async () => {
      const { recordsArray } = await serverModel.getAll();
      expect(recordsArray.length).to.eq(5);
      expect(recordsArray).to.be.an.instanceof(Array);
    });
  });

  describe("getById", () => {
    it("should get order by id", async () => {
      const { recordsArray: allItemsArray } = await serverModel.getAll();
      const idNum = allItemsArray[2].id;
      const { recordsArray: assertItemsArray } = await serverModel.getById(
        idNum
      );
      expect(assertItemsArray).to.exist;
      expect(assertItemsArray.length).to.eq(1);
      expect(assertItemsArray[0].id).to.eq(idNum);
    });
  });

  describe("getByContents", () => {
    it("should search from ja column (not empty)", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContents({
          ja: "相棒",
        });
      const { recordsArray: expectedItemsArray } = await serverModel.getById(
        1 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray[0]);
    });

    it("should search from ja column (empty)", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContents({
          ja: "",
        });
      const { recordsArray: expectedItemsArray1 } = await serverModel.getById(
        3 + LastIdNum
      );
      const { recordsArray: expectedItemsArray2 } = await serverModel.getById(
        5 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(2);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray1[0]);
      assertedItemsArray[1].should.deep.equal(expectedItemsArray2[0]);
    });

    it("should search from en column (not empty)", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContents({
          en: "Hunter × Hunter",
        });
      const { recordsArray: expectedItemsArray } = await serverModel.getById(
        2 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray[0]);
    });

    it("should search from ja (not empty) and en (empty) column - Hit", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContents({
          ja: "世界制服をたくらむモララー",
          en: "",
        });
      const { recordsArray: expectedItemsArray } = await serverModel.getById(
        4 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray[0]);
    });

    it("should search from ja (not empty) and en (empty) column - Not Hit", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContents({
          ja: "ダーウィン事変",
          en: "",
        });
      expect(assertedItemsArray).to.not.be.undefined;
      expect(assertedItemsArray.length).to.eq(0);
    });

    it("should search from ja (null) and en (not empty) column", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContents({
          ja: null,
          en: "Homestuck",
        });
      const { recordsArray: expectedItemsArray } = await serverModel.getById(
        3 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray[0]);
    });

    it("should search from ja (empty) and en (empty) column", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContents({
          ja: "",
          en: "",
        });
      const { recordsArray: expectedItemsArray1 } = await serverModel.getById(
        5 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray1[0]);
    });

    it("should search from ja (null) and en (null) column", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContents({
          ja: null,
          en: null,
        });
      const { recordsArray: expectedItemsArray1 } = await serverModel.getById(
        5 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray1[0]);
    });

    it("should search when any column selected", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContents({});
      expect(assertedItemsArray.length).to.eq(5);
    });
  });

  describe("create", () => {
    it("should insert new ja (not empty) and en (not empty)", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.create({
        ja: "ひぐらしのなく頃に",
        en: "When They Cry",
      });
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].id.should.deep.equal(
        LastIdNum + fixtures.getSamples().length + 1
      );
      assertedItemsArray[0].ja.should.deep.equal("ひぐらしのなく頃に");
      assertedItemsArray[0].en.should.deep.equal("When They Cry");
    });

    it("should insert new ja (not empty) and en (empty)", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.create({
        ja: "ナイトメアアナボリズム",
        en: "",
      });
      expect(assertedItemsArray.length).to.eq(1);

      assertedItemsArray[0].id.should.deep.equal(
        LastIdNum + fixtures.getSamples().length + 1
      );
      assertedItemsArray[0].ja.should.deep.equal("ナイトメアアナボリズム");
      expect(assertedItemsArray[0].en).to.be.null;
    });

    it("should insert new ja (null) and en (not empty)", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.create({
        ja: null,
        en: "According to You",
      });
      expect(assertedItemsArray.length).to.eq(1);

      assertedItemsArray[0].id.should.deep.equal(
        LastIdNum + fixtures.getSamples().length + 1
      );
      expect(assertedItemsArray[0].ja).to.be.null;
      assertedItemsArray[0].en.should.deep.equal("According to You");
    });

    it("should insert new ja (not empty)", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.create({
        ja: "ミセス・ノイズィ",
      });
      expect(assertedItemsArray.length).to.eq(1);

      assertedItemsArray[0].id.should.deep.equal(
        LastIdNum + fixtures.getSamples().length + 1
      );
      assertedItemsArray[0].ja.should.deep.equal("ミセス・ノイズィ");
      expect(assertedItemsArray[0].en).to.be.null;
    });

    it("should insert the already exists item (ja: not empty, en: not empty)", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create({
        ja: "世界制服をたくらむモララー",
        en: "The World Uniform Morara",
      });
      expect(assertedItemsArray).to.be.null;
      expect(errorCode).to.eq(23505); // 一意性違反
      expect(errorMsg).not.to.be.null;
    });

    it("should insert the already exists item (ja: not empty, en: empty)", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create({
        ja: "相棒",
        en: "",
      });
      expect(assertedItemsArray).to.be.null;
      expect(errorCode).to.eq(23505); // 一意性違反
      expect(errorMsg).not.to.be.null;
    });

    it("should insert the already exists item (en: null)", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create({
        en: null,
      });
      expect(assertedItemsArray).to.be.null;
      expect(errorCode).to.eq(23505); // 一意性違反
      expect(errorMsg).not.to.be.null;
    });

    it("should insert the already exists item (undefined)", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create({});
      expect(assertedItemsArray).to.be.null;
      expect(errorCode).to.eq(23505); // 一意性違反
      expect(errorMsg).not.to.be.null;
    });
  });
});
