// This is the jQuery Algolia Search module
// It's using $.ajax to do requests with a JSONP fallback
// jQuery promises are returned

var inherits = require('inherits');

var AlgoliaSearch = require('../../AlgoliaSearch');
var inlineHeaders = require('../inline-headers');
var JSONPRequest = require('../JSONP-request');

// expose original algoliasearch fn in window
window.algoliasearch = require('./algoliasearch');

function algoliasearch(applicationID, apiKey, opts) {
  var extend = require('extend');

  var getDocumentProtocol = require('../get-document-protocol');

  opts = extend(true, {}, opts) || {};

  if (opts.protocol === undefined) {
    opts.protocol = getDocumentProtocol();
  }

  opts._ua = algoliasearch.ua;

  return new AlgoliaSearchJQuery(applicationID, apiKey, opts);
}

algoliasearch.version = require('../../version.json');
algoliasearch.ua = 'Algolia for jQuery ' + algoliasearch.version;

var $ = global.jQuery;

$.algolia = {Client: algoliasearch, ua: algoliasearch.ua, version: algoliasearch.version};

function AlgoliaSearchJQuery() {
  // call AlgoliaSearch constructor
  AlgoliaSearch.apply(this, arguments);
}

inherits(AlgoliaSearchJQuery, AlgoliaSearch);

AlgoliaSearchJQuery.prototype._request = function(url, opts) {
  return $.Deferred(function(deferred) {
    var body = opts.body;

    url = inlineHeaders(url, opts.headers);

    $.ajax(url, {
      type: opts.method,
      timeout: opts.timeout,
      dataType: 'json',
      data: body,
      complete: function(jqXHR, textStatus/* , error*/) {
        if (textStatus === 'timeout') {
          deferred.resolve(new Error('Timeout - Could not connect to endpoint ' + url));
          return;
        }

        if (jqXHR.status === 0) {
          deferred.reject(new Error('Network error'));
          return;
        }

        deferred.resolve({
          statusCode: jqXHR.status,
          body: jqXHR.responseJSON
        });
      }
    });
  }).promise();
};

AlgoliaSearchJQuery.prototype._request.fallback = function(url, opts) {
  url = inlineHeaders(url, opts.headers);

  return $.Deferred(function(deferred) {
    JSONPRequest(url, opts, function JSONPRequestDone(err, content) {
      if (err) {
        deferred.reject(err);
        return;
      }

      deferred.resolve(content);
    });
  }).promise();
};

AlgoliaSearchJQuery.prototype._promise = {
  reject: function(val) {
    return $.Deferred(function(deferred) {
      deferred.reject(val);
    }).promise();
  },
  resolve: function(val) {
    return $.Deferred(function(deferred) {
      deferred.resolve(val);
    }).promise();
  },
  delay: function(ms) {
    return $.Deferred(function(deferred) {
      setTimeout(function() {
        deferred.resolve();
      }, ms);
    }).promise();
  }
};
