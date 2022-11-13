const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const serverModel = require("../src/server_model.js");

const setupServer = () => {
  /**
   * Create, set up and return your express server, split things into separate files if it becomes too long!
   */
  const templateJson = { id: null, ja: null, en: null };

  const parseModelResponse = (recordsArray, errorCode, errorMsg) => {
    const returnObject = {
      resultCode: 0,
      msg: null,
    };

    switch (errorCode) {
      case null: // 正常終了
      case undefined:
      case "":
        break;
      case -1: // Validationエラー
        returnObject.msg = `Request Body is invalid.`;
        returnObject.resultCode = 400;
        return returnObject;
      case 23505: // 一意制約違反
        returnObject.msg = `Already nserted record is specified.`;
        returnObject.resultCode = 409;
        return returnObject;
      default: // その他エラー
        returnObject.msg = `DB error occured: ${errorMsg}`;
        returnObject.resultCode = 500;
        return returnObject;
    }

    if (!recordsArray || recordsArray.length < 1) {
      returnObject.msg = "Record Not Found";
      returnObject.resultCode = 404;
      return returnObject;
    }

    recordsArray.forEach((record) => {
      if (!"id" in record) {
        returnObject.msg =
          "DB error occured: Record not found (something is wrong).";
        returnObject.resultCode = 404;
        return returnObject;
      }
    });

    return returnObject;
  };

  const parseResponseJson = (record) => {
    const returnObject = {
      resultCode: 0,
      msg: null,
    };

    let insertModeEnabled = false;
    serverModel.Keys.forEach((key) => {
      if (key in record) {
        insertModeEnabled = true;
      }
    });
    if (!insertModeEnabled) {
      returnObject.msg =
        "DB error occured: Any keys except ID of inserted record not found. (something is wrong)";
      returnObject.resultCode = 500;
      return returnObject;
    }

    return returnObject;
  };

  app.use(bodyParser.json());
  app.use((error, _, response, next) => {
    if (error instanceof SyntaxError) {
      response.status(400).json({ msg: "Request Body is Invalid." });
    } else {
      next();
    }
  });

  app.get("/", (req, res) => {
    res.send("now running...");
  });

  app.post("/item", async (req, res) => {
    const errorResJson = {};
    const resJson = Object.create(templateJson);

    try {
      const {
        recordsArray: recordsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.create(req.body);

      // エラーチェック
      const { resultCode: httpStatusCode, msg: parsedErrorMsg } =
        parseModelResponse(recordsArray, errorCode, errorMsg);
      if (httpStatusCode == 404) {
        // insertではあり得ない事象なので一応
        if (errorMsg) {
          errorResJson.msg = `DB error occured: ${errorMsg}`;
        } else {
          errorResJson.msg = `DB error occured}`;
        }
        return res.status(500).json(errorResJson);
      } else if (httpStatusCode !== 0) {
        errorResJson.msg = parsedErrorMsg;
        return res.status(httpStatusCode).json(errorResJson);
      }

      // エラーチェック2（insertではあり得ない事象なので一応）
      const { resultCode: httpStatusCode2, msg: parsedErrorMsg2 } =
        parseResponseJson(recordsArray[0]);
      if (httpStatusCode2 !== 0) {
        errorResJson.msg = parsedErrorMsg2;
        return res.status(httpStatusCode2).json(errorResJson);
      }

      // 正常終了
      resJson.id = recordsArray[0].id;
      resJson.ja = recordsArray[0].ja;
      resJson.en = recordsArray[0].en;
      return res.status(201).json(resJson);
    } catch (e) {
      errorResJson.msg = `Server error occured: ${e}`;
      return res.status(500).json(errorResJson);
    }
  });

  app.patch("/item", async (req, res) => {
    return res.status(400).json({ msg: "ID is required." });
  });

  app.patch("/item/:id", async (req, res) => {
    const errorResJson = {};
    const resJson = Object.create(templateJson);

    try {
      if (!/^[-]?\d*$/.test(req.params.id)) {
        errorResJson.msg = `Path Parameter is invalid.`;
        return res.status(400).json(errorResJson);
      }

      const {
        recordsArray: recordsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.updateById(Number(req.params.id), req.body);

      // エラーチェック
      const { resultCode: httpStatusCode, msg: parsedErrorMsg } =
        parseModelResponse(recordsArray, errorCode, errorMsg);
      if (httpStatusCode !== 0) {
        errorResJson.msg = parsedErrorMsg;
        return res.status(httpStatusCode).json(errorResJson);
      }

      // エラーチェック2（updateではあり得ない事象なので一応）
      const { resultCode: httpStatusCode2, msg: parsedErrorMsg2 } =
        parseResponseJson(recordsArray[0]);
      if (httpStatusCode2 !== 0) {
        errorResJson.msg = parsedErrorMsg2;
        return res.status(httpStatusCode2).json(errorResJson);
      }

      // 正常終了
      resJson.id = recordsArray[0].id;
      resJson.ja = recordsArray[0].ja;
      resJson.en = recordsArray[0].en;
      return res.status(200).json(resJson);
    } catch (e) {
      errorResJson.msg = `Server error occured: ${e}`;
      return res.status(500).json(errorResJson);
    }
  });

  app.delete("/item", async (req, res) => {
    return res.status(400).json({ msg: "ID is required." });
  });

  app.delete("/item/:id", async (req, res) => {
    const errorResJson = {};
    const resJson = Object.create(templateJson);

    try {
      if (!/^[-]?\d*$/.test(req.params.id)) {
        errorResJson.msg = `Path Parameter is invalid.`;
        return res.status(400).json(errorResJson);
      }

      const {
        recordsArray: recordsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.deleteById(Number(req.params.id));

      // エラーチェック
      const { resultCode: httpStatusCode, msg: parsedErrorMsg } =
        parseModelResponse(recordsArray, errorCode, errorMsg);
      if (httpStatusCode == 409) {
        // insertではあり得ない事象なので一応
        if (errorMsg) {
          errorResJson.msg = `DB error occured: ${errorMsg}`;
        } else {
          errorResJson.msg = `DB error occured}`;
        }
        return res.status(500).json(errorResJson);
      } else if (httpStatusCode !== 0) {
        errorResJson.msg = parsedErrorMsg;
        return res.status(httpStatusCode).json(errorResJson);
      }

      // 正常終了
      resJson.id = recordsArray[0].id;
      resJson.ja = recordsArray[0].ja;
      resJson.en = recordsArray[0].en;
      return res.status(200).json(resJson);
    } catch (e) {
      errorResJson.msg = `Server error occured: ${e}`;
      return res.status(500).json(errorResJson);
    }
  });

  app.get("/item/:id", async (req, res) => {
    const errorResJson = {};
    const resJson = Object.create(templateJson);

    try {
      if (!/^[-]?\d*$/.test(req.params.id)) {
        errorResJson.msg = `Path Parameter is invalid.`;
        return res.status(400).json(errorResJson);
      }

      const {
        recordsArray: recordsArray,
        errorCode: errorCode,
        errorMsg: errorMsg,
      } = await serverModel.getById(Number(req.params.id));

      // エラーチェック
      const { resultCode: httpStatusCode, msg: parsedErrorMsg } =
        parseModelResponse(recordsArray, errorCode, errorMsg);
      if (httpStatusCode == 409) {
        // selectではあり得ない事象なので一応
        if (errorMsg) {
          errorResJson.msg = `DB error occured: ${errorMsg}`;
        } else {
          errorResJson.msg = `DB error occured}`;
        }
        return res.status(500).json(errorResJson);
      } else if (httpStatusCode !== 0) {
        errorResJson.msg = parsedErrorMsg;
        return res.status(httpStatusCode).json(errorResJson);
      }

      // 正常終了
      resJson.id = recordsArray[0].id;
      resJson.ja = recordsArray[0].ja;
      resJson.en = recordsArray[0].en;
      return res.status(200).json(resJson);
    } catch (e) {
      errorResJson.msg = `Server error occured: ${e}`;
      return res.status(500).json(errorResJson);
    }
  });

  return app;
};

module.exports = { setupServer };
