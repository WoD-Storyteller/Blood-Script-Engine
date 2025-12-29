module.exports = {
  apps: [
    {
      name: 'blood-script-engine',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        GCP_PROJECT_ID: 'just-sunrise-398717',
      },
    },
  ],
};