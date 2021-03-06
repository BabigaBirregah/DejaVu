/*
 * Expose routes
 */
var path = require('path');
var mongoose = require('mongoose');
var routes = require('../routes/index');


module.exports = function (app, config) {
    app.get('/', routes.index);
    app.post('/run', routes.run);
    app.get('/queries', routes.queries);

    app.get('/results/:resultId/map', routes.result);
    app.get('/results/:resultId/graph', routes.graph);
    app.get('/results/:resultId/graphJson', routes.graphJson);
    app.get('/results/:resultId/json', routes.resultJson);
    app.get('/results/:resultId/gexf', routes.graphExportGexf);

    app.get('/offline', routes.offlineForm);
    app.post('/offline/run', routes.offline);
    app.post('/offline/upload', routes.upload);

    app.get('/queries/delete/:queryId', routes.deleteQuery);
    app.get('/queries/export/:queryId', routes.exportQuery);
    app.get('/queries/:queryId/json', routes.queryJson);

    app.get('/streaming', routes.streaming);
    app.get('/streaming/run', routes.streamingRun);
    app.get('/streaming/stop', routes.streamingStop);
    // app.get('/streaming/status', routes.streamingStatus);
    app.get('/streaming/info', routes.streamingInfo);
    app.get('/streaming/export', routes.streamingExport);

}
