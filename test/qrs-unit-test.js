const expect = require('chai').expect;
const fs = require('fs');

const QRS = require('../index.js');
const chai = require('chai');
chai.use(require('chai-json-schema'));

const options = {
  host: 'qs02',
  port: '4242',
  prefix: '',
  xrfkey: 'abcdefghijklmnop',
  userDirectory: 'internal',
  userId: 'sa_repository',
  isSecure: true,
  cert: 'C:\\Cert\\client.pem',
  key: 'C:\\Cert\\client_key.pem',
  ca: 'C:\\Cert\\root.pem',
};

const args = {
  body: {
    userId: 'newuser',
    userDirectory: 'portal',
    name: 'My New User',
    roles: [],
  },
  queryParams: {

  },
  templateParams: {

  },
};

describe('Method registration test', () => {
  it('should instantiate QRS', (done) => {
    const qrs = new QRS(options);
    expect(qrs instanceof QRS).to.be.true;
    done();
  });

  it('should register method', (done) => {
    const qrs = new QRS(options);
    let res = qrs.registerMethod('getTest', 'GET', '/test/path');
    expect(res.name).to.be.equal('getTest');
    expect(res.options.method).to.be.equal('GET');
    expect(res.options.path).to.be.equal('/test/path');

    res = qrs.registerMethod('postTest', 'POST', '/test/path');
    expect(res.name).to.be.equal('postTest');
    expect(res.options.method).to.be.equal('POST');
    expect(res.options.path).to.be.equal('/test/path');

    res = qrs.registerMethod('putTest', 'PUT', '/test/{id}/path');
    expect(res.name).to.be.equal('putTest');
    expect(res.options.method).to.be.equal('PUT');
    expect(res.options.path).to.be.equal('/test/{id}/path');

    res = qrs.registerMethod('deleteTest', 'DELETE', '/test/{id}/path');
    expect(res.name).to.be.equal('deleteTest');
    expect(res.options.method).to.be.equal('DELETE');
    expect(res.options.path).to.be.equal('/test/{id}/path');
    done();
  });

  it('should get empty result', (done) => {
    const qrs = new QRS(options);
    const method = qrs.showMethodInfo('getTest');
    expect(method).to.be.equal('');
    done();
  });

  it('should get method', (done) => {
    const qrs = new QRS(options);
    qrs.registerMethod('getTest', 'GET', '/test/path', '?param={param}');
    const method = qrs.showMethodInfo('getTest');
    expect(method.name).to.be.equal('getTest');
    expect(method.method).to.be.equal('GET');
    expect(method.path).to.be.equal('/test/path');
    expect(method.params).to.be.equal('?param={param}');
    done();
  });

  it('should delete method', (done) => {
    const qrs = new QRS(options);
    qrs.registerMethod('getTest', 'GET', '/test/path', '?param={param}');
    let method = qrs.showMethodInfo('getTest');
    expect(method.name).to.be.equal('getTest');
    const res = qrs.deleteMethod('getTest');
    expect(res).to.be.true;
    method = qrs.showMethodInfo('getTest');
    expect(method).to.be.equal('');
    done();
  });

  it('should fail to delete method', (done) => {
    const qrs = new QRS(options);
    const res = qrs.deleteMethod('getTest');
    expect(res).to.be.false;
    done();
  });

  it('should get options', (done) => {
    const qrs = new QRS(options);
    const res = qrs.getOptions();
    expect(res.host).to.be.equal('qs02');
    expect(res.port).to.be.equal('4242');
    done();
  });

  it('shoud return error when name already exists.', (done) => {
    try {
      const qrs = new QRS(options);
      qrs.registerMethod('addUser', 'POST', '/qrs/user');
      qrs.registerMethod('addUser', 'POST', '/qrs/user');
    } catch (e) {
      expect(e.toString()).to.include('Methods already exists');
    }
    done();
  });

  it('shoud return error when method not allowed .', (done) => {
    try {
      const qrs = new QRS(options);
      qrs.registerMethod('addUser', 'A', '/qrs/user');
    } catch (e) {
      expect(e.toString()).to.include('Method not allowed');
    }
    done();
  });

  it('shoud return error when path is not entered.', (done) => {
    try {
      const qrs = new QRS(options);
      qrs.registerMethod('addUser', 'POST');
    } catch (e) {
      expect(e.toString()).to.include('Path is not specified');
      done();
    }
  });

  it('shoud register and execute method', (done) => {
    const qrs = new QRS(options);
    qrs.registerMethod('addUser', 'POST', '/qrs/user');
    qrs.exec.addUser(args).then((res) => {
      expect(res.userId).to.be.equal('newuser');
      expect(res.name).to.be.equal('My New User');
    });
    done();
  });

  it('shoud register multiple methods', (done) => {
    const qrs = new QRS(options);
    qrs.registerMethod('addUser', 'POST', '/qrs/user');
    qrs.registerMethod('getApp', 'GET', '/qrs/app');
    // addUser
    let method = qrs.showMethodInfo('addUser');
    expect(method.method).to.be.equal('POST');
    expect(method.path).to.be.equal('/qrs/user');
    // getApp
    method = qrs.showMethodInfo('getApp');
    expect(method.method).to.be.equal('GET');
    expect(method.path).to.be.equal('/qrs/app');
    done();
  });

  it('shoud import endpoint file', (done) => {
    const qrs = new QRS(options);
    qrs.importMethods('./schemas/3.2.2.json');
    const methods = qrs.showAllMethodsInfo();
    const getAbout = methods[0];
    expect(getAbout.name).to.be.equal('getAbout');
    expect(getAbout.method).to.be.equal('GET');
    done();
  });

  it('shoud initialize with default endpoint file', (done) => {
    const qrs = new QRS(options).initialize();
    const methods = qrs.showAllMethodsInfo();
    const getAbout = methods[0];
    expect(getAbout.name).to.be.equal('getAbout');
    expect(getAbout.method).to.be.equal('GET');
    done();
  });

  it('should increment time', (done) => {
    const gotTime = QRS.incrementTimeByMilliseconds("2017-04-25T11:34:52.256Z", 1000);
    expect(gotTime).to.be.equal("2017-04-25T11:34:53.256Z");
    done();
  });
});

