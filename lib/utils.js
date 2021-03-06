var fs = require('fs');

if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};

// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


Array.prototype.partition = function(length) {
  var result = [];
  for(var i = 0; i < this.length; i++) {
    if(i % length === 0) result.push([]);
    result[result.length - 1].push(this[i]);
  }
  return result;
};



/*
 * Formats mongoose errors into new array
 */
exports.errors = function(errors) {
    // var keys = Object.keys(errors)
    console.log(errors);
    var errs = [];
    for (key in errors) {
        errs.push(errors[key].message);
    }
    if (!errs) {
        return ['Oops! There was an error'];
    }

    return errs;
}


exports.getAround = function(source, raidus) {
    var latitude = Number(source[1]);
    var longitude = Number(source[0]);

    var degree = (24901*1609)/360.0;
    var raidusMile = raidus;

    var dpmLat = 1/degree;
    var radiusLat = dpmLat*raidusMile;
    var minLat = latitude - radiusLat;
    var maxLat = latitude + radiusLat;

    var mpdLng = degree*Math.cos(latitude * (Math.PI/180));
    var dpmLng = 1 / mpdLng;
    var radiusLng = dpmLng*raidusMile;
    var minLng = longitude - radiusLng;
    var maxLng = longitude + radiusLng;

    var around = {
        minLat: minLat,
        minLng: minLng,
        maxLat: maxLat,
        maxLng: maxLng
    }
    return around;
}


exports.getDistance = function(source, target) {
    var R = 6371;

    var dLat = deg2rad(target.lat - source.lat);
    var dLng = deg2rad(target.lng - source.lng);
    var a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(source.lat)) * Math.cos(deg2rad(target.lat)) *
        Math.sin(dLng/2) * Math.sin(dLng/2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km

    return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

exports.geocode2xy = function(target, origin) {
    var xy = {x: 0, y: 0};
    var R = 6371;
    
    // lat => y
    var dLat = deg2rad(target.lat - origin.lat);
    xy.y = 2 * R * Math.sin(dLat / 2) * Math.cos(dLat / 2);
    xy.y = xy.y.toFixed(2);
    
    // lng => x
    var r = R * Math.cos(deg2rad(target.lat));
    var dLng = deg2rad(target.lng - origin.lng);
    xy.x = 2 * r * Math.sin(dLng / 2) * Math.cos(dLng / 2);
    xy.x = xy.x.toFixed(2);
    
    return xy;
}

exports.getTimeDifference = function(source, target) {
    source = new Date(source).getTime();
    target = new Date(target).getTime();

    return Math.abs(source - target);
}

exports.checkUserExisting = function checkExisting(user_pair, list) {
    if (list.length === 0) {
        return -1;
    }

    for (var index=0; index<list.length; index++) {
        if (this.compareArrays(list[index], user_pair)) {
            return index;
        }
    }
    return -1;
}

exports.checkTweetExisting = function(element, list) {
    for (var index=0; index<list.length; index++) {
        if (this.compareArrays(
            [element[0].id, element[1].id],
            [list[index].id, list[index].id]
        )) {
            return 1
        }
    }
    return -1;
}

// Only one dimension
exports.compareArrays = function (arr1, arr2, field) {
    if (!arr1 || !arr2) {
        return false;
    }

    if (arr1.length != arr2.length) {
        return false;
    }

    for (var i=0; i<arr1.length; i++) {
        if (arr2.indexOf(arr1[i]) == -1) {
            return false
        }
    }

    return true;
}

exports.parseQueryString = function(queryString) {
    var params = {}, queries, temp, i, l;

    queryString = queryString.replace('?', '');
    // Split into key/value pairs
    queries = queryString.split("&");

    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }

    return params;
};

exports.makeCronPattern = function(date) {
    var cronPattern = '';
    var date = new Date(date);
    cronPattern += date.getSeconds() + ' ';
    cronPattern += date.getMinutes() + ' ';
    cronPattern += date.getHours() + ' ';
    cronPattern += date.getDate() + ' ';
    // This fucking offset of month, come on!!!
    cronPattern += (date.getMonth()) + ' ';
    cronPattern += '*';

    return cronPattern;
}


