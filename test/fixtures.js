// PostgreSQLでは、空文字とnullが別扱いなので注意！！

module.exports = {
  getSamples() {
    return [
      {
        ja: "相棒",
        en: "AIBOU: Tokyo Detective Duo",
      },
      {
        ja: "Hunter × Hunter",
        en: "Hunter × Hunter",
      },
      {
        ja: null,
        en: "Homestuck",
      },
      {
        ja: "世界制服をたくらむモララー",
        en: null,
      },
      {
        ja: "",
        en: "",
      },
    ];
  },
};
