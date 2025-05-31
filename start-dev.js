const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск NeuralChat в режиме разработки...');

// Запускаем только веб-приложение
const webProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'packages', 'web'),
  stdio: 'inherit',
  shell: true
});

webProcess.on('error', (error) => {
  console.error('❌ Ошибка запуска веб-приложения:', error);
});

webProcess.on('close', (code) => {
  console.log(`📱 Веб-приложение завершено с кодом ${code}`);
});

// Обработка сигналов для корректного завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Завершение работы...');
  webProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Завершение работы...');
  webProcess.kill('SIGTERM');
  process.exit(0);
}); 