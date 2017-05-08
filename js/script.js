/**
 * Created by h205p2 on 4/14/17.
 */

$(document).ready(function(){
    var $start = $("#start");
    $start.click(function(){
        var $inputText = $("#inputText");
        //setStatus('');
        console.log('start app.');
        $inputText.keyup(function() {
            queueRefreshText();
        });
        $inputText.change(function() {
            queueRefreshText();
        });
        $inputText.text('hello world');
        refreshText();
        resolveOneWord();
    });

});



var WordCache = function() {
    this.cachedwords = [];
    this.queue = [];
    this.data = JSON.parse(localStorage.getItem('wordcache') || '{}');
    this.listeners = [];
    this.pop = function() {
        if (this.queue.length == 0) {
            return null;
        }
        var item = this.queue[0];
        this.queue.splice(0, 1);
        return item;
    };
    this.saveCache = function() {
        localStorage.setItem('wordcache', JSON.stringify(this.data));
    };
    this.store = function(word, data) {
        console.log('store', word, data);
        if (this.cachedwords.indexOf(word) == -1) {
            this.cachedwords.push(word);
        }
        var index = this.queue.indexOf(word);
        if (index != -1) {
            this.queue.splice(index, 1);
        }
        this.data[word] = data;
        this.callFulfilledListeners();
        this.saveCache();
    };
    this.callFulfilledListeners = function() {
        console.log('callFulfilledListeners', this.listeners);
        // callback(words);
        var thisThis = this;
        this.listeners.forEach(function(item) {
            console.log('check listener', item);

            var anyMissing = false;
            var result = [];
            for(var i=0; i<item.words.length; i++) {
                var word = item.words[i];
                var wordData = thisThis.data[word];
                result[i] = wordData;
                if (typeof(wordData) == 'undefined') {
                    anyMissing = true;
                }
            }

            if (!anyMissing) {
                if (!item.fulfilled) {
                    console.log('we can fire', item, result);
                    item.fulfilled = true;
                    item.callback(result);
                }
            }
        });

        this.listeners = this.listeners.filter(function(item) {
            return !item.fulfilled;
        });
    };
    this.lookupWords = function(words, callback) {
        var thisA = this;
        words.forEach(function(word) {
            if (thisA.queue.indexOf(word) == -1 &&
                thisA.cachedwords.indexOf(word) == -1 &&
                typeof(thisA.data[word]) == 'undefined') {
                thisA.queue.push(word);
            }
        });
        this.listeners.push({
            words: words,
            fulfilled: false,
            callback: callback
        });
        this.callFulfilledListeners();
    }
};













var cache = new WordCache();

var g_name = '';
var g_tracks = '';

function setStatus(text) {
    if (text != '') {
        $('#status').html(
            '<div class="progress progress-striped active">' +
            '<div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">' +
            text +
            '</div>' +
            '</div>'
        );
    } else {
        $('#status').html('');
    }
}


var splitText = function(inputText) {
    var words = inputText
        .split(/[ \n\r\t]/)
        .map(function(w) {
            return w.toLowerCase().trim().replace(/^[.,-]+/,'').replace(/[.,-]+$/g,'');
        })
        .filter(function(w) {
            return (w.length > 0);
        });
    words = words.slice(0, 100);
    return words;
};

