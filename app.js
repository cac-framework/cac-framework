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
  switch (command.Device.DeviceType) {
    case deviceType.Kinect:
      var skeletonx = command;
      skeletonx.Device.LastUpdateDateTime = new Date().getTime();
      skeletonx.Device.SocketID = wsSession.sessionID;

      if (!(skeletonx.Device.SessionID in allSessionsList)) {
        allSessionsList[skeletonx.Device.SessionID] = new Session(skeletonx.Device.SessionID, wsSession);
      }

      allSessionsList[skeletonx.Device.SessionID].allSkeletonList[skeletonx.Device.DeviceID] = skeletonx;
      sendDataToSessionClients(skeletonx.Device.SessionID, skeletonx.Device, wsSession.sessionID, command, compressData);
      break;
    case deviceType.Wiimote:
    case deviceType.WiiBalanceboard:
      var wiimotex = command;
      wiimotex.Device.LastUpdateDateTime = new Date().getTime();
      wiimotex.Device.SocketID = wsSession.sessionID;

      if (!(wiimotex.Device.SessionID in allSessionsList)) {
        allSessionsList[wiimotex.Device.SessionID] = new Session(wiimotex.Device.SessionID, wsSession);
      }

      allSessionsList[wiimotex.Device.SessionID].allSkeletonList[wiimotex.Device.DeviceID] = wiimotex;
      sendDataToSessionClients(wiimotex.Device.SessionID, wiimotex.Device, wsSession.sessionID, command, compressData);
      break;
    case deviceType.Mindwave:
      var mindwavex = command;
      mindwavex.Device.LastUpdateDateTime = new Date().getTime();
      mindwavex.Device.SocketID = wsSession.sessionID;

      if (!(mindwavex.Device.SessionID in allSessionsList)) {
        allSessionsList[mindwavex.Device.SessionID] = new Session(mindwavex.Device.SessionID, wsSession);
      }

      allSessionsList[mindwavex.Device.SessionID].allSkeletonList[mindwavex.Device.DeviceID] = mindwavex;
      sendDataToSessionClients(mindwavex.Device.SessionID, mindwavex.Device, wsSession.sessionID, command, compressData);
      break;
    case deviceType.RGBVideo:
      var rgbvIdeox = command;
      rgbvIdeox.Device.LastUpdateDateTime = new Date().getTime();
      rgbvIdeox.Device.SocketID = wsSession.sessionID;

      if (!(rgbvIdeox.Device.SessionID in allSessionsList)) {
        allSessionsList[rgbvIdeox.Device.SessionID] = new Session(rgbvIdeox.Device.SessionID, wsSession);
      }

      allSessionsList[rgbvIdeox.Device.SessionID].allSkeletonList[rgbvIdeox.Device.DeviceID] = rgbvIdeox;
      sendDataToSessionClients(rgbvIdeox.Device.SessionID, rgbvIdeox.Device, wsSession.sessionID, command, compressData);
      break;
    case deviceType.AndroidSensor:
      var androidsensorx = command;
      androidsensorx.Device.LastUpdateDateTime = new Date().getTime();
      androidsensorx.Device.SocketID = wsSession.sessionID;

      if (!(androidsensorx.Device.SessionID in allSessionsList)) {
        allSessionsList[androidsensorx.Device.SessionID] = new Session(androidsensorx.Device.SessionID, wsSession);
      }

      allSessionsList[androidsensorx.Device.SessionID].allSkeletonList[androidsensorx.Device.DeviceID] = androidsensorx;
      sendDataToSessionClients(androidsensorx.Device.SessionID, androidsensorx.Device, wsSession.sessionID, command, compressData);
      break;
    case deviceType.Epoc:
      var epocx = command;
      epocx.Device.LastUpdateDateTime = new Date().getTime();
      epocx.Device.SocketID = wsSession.sessionID;

      if (!(epocx.Device.SessionID in allSessionsList)) {
        allSessionsList[epocx.Device.SessionID] = new Session(epocx.Device.SessionID, wsSession);
      }

      allSessionsList[epocx.Device.SessionID].allSkeletonList[epocx.Device.DeviceID] = epocx;
      sendDataToSessionClients(epocx.Device.SessionID, epocx.Device, wsSession.sessionID, command, compressData);
      break;
    case deviceType.Event:
      var eventx = command;
      eventx.Device.LastUpdateDateTime = new Date().getTime();
      eventx.Device.SocketID = wsSession.sessionID;

      if (!(eventx.Device.SessionID in allSessionsList)) {
        allSessionsList[eventx.Device.SessionID] = new Session(eventx.Device.SessionID, wsSession);
      }

      allSessionsList[eventx.Device.SessionID].allSkeletonList[eventx.Device.DeviceID] = eventx;
      sendDataToSessionClients(eventx.Device.SessionID, eventx.Device, wsSession.sessionID, command, compressData);
      break;
    default:
      // default behaviour
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
   * @function streamChannelIsFree
   * @description - Check if a stream channel is free
   * @param {String} deviceName - The name of the device
   * @return {Boolean} - A boolean value indicating whether the channel is free or not
   */
  this.streamChannelIsFree = function (deviceName) {
    if (allStreamChannelSettings[deviceName].SyncOn == false)
      return true;
    return allStreamChannelSettings[deviceName].channelFree;
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
          continue;
      }

      if ((this.receiveExceptions[i].deviceID !== null) && (this.receiveExceptions[i].deviceID !== "")) {
        if (this.receiveExceptions[i].deviceID !== deviceException.deviceID)
          continue;
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
    for (var key in allSessionsList[sessionID].allWebSocketSessionList) {

      var wsSession = allSessionsList[sessionID].allWebSocketSessionList[key];
      var deviceName = getDeviceName(deviceSource.DeviceType);

      if ((wsSession === null) || (wsSession.session === null) || (wsSession.session.sessionID === null) || (wsSession.streamChannelIsFree(deviceName) === false))
        continue;

      if ((wsSession.session.sessionID !== senderSocketID) && ((wsSession.transmissionInProgress === false) || (deviceSource.ObligatoryTransmission === true))) {

        // If a client has requested exception for this device, continue with the next WebSocket session
        if (deviceSource != null) {
          var foundIndex = wsSession.findkDeviceException(deviceSource);
          if (foundIndex > -1)
            continue;
        }

        try {
          wsSession.transmissionInProgress = true;
          // Check if the client requested compressed data
          if (wsSession.receiveCompressedData == true) {
            //compressData();
          } else {
            setChannelStatus(getDeviceName(deviceSource.DeviceType), false); // channel not free
            wsSession.session.send(JSON.stringify(data_));
          }
        }
        catch (err) {
          wsSession.transmissionInProgress = false;
          setChannelStatus(getDeviceName(deviceSource.DeviceType), true); // channel free
        }
        wsSession.transmissionInProgress = false;
      }

    }
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

  if (message.search("\"Device\"") >= 0) {
    message = JSON.parse(message);
    deviceControllerCommand(message, compressData, wsSession);
    wsSession.send("OK"); // message received
  }
  else if (message.search("\"DeviceID\"") >= 0) {
    message = JSON.parse(message);
    deviceCommand(message, wsSession.sessionID); // message is device
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

        var wsSessionx;
        var receiveCompressedDataValue = commandString.substr(22);
        var receiveCompressedDataValueInt = 0;

        if (!receiveCompressedDataValue) {
          wsSession.send("ReceiveCompressedData=ERROR");
          return;
        }

        receiveCompressedDataValueInt = parseInt(receiveCompressedDataValue);

        for (var key in allSessionsList) {
          if (allSessionsList.hasOwnProperty(key)) {
            var session = allSessionsList[key];
            for (var wsKey in session.allWebSocketSessionList) {
              if (session.allWebSocketSessionList.hasOwnProperty(wsKey)) {
                wsSessionx = session.allWebSocketSessionList[wsKey];
                if (wsSessionx.session.sessionID === wsSessionx.sessionID) {
                  wsSessionx.receiveCompressedData = Boolean(receiveCompressedDataValueInt);
                  break;
                }
              }
            }
          }
        }

        wsSession.send("OK"); // message received
      }

      else if ((commandString.substr(0, 5) === "NEXT=") || (commandString.substr(0, 7) === "SYNCON=") || (commandString.substr(0, 8) === "SYNCOFF=")) {

        var indexOfEqual, devicetypeFlag, deviceName;

        indexOfEqual = commandString.indexOf("=") + 1; // index of equal sign
        devicetypeFlag = parseInt(commandString.substr(indexOfEqual));  // Get device type

        // Get device name
        deviceName = getDeviceName(devicetypeFlag);

        // Send an error for an unknown device
        if ((devicetypeFlag === deviceType.unknown) || !deviceName) {
          wsSession.send(commandString.substr(0, indexOfEqual) + "ERROR");
          return;
        }

        for (var key in allSessionsList) {
          if (allSessionsList.hasOwnProperty(key)) {
            var session = allSessionsList[key];
            for (var wsKey in session.allWebSocketSessionList) {
              if (session.allWebSocketSessionList.hasOwnProperty(wsKey)) {
                wsSessionx = session.allWebSocketSessionList[wsKey];
                if (wsSessionx.session.sessionID === wsSessionx.sessionID) {
                  if (commandString.substr(0, 5) === "NEXT=")
                    setChannelStatus(deviceName, true);
                  else if (commandString.substr(0, 7) === "SYNCON=")
                    setSyncStatus(deviceName, true);
                  else if (commandString.substr(0, 8) === "SYNCOFF=")
                    setSyncStatus(deviceName, false);
                  //break;
                }
              }
            }
          }
        }

        wsSession.send("OK"); // Message received

      }
    }
    catch (err) {
      //console.log(err);
    }
  }

}


