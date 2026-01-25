module.exports = {
  apps: [
    {
      name: "bloodscript-auto-deploy",
      script: "scripts/git-auto-deploy.js",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
