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
    it("should get item", async () => {
      const { recordsArray: assertItemsArray } = await serverModel.getById(
        2 + LastIdNum
      );
      expect(assertItemsArray).to.exist;
      expect(assertItemsArray.length).to.eq(1);
      expect(assertItemsArray[0].id).to.eq(2 + LastIdNum);
    });

    it("shouldn't get item when non-existent id is specified", async () => {
      const { recordsArray: assertItemsArray } = await serverModel.getById(-1);
      expect(assertItemsArray.length).to.eq(0);
    });

    it("shouldn't get item when the type of id is wrong.", async () => {
      const {
        recordsArray: assertItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.getById("a");
      expect(assertItemsArray).to.null;
      expect(errorCode).to.eq(-1); // Model????????????????????????????????????
      expect(errorMsg).not.to.null;
    });
  });

  describe("getByContentsLike", () => {
    it("should search from ja column (not empty)", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContentsLike({
          ja: "??????",
        });
      const { recordsArray: expectedItemsArray } = await serverModel.getById(
        1 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray[0]);
    });

    it("should search from ja column (empty)", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContentsLike({
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
        await serverModel.getByContentsLike({
          en: "Hunter ?? Hunter",
        });
      const { recordsArray: expectedItemsArray } = await serverModel.getById(
        2 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray[0]);
    });

    it("should search from ja (not empty) and en (empty) column - Hit", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContentsLike({
          ja: "???????????????????????????????????????",
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
        await serverModel.getByContentsLike({
          ja: "?????????????????????",
          en: "",
        });
      expect(assertedItemsArray).to.not.be.undefined;
      expect(assertedItemsArray.length).to.eq(0);
    });

    it("should search from ja (null) and en (not empty) column", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContentsLike({
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
        await serverModel.getByContentsLike({
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
        await serverModel.getByContentsLike({
          ja: null,
          en: null,
        });
      const { recordsArray: expectedItemsArray1 } = await serverModel.getById(
        5 + LastIdNum
      );
      expect(assertedItemsArray.length).to.eq(1);
      assertedItemsArray[0].should.deep.equal(expectedItemsArray1[0]);
    });

    it("should search when the zero length object is specified", async () => {
      const { recordsArray: assertedItemsArray } =
        await serverModel.getByContentsLike({});
      expect(assertedItemsArray.length).to.eq(5);
    });

    it("shouldn't search when wrong query is specified", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.getByContentsLike("a");
      expect(assertedItemsArray).to.null;
      expect(errorCode).to.eq(-1); // Model????????????????????????????????????
      expect(errorMsg).not.to.null;
    });
  });

  describe("create", () => {
    it("should insert new ja (not empty) and en (not empty)", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.create({
        ja: "???????????????????????????",
        en: "When They Cry",
      });
      expect(assertedItemsArray.length).to.eq(1);
      expect(assertedItemsArray[0].id).to.eq(
        LastIdNum + fixtures.getSamples().length + 1
      );
      expect(assertedItemsArray[0].ja).to.eq("???????????????????????????");
      expect(assertedItemsArray[0].en).to.eq("When They Cry");
    });

    it("should insert new ja (not empty) and en (empty)", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.create({
        ja: "?????????????????????????????????",
        en: "",
      });
      expect(assertedItemsArray.length).to.eq(1);

      expect(assertedItemsArray[0].id).to.eq(
        LastIdNum + fixtures.getSamples().length + 1
      );
      expect(assertedItemsArray[0].ja).to.eq("?????????????????????????????????");
      expect(assertedItemsArray[0].en).to.null;
    });

    it("should insert new ja (null) and en (not empty)", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.create({
        ja: null,
        en: "According to You",
      });
      expect(assertedItemsArray.length).to.eq(1);

      expect(assertedItemsArray[0].id).to.eq(
        LastIdNum + fixtures.getSamples().length + 1
      );
      expect(assertedItemsArray[0].ja).to.null;
      expect(assertedItemsArray[0].en).to.eq("According to You");
    });

    it("should insert new ja (not empty) only", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.create({
        ja: "????????????????????????",
      });
      expect(assertedItemsArray.length).to.eq(1);

      expect(assertedItemsArray[0].id).to.eq(
        LastIdNum + fixtures.getSamples().length + 1
      );
      expect(assertedItemsArray[0].ja).to.eq("????????????????????????");
      expect(assertedItemsArray[0].en).to.null;
    });

    it("shouldn't insert the zero length object", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create({});
      expect(assertedItemsArray).to.null;
      expect(errorCode).to.eq(-1); // Model????????????????????????????????????
      expect(errorMsg).not.to.null;
    });

    it("shouldn't insert item when wrong query is specified", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create("a");
      expect(assertedItemsArray).to.null;
      expect(errorCode).to.eq(-1); // Model????????????????????????????????????
      expect(errorMsg).not.to.null;
    });

    it("shouldn't insert the already exists item (ja: not empty, en: not empty)", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create({
        ja: "???????????????????????????????????????",
        en: "The World Uniform Morara",
      });
      expect(assertedItemsArray).to.null;
      expect(errorCode).to.eq(23505); // ???????????????
      expect(errorMsg).not.to.null;
    });

    it("shouldn't insert the already exists item (ja: not empty, en: empty)", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create({
        ja: "??????",
        en: "",
      });
      expect(assertedItemsArray).to.null;
      expect(errorCode).to.eq(23505); // ???????????????
      expect(errorMsg).not.to.null;
    });

    it("shouldn't insert the all null object", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create({
        en: null,
      });
      expect(assertedItemsArray).to.null;
      expect(errorCode).to.eq(-1); // Model????????????????????????????????????
      expect(errorMsg).not.to.null;
    });

    it("should insert the array within deplication item.", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.create([
        {
          ja: "???????????????-MASHLE-",
          en: "Mashle: Magic and Muscles",
        },
        {
          ja: "?????? ??????????????????????????????",
          en: "A Certain Magical Index: Genesis Testament",
        },
        {
          ja: "???????????????-MASHLE-",
          en: "Mashle: Magic and Muscles",
        },
      ]);
      expect(assertedItemsArray.length).to.eq(2);

      expect(assertedItemsArray[0].id).to.eq(
        LastIdNum + fixtures.getSamples().length + 1
      );
      expect(assertedItemsArray[0].ja).to.eq("???????????????-MASHLE-");
      expect(assertedItemsArray[0].en).to.eq("Mashle: Magic and Muscles");
      expect(assertedItemsArray[1].id).to.eq(
        LastIdNum + fixtures.getSamples().length + 2
      );
      expect(assertedItemsArray[1].ja).to.eq("?????? ??????????????????????????????");
      expect(assertedItemsArray[1].en).to.eq(
        "A Certain Magical Index: Genesis Testament"
      );
    });
  });

  describe("updateById", () => {
    it("should update item when existed id and ja is specified", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.updateById(
        LastIdNum + 1,
        {
          ja: "???????????????????????????????????????",
        }
      );
      expect(assertedItemsArray.length).to.eq(1);
      expect(assertedItemsArray[0].id).to.eq(LastIdNum + 1);
      expect(assertedItemsArray[0].ja).to.eq("???????????????????????????????????????");
      expect(assertedItemsArray[0].en).to.eq("AIBOU: Tokyo Detective Duo");
    });

    it("should update item when existed id and en is specified", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.updateById(
        LastIdNum + 1,
        {
          en: "Cities: Skylines",
        }
      );
      expect(assertedItemsArray[0].id).to.eq(LastIdNum + 1);
      expect(assertedItemsArray[0].ja).to.eq("??????");
      expect(assertedItemsArray[0].en).to.eq("Cities: Skylines");
    });

    it("should update item when existed id and the pair of (ja, en:empty) is specified", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.updateById(
        LastIdNum + 1,
        {
          ja: "???????????????????????????????????????",
          en: "",
        }
      );
      expect(assertedItemsArray.length).to.eq(1);
      expect(assertedItemsArray[0].id).to.eq(LastIdNum + 1);
      expect(assertedItemsArray[0].ja).to.eq("???????????????????????????????????????");
      expect(assertedItemsArray[0].en).to.null;
    });

    it("should update item when existed id and the pair of (ja:null, en) is specified", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.updateById(
        LastIdNum + 2,
        {
          ja: null,
          en: "Horrorrune",
        }
      );
      expect(assertedItemsArray.length).to.eq(1);
      expect(assertedItemsArray[0].id).to.eq(LastIdNum + 2);
      expect(assertedItemsArray[0].ja).to.null;
      expect(assertedItemsArray[0].en).to.eq("Horrorrune");
    });

    it("should update item when existed id and the pair of (ja, en) is specified", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.updateById(
        LastIdNum + 3,
        {
          ja: "????????????",
          en: "World of Light",
        }
      );
      expect(assertedItemsArray.length).to.eq(1);
      expect(assertedItemsArray[0].id).to.eq(LastIdNum + 3);
      expect(assertedItemsArray[0].ja).to.eq("????????????");
      expect(assertedItemsArray[0].en).to.eq("World of Light");
    });

    // insert?????????????????????????????????
    it("should update item when existed id and the pair of (ja:null, en:empty) is specified", async () => {
      await serverModel.updateById(LastIdNum + 5, {
        ja: "dummy",
        en: "dummy",
      }); // ???????????????????????????????????????????????????????????????????????????
      const { recordsArray: assertedItemsArray } = await serverModel.updateById(
        LastIdNum + 4,
        {
          ja: null,
          en: "",
        }
      );
      expect(assertedItemsArray.length).to.eq(1);
      expect(assertedItemsArray[0].id).to.eq(LastIdNum + 4);
      expect(assertedItemsArray[0].ja).to.null;
      expect(assertedItemsArray[0].en).to.null;
    });

    it("shouldn't update item when non-existed id is specified", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.updateById(-1, {
        ja: "?????????????????????",
        en: "Chainsaw Man",
      });
      expect(assertedItemsArray.length).to.eq(0);
      expect(errorCode).to.null;
      expect(errorMsg).to.null;
    });

    it("shouldn't update item when the type of id is wrong.", async () => {
      const {
        recordsArray: assertItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.updateById("a", {
        ja: "????????????????????????",
        en: "Suzume no Tojimari",
      });
      expect(assertItemsArray).to.null;
      expect(errorCode).to.eq(-1); // Model????????????????????????????????????
      expect(errorMsg).not.to.null;
    });

    it("shouldn't update item when zero length object is specidifed as query", async () => {
      await serverModel.updateById(LastIdNum + 5, {
        ja: "dummy",
        en: "dummy",
      }); // ??????????????????????????????????????????????????????????????????
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.updateById(LastIdNum + 4, {});
      expect(assertedItemsArray).to.null;
      expect(errorCode).to.eq(-1); // Model????????????????????????????????????
      expect(errorMsg).not.to.null;
    });

    it("shouldn't update item when wrong query is specified", async () => {
      const {
        recordsArray: assertedItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.updateById(LastIdNum + 1, [
        {
          ja: "????????????",
          en: "Demon Slayer: Kimetsu no Yaiba",
        },
        {
          ja: "??????????????????",
          en: "A Spirit of the Sun",
        },
      ]);
      expect(assertedItemsArray).to.null;
      expect(errorCode).to.eq(-1); // Model????????????????????????????????????
      expect(errorMsg).not.to.null;
    });
  });

  describe("deleteById", () => {
    it("should delete item", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.deleteById(
        LastIdNum + 1
      );
      expect(assertedItemsArray.length).to.eq(1);
      expect(assertedItemsArray[0].id).to.eq(LastIdNum + 1);
      expect(assertedItemsArray[0].ja).to.eq("??????");
      expect(assertedItemsArray[0].en).to.eq("AIBOU: Tokyo Detective Duo");
    });

    it("shouldn't delete item when non-existent id is specified", async () => {
      const { recordsArray: assertedItemsArray } = await serverModel.deleteById(
        -1
      );
      expect(assertedItemsArray.length).to.eq(0);
    });

    it("shouldn't delete item when the type of id is wrong.", async () => {
      const {
        recordsArray: assertItemsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.deleteById("a");
      expect(assertItemsArray).to.null;
      expect(errorCode).to.eq(-1); // Model????????????????????????????????????
      expect(errorMsg).not.to.null;
    });
  });
});
