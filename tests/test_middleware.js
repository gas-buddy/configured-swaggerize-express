import tap from 'tap';
import path from 'path';
import express from 'express';
import request from 'supertest';
import meddleware from 'meddleware';
import * as configSwagger from '../src/index';

let app;

tap.test('setup express', async (t) => {
  app = express();
  const middlewareConfig = {
    authWare: {
      module: {
        factory: configSwagger,
        arguments: [{
          spec: path.join(__dirname, 'sample.yaml'),
          handlers: path.join(__dirname, 'handlers'),
          security: {
            fake_auth(req, res, next) {
              if (req.headers.authorization) {
                next();
              } else {
                const e = new Error('Authorization Failed');
                e.status = 401;
                next(e);
              }
            },
          },
        }],
      },
    },
  };
  const before = middlewareConfig.authWare.module.factory;
  const transformed = await configSwagger.resolveFactories(middlewareConfig);
  t.ok(before !== transformed.authWare.module.factory, 'Should have resolved');
  app.use(meddleware(transformed));
  // Swallow errors
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status).end();
  });

  // eslint-disable-next-line no-underscore-dangle
  t.strictEquals(app._router.stack.length, 5, 'Should have added swagger handlers');
});

tap.test('call handler with no auth', (t) => {
  request(app)
    .get('/hello/world')
    .end((err, res) => {
      t.strictEquals(res.status, 401, 'Should get a 401');
      t.end();
    });
});

tap.test('call handler with auth', (t) => {
  request(app)
    .get('/hello/world')
    .set('Authorization', 'I_AM_GOD')
    .end((err, res) => {
      t.ok(!err, 'Should not have errored');
      t.strictEquals(res.status, 200, 'Should get a 200');
      t.deepEquals(res.body, { ok: true }, 'Response should match');
      t.end(err);
    });
});
