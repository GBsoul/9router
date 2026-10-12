docker stop aio-router
docker rm aio-router
docker build -t aio-router .
docker run -d --name aio-router -p 20128:20128 --env-file .env -v 9router-data:/app/data aio-router