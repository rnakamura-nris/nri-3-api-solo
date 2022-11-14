/**
 * プレゼン用のサンプルレコード
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("dict").del();
  await knex.raw("TRUNCATE TABLE dict RESTART IDENTITY CASCADE");
  await knex("dict").insert([
    { ja: "名探偵コナン", en: "Case Closed" }, // 日本語・英語に別な文字列が設定
    { ja: "Slam dunk", en: "Slam dunk" }, // 日本語・英語に同じ文字列が設定
    { en: "Batman: Zero Year" }, // 日本語未設定
    { ja: "チ。―地球の運動について―" }, // 英語未設定
  ]);
};
