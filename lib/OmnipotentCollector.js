var util = require('util');
var async = require('async');
//=========Build access data for twit=================
var Twit = require('twit')

var T = new Twit({
    consumer_key: 'a7ZYldOLb4XiG0YTkQro8Qv6r',
    consumer_secret: 'w39aaLvDkcoM54lLNEmOk22JowvchlNYx8M2lUvR4jushklBAZ',
    access_token: '2438437632-X0Ufc7sHAIqsjxk9P8RShFqCYH2fn45O0wMKRvS',
    access_token_secret: 'ywqj8lTkrnVAAMXs0bHGgBOeDv9fIA5daR6pXOGJnt7FU',
});
//==========FIN============================
// Build Mongoose connection for streaming db
var mongoose = require('mongoose');

var uri = 'mongodb://localhost:27017/streaming'
var options = {
    server: {
        auto_reconnecdt: true,
        socketOptions: {
            KeepAlive: 1
        },
        poolSize: 20
    }
};
// mongoose.connect(uri, options);
console.log('=====Connect To Passive DB============');
var con = mongoose.createConnection(uri, options);
mongoose.connection.on('error', function(err) {
    console.log(err)
});
// Reconnect when closed
mongoose.connection.on('disconnected', function() {
    connect();
});

// ========FIN==========================

// Build Tweet Model Schema
var UserModelFile = require('../models/UserModel');
var TweetModelFile = require('../models/TweetModel');
var StreamingModelFile = require('../models/StreamingModel');
UserModel = con.model('UserModel', UserModelFile.UserModelSchema);
TweetModel = con.model('TweetModel', TweetModelFile.TweetModelSchema);
StreamingModel = con.model('StreamingModel', StreamingModelFile.StreamingModelSchema);
// =========FIN============

function OmnipotentCollector() {
    this.params = {
        // delimited: 'length',
        locations: '-180,-90,180,90'
    }
    this.stream = T.stream('statuses/filter', this.params);
}

OmnipotentCollector.prototype.run = function(self) {
    // Check if already exist one open
    StreamingModel.loadByStatus(1, function(err, streamObj) {
        if (streamObj) {
            console.log('Already Exists, Exit');
        }
        else {
            console.log('Create a new Streaming Connection');
            var newStreamObj = new StreamingModel();
            self.runStreaming(self, newStreamObj);
        }
    });
}

OmnipotentCollector.prototype.runStreaming = function(self, streamingModel) {
    streamingModel.status = 1;
    streamingModel.save(function(err) {
        if (err) console.log(err);
    });

    self.streamOn(self);
}
OmnipotentCollector.prototype.streamOn = function(self) {
    console.log('===========Connect to Streaming API=============');
    self.stream.keepAlive();
    self.stream.on('disconnect', function(disconnectMessage) {
        console.log(disconnectMessage);
        streamingModel.status = 0;
        streamingModel.end_date = new Date();
        streamingModel.save(function(err) {
            if (err) console.log(err);
        });
    });var ival = 60*1000
    self.stream.on('reconnect', function (req, res, ival) {
        console.log('reconnect. statusCode:', res.statusCode, 'interval:', ival)
    })
    self.stream.on('connected', function(response) {
        console.log('Connected');
    });
    self.stream.on('warning', function(warning) {
        console.log(warning);
    });
    self.stream.on('tweet', function(data) {
        var user = new UserModel(data.user);
        user._id = data.user.id;
        user.save(function(err) {
            if (err) {
                if (err.code !== 11000) {
                    console.log(err);
                }
            }
            else {
                // console.log('UserID ' + user._id + ' Saved');
            }
        });
        // console.log(data.statuses[index].user);
        var t = new TweetModel(data);
        t._id = data.id;
        t.user_id = user._id;
        t.created_at = new Date(data.created_at).toISOString();
        t.save(function(err) {
            if (err) {
                if (err.code !== 11000) {
                    console.log(err);
                }
            }
            else {
                // console.log('Tweet ID: ' + t._id + ' Saved');
            }
        });
    });
}
OmnipotentCollector.prototype.stop = function(self) {
    StreamingModel.loadByStatus(1, function(err, streamObj) {
        if (err) {
            console.log(err);
        }
        if (!streamObj) {
            console.log('No streaming running');
        }
        else {
            try {
                self.stream.stop();
            }
            catch(e) {
                console.log(e);
            }
            console.log('========Streaming API Stopped========');
            streamObj.status = 0;
            streamObj.end_date = new Date();
            streamObj.save(function(err) {
                if (err) console.log(err);
            });
        }
    });
}

OmnipotentCollector.prototype.getStatus = function(cb) {
    StreamingModel.loadByStatus(1, cb);
}

OmnipotentCollector.prototype.getDBInfo = function(cb) {
    async.waterfall([
        function(callback) {
            UserModel.count({}, function(err, user_count) {
                callback(null, user_count);
            });
        },
        function(user_count, callback) {
            TweetModel.count({}, function(err, tweet_count) {
                callback(null, user_count, tweet_count);
            });
        }
    ], cb);
}

module.exports = OmnipotentCollector;