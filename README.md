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
      "async": true,
      "module": {
        "factory": "require:configured-swaggerize-express",
        "arguments": [{
          "spec":
        }]
      }
    }
  }
}
```

**server.js**
```
// Load confit first into a variable called config
for (const middleware of Object.values(config.get('meddleware'))) {
  if (middleware.async) {
    middleware.module.factory = await middleware.module.factory(middleware.module.arguments);
  }
}
```
