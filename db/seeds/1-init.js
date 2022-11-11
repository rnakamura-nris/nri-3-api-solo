/**
 * サンプルレコード
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("Dict").del();
  await knex("Dict").insert([
    { ja: "相棒", en: "AIBOU: Tokyo Detective Duo" }, // 日本語・英語に別な文字列が設定
    { ja: "Hunter × Hunter", en: "Hunter × Hunter" }, // 日本語・英語に同じ文字列が設定
    { en: "Homestuck" }, // 日本語未設定
    { ja: "世界制服をたくらむモララー" }, // 英語未設定
    { ja: "", en: "" }, // 双方未設定
  ]);
};