const args2 = {
  queryParams: {
    extended: true,
    format: 'JSON',
  },
};

describe('Method registration with query parameters test', () => {
  it('should get API description with query parameters.', (done) => {
    const qrs = new QRS(options);
    qrs.importMethods('./schemas/3.2.2.json');
    qrs.exec.getAboutApiDescription(args2).then((res) => {
      expect(res.toString()).to.include('/qrs/about/api/default/analyzeraccessgroup');
      done();
    });
  });
});

describe('Method registration with template parameters test', () => {
  it('should get user with template parameters.', (done) => {
    const args3 = {
      templateParams: {
        id: 'fa8cea72-a2c8-44f4-a189-973b68adf5a9',
      },
    };
    const qrs = new QRS(options);
    qrs.importMethods('./schemas/3.2.2.json');
    qrs.exec.getUserId(args3).then((res) => {
      expect(res.id).to.be.equal(args3.templateParams.id);
      done();
    });
  });

  it('should method with template parameters multiple times', (done) => {
    const args3 = {
      templateParams: {
        id: 'fa8cea72-a2c8-44f4-a189-973b68adf5a9',
      },
    };
    const qrs = new QRS(options);
    qrs.importMethods('./schemas/3.2.2.json');
    qrs.exec.getUserId(args3).then((res) => {
      expect(res.id).to.be.equal(args3.templateParams.id);
    });
    qrs.exec.getUserId(args3).then((res) => {
      console.log(res.toString())
      expect(res.id).to.be.equal(args3.templateParams.id);
      done();
    });
  });

  it('should export app with template parameters.', (done) => {
    const args4 = {
      templateParams: {
        id: 'eca848d6-30e4-454a-9742-b8479b5f40c8',
      },
    };
    const qrs = new QRS(options);
    qrs.importMethods('./schemas/3.2.2.json');
    qrs.exec.getAppIdExport(args4).then((res) => {
      const args5 = {
        templateParams: {
          id: 'eca848d6-30e4-454a-9742-b8479b5f40c8',
          exportticketid: res.value,
          localfilename: 'Dashboard',
        },
      };
      const method = qrs.getMethod('getDownloadAppIdExportticketidLocalfilename');
      method.options.headers['Content-Type'] = 'application/vnd.qlik.sense.app';
      qrs.setMethod('getDownloadAppIdExportticketidLocalfilename', method);
      qrs.exec.getDownloadAppIdExportticketidLocalfilename(args5).then((res2) => {
        const file = fs.createWriteStream('C:\\Users\\amo.QTSEL\\Documents\\Qlik\\Sense\\Apps\\output.qvf');
        file.write(res2);
        file.end();
        done();
      });
    });
  });

  it('should fail to get user with missing template parameter.', (done) => {
    const args6 = {
      templateParams: {
      },
    };
    const qrs = new QRS(options);
    qrs.importMethods('./schemas/3.2.2.json');
    try {
      qrs.exec.getUserId(args6);
    } catch (e) {
      expect(e.toString()).to.include('Template parameter is missing');
      done();
    }
  });
});