var refreshText = function() {
    setStatus('Updating text...');
    var $inputText = $("#inputText");
    var wordListB = $inputText.val();
    var wordList = wordListB.trim();
    //g_
    var words = splitText(wordList);
    console.log('text changed.', wordList, words);
    cache.lookupWords(words, function(wordData) {

        setStatus('');

        console.log('wordcache callback', wordData);
        // $('#debug').text(JSON.stringify(worddata, null, 2));

        var text = '';
        //txt
        var trackList = [];
        //g_tracks
        wordData.forEach(function(data) {
            console.log('word', data.word);

            data.tracks.sort(function(a,b) {
                return Math.random() - 0.5;
            });

            var names = data.tracks.map(function(track) {
                return track.name;
            });

            console.log('names', names);

            var trackSet = new TrackSet(names);
            //f
            var trackSetR = trackSet.getA(data.word);
            //fr
            console.log('trackSetR', trackSetR);

            var found = null;
            var title = '';

            if (!found) {
                data.tracks.forEach(function(track) {
                    if (track.name.toLowerCase().trim() === data.word.toLowerCase().trim()) {
                        found = track;
                    }
                });
            }

            if (!found) {
                if (trackSetR && trackSetR.length > 0) {
                    data.tracks.forEach(function(track) {
                        if (track.name === trackSetR[0][1]) {
                            found = track;
                        }
                    });
                }
            }

            if (!found) {
                if (data.tracks.length > 0) {
                    found = data.tracks[0];
                }
            }

            console.log('found', found);
            if (found) {
                trackList.push(found.uri);
                text += '<div class="media"><a class="pull-left" href="#"><img class="media-object" src="' + found.cover_url + '" /></a><div class="media-body"><h4 class="media-heading"><a href="https://open.spotify.com/track/' + clearURI(found.uri) + '">' + found.name + '</a></h4>Album: <a href="https://open.spotify.com/track/' + clearURI(found.album_uri) + '">' + found.album + '</a><br/>Artist: <a href="https://open.spotify.com/track/' + clearURI(found.artist_uri) + '">' + found.artist+'</a></div></div>\n';
            } else {
                text += '<div class="media">No match found for the word "' + data.word+ '"</div>\n'
            }
        });

        $('#debug').html(text);
    });
};


function clearURI(link){
    var count = 0;
    var newURI = "";
    for(var z=0; z < link.length - 1; z++){
        if(link[z] == ":"){
            count++
        }
        if(count >= 2){
            newURI += link[z+1]
        }
    }
    return newURI;
}




var doSearch = function(word, callback) {
    console.log('search for ' + word);
    var url = 'https://api.spotify.com/v1/search?type=track&limit=50&q=' + encodeURIComponent('track:"' + word + '"');
    $.ajax(url, {
        dataType: 'json',
        success: function(result) {
            console.log('got track', result);
            callback({
                word: word,
                tracks: result.tracks.items
                    .map(function(item) {
                        var returnValue = {
                            name: item.name,
                            artist: 'Unknown',
                            artist_uri: '',
                            album: item.album.name,
                            album_uri: item.album.uri,
                            cover_url: '',
                            uri: item.uri
                        };
                        if (item.artists.length > 0) {
                            returnValue.artist = item.artists[0].name;
                            returnValue.artist_uri = item.artists[0].uri;
                        }
                        if (item.album.images.length > 0) {
                            returnValue.cover_url = item.album.images[item.album.images.length - 1].url;
                        }
                        return returnValue;
                    })
            });
        },
        error: function(result) {
            callback({
                word: word,
                tracks: []
            });
        }
    });
};

var resolveOneWord = function() {
    var word = cache.pop();
    if (word) {
        console.log('time to resolve word', word);
        setStatus('Looking up the word "' + word + '"');
        doSearch(word, function(result) {
            console.log('got word result', result);
            cache.store(word, result);
            setTimeout(resolveOneWord, 1);
        });
    } else {
        console.log('no words to look up...');
        setTimeout(resolveOneWord, 1000);
    }
};


var refreshTimer = 0;
var queueRefreshText = function() {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(function() {
        refreshText();
    }, 1000);
};

















