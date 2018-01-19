'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = actionSyncMiddleware;
var actionSet = new Set();

// eslint-disable-next-line
var noActionMiddleware = function noActionMiddleware(store) {
    return function (next) {
        return function (action) {
            return next(action);
        };
    };
};

var receiverCombo = function receiverCombo(onActionRecived) {
    return function (store) {
        return function (result) {
            onActionRecived(store.dispatch);
            return result;
        };
    };
};

// eslint-disable-next-line
var sender = function sender(actionSender) {
    return function (store) {
        return function (next) {
            return function (action) {
                actionSender(action);
                next(action);
            };
        };
    };
};

var receiver = function receiver(actionIterator) {
    return function (store) {
        return receiverCombo(actionIterator)(store)(noActionMiddleware(store));
    };
};

var both = function both(actionIterator) {
    return function (actionSender) {
        return function (store) {
            return receiverCombo(actionIterator)(store)(sender(actionSender)(store));
        };
    };
};

// eslint-disable-next-line
var defaultFilter = function defaultFilter(action) {
    return true;
};

function actionSyncMiddleware(inputOptions) {
    var options = Object.assign({}, {
        // ignore this middleware
        ignore: false,
        // Modus operandum
        // Possible values...
        // sender : sends the dispatched actions to server
        // receiver : recives actions from server and dispatches them
        // both : acts as both sender and reciver
        mode: 'both',
        // A function that takes a function accepting an action as input.
        // Expecting the input function to be called whenever a new action is available.
        // Required in the 'receiver' and 'both' modes
        onActionRecived: function onActionRecived() {
            var error = { message: 'Method required' };
            throw error;
        },
        // A function taking an action, that will be called whenever an action happens
        // Required in the 'sender' and 'both' modes
        sendAction: function sendAction() {
            var error = { message: 'Method required' };
            throw error;
        },
        // filter applied before sending actions to server
        sendFilter: defaultFilter,
        // filter applied before dispatching action recived from server
        receiverFilter: defaultFilter
    }, inputOptions);

    var ignore = options.ignore,
        receiverFilter = options.receiverFilter,
        sendFilter = options.sendFilter,
        sendAction = options.sendAction,
        onActionRecived = options.onActionRecived,
        mode = options.mode;


    if (ignore) {
        return noActionMiddleware;
    }

    var onActionRecivedWrapper = function onActionRecivedWrapper(dispatch) {
        return onActionRecived(function (action) {
            if (receiverFilter(action)) {
                actionSet.add(action);
                dispatch(action);
            }
        });
    };

    var actionSender = function actionSender(action) {
        // eslint-disable-next-line
        if (actionSet.has(action)) {
            actionSet.delete(action);
            return;
        }

        if (sendFilter(action)) {
            sendAction(action);
        }
    };

    switch (mode) {
        case 'sender':
            return sender(actionSender);
        case 'receiver':
            return receiver(onActionRecivedWrapper);
        default:
            return both(onActionRecivedWrapper)(actionSender);
    }
}