/**
 * @function deviceCommand
 * @description - Modifies device exceptions
 * @param {Object} device - The device object
 * @param {String} senderSocketID - senderSocketID
 */
function deviceCommand(device, senderSocketID) {

  if ((device === null) || (device.SessionID === null))
    return;

  if (device.DeviceExceptionCmd === deviceExceptionCmd.unknown)
    return;

  if (!(device.SessionID in allSessionsList))
    return;

  // Change device exceptions
  for (var key in allSessionsList[device.SessionID].allWebSocketSessionList) {
    wsSessionx = allSessionsList[device.SessionID].allWebSocketSessionList[key];

    if (wsSessionx.session.sessionID === senderSocketID) {
      if (device.DeviceExceptionCmd == deviceExceptionCmd.addException)
        wsSessionx.addDeviceException(device);
      else if (device.DeviceExceptionCmd == deviceExceptionCmd.removeException)
        wsSessionx.removeDeviceException(device);
      else if (device.DeviceExceptionCmd == deviceExceptionCmd.clearAllExceptions)
        wsSessionx.clearAllDeviceException();
    }

  }
}

/**
 * @function getDeviceName
 * @description - Gets device's name by its type
 * @param {Number} deviceCode - The type of the device
 * @return {String} - The name of the device
 */
function getDeviceName(deviceCode) {
  var deviceName = "";
  for (var key in deviceType) {
    if (deviceType[key] === deviceCode)
      deviceName = key;
  }
  return deviceName;
}