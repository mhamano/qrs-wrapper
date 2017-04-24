const expect = require('chai').expect;
const session = require('supertest-session');
const QRS = require('../index.js');
const chai = require('chai');
chai.use(require('chai-json-schema'))
const app = require('../src/app');
let testSession = session(app);

const options = {
  host: 'qs02',
  port: '4242',
  prefix: '/portal',
  xrfkey: 'abcdefghijklmnop',
  isSecure: true,
  cert: 'C:\\Cert\\client.pem',
  key: 'C:\\Cert\\client_key.pem',
  ca: 'C:\\Cert\\root.pem',
};

/**
* User Test
*/
describe('QRS app test', () => {
  const appSchema = {
    title: 'app Schema',
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
    },
  };

  // AppID of test template app
  const appID = '59759885-018f-4a43-898d-a92b1ce31d28';
  const streamID = 'aaec8d41-5201-43ab-809f-3063750dfafd';
  let copiedAppID = null;

  it('should successfully copy app.', (done) => {
    const qrs = new QRS(options);
    qrs.copyApp(appID, 'Test').then((returnedApp) => {
      expect(returnedApp).to.be.jsonSchema(appSchema);
      copiedAppID = returnedApp.id;
      done();
    });
  });

  it('should successfully publish app.', (done) => {
    const qrs = new QRS(options);
    qrs.publishApp(copiedAppID, 'Test', streamID).then((returnedApp) => {
      expect(returnedApp).to.be.jsonSchema(appSchema);
      done();
    });
  });
});