var TrackSet = function(array) {
    //, useLevenshtein, gramSizeLower, gramSizeUpper

    // default options
    this.array = array;
    //arr
    this.gramSizeLower = 2;
    this.gramSizeUpper =  3;
    this.useLevenshtein = true;

    // define all the object functions and attributes
    this.exactSet = {};
    this.matchDict = {};
    this.items = {};

    // helper functions
    var levenshtein = function(str1, str2) {
        var current = [], prev, value;

        for (var i = 0; i <= str2.length; i++)
            for (var j = 0; j <= str1.length; j++) {
                if (i && j)
                    if (str1.charAt(j - 1) === str2.charAt(i - 1))
                        value = prev;
                    else
                        value = Math.min(current[j], current[j - 1], prev) + 1;
                else
                    value = i + j;

                prev = current[j];
                current[j] = value;
            }

        return current.pop();
    };

    // return an edit distance from 0 to 1
    var _distance = function(string1, string2) {
        if (string1 == null && string2 == null) {
            throw 'Trying to compare two null values';
        }
        if (string1 == null || string2 == null){
            return 0
        }
        string1 = String(string1);
        string2 = String(string2);

        var distance = levenshtein(string1, string2);
        if (string1.length > string2.length) {
            return 1 - distance / string1.length;
        } else {
            return 1 - distance / string2.length;
        }
    };
    var _nonWordRe = /[^\w, ]+/;

    var _iterateGrams = function(value, gramSize) {
        gramSize = gramSize || 2;
        var simplified = '-' + value.toLowerCase().replace(_nonWordRe, '') + '-',
            lenDiff = gramSize - simplified.length,
            results = [];
        if (lenDiff > 0) {
            for (var i = 0; i < lenDiff; i++) {
                value += '-';
            }
        }
        for (var j = 0; j < simplified.length - gramSize + 1; j++) {
            results.push(simplified.slice(j, j + gramSize))
        }
        return results;
    };

    var _gramCounter = function(value, gramSize) {
        gramSize = gramSize || 2;
        var result = {},
            grams = _iterateGrams(value, gramSize),
            i = 0;
        for (i; i < grams.length; ++i) {
            if (grams[i] in result) {
                result[grams[i]] += 1;
            } else {
                result[grams[i]] = 1;
            }
        }
        return result;
    };

    // the main functions
    this.getA = function(value, defaultValue) {
        var result = this.getB(value);
        if (!result && defaultValue) {
            return defaultValue;
        }
        return result;
    };

    this.getB = function(value) {
        var normalizedValue = this.normalizeString(value),
            result = this.exactSet[normalizedValue];
        if (result) {
            return [[1, result]];
        }
        var results = [];
        for(var gramSize = this.gramSizeUpper; gramSize > this.gramSizeLower; gramSize--) {
            results = this.getC(value, gramSize);
            if (results) {
                return results;
            }
        }
        return null;
    };

    this.getC = function(value, gramSize) {
        var normalizedValue = this.normalizeString(value),
            matches = {},
            gramCounts = _gramCounter(normalizedValue, gramSize),
            items = this.items[gramSize],
            sumOfSquareGramCounts = 0,
            gram,
            gramCount,
            index,
            otherGramCount;

        for (gram in gramCounts) {
            gramCount = gramCounts[gram];
            sumOfSquareGramCounts += Math.pow(gramCount, 2);
            if (gram in this.matchDict) {
                for (var k = 0; k < this.matchDict[gram].length; k++) {
                    index = this.matchDict[gram][k][0];
                    otherGramCount = this.matchDict[gram][k][1];
                    if (index in matches) {
                        matches[index] += gramCount * otherGramCount;
                    } else {
                        matches[index] = gramCount * otherGramCount;
                    }
                }
            }
        }

        function isEmptyObject(obj) {
            for(var prop in obj) {
                if(obj.hasOwnProperty(prop))
                    return false;
            }
            return true;
        }

        if (isEmptyObject(matches)) {
            return null;
        }

        var vectorNormal = Math.sqrt(sumOfSquareGramCounts),
            results = [],
            matchScore;
        // build a results list of [score, str]
        for (var matchIndex in matches) {
            matchScore = matches[matchIndex];
            results.push([matchScore / (vectorNormal * items[matchIndex][0]), items[matchIndex][1]]);
        }
        var sortDescending = function(a, b) {
            if (a[0] < b[0]) {
                return 1;
            } else if (a[0] > b[0]) {
                return -1;
            } else {
                return 0;
            }
        };
        var newResults = [];
        results.sort(sortDescending);
        if (this.useLevenshtein) {

                var endIndex = Math.min(50, results.length);
            // truncate somewhat arbitrarily to 50
            for (var l = 0; l < endIndex; l++) {
                newResults.push([_distance(results[l][1], normalizedValue), results[l][1]]);
            }
            results = newResults;
            results.sort(sortDescending);
        }
        for (var m = 0; m < results.length; m++) {
            if (results[m][0] == results[0][0]) {
                newResults.push([results[m][0], this.exactSet[results[m][1]]]);
            }
        }
        return newResults;
    };

    this.add = function(value) {
        var normalizedValue = this.normalizeString(value);
        if (normalizedValue in this.exactSet) {
            return false;
        }

        var i = this.gramSizeLower;
        for (i; i < this.gramSizeUpper + 1; ++i) {
            this.addB(value, i);
        }
    };

    this.addB = function(value, gramSize) {
        var normalizedValue = this.normalizeString(value),
            items = this.items[gramSize] || [],
            index = items.length;

        items.push(0);
        var gramCounts = _gramCounter(normalizedValue, gramSize),
            sumOfSquareGramCounts = 0,
            gram, gramCount;
        for (var gram in gramCounts) {
            gramCount = gramCounts[gram];
            sumOfSquareGramCounts += Math.pow(gramCount, 2);
            if (gram in this.matchDict) {
                this.matchDict[gram].push([index, gramCount]);
            } else {
                this.matchDict[gram] = [[index, gramCount]];
            }
        }
        var vectorNormal = Math.sqrt(sumOfSquareGramCounts);
        items[index] = [vectorNormal, normalizedValue];
        this.items[gramSize] = items;
        this.exactSet[normalizedValue] = value;
    };

    this.normalizeString = function(str) {
        if (Object.prototype.toString.call(str) !== '[object String]') throw 'Must use a string as argument to trackSet functions';
        return str.toLowerCase();
    };

    // return length of items in set
    this.length = function() {
        var count = 0,
            prop;
        for (prop in this.exactSet) {
            if (this.exactSet.hasOwnProperty(prop)) {
                count += 1;
            }
        }
        return count;
    };

    // return is set is empty
    this.isEmpty = function() {
        for (var prop in this.exactSet) {
            if (this.exactSet.hasOwnProperty(prop)) {
                return false;
            }
        }
        return true;
    };

    // return list of values loaded into set
    this.values = function() {
        var values = [],
            prop;
        for (prop in this.exactSet) {
            if (this.exactSet.hasOwnProperty(prop)) {
                values.push(this.exactSet[prop])
            }
        }
        return values;
    };


    // initialization
    var i = this.gramSizeLower;
    for (i; i < this.gramSizeUpper + 1; ++i) {
        this.items[i] = [];
    }
    // add all the items to the set
    for (i = 0; i < array.length; ++i) {
        this.add(array[i]);
    }

    return this;
};



















