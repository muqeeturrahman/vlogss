module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: ["eslint:recommended", "plugin:node/recommended"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "warning",
  },
};
