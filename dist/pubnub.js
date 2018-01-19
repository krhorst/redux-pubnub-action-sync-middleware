'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = pubnubActionSyncer;

var _pubnub = require('pubnub');

var _pubnub2 = _interopRequireDefault(_pubnub);

var _guid = require('guid');

var _guid2 = _interopRequireDefault(_guid);

var _queryString = require('query-string');

var _actionSyncer = require('./actionSyncer');

var _actionSyncer2 = _interopRequireDefault(_actionSyncer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pubnubConnection = function pubnubConnection(options) {
    var guid = _guid2.default.raw();
    var subscribers = [];
    var channel = options.channel || 'pubnub-action-syncer';

    // eslint-disable-next-line
    var pubnub = new _pubnub2.default(options);

    var handleMessage = function handleMessage(message) {
        var _message$message = message.message,
            source = _message$message.source,
            action = _message$message.action;


        if (source === guid) {
            return;
        }

        subscribers.forEach(function (_ref) {
            var callback = _ref.callback;

            callback(action);
        }, undefined);
    };

    pubnub.addListener({
        status: function status(statusEvent) {
            if (statusEvent.category === 'PNConnectedCategory') {
                console.log('Connected as ' + guid);
            }
        },
        message: handleMessage
    });

    pubnub.subscribe({
        channels: [channel]
    });

    var subscribe = function subscribe(callback) {
        var token = _guid2.default.raw();
        subscribers.push({ id: token, callback: callback });

        return function () {
            var index = subscribers.findIndex(function (value) {
                return value.id === token;
            });
            var removed = subscribers.splice(index, 1);
            return removed.length === 1 && removed[0].id === token;
        };
    };

    var publish = function publish(action) {
        var message = {
            source: guid,
            action: action
        };

        pubnub.publish({
            channel: channel,
            message: message
        });
    };

    return {
        subscribe: subscribe,
        publish: publish
    };
};

function pubnubActionSyncer(inputOptions) {
    var options = Object.assign({}, {
        mode: (0, _queryString.parse)(window.location.search).syncMode
    }, inputOptions);

    var _pubnubConnection = pubnubConnection(options),
        subscribe = _pubnubConnection.subscribe,
        publish = _pubnubConnection.publish;

    options.onActionRecived = subscribe;
    options.sendAction = publish;

    return (0, _actionSyncer2.default)(options);
}