const fs = require('fs');
const Method = require('./method');

module.exports = class QlikSenseRepository {
  constructor(options) {
    this.prefix = QlikSenseRepository.formatPrefix(options.prefix) || '';
    this.xrfkey = options.xrfkey || 'abcdefghijklmnop';
    this.contentType = options.contentType || 'application/json';

    this.options = {
      host: options.host || 'localhost',
      port: options.port || 4242,
      headers: { 'X-qlik-xrfkey': options.xrfkey, 'Content-Type': this.contentType, 'X-Qlik-User': `UserDirectory=${options.userDirectory}; UserId=${options.userId}` },
      cert: fs.readFileSync(options.cert),
      key: fs.readFileSync(options.key),
      ca: fs.readFileSync(options.ca),
      isSecure: options.isSecure || 'true',
    };

    this.methods = {};
    this.exec = {};
  }

  /**
 * @static formatPrefix - format prefix with leading '/' and withoug trailing '/'
 *
 * @param {String} prefix prefix used for Qlik Sense Virtual Proxy
 *
 * @return {String} formated prefix
 */
  static formatPrefix(prefix) {
    let _prefix = prefix;
    if (_prefix == null || _prefix === '' || _prefix === undefined) {
      return '';
    }
    if (_prefix.substring(0, 1) !== '/') {
      _prefix = `/${prefix}`;
    }
    if (prefix.substr(-1, 1) === '/') {
      _prefix = _prefix.substring(0, _prefix.length - 1);
    }
    return _prefix;
  }

  registerMethod(name, method, path, params, extended) {
    const allowedMethod = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!method.indexOf(allowedMethod)) {
      throw new Error('Method not allowed. Use GET, POST, PUT or DELETE.');
    }
    if (path === undefined || path === null) {
      throw new Error('Path is not specified');
    }
    // infos specific to each method will be added later in Method class,  so breaking the
    // newOption's reference to this.options, and pass it to Method class to aviod overwrite.
    const newOption = Object.assign({}, this.options);
    if (this.methods[name] !== undefined) {
      throw new Error('Methods already exists');
    }
    this.methods[name] = new Method(name, method, path, newOption, params, extended);
    this.exec[name] = this.methods[name].getMethod();
    return this.methods[name];
  }

  showMethodInfo(name) {
    if (name in this.methods) {
      return {
        name,
        method: this.methods[name].options.method,
        path: this.methods[name].options.path,
        params: this.methods[name].params,
        extended: this.methods[name].extended,
      };
    }
    return '';
  }

  showAllMethodsInfo() {
    const allMethods = [];
    for(const name in this.methods) {
      allMethods.push(this.showMethodInfo(name));
    }
    return allMethods;
  }

  getMethod(name) {
    return this.methods[name];
  }

  setMethod(name, method) {
    this.methods[name] = method;
    return this.methods[name];
  }

  deleteMethod(name) {
    delete this.methods[name];
    delete this.exec[name];
  }

  getOptions() {
    return this.options;
  }

  importMethods(filePath) {
    const file = fs.readFileSync(filePath);
    const json = JSON.parse(file);
    json.forEach((d) => {
      const entry = JSON.parse(d);
      let name = entry.method.toLowerCase();
      const reg = new RegExp(/^{.*}$/);
      entry.path.split('?')[0].split('/').forEach((elem) => {
        if (elem !== '' && elem !== 'qrs' && !reg.test(elem)) {
          name += elem.charAt(0).toUpperCase() + elem.slice(1);
        }
      });
      this.registerMethod(name, entry.method, entry.path.split('?')[0], entry.path.split('?')[1], entry.extended);
    });
  }
};
