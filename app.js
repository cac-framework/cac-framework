var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {

  // Set WebSockets ID
  ws.sessionID = ws.upgradeReq.headers["sec-websocket-key"];

  ws.on('message', function incoming(message) {
    //console.log('received: %s', message);
    //var command = JSON.parse(message);
    onDataReceived(ws, message);
  });

  ws.send('something');

});



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

function streamChannelSettings(deviceType) {
  this.deviceType = deviceType;
  this.syncOn = false;
  this.channelFree = true;
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
    this.allWebSocketSessionList[newWebSocketDeviceSession.sessionID] = newWebSocketDeviceSession;
  }

}

function WebSocketDeviceSession() {
  this.sessionID = "";
  this.transmissionInProgress = false;
  this.receiveExceptions = [];
  this.receiveCompressedData = false;
  this.session = {};


  // TODO - merge addDeviceException, removeDeviceException and clearAllDeviceException
  /**
   * @function deviceControllerCommand
   * @description - description
   * @param {Object} device - A device object
   * @return {Boolean} - A boolean value indicating whether the exception is stored or not.
   */
  this.addDeviceException = function (device) {
    device.lastUpdateDateTime = new Date().getTime();
    if (this.findkDeviceException(device) < 0) {
      this.receiveExceptions.push(device);
      return true;
    }
    else
      return false;
  }

  /**
   * @function removeDeviceException
   * @description -
   * @param {Object} device - A device object
   * @return {Boolean} -
   */
  this.removeDeviceException = function (device) {
    device.lastUpdateDateTime = new Date().getTime();

    var deviceIndex = this.findkDeviceException(device);
    if (deviceIndex < 0)
      return false;
    else {
      this.receiveExceptions.splice(deviceIndex, 1);
      return true;
    }

  }

  /**
   * @function clearAllDeviceException
   * @description -
   * @return {Boolean} -
   */
  this.clearAllDeviceException = function (device) {
    this.receiveExceptions = [];
    return true;
  }

  /**
 * @function initiateAllStreamChannelSettings
 * @description - Initiates all stream channel settings
 */
  this.initiateAllStreamChannelSettings = function () {

    var scs = {};
    allStreamChannelSettings = {};

    for (var key in deviceType) {
      if (deviceType.hasOwnProperty(key)) {
        scs = new streamChannelSettings(deviceType[key]);
        allStreamChannelSettings[key] = scs;
      }
    }

  }

  /**
 * @function initiateAllStreamChannelSettings
 * @description - Initiates all stream channel settings
 */
  this.addRGBException = function () {
    var dev = new Device();
    dev.deviceExceptionCmd = deviceExceptionCmd.addException;
    dev.deviceType = deviceType.RGBVideo;
    dev.sessionID = this.sessionID;
    this.addDeviceException(dev);
  }

  /**
 * @function findkDeviceException
 * @description - findkDeviceException
 * @param  {String} deviceException - deviceException
 * @return {Number} - The index of the deviceException found in the receiveExceptions. Otherwise, it returns -1.
 */
  this.findkDeviceException = function (deviceException) {

    for (var i = 0; i < this.receiveExceptions.length; i++) {
      if (this.receiveExceptions[i].deviceType !== deviceType.unknown) {
        if (this.receiveExceptions[i].deviceType !== deviceException.deviceType)
          return;
      }

      if ((this.receiveExceptions[i].deviceID !== null) && (this.receiveExceptions[i].deviceID !== "")) {
        if (this.receiveExceptions[i].deviceID !== deviceException.deviceID)
          return;
      }

      return i;
    }

    return -1;
  }

  this.initiateAllStreamChannelSettings();
  this.addRGBException();
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
 * @function setSyncStatus
 * @description - Sets synchronisation status of a channel
 * @param {Number} deviceType - The device type
 * @param {Boolean} setSyncOn - True if the channel is synchronised
 */
function setSyncStatus(deviceType, setSyncOn) {
  allStreamChannelSettings[deviceType].syncOn = setSyncOn;
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
  this.deviceExceptionCmd = deviceExceptionCmd.unknown;
  this.obligatoryTransmission = false;
}


/**
 * @function onDataReceived
 * @description - Handles data sent from a client
 * @param {String} wsSession - The WebSockets session
 * @param {String} message - The message received
 */
function onDataReceived(wsSession, message) {

  var commandsList = [];
  var commandString = "";
  var compressData = null;
  var sessionID = "";

  if (message.ContainerCompression) {
    // todo - Uncompress
  }

  if (message.Device) {
    commandsList.push(message);
    deviceControllerCommand(message, compressData, wsSession);
    commandsList = [];
    wsSession.send("OK"); // message received
  }
  else if (message.DeviceID) {
    deviceCommand(message, wsSession.sessionID); // message is device
    commandsList = [];
  }
  else {
    commandsList = message.split(",");
  }

  for (var cmdInd = 0; cmdInd < commandsList.length; cmdInd++) {

    commandString = commandsList[cmdInd];

    try {

      if (commandString.substr(0, 10) === "SessionID=") {

        try {
          sessionID = commandString.substr(10);
          if ((sessionID === null) || (sessionID === "")) {
            wsSession.send("SessionID=ERROR");
            return;
          }

          if (!allSessionsList.sessionID) {
            var sessionx = new Session(sessionID, wsSession);
            allSessionsList[sessionID] = sessionx;
          }
        }
        catch (err) {
          console.log("WS message received 'SessionID' failed A: " + err);
        }

        // Get the WebSocket session and add it to sessions list
        var wsDeviceSession = null;

        for (var key in allSessionsList) {
          if (allSessionsList.hasOwnProperty(key)) {
            var session = allSessionsList[key];
            if (session.allWebSocketSessionList[wsSession.sessionID]) {
              wsDeviceSession = session.allWebSocketSessionList[wsSession.sessionID];
              delete session.allWebSocketSessionList[wsSession.sessionID];
            }
          }
        }


        if (wsDeviceSession === null) {
          wsDeviceSession = new WebSocketDeviceSession();
          wsDeviceSession.session = wsSession;
          wsDeviceSession.sessionID = wsSession.sessionID;
        }

        allSessionsList[sessionID].allWebSocketSessionList[wsDeviceSession.sessionID] = wsDeviceSession;

        wsSession.send("OK"); // Message received
      }

      else if (commandString.substr(0, 22) === "ReceiveCompressedData=") {

        var receiveCompressedDataValue = commandString.substr(22);
        var receiveCompressedDataValueInt = 0;

        if (!receiveCompressedDataValue) {
          wsSession.send("ReceiveCompressedData=ERROR");
          return;
        }

        receiveCompressedDataValueInt = parseInt(receiveCompressedDataValue);

        allSessionsList.forEach(function (session, index) {
          session.allWebSocketSessionList.forEach(function (wsSessionx, index) {
            if (wsSessionx.session.sessionID == wsSessionx.sessionID) {
              wsSessionx.receiveCompressedData = Boolean(receiveCompressedDataValueInt);
              //TODO - break not function inside .forEach function
              //break;
            }
          })
        });

        wsSessionx.Send("OK"); //message received
      }

      else if ((commandString.substr(0, 5) === "NEXT=") || (commandString.substr(0, 7) === "SYNCON=") || (commandString.substr(0, 8) === "SYNCOFF=")) {

        var indexOfEqual = commandString.indexOf("=") + 1;
        var devicetypeNextFlag = commandString.substr(indexOfEqual);
        devicetypeNextFlag = parseInt(devicetypeNextFlag);

        // TODO - add the other condition as well
        if (devicetypeNextFlag === 0) {
          //if ((devicetypeNextFlag === 0) || (Enum.IsDefined(typeof (DeviceTypeEnum), devicetypeNextFlag) == false)) {

          wsSessionx.send(commandString.substr(0, indexOfEqual) + "ERROR");
          return;
        }

        allSessionsList.forEach(function (session, index) {
          session.allWebSocketSessionList.forEach(function (wsSessionx, index) {
            if (wsSessionx.session.sessionID == wsSessionx.sessionID) {
              if (commandString.substr(0, 5) === "NEXT=")
                setChannelStatus(devicetypeNextFlag, true);
              else if (commandString.substr(0, 7) === "SYNCON=")
                setSyncStatus(devicetypeNextFlag, true);
              else if (commandString.substr(0, 8) === "SYNCOFF=")
                setSyncStatus(devicetypeNextFlag, false);
              // TODO - break is not supported in forEach
              //break;
            }
          });
        });

      }
    }
    catch (err) {
      //console.log(err);
    }
  }

}


/**
 * @function deviceCommand
 * @description - deviceCommand
 * @param {Object} devicex - The device object
 * @param {String} senderSocketID - senderSocketID
 */
function deviceCommand(devicex, senderSocketID) {

  if ((devicex === null) || (devicex.SessionID === null))
    return;

  if (devicex.deviceExceptionCmd === deviceExceptionCmd.unknown)
    return;

  if (!(devicex.SessionID in allSessionsList))
    return;

  allSessionsList[devicex.sessionID].allWebSocketSessionList.forEach(function (wsSessionx, index) {
    if (wsSessionx.session.sessionID === senderSocketID) {
      if (devicex.deviceExceptionCmd == deviceExceptionCmd.addException)
        wsSessionx.addDeviceException(devicex);
      else if (devicex.deviceExceptionCmd == deviceExceptionCmd.removeException)
        wsSessionx.removeDeviceException(devicex);
      else if (devicex.deviceExceptionCmd == deviceExceptionCmd.clearAllExceptions)
        wsSessionx.clearAllDeviceException();
    }
  });

}