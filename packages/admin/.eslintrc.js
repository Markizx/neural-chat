module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Отключаем строгие правила для production
    'prettier/prettier': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // Разрешаем console.log в admin панели
    'no-console': 'off',
    // Отключаем другие строгие правила
    'react-hooks/exhaustive-deps': 'warn'
  },
  env: {
    browser: true,
    node: true,
    es6: true
  }
}; 