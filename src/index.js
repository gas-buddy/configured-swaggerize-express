import assert from 'assert';
import express from 'express';
import swaggerize from '@gasbuddy/swaggerize-express';
import jsonResolver from '@gasbuddy/swagger-ref-resolver';

export const MARKER = Symbol('Module marker for configured-swaggerize-express');

function safeCopy(swaggerizeOptions, api) {
  // swaggerize-express sets the basePath on the api object, but
  // we don't want that because we reuse that api object.
  return Object.assign({}, swaggerizeOptions, {
    api: Object.assign({}, api),
  });
}

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

  const swaggerizeOptions = {
    handlers: options.handlers,
  };
  const original = swaggerize(safeCopy(swaggerizeOptions, api));

  // If you want to host multiple swagger documents, you'll
  // need to set returnApp true to cause it to mount a full
  // express app rather than just swaggerizing the main app,
  // because swaggerize-express assigns a read-only property
  // to the app
  if (options.returnApp || Array.isArray(options.alternateBasePaths)) {
    const apps = [express().use(original)];
    if (Array.isArray(options.alternateBasePaths)) {
      for (const altPath of options.alternateBasePaths) {
        apps.push(express().use(altPath, swaggerize(safeCopy(swaggerizeOptions, api))));
      }
    }
    const app = express();
    app.use(...apps);
    return app;
  }

  return original;
}
