import assert from 'assert';
import swaggerize from 'swaggerize-express';
import jsonResolver from '@gasbuddy/swagger-ref-resolver';

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
  const api = await jsonResolver(options.spec);

  // Attach any dynamic security handlers
  if (api.securityDefinitions) {
    for (const [name, def] of Object.entries(api.securityDefinitions)) {
      if (options.security && options.security[name]) {
        def['x-authorize'] = options.security[name];
      }
    }
  }

  return function swaggerizeSetup() {
    return swaggerize({
      api,
      handlers: options.handlers,
    });
  };
}
