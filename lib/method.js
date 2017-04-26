const http = require('http');
const https = require('https');

module.exports = class Method {

  /**
   * constructor - Constructor of Method
   *
   * @param {String} name     Method name
   * @param {String} method   HTTP method (GET, POST, PUT, DELETE)
   * @param {String} path     REST API PATH
   * @param {Object} options  Options for connecting Qlik Sense - { host: String, port: Number,
   *                          prefix: String,xrfkey: String, userDirectory: String, userId: String
   *                          isSecure: Boolean, cert: String, key: String, ca: String }
   * @param {Object} params   HTTP Parameters - { body: Object, queryParams: Object,
   *                                              templateParams: Object }
   * @param {String} extended Extended information
   *
   * @return {Object} Method Instance
   */
  constructor(name, method, path, options, params, extended) {
    this.name = name;
    this.params = params || '';
    this.extended = extended;
    this.options = options;
    this.options.method = method;
    this.options.path = path;

    if (extended === undefined) {
      this.extended = '';
    } else {
      this.extended = extended;
    }
    return this;
  }


  /**
   * getMethod - Get method function
   *
   * @return {Object}  function to send HTTP request
   */
  getMethod() {
    return (args) => {
      // Store this.options to newOptions to avoid saving path
      const newOptions = Object.assign({}, this.options);
      newOptions.path = Method.addTemplateParameters(newOptions, args);
      newOptions.path = Method.addQueryParameters(newOptions, args);
      const jsonrequest = args.body;
      const promise = new Promise((resolve, reject) => {
        const protocol = newOptions.isSecure ? https : http;
        const sessionReq = protocol.request(newOptions, (sessionRes) => {
          const data = [];
          let dataLen = 0;
          sessionRes.on('data', (d) => {
            const reg = new RegExp(/^{.*}$/);
            if (reg.test(d.toString())) {
              const session = JSON.parse(d.toString());
              resolve(session);
            } else {
              data.push(d);
              dataLen += d.length;
            }
          });
          sessionRes.on('end', () => {
            const buf = Buffer.concat(data, dataLen);
            resolve(buf);
          });
        });

        if (jsonrequest != null) {
          sessionReq.write(JSON.stringify(jsonrequest));
        }
        sessionReq.end();
        sessionReq.on('error', (err) => {
          reject(err);
        });
      });
      return promise;
    };
  }


  /**
   * @static addTemplateParameters - Add template parameters to path
   *
   * @param {Object} options HTTP options
   * @param {Object} args    HTTP parameters
   *
   * @return {String} REST API path
   */
  static addTemplateParameters(options, args) {
    let newPath = options.path;
    if (args.templateParams !== undefined && Object.keys(args.templateParams).length > 0) {
      for(const key in args.templateParams) {
        newPath = newPath.replace(`{${key}}`, args.templateParams[key]);
      }
    }
    const reg = new RegExp(/{.*}/);
    if (reg.test(newPath)) {
      throw new Error(`Template parameter is missing: ${newPath}`);
    }
    return newPath;
  }

  /**
   * @static addQueryParameters - Add query parameters to path
   *
   * @param {Object} options HTTP options
   * @param {Object} args    HTTP parameters
   *
   * @return {String} REST API path
   */
  static addQueryParameters(options, args) {
    let queryParameters = `?xrfkey=${options.headers['X-qlik-xrfkey']}`;

    if (args.queryParams !== undefined && Object.keys(args.queryParams).length > 0) {
      for(const key in args.queryParams) {
        queryParameters += `&${key}=${args.queryParams[key]}`;
      }
    }
    return options.path + queryParameters;
  }
};