/*
exports.startApp = function() {
    var $inputText = $("#inputText");
    setStatus('');
    console.log('start app.');
    $inputText.keyup(function() {
        queueRefreshText();
    });
    $inputText.change(function() {
        queueRefreshText();
    });
    $('#start').click(function() {
        doLogin(function() {});
    });
    $inputText.text('hello world');
    refreshText();
    resolveOneWord();
};

*/


/*
 var client_id = '';
 var redirect_uri = '';


 if (location.host == 'localhost:8000') {
 client_id = 'd37a9e88667b4fb3bc994299de2a52bd';
 redirect_uri = 'http://localhost:8000/callback.html';
 } else {
 client_id = '6f9391eff32647baa44b1a700ad4a7fc';
 redirect_uri = 'http://lab.possan.se/playlistcreator-example/callback.html';
 }

 var doLogin = function(callback) {
 var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id +
 '&response_type=token' +
 '&scope=playlist-read-private%20playlist-modify%20playlist-modify-private' +
 '&redirect_uri=' + encodeURIComponent(redirect_uri);
 localStorage.setItem('createplaylist-tracks', JSON.stringify(g_tracks));
 localStorage.setItem('createplaylist-name', g_name);
 var w = window.open(url, 'asdf', 'WIDTH=400,HEIGHT=500');
 };
 */





















