# qrs-wrapper
Wrapper for Qlik Sense Repository Service(QRS) API for Node.js.

* Tested with Qlik Sense v3.2SR2 and Node v6.10.1.

# Installation and Configuration
Create a node.js project and install qrs-wrapper package.

    npm install --save qrs-wrapper

Load qrs-wrapper module.

    // Load qrs-wrapper module
    const QRS = require('qrs-wrapper');

Configure options to connect to Qlik Sense Repository(QRS) API.

    // Config options to connect to Qlik Sense Repository(QRS) API
    const options = {
      host: 'qs01',
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

Initialize QRS instance with options and call initialize method.

    const qrs = new QRS(options).initialize();


In the initialization, a list of API endpoints are loaded from the schema file and these API endpoints are registered to the QRS instance. (The schema file is located at /schemas and it contains output of GET: /qrs/about/api/description?extended=true&format=json )

Execute API call with qrs.exec.methodName.

    // Get the list of apps
    const args = {};
    qrs.exec.getApp(args).then((res) => {
      // do something
    });

The following types of values can be supplied in the parameter.

  * body - Body for POST/PUT requests
  * queryParams - Query parameters
  * templateParams - Parameters for REST URL path. For instance, 'id' is supplied in the templateParams for getAppId method, {id} part of GET: /qrs/app/{id} is replaced by the valued of 'id'.


        const args = {
          body: {
            userId: 'newuser',
            userDirectory: 'portal',
            name: 'My New User',
            roles: [],
          },
          queryParams: {
            filter: `name eq 'Everyone'`,
          },
          templateParams: {
            id: 'fa8cea72-a2c8-44f4-a189-973b68adf5a9',
          },
        };

The naming convention for the default methods are HTTP Method + API endpoint (/qrs/ is not included) with camel-case format. For example:

  * GET /qrs/app -> getApp(args)
  * GET /qrs/app/{id} -> getAppId(args)
  * POST /qrs/app/{id}/copy -> postAppIdCopy(args)

## Examples
 * Get the list of apps

          const args = {};
          qrs.exec.getApp(args);

 * Get stream with filtering
          const argsForExistingStream = {
             queryParams: {
               filter: `name eq 'Everyone'`,
             },
           };
           qrs.exec.getStream(argsForExistingStream);

 * Get detailed property of custom property
         const argsForGetCustomProperty = {
          templateParams: {
            id: 'eca848d6-30e4-454a-9742-b8479b5f40c8',
          },
        };
        qrs.exec.getCustompropertydefinitionId(argsForGetCustomProperty);

 * Add user
         const argsForUser = {
           body: {
             userId: req.body.userid,
             userDirectory: 'portal',
             name: req.body.fullname,
             roles: [],
           },
         };
         qrs.exec.postUser(argsForUser);

 * Add stream
         const argsForStream = {
           body: {
             name: 'MyStream',
           },
         };
         qrs.exec.postStream(argsForStream);

 * Copy app
         const argsForCopyApp = {
          queryParams: {
            name: 'MyNewApp',
          },
          templateParams: {
            id: 'eca848d6-30e4-454a-9742-b8479b5f40c8',
          },
        };
        qrs.exec.postAppIdCopy(argsForCopyApp);

 * Publish app
         const argsForPublishApp = {
          queryParams: {
            stream: userStreamId,
            name: 'MyPublishedApp',
          },
          templateParams: {
            id: appId,
          },
        };
        qrs.exec.putAppIdPublish(argsForPublishApp);

 * Add custom property
         const addCustomProperty = () => {
           const argsForCustomProperty = {
             body: {
               name: 'Tenant',
               valueType: 'Text',
               choiceValues: [
                 'None'
               ],
               objectTypes: [
                 'App',
                 'ContentLibrary',
                 'DataConnection',
                 'Stream',
                 'User',
               ],
             },
           };
           qrs.exec.postCustompropertydefinition(argsForCustomProperty);

 * Add choice values to custom property
         const modifiedDate = customProp.modifiedDate;
         const argsForSelection = { body: { items: [{ type: "CustomPropertyDefinition", objectID: customProp.id }] } };
         // Make selection on user for modification
         qrs.exec.postSelection(argsForSelection)
          .then((selection) => {
            const choiceValues = customProp.choiceValues;
            choiceValues.push('new value');
            const argsForModifyingCustomProperty = {
              body: {
                properties: [{ name: "choiceValues", value: choiceValues, valueIsDifferent: false, valueIsModified: true }],
                type: "CustomPropertyDefinition",
                latestModifiedDate: QRS.incrementTimeByMilliseconds(modifiedDate, 1000),
              },
              templateParams: {
                id: selection.id, // Selection ID returned by selection
              },
            };
            return qrs.exec.putSelectionIdCustompropertydefinitionSynthetic(argsForModifyingCustomProperty);
          });

 * Add security rule
         const argsForAddingSecurityRule = {
           body: {
             category: 'Security',
             type: 'Custom',
             name: '0-TenantStreamRule',
             rule: '((user.@Tenant=resource.stream.@Tenant))',
             resourceFilter: 'App*',
             actions: 34,
             comment: 'The user should be able to see the apps published to the tenant stream of the user. ',
             disabled: false,
             privileges: null,
           },
         };
        qrs.exec.postSystemrule(argsForAddingSecurityRule);

 * Export app
        const argsForExport = {
          templateParams: {
            id: 'eca848d6-30e4-454a-9742-b8479b5f40c8',
          },
        };
        qrs.exec.getAppIdExport(argsForExport).then((res) => {
          const argsForDownload = {
            templateParams: {
              id: 'eca848d6-30e4-454a-9742-b8479b5f40c8',
              exportticketid: res.value,
              localfilename: 'Dashboard',
            },
          };
          const method = qrs.getMethod('getDownloadAppIdExportticketidLocalfilename');
          method.options.headers['Content-Type'] = 'application/vnd.qlik.sense.app';
          qrs.setMethod('getDownloadAppIdExportticketidLocalfilename', method);
          qrs.exec.getDownloadAppIdExportticketidLocalfilename(argsForDownload).then((res2) => {
            const file = fs.createWriteStream('C:\\Users\\MyUser\\Documents\\Qlik\\Sense\\Apps\\output.qvf');
            file.write(res2);
            file.end();
            done();
          });
        });

## Additional configuration

 * Registering custom method manually
         qrs.registerMethod('addUser', 'POST', '/qrs/user');
         qrs.exec.addUser(args).then((res) => {
           // do something
         });

 * Show registed method info
        const method = qrs.showMethodInfo('getTest');

 * Show all registed methods info
        const methods = qrs.showAllMethodsInfo();

 * Delete registered method
         const res = qrs.deleteMethod('addUser');

 * Import methods from file
        qrs.importMethods('./schemas/3.2.2.json');

 * Show options
         const res = qrs.getOptions();

 * Increment times (used for modifying properties)
        const gotTime = QRS.incrementTimeByMilliseconds('2017-04-25T11:34:52.256Z', 1000);

## Author

**Masaki Hamano**
* http://github.com/mhamano

## Change Log

See [CHANGELOG](CHANGELOG.yml)

## License & Copyright
The software is made available "AS IS" without any warranty of any kind under the MIT License (MIT).

See [Additional license information for this solution.](LICENSE.md)