exports.fetchEvents = function(events, str) {
    if (events === '') {
        return true;
    }
    var substr = [];
    var events_arr = events.split(' ');
    var found = false;
    var is_retweet = false;
    var retweet_fetched = false;
    // Has RT
    if (events_arr.indexOf('RT') > -1) {
        is_retweet = true;
        var str_arr = str.split(' ');
        for (var index=0; index<str_arr.length; index++) {
            if (str_arr[index] === 'RT') {
                retweet_fetched = true;
            }
        }
    }

    if (events_arr.indexOf('OR') > -1) {
        events_arr.splice(events_arr.indexOf('OR'), 1);
    }

    for (var index=0; index<events_arr.length; index++) {
        if (events_arr[index][0] === '-') {
            events_arr.splice(index, 1);
        }
    }

    substr = events_arr;
    var found_count = 0;
    for (var index=0; index<substr.length; index++) {
        if (str.indexOf(substr[index]) > -1) {
            found_count ++;
        }
    }
    if (found_count >= 1 && is_retweet && retweet_fetched) {
        found = true;
    }
    else if (!is_retweet && found_count >= 1) {
        found = true;
    }
    else {
        found = false;
    }
    return found;
}

exports.fieldValidation = function(body) {
    console.log(body);
    var disable = ['_csrf', 'events', 'created_date', 'operator', 'rt', 'event_type', 'event_name'];
    var errors = [];
    // check if filled
    for (var key in body) {
        if (disable.indexOf(key) > -1) {
            continue;
        }
        if (body[key] === '') {
            errors.push('Field : <b>"' + key + '"</b> Must be field.');
        }
    }
    if (body.start_date && body.end_date) {
        if (new Date(body.start_date) >= new Date(body.end_date)) {
            errors.push('Start Date must before End Date');
        }
    }
    var steptime = (new Date(body.end_date).getTime() - new Date(body.start_date).getTime())/ body.n;

    if (steptime < body.dt) {
        errors.push('Number of frames too large.');
    }

    return errors;
}

exports.parseOfflineFile = function(req, utils) {
    console.log(req.files);
    if (typeof(req.files) !== 'undefined' && typeof(req.files.offline_file) !== 'undefined' && req.files.offline_file.originalFilename !== '') {
        var temp_path = req.files.offline_file.path;
        if (temp_path) {
            fs.readFile(temp_path, 'utf-8', function(err, content) {
                var render_msg = {
                    status: false,
                    message: []
                }
                var message = [];
                try {
                    var data = JSON.parse(content);
                } catch (e) {
                    message.push(this.errors(e));
                    console.log(e);
                }
                message = message.concat(utils.validateOfflineFile(data));

                if (message.length > 0) {
                    render_msg.message = message;
                }
                else {
                    render_msg.status = true;
                    render_msg.message = ['File uploaded!'];
                };
                // fs.unlink(temp_path);
                if (render_msg.status === true) {
                    req.flash('success', render_msg.message);
                }
                else {
                    req.flash('danger', render_msg.message);
                }
            });
        }
    } else {
        req.flash('danger', ['File is mandatory and JSON format']);
    }
}

exports.validateOfflineFile = function validateOfflineFile(content) {
    var fields = ['id', 'user', 'text', 'coordinates', 'created_at'];
    var user_fields = ['id', 'name'];
    var message = [];
    if (content && typeof(content!=='undefined')) {
        for (var index=0; index<content.length; index++) {
            var tweet = content[index];
            // check global field
            for (var field_index=0; field_index<fields.length; field_index++) {
                if (typeof(tweet[fields[field_index]]) == 'undefined') {
                    message.push('Tweet No.' + (index + 1) + ', Field ' + fields[field_index] + ' is mandatory');
                }
            }
            // check user info
            if (typeof(tweet.user) !== 'undefined') {
                for (var field_index=0; field_index<user_fields.length; field_index++) {
                    if (typeof(tweet['user'][user_fields[field_index]]) == 'undefined') {
                        message.push('Tweet No.' + (index + 1) + ', User Field ' + user_fields[field_index] + ' is mandatory');
                    }
                }
            }
            // check coordinates info
            var message_coordinates = 'Tweet No.' + (index + 1) + ', Field coordinates is not appropried';
            if (typeof(tweet.coordinates) !== 'undefined' && tweet.coordinates !== null) {
                if (typeof(tweet.coordinates.coordinates) !== 'undefined') {
                    var coordinates = tweet.coordinates.coordinates;
                    if (coordinates.length !== 2) {
                        message.push(message_coordinates);
                    }
                    for (var coordinates_index=0; coordinates_index<coordinates.length; coordinates_index++) {
                        if (typeof(coordinates[coordinates_index]) !== 'number') {
                            message.push('Tweet No.' + (index + 1) + ', Field coordinates must be an array of numbers');
                        }
                    }
                }
                else {
                    // message.push(message_coordinates);
                }
            }
            if (typeof(tweet.created_at) !== 'undefined') {
                try {
                    var iso_time = new Date(tweet.created_at).toISOString();
                } catch (err) {
                    message.push('Tweet No.' + (index + 1) + ', Field created_at has invalid time value');
                }
            }
        }
    }
    else {
        message.push(['File fatal. Cannot read JSON file. Something wrong in the JSON file']);
    }

    return message;
}