/*


 function getUsername(callback) {
 console.log('getUsername');
 var url = 'https://api.spotify.com/v1/me';
 $.ajax(url, {
 dataType: 'json',
 headers: {
 'Authorization': 'Bearer ' + g_access_token
 },
 success: function(r) {
 console.log('got username response', r);
 callback(r.id);
 },
 error: function(r) {
 callback(null);
 }
 });
 }
 function createPlaylist(username, name, callback) {
 console.log('createPlaylist', username, name);
 var url = 'https://api.spotify.com/v1/users/' + username +
 '/playlists';
 $.ajax(url, {
 method: 'POST',
 data: JSON.stringify({
 'name': name,
 'public': false
 }),
 dataType: 'json',
 headers: {
 'Authorization': 'Bearer ' + g_access_token,
 'Content-Type': 'application/json'
 },
 success: function(r) {
 console.log('create playlist response', r);
 callback(r.id);
 },
 error: function(r) {
 callback(null);
 }
 });
 }
 function addTracksToPlaylist(username, playlist, tracks, callback) {
 console.log('addTracksToPlaylist', username, playlist, tracks);
 var url = 'https://api.spotify.com/v1/users/' + username +
 '/playlists/' + playlist +
 '/tracks'; // ?uris='+encodeURIComponent(tracks.join(','));
 $.ajax(url, {
 method: 'POST',
 data: JSON.stringify(tracks),
 dataType: 'text',
 headers: {
 'Authorization': 'Bearer ' + g_access_token,
 'Content-Type': 'application/json'
 },
 success: function(r) {
 console.log('add track response', r);
 callback(r.id);
 },
 error: function(r) {
 callback(null);
 }
 });
 }
 function doit() {
 // parse hash
 var hash = location.hash.replace(/#/g, '');
 var all = hash.split('&');
 var args = {};
 console.log('all', all);
 all.forEach(function(keyvalue) {
 var idx = keyvalue.indexOf('=');
 var key = keyvalue.substring(0, idx);
 var val = keyvalue.substring(idx + 1);
 args[key] = val;
 });
 g_name = localStorage.getItem('createplaylist-name');
 g_tracks = JSON.parse(localStorage.getItem('createplaylist-tracks'));
 console.log('got args', args);
 if (typeof(args['access_token']) != 'undefined') {
 // got access token
 console.log('got access token', args['access_token']);
 g_access_token = args['access_token'];
 }
 getUsername(function(username) {
 console.log('got username', username);
 createPlaylist(username, g_name, function(playlist) {
 console.log('created playlist', playlist);
 addTracksToPlaylist(username, playlist, g_tracks, function() {
 console.log('tracks added.');
 $('#playlistlink').attr('href', 'spotify:user:'+username+':playlist:'+playlist);
 $('#creating').hide();
 $('#done').show();
 });
 });
 });
 }

 */















//client id: 49d6803a5e8a4b6d935d1c2aeb027fa4
//client secret: 299dc78e432f4e39b0f9bcb32dc841b2



//https://yoda.p.mashape.com/yoda
//https://faceplusplus-faceplusplus.p.mashape.com/detection/detect
//https://mager-spotify-web.p.mashape.com/lookup/1/.json
//https://www.quora.com/What-are-some-cool-fun-APIs