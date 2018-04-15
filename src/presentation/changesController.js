const handleChanges = require('../application/handleChanges');
const c3prLOG = require("node-c3pr-logger");

module.exports = function (app) {

    app.post('/changes', function (request, response) {
        const changes = request.body;
        if (!changes.meta ||
            !changes.meta.correlationId ||
            !changes.meta.compatibleSchemas ||
            !changes.meta.compatibleSchemas.includes("c3pr/c3pr::changes")) {
            const errorMessage = `Request does not contain required metadata (meta.correlationId and meta.compatibleSchemas): ${JSON.stringify(changes)}.`;
            c3prLOG(errorMessage, {changes}, {nodeName: 'c3pr-brain', correlationIds: [changes.meta && changes.meta.correlationId], moduleName: 'changesController'});
            response.status(400).send(errorMessage);
            return;
        }
        c3prLOG(`Changes received. Changeset: ${JSON.stringify(changes.changeset)}`, {changes}, {nodeName: 'c3pr-brain', correlationId: changes.meta.correlationId, moduleName: 'changesController'});
        handleChanges(changes);
        response.send('Ok, that would be all, thanks.');
    });

};