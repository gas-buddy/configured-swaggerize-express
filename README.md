configured-swaggerize-express
=============================
A small wrapper around swaggerize-express to allow runtime security
handling and config-based instantiation. Please note that if you
instantiate the module in configuration, you must resolve the promise
that the factory function returns before passing to meddleware. For example:

**config.json**
```
{
  "meddleware": {
    "myService": {
      "module": {
        "factory": "require:configured-swaggerize-express",
        "arguments": [{
          "spec": "require:some-swagger-module"
        }]
      }
    }
  }
}
```

**server.js**
```
import * as configSwagger from '@gasbuddy/configured-swaggerize-express';

// Load confit first into a variable called config
app.use(meddleware(await configSwagger.resolveFactories(config.get('middleware')));
```
