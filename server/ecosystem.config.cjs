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
      kill_timeout: 5000,
      listen_timeout: 8000,
      restart_delay: 3000,
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
