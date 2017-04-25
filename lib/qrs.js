const fs = require('fs');
const Method = require('./method');

module.exports = class QlikSenseRepository {

  /**
   * constructor - QlikSenseRepository Constructor
   *
   * @param {Object} options Options for connecting Qlik Sense - { host: String, port: Number,
   *                         prefix: String,xrfkey: String, userDirectory: String, userId: String
   *                         isSecure: Boolean, cert: String, key: String, ca: String }
   * @return {Object} QlikSenseRepository Instance
   */
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
   * initialize - initialize instance with default schema file
   *
   * @param {String} schema schema file path
   *
   * @return {Object} QlikSenseRepository Instance
   */
  initialize(schema) {
    const filePath = schema || './schemas/3.2.2.json';
    this.importMethods(filePath);
    return this;
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


  /**
   * registerMethod - Register method to this instance
   *
   * @param {String} name     Method name
   * @param {String} method   HTTP method for this method - GET, POST, PUT, DELETE
   * @param {String} path     REST API PATH
   * @param {Object} params   HTTP Parameters - { body: Object, queryParams: Object,
   *                                              templateParams: Object }
   * @param {String} extended Extended infomation
   *
   * @return {Object} Registered method
   */
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
      throw new Error(`Methods already exists: ${name}`);
    }
    this.methods[name] = new Method(name, method, path, newOption, params, extended);
    this.exec[name] = this.methods[name].getMethod();
    return this.methods[name];
  }


  /**
   * showMethodInfo - Show property infomation on registered method
   *
   * @param {String} name Method name
   *
   * @return {Object} Method properties
   */
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


  /**
   * showAllMethodsInfo - Show all registered methods
   *
   * @return {Object} Methods' properties
   */
  showAllMethodsInfo() {
    const allMethods = [];
    for(const name in this.methods) {
      allMethods.push(this.showMethodInfo(name));
    }
    return allMethods;
  }


  /**
   * getMethod - Get method instance
   *
   * @param {String} name Method name
   *
   * @return {Object} Method instance
   */
  getMethod(name) {
    return this.methods[name];
  }


  /**
   * setMethod - Set method properties
   *
   * @param {String} name   Method name
   * @param {Object} method Method instance
   *
   * @return {Object} Method instance after change
   */
  setMethod(name, method) {
    this.methods[name] = method;
    return this.methods[name];
  }


  /**
   * deleteMethod - Delete method
   *
   * @param {String} name Method name
   *
   * @return {Boolean} Execution result
   */
  deleteMethod(name) {
    if (this.methods[name] !== undefined) {
      delete this.methods[name];
      delete this.exec[name];
      return true;
    }
    return false;
  }


  /**
   * getOptions - Return options
   *
   * @return {Object} Options
   */
  getOptions() {
    return this.options;
  }


  /**
   * importMethods - Import methods from file
   *
   * @param {String} filePath file path containing methods information
   *
   * @return {Null} return null
   */
  importMethods(filePath) {
    const file = fs.readFileSync(filePath);
    const json = JSON.parse(file);
    json.forEach((d) => {
      const entry = JSON.parse(d);
      let name = entry.method.toLowerCase();
      //const reg = new RegExp(/^{.*}$/);
      entry.path.split('?')[0].split('/').forEach((elem) => {
        //if (elem !== '' && elem !== 'qrs' && !reg.test(elem)) {
        if (elem !== '' && elem !== 'qrs') {
          // Remove {} from path. ex) {id} => id
          const formattedElem = elem.replace('{', '').replace('}', '');
          // Capitalize elements ex) GET /qrs/app/id/ => getAppId
          name += formattedElem.charAt(0).toUpperCase() + formattedElem.slice(1);
        }
      });
      this.registerMethod(name, entry.method, entry.path.split('?')[0], entry.path.split('?')[1], entry.extended);
    });
    return null;
  }
};
