const http = require('http');
const https = require('https');

module.exports = class Method {
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

  getMethod() {
    return (args) => {
      this.options.path = Method.addTemplateParameters(this.options, args);
      this.options.path = Method.addQueryParameters(this.options, args);
      const jsonrequest = args.body;
      const promise = new Promise((resolve, reject) => {
        const protocol = this.options.isSecure ? https : http;
        const sessionReq = protocol.request(this.options, (sessionRes) => {
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
