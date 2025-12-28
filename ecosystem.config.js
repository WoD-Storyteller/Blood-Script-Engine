module.exports = {
  apps: [
    {
      name: 'blood-script-engine',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      max_memory_restart: '512M',
      autorestart: true,
      watch: false,
      time: true,
    },
  ],
};