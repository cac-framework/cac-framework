// Required modules
var Session = require('./constructors.js').Session,
  WebSocketDeviceSession = require('./constructors.js').WebSocketDeviceSession,
  Device = require('./constructors.js').Device,
  streamChannelSettings = require('./constructors.js').streamChannelSettings,
  deviceType = require('./enums.js').deviceType,
  deviceExceptionCmd = require('./enums.js').deviceExceptionCmd,
  WebSocketServer = require('ws').Server;

// Session and channel settings containers
var allSessionsList = {},
  allStreamChannelSettings = {};

// Create a WebSocket server 
var wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {

  ws.sessionID = ws.upgradeReq.headers["sec-websocket-key"]; // Set WebSockets ID

  ws.on('message', function incoming(message) {
    onDataReceived(ws, message);
  });

  ws.send('Connection established.'); // Send message

});

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

/**
 * @function deviceControllerCommand
 * @description - description
 * @param {Object} devicex - An object containing a device object
 * @param {String} compressData - compressData
 * @param {Object} wsSession - A WebSocket session
 */
function deviceControllerCommand(devicex, compressData, wsSession) {

  var device = devicex.Device;

  device.LastUpdateDateTime = new Date().getTime();
  device.SocketID = wsSession.sessionID;

  if (!(device.SessionID in allSessionsList)) {
    allSessionsList[device.SessionID] = new Session(device.SessionID, wsSession);
  }

  switch (device.DeviceType) {
    case deviceType.Kinect:
      allSessionsList[device.SessionID].allSkeletonList[device.DeviceID] = devicex;
      break;
    case deviceType.Wiimote:
    case deviceType.WiiBalanceboard:
      allSessionsList[device.SessionID].allWiimoteList[device.DeviceID] = devicex;
      break;
    case deviceType.Mindwave:
      allSessionsList[device.SessionID].allMindwaveList[device.DeviceID] = devicex;
      break;
    case deviceType.RGBVideo:
      allSessionsList[device.SessionID].allColorVideoList[device.DeviceID] = devicex;
      break;
    case deviceType.AndroidSensor:
      allSessionsList[device.SessionID].allAndroidSensorList[device.DeviceID] = devicex;
      break;
    case deviceType.Epoc:
      allSessionsList[device.SessionID].allEpocList[device.DeviceID] = devicex;
      break;
    case deviceType.Event:
      allSessionsList[device.SessionID].allEventList[device.DeviceID] = devicex;
      break;
    default:
      // default behaviour
      break;
  }

  sendDataToSessionClients(device.SessionID, device, wsSession.sessionID, devicex, compressData);
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
            wsSession.setChannelStatus(getDeviceName(deviceSource.DeviceType), false); // channel not free
            wsSession.session.send(JSON.stringify(data_));
          }
        }
        catch (err) {
          wsSession.transmissionInProgress = false;
          wsSession.setChannelStatus(getDeviceName(deviceSource.DeviceType), true); // channel free
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
                    wsSessionx.setChannelStatus(deviceName, true);
                  else if (commandString.substr(0, 7) === "SYNCON=")
                    wsSessionx.setSyncStatus(deviceName, true);
                  else if (commandString.substr(0, 8) === "SYNCOFF=")
                    wsSessionx.setSyncStatus(deviceName, false);
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
      // console.log(err);
    }
  }
}