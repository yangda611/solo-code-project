const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

app.use(async (ctx, next) => {
  console.log(`Request received: ${ctx.method} ${ctx.url}`);
  await next();
});

router.get('/test', (ctx) => {
  ctx.body = { message: 'Hello World!' };
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3002, () => {
  console.log('Test server running on port 3002');
});
