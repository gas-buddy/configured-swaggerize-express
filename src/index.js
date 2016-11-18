import assert from 'assert';
import swaggerize from 'swaggerize-express';
import jsonResolver from '@gasbuddy/swagger-ref-resolver';

export const MARKER = Symbol('Module marker for configured-swaggerize-express');

export default async function configureSwaggerize(options) {
  assert(options, `An argument must be passed to configured-swaggerize-express. Typically
this is referenced in meddleware key 'arguments'. It must be a single element
array with at least a "spec" property resolving to the swagger content or filename`);
  assert(options.spec, `configured-swaggerize-express argument must contain a spec property
pointing to the swagger file to be hosted`);
  assert(options.handlers, `configured-swaggerize-express arguments must contain a handlers
property pointing to the directory implementing the handlers (or the handlers themselves).`);

  // We return a promise that, when resolved, will return a factory method that will
  // make the actual middleware
  const api = await jsonResolver(options.spec, options.basedir);

  // Attach any dynamic security handlers
  if (api.securityDefinitions) {
    for (const [name, def] of Object.entries(api.securityDefinitions)) {
      if (options.security && options.security[name]) {
        def['x-authorize'] = options.security[name];
      }
    }
  }

  return swaggerize({
    api,
    handlers: options.handlers,
  });
}

export async function resolveFactories(config) {
  const transformed = {};
  for (const [name, mwConfig] of Object.entries(config)) {
    if (mwConfig && mwConfig.module && mwConfig.module.factory
      && mwConfig.module.factory.MARKER === MARKER) {
      const moduleArg = mwConfig.module;
      const finalValue = await module.exports.default(...moduleArg.arguments);
      const mutated = Object.assign({}, mwConfig);
      mutated.module = Object.assign({}, moduleArg, {
        factory() { return finalValue; },
        name: moduleArg.name || moduleArg.factory.name,
      });
      transformed[name] = mutated;
    } else {
      transformed[name] = mwConfig;
    }
  }
  return transformed;
}
