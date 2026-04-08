module.exports = {
  apps: [
    {
      name: 'kakeibu-server',
      script: 'src/app.js',
      cwd: '/var/www/kakeibu/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '/var/log/kakeibu/err.log',
      out_file: '/var/log/kakeibu/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
