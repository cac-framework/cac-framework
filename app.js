var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');
  
});

return;


/**
 * Enum for device types
 * @readonly
 * @enum {number}
 */
var deviceType = {
  Unknown: 0,
  Kinect: 1,
  Wiimote: 2,
  WiiBalanceboard: 3,
  Mindwave: 4,
  RGBVideo: 5,
  DepthVideo: 6,
  AndroidSensor: 7,
  Epoc: 8,
  Annotation: 9,
  Event: 10
}

/**
 * Enum for device exceptions
 * @readonly
 * @enum {number}
 */
var deviceExceptionCmd = {
  unknown: 0,
  addException: 1,
  removeException: 2,
  clearAllExceptions: 3
}

// Contains all sessions (key: sessionID, value: session)
var allSessionsList = {};

// Contains all streamChannelSettings (key: deviceType, value: streamChannelSettings)
var allStreamChannelSettings = {};

var streamChannelSettings = {
  deviceType: deviceType.unknown,
  syncOn: false,
  channelFree: true
};

/**
 * @function deviceControllerCommand
 * @description - description
 * @param {String} command - command
 * @param {String} compressData - compressData
 * @param {Object} wsSession - wsSession
 */
function deviceControllerCommand(command, compressData, wsSession) {
  switch (command.DeviceType) {
    case 1:
      var seletonx = command;
      skeletonx.Device.LastUpdateDateTime = new Date().getTime();
      skeletonx.Device.SocketID = wsSession.sessionID;

      if (!(skeletonx.Device.SessionID in allSessionsList)) {
        allSessionsList[skeletonx.Device.SessionID] = new Session(skeletonx.Device.SessionID, wsSession);
      }

      allSessionsList[skeletonx.Device.SessionID].allSkeletonList[skeletonx.Device.DeviceID] = skeletonx;
      sendDataToSessionClients(skeletonx.Device.SessionID, skeletonx.Device, wsSession.sessionID, commandString, compressData);
      break;
    case 2:
    case 3:
    case 4:
    case 5:
      text = "Soon it is Weekend";
      break;
    case 0:
    case 6:
      text = "It is Weekend";
    default:
      text = "Looking forward to the Weekend";
      break;
  }
}

function Session(sessionID, wsSession) {

  this.sessionID = sessionID;
  this.updatedDateTime = new Date().getTime();

  this.allWiimoteList = {};
  this.allSkeletonList = {};
  this.allMindwaveList = {};
  this.allColorVideoList = {};
  this.allAndroidSensorList = {};
  this.allEpocList = {};
  this.allEventList = {};
  this.allWebSocketSessionList = {};

  if (wsSession != null) {
    var newWebSocketDeviceSession = new WebSocketDeviceSession();
    newWebSocketDeviceSession.session = wsSession;
    newWebSocketDeviceSession.sessionID = wsSession.sessionID;
    this.allWebSocketSessionList[newWebSocketDeviceSession.SessionID] = newWebSocketDeviceSession;
  }

}

function WebSocketDeviceSession() {
  this.sessionID = "";
  this.transmissionInProgress = false;
  this.receiveExceptions = [];
  this.receiveCompressedData = false;
  this.session = {};
  initiateAllStreamChannelSettings();
  addRGBException();
}

/**
 * @function sendDataToSessionClients
 * @description - Sends data to all clients with same session ID
 * @param {String} sessionID - The device type
 * @param {Number} deviceSource - The device type
 * @param {String} senderSocketID - The WebSocket ID of the client
 * @param {String} data_ - The data to send
 * @param {String} compressdata_ - compressdata_
 */
function sendDataToSessionClients(sessionID, deviceSource, senderSocketID, data_, compressdata_) {

  try {

    if (!(sessionID in allSessionsList))
      return;

    // Iterate through WebSockets sessions
    allSessionsList[sessionID].allWebSocketSessionList.forEach(function (wsSession, index) {

      if ((wsSession === null) || (wsSession.session === null) || (wsSession.session.sessionID === null) || (wsSession.streamChannelIsFree(deviceSource.DeviceType) === false))
        return;

      if ((wsSession.session.sessionID !== senderSocketID) && ((wsSession.transmissionInProgress === false) || (deviceSource.ObligatoryTransmission === true))) {

        // If a client has requested exception for this device, continue with the next WebSocket session
        if (deviceSource != null) {
          var foundIndex = wsSession.findkDeviceException(deviceSource);
          if (foundIndex > -1)
            return;
        }

        try {
          wsSession.transmissionInProgress = true;
          // Check if the client requested compressed data
          if (wsSession.receiveCompressedData == true) {
            //compressData();
          } else {
            wsSession.setChannelStatus(deviceSource.deviceType, false); // channel not free
            wsSession.session.send(data_);
          }
        }
        catch (err) {
          wsSession.transmissionInProgress = false;
          wsSession.setChannelStatus(deviceSource.deviceType, true); // channel free
        }
        wsSession.transmissionInProgress = false;
      }

    });
  }
  catch (err) {
    //console.log(err);
  }

}

/**
 * @function setChannelStatus
 * @description - Sets the status of a channel
 * @param {Number} deviceType - The device type
 * @param {Boolean} setChannelFree - True if the channel is free
 */
function setChannelStatus(deviceType, setChannelFree) {
  allStreamChannelSettings[deviceType].channelFree = setChannelFree;
}


/**
 * @function findkDeviceException
 * @description - findkDeviceException
 * @param  {String} deviceException - deviceException
 * @return {Number} - The index of the deviceException found in the ReceiveExceptions. Otherwise, it returns -1.
 */
function findkDeviceException(deviceException) {

  for (var i = 0; i < ReceiveExceptions.Count; i++) {
    if (ReceiveExceptions[i].DeviceType != DeviceTypeEnum.Unknown) {
      if (ReceiveExceptions[i].DeviceType != deviceException.DeviceType)
        return;
    }

    if ((ReceiveExceptions[i].DeviceID != null) && (ReceiveExceptions[i].DeviceID != "")) {
      if (ReceiveExceptions[i].DeviceID != deviceException.DeviceID)
        return;
    }

    return i;
  }

  return -1;
}



function Device() {
  this.id = 0;
  this.deviceID = "";     //in case of two connected wiimotes the guid, lanip, publicip and devicetype will be identical. The ID will be used tounoque identify them
  this.publicIP = "";
  this.lanIP = "";
  this.gUID = "";
  this.deviceType = deviceType.Unknown;
  this.lastUpdateDateTime = new Date().getTime();
  this.socketID = "";
  this.sessionID = "";
  this.deviceExceptionCmd = deviceExceptionCmdEnum.unknown;
  this.obligatoryTransmission = false;
}