const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;

const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const { setupServer } = require("../src/server_controller.js");

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

const server = setupServer();
describe("Conrtoller", () => {
  let request;
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
    request = chai.request(server);
  });

  afterEach(async () => {
    await knex
      .from(TABLE_NAME)
      .del()
      .catch((error) => console.error(error));
  });

  describe("POST /", () => {
    it("server should running", async () => {
      const res = await request.get("/");
      res.text.should.deep.equal("now running...");
    });
  });

  describe("POST /item", () => {
    it("should returned and inserted to the db when inputting ja and en", async () => {
      const requestJson = {
        ja: "バレットフィリア達の闇市場",
        en: "Barettofiriatachi no Yami-Ichiba ~ 100th Black Market",
      };

      const res = await request.post("/item").send(requestJson);
      res.should.be.json;
      res.should.have.status(201);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        LastIdNum + fixtures.getSamples().length + 1
      );

      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("should returned and inserted to the db when inputting ja", async () => {
      const requestJson = {
        ja: "働かないふたり",
      };

      const res = await request.post("/item").send(requestJson);
      res.should.be.json;
      res.should.have.status(201);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        LastIdNum + fixtures.getSamples().length + 1
      );

      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("should inserted already exist column", async () => {
      const requestJson = {
        en: "HEROES",
      };

      const res = await request.post("/item").send(requestJson);
      res.should.be.json;
      res.should.have.status(201);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        LastIdNum + fixtures.getSamples().length + 1
      );

      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("should returned and inserted to the db when inputting en and extra key", async () => {
      const requestJson = {
        en: "Feels Good Man",
        extra: "Pepe the Flog is still alive!",
      };

      const res = await request.post("/item").send(requestJson);
      res.should.be.json;
      res.should.have.status(201);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        LastIdNum + fixtures.getSamples().length + 1
      );

      expect(assertItemsArray[0].extra).to.be.undefined;
      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("shouldn't inserted already exist record", async () => {
      const requestJson = {
        ja: "相棒",
      };

      const res = await request.post("/item").send(requestJson);
      res.should.be.json;
      res.should.have.status(409);
    });

    it("shouldn't inserted when invalid json is requested", async () => {
      const requestJson = "相棒";

      const res = await request.post("/item").send(requestJson);
      res.should.be.json;
      res.should.have.status(400);
    });

    it("shouldn't inserted when zero length json is requested", async () => {
      const requestJson = {};

      const res = await request.post("/item").send(requestJson);
      res.should.be.json;
      res.should.have.status(400);
    });
  });

  describe("PATCH /item/:id", () => {
    it("should returned and updated when inputting ja and en", async () => {
      const requestId = LastIdNum + 1;
      const requestJson = {
        ja: "タコピーの原罪",
        en: "Takopi's Original Sin",
      };

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        requestId
      );

      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("should returned and updated when inputting ja and en(null)", async () => {
      const requestId = LastIdNum + 1;
      const requestJson = {
        ja: "星守る犬",
        en: null,
      };

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        requestId
      );

      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("should returned and updated when inputting ja(empty string) and en", async () => {
      const requestId = LastIdNum + 1;
      const requestJson = {
        ja: "",
        en: "Party Parrot",
      };

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        requestId
      );

      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("should returned and updated only ja when inputting ja(empty string)", async () => {
      const requestId = LastIdNum + 1;
      const requestJson = {
        ja: "相棒 -劇場版III- 巨大密室！特命係 絶海の孤島へ",
      };

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        requestId
      );

      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("should returned and updated when inputting same record", async () => {
      const requestId = LastIdNum + 1;
      const requestJson = {
        ja: "相棒",
        en: "AIBOU: Tokyo Detective Duo",
      };

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        requestId
      );

      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("shouldn't updated when invalid json is requested", async () => {
      const requestId = LastIdNum + 1;
      const requestJson = "相棒";

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(400);
    });

    it("shouldn't updated when zero length json is requested", async () => {
      const requestId = LastIdNum + 1;
      const requestJson = {};

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(400);
    });

    it("shouldn't returned and updated when inputting same record (id is not same)", async () => {
      const requestId = LastIdNum + 2;
      const requestJson = {
        ja: "相棒",
        en: "AIBOU: Tokyo Detective Duo",
      };

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(409);

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        requestId
      );

      expect(assertItemsArray[0].id).to.equal(requestId);
      expect(assertItemsArray[0].ja).to.equal("Hunter × Hunter");
      expect(assertItemsArray[0].en).to.equal("Hunter × Hunter");
    });

    it("shouldn't returned and updated when inputting ja is same (id is not same)", async () => {
      const requestId = LastIdNum + 2;
      const requestJson = {
        ja: "相棒",
      };

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(409);

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        requestId
      );

      expect(assertItemsArray[0].id).to.equal(requestId);
      expect(assertItemsArray[0].ja).to.equal("Hunter × Hunter");
      expect(assertItemsArray[0].en).to.equal("Hunter × Hunter");
    });

    it("shouldn't returned and updated when non-existent id is specified.", async () => {
      const requestId = -1;
      const requestJson = {
        ja: "しんそつ七不思議",
      };

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(404);
    });

    it("shouldn't returned and updated when type of id is wrong.", async () => {
      const requestId = "a";
      const requestJson = {
        ja: "FX戦士くるみちゃん",
      };

      const res = await request.patch(`/item/${requestId}`).send(requestJson);
      res.should.be.json;
      res.should.have.status(400);
    });

    it("shouldn't returned and updated when id is not specified", async () => {
      const requestJson = {
        ja: "FX戦士くるみちゃん",
      };

      const res = await request.patch(`/item`).send(requestJson);
      res.should.be.json;
      res.should.have.status(400);
    });
  });

  describe("DELETE /item/:id", () => {
    it("should returned and deleted when existent id is specified", async () => {
      const requestId = LastIdNum + 2;

      const res = await request.delete(`/item/${requestId}`);
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      expect(JSON.parse(res.text).id).to.equal(requestId);
      expect(JSON.parse(res.text).ja).to.equal("Hunter × Hunter");
      expect(JSON.parse(res.text).en).to.equal("Hunter × Hunter");

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        requestId
      );
      expect(assertItemsArray.length).to.equal(0);
    });

    it("shouldn't returned and deleted when non-existent id is specified", async () => {
      const requestId = -1;

      const res = await request.delete(`/item/${requestId}`);
      res.should.be.json;
      res.should.have.status(404);
    });

    it("shouldn't returned and deleted when type of id is wrong", async () => {
      const requestId = "a";

      const res = await request.delete(`/item/${requestId}`);
      res.should.be.json;
      res.should.have.status(400);
    });

    it("shouldn't returned and deleted when id is not specified", async () => {
      const requestJson = {
        ja: "ケンカンオメガ",
      };

      const res = await request.delete(`/item`).send(requestJson);
      res.should.be.json;
      res.should.have.status(400);
    });
  });

  describe("GET /item/:id", () => {
    it("should returned record when existent id is specified", async () => {
      const requestId = LastIdNum + 2;

      const res = await request.get(`/item/${requestId}`);
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getById(
        requestId
      );
      JSON.parse(res.text).should.deep.equal(assertItemsArray[0]);
    });

    it("shouldn't returned and deleted when non-existent id is specified.", async () => {
      const requestId = -1;

      const res = await request.get(`/item/${requestId}`);
      res.should.be.json;
      res.should.have.status(404);
    });

    it("shouldn't returned and deleted when type of id is wrong.", async () => {
      const requestId = "a";

      const res = await request.get(`/item/${requestId}`);
      res.should.be.json;
      res.should.have.status(400);
    });

    it("should returned all records when json parameter is unspecified - P1", async () => {
      const res = await request.get("/item");
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.true;
      expect(JSON.parse(res.text).length).to.equal(
        fixtures.getSamples().length
      );

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      for (let i = 0; i < fixtures.getSamples(); i++) {
        JSON.parse(res.text)[i].should.deep.equal(assertItemsArray[i]);
      }
    });

    it("should returned all records when json parameter is unspecified - P2", async () => {
      const res = await request.get("/item").send();
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.true;
      expect(JSON.parse(res.text).length).to.equal(
        fixtures.getSamples().length
      );

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      for (let i = 0; i < fixtures.getSamples(); i++) {
        JSON.parse(res.text)[i].should.deep.equal(assertItemsArray[i]);
      }
    });

    it("should returned all records when json parameter is zero length", async () => {
      const res = await request.get("/item").send({});
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.true;
      expect(JSON.parse(res.text).length).to.equal(
        fixtures.getSamples().length
      );

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      for (let i = 0; i < fixtures.getSamples(); i++) {
        JSON.parse(res.text)[i].should.deep.equal(assertItemsArray[i]);
      }
    });

    it("should returned the result of partial search (ja) - P1", async () => {
      const res = await request.get("/item").send({ ja: "を" });
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      JSON.parse(res.text).should.deep.equal(assertItemsArray[3]);
    });

    it("should returned the result of partial search (ja) - P2", async () => {
      const res = await request
        .get("/item")
        .send({ ja: "世界制服をたくらむモララー（ウララー編）" });
      res.should.be.json;
      res.should.have.status(404);
    });

    it("should returned the result of partial search (ja: null)", async () => {
      const res = await request.get("/item").send({ ja: null });
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.true;
      expect(JSON.parse(res.text).length).to.equal(2);

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      JSON.parse(res.text)[0].should.deep.equal(assertItemsArray[2]);
      JSON.parse(res.text)[1].should.deep.equal(assertItemsArray[4]);
    });

    it("should returned the result of partial search (en) - P1", async () => {
      const res = await request.get("/item").send({ en: "e" });
      res.should.be.json;
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.true;
      expect(JSON.parse(res.text).length).to.equal(3);

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      JSON.parse(res.text)[0].should.deep.equal(assertItemsArray[0]);
      JSON.parse(res.text)[1].should.deep.equal(assertItemsArray[1]);
      JSON.parse(res.text)[2].should.deep.equal(assertItemsArray[2]);
    });

    it("should returned the result of partial search (ja) - P2", async () => {
      const res = await request
        .get("/item")
        .send({ en: "Hunter x Hunter (Chimera Ants Series)" });
      res.should.be.json;
      res.should.have.status(404);
    });

    it("should returned the result of partial search (en: empty string)", async () => {
      const res = await request.get("/item").send({ en: "" });
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.true;
      expect(JSON.parse(res.text).length).to.equal(2);

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      JSON.parse(res.text)[0].should.deep.equal(assertItemsArray[3]);
      JSON.parse(res.text)[1].should.deep.equal(assertItemsArray[4]);
    });

    it("should returned the result of partial search (ja and en) - P1", async () => {
      const res = await request.get("/item").send({ ja: "Hunter", en: "e" });
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      JSON.parse(res.text).should.deep.equal(assertItemsArray[1]);
    });

    it("should returned the result of partial search (ja:empty string and en) - P2", async () => {
      const res = await request.get("/item").send({ ja: "", en: "e" });
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      JSON.parse(res.text).should.deep.equal(assertItemsArray[2]);
    });

    it("should returned the result of partial search (ja and en:null ) - P2", async () => {
      const res = await request.get("/item").send({ ja: "制服", en: null });
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      JSON.parse(res.text).should.deep.equal(assertItemsArray[3]);
    });

    it("should ignore json parameter which is not included column - P1", async () => {
      const res = await request
        .get("/item")
        .send({ extra: "Unneeded string..." });
      res.should.be.json;
      res.should.have.status(200);
      expect(JSON.parse(res.text).length).to.equal(
        fixtures.getSamples().length
      );

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      for (let i = 0; i < fixtures.getSamples(); i++) {
        JSON.parse(res.text)[i].should.deep.equal(assertItemsArray[i]);
      }
    });

    it("should ignore json parameter which is not included column - P2", async () => {
      const res = await request
        .get("/item")
        .send({ ja: "制服", en: null, extra: "Unneeded string..." });
      res.should.have.status(200);
      expect(Array.isArray(JSON.parse(res.text))).to.false;

      const { recordsArray: assertItemsArray } = await serverModel.getAll();
      JSON.parse(res.text).should.deep.equal(assertItemsArray[3]);
    });

    it("shouldn't succeed SQLi", async () => {
      const res = await request
        .get("/item")
        .send({ ja: "'a' OR 1 = 1; -- '", en: "'a' OR 1 = 1; -- '" });
      res.should.be.json;
      res.should.have.status(404);
    });
  });
});
