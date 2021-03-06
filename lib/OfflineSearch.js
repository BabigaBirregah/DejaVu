// offline search 
var utils = require('./utils');
var async = require('async');
var geoUtils = require('geojson-utils');
var CronJob = require('cron').CronJob;
var mongoose = require('mongoose');
var UserModelFile = require('../models/UserModel');
var TweetModelFile = require('../models/TweetModel');
var QueryModelFile = require('../models/QueryModel');

// Passive DB config
var uriPassive = 'mongodb://localhost:27017/streaming'
// Active DB config
var uriActive = 'mongodb://localhost:27017/twc'

var options = {
    server: {
        auto_reconnecdt: true,
        socketOptions: {
            KeepAlive: 1
        },
        poolSize: 20
    }
};
var hour = 1000*60*60;

OfflineSearch.prototype.period_data = {};

function OfflineSearch(query_data) {
    // always initialize all instance properties
    this.query_data = query_data;
    this.connect();
}

OfflineSearch.prototype.connect = function() {
    console.log('=======OfflineSearch: connect to passive DB============');
    var conPassive = mongoose.createConnection(uriPassive, options);
    mongoose.connection.on('error', function(err) {
        console.log(err);
    });
    this.conPassive = conPassive;
    this.UserModelPassive = this.conPassive.model('UserModel', UserModelFile.UserModelSchema);
    this.TweetModelPassive = this.conPassive.model('TweetModel', TweetModelFile.TweetModelSchema);

    console.log('=======OfflineSearch: connect to active DB============');
    var conActive = mongoose.createConnection(uriActive, options);
    mongoose.connection.on('error', function(err) {
        console.log(err);
    });
    this.conActive = conActive;
    this.QueryModelActive = this.conActive.model('QueryModel', QueryModelFile.QueryModelSchema);
}

OfflineSearch.prototype.disconnect = function() {
    console.log('=======SHIFTING: disconnect to passive DB============');
    this.conPassive.close();
    console.log('=======SHIFTING: disconnect to active DB============');
    this.conActive.close();
}

OfflineSearch.prototype.buildSchedule = function(self) {
    this.dateConvertToISOString();
    if (this.query_data.start_date <= this.query_data.created_date && this.query_data.end_date <= this.query_data.created_date) {
        // search in the past,
        var dates = {
            since: new Date(new Date(this.query_data.start_date) - self.query_data.dt),
            until: new Date(new Date(this.query_data.end_date) + self.query_data.dt)
        }
        self.runSearch(self, dates);
    }
}

OfflineSearch.prototype.runSearch = function(self, dates) {
    console.log('==========Start Offline Search=============');
    var options = {
        criteria: {
            created_at: {
                "$gt": new Date(dates.since).toISOString(),
                "$lt": new Date(dates.until).toISOString()
            }
        }
    };

    async.waterfall([
        function(callback) {
            self.TweetModelPassive.list(options, function(err, list) {
                console.log('=======Number Of Tweets loaded: ' + list.length + '==============');
                var user_list = [];
                var tweet_list = [];
                for (var index=0; index<list.length; index++) {
                    if (self.checkGeometry(self.query_data, list[index])
                        && self.checkEvents(self.query_data, list[index])) {
                        user_list.push(list[index].user_id);
                        tweet_list.push(list[index]._id);
                    }
                }
                callback(null, user_list, tweet_list);
            });
        },
        function(user_list, tweet_list, callback) {
            console.log('========Number Of Tweets affected: ' + tweet_list.length + '==============');
            self.QueryModelActive.load(self.query_data.queryObj.toString(), function(err, queryDoc) {
                if (err) console.log(err);
                queryDoc.users = queryDoc.users.concat(user_list).unique();
                queryDoc.tweets = queryDoc.tweets.concat(tweet_list).unique();
                queryDoc.save(function(err) {
                    if (err) console.log(err);
                    callback(err, queryDoc);
                });
            });
        }
    ], function(err, queryDoc) {
        console.log('==================FIN Offline Search===========');
        self.disconnect();
    });
}

OfflineSearch.prototype.checkGeometry = function(query_data, tweet) {
    var geocode = this.extractGeocode(tweet);
    if (utils.getDistance(geocode, this.customGeocode(query_data)) <= query_data.r) {
        return true;
    }
    return false;
}

OfflineSearch.prototype.checkEvents = function(query_data, tweet) {
    // utils.fetchEvents(query_data.events, tweet.text)
    return utils.fetchEvents(query_data.events, tweet.text);
}

OfflineSearch.prototype.makePeriod = function(cases) {
    if (cases == 0) {
        var start_date = new Date(this.query_data.start_date).getTime();
        var end_date = new Date(this.query_data.end_date).getTime();
        var diff = end_date - start_date;
        var ecart = 0;
    }
    if (cases == 0) {
        var times_arr = []
        for (var index=0; index<=(diff/(hour*24)); index++) {
            times_arr.push(index);
        }
        this.period_data = {
            times_arr : times_arr
        }
    }
}

OfflineSearch.prototype.dateConvertToISOString = function() {
    this.query_data.created_date = new Date(this.query_data.created_date).toISOString();
    this.query_data.start_date = new Date(this.query_data.start_date).toISOString();
    this.query_data.end_date = new Date(this.query_data.end_date).toISOString();
}

OfflineSearch.prototype.extractGeocode = function(tweet) {
    if (tweet.coordinates) {
        return {
            lng: tweet.coordinates.coordinates[0],
            lat: tweet.coordinates.coordinates[1]
        }
    }
    else {
        var point = geoUtils.rectangleCentroid({
            coordinates: tweet.place.bounding_box.coordinates
        });
        return {
            lat: point[0],
            lng: point[1]
        }
    }
}

OfflineSearch.prototype.customGeocode = function(query_data) {
    var geocode = query_data.geocode.replace('(', '');
    geocode = geocode.replace(')', '');
    geocode = geocode.split(',');
    return {
        lat: geocode[0],
        lng: geocode[1]
    };
}

module.exports = OfflineSearch;