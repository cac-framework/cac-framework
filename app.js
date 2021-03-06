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

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true ;
}

// Create a WebSocket server 
var wss = new WebSocketServer({ port: 8083 });

wss.on('connection', function connection(ws) {

  ws.sessionID = ws.upgradeReq.headers["sec-websocket-key"]; // Set WebSockets ID

  ws.on('message', function incoming(message) {
    onDataReceived(ws, message);
  });

  ws.on('close', function (code, message) {
    for (var sKey in allSessionsList) {
      var wsSessions = allSessionsList[sKey].allWebSocketSessionList;
      for (var wsKey in wsSessions) {
        delete wsSessions[ws.sessionID];
        if(isEmpty(wsSessions)) {
          delete allSessionsList[sKey];
        }
      }
    }
  });

  ws.send('Connection established.'); // Send message

});





//GIven that the certificate is self-signed, the https://localhost:8084/ shall be visited from the browser to enable us accepting the self-signed certificate.
// Create a second SSL enabled WebSocket server 
var cfg = {
 ssl: true,
 port: 8084,
 ssl_key: 'cert/cert.key',
 ssl_cert: 'cert/cert.cert',
 ssl_pfx: 'cert/cert.pfx'
};


var httpServ = ( cfg.ssl ) ? require('https') : require('http');
var WebSocketServer = require('ws').Server;
var app = null;
// dummy request processing
var processRequest = function( req, res ) {
  res.writeHead(200);
  res.end("All glory to WebSockets!\n");                  
};

var fs = require('fs');
if ( cfg.ssl ) {
 app = httpServ.createServer({      
      // providing server with  SSL key/cert
      //key: fs.readFileSync( cfg.ssl_key ),
      //cert: fs.readFileSync( cfg.ssl_cert )
      //ca: fs.readFileSync(config.ssl.ca) //this could be probably ommited
      pfx: fs.readFileSync(cfg.ssl_pfx),
      passphrase: '1234'
      //requestCert: true,
      //rejectUnauthorized: true
      }, processRequest ).listen( cfg.port );
} else {
  app = httpServ.createServer( processRequest ).listen( cfg.port );
}

// Create a second SSL enabled WebSocket server 
var wssssl = new WebSocketServer({ server: app });

wssssl.on('connection', function connection(ws) {

  ws.sessionID = ws.upgradeReq.headers["sec-websocket-key"]; // Set WebSockets ID

  ws.on('message', function incoming(message) {
    onDataReceived(ws, message);
  });

  ws.on('close', function (code, message) {
    for (var sKey in allSessionsList) {
      var wsSessions = allSessionsList[sKey].allWebSocketSessionList;
      for (var wsKey in wsSessions) {
        delete wsSessions[ws.sessionID];
        if(isEmpty(wsSessions)) {
          delete allSessionsList[sKey];
        }
      }
    }
  });

  ws.send('Connection established.'); // Send message

});

function convertToDevice(device) {

  var devicex = new Device();

  devicex.id = device.ID;
  devicex.deviceID = device.DeviceID;
  devicex.publicIP = device.PublicIP;
  devicex.lanIP = device.LanIP;
  devicex.guid = device.GUID;
  devicex.deviceType = device.DeviceType;
  devicex.lastUpdateDateTime = device.LastUpdateDateTime;
  devicex.socketID = device.SocketID;
  devicex.sessionID = device.SessionID;
  devicex.deviceExceptionCmd = device.DeviceExceptionCmd;
  devicex.obligatoryTransmission = device.ObligatoryTransmission;

  return devicex;
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




function getStreamingSourcesDemand(sessionID){
  //iterates all the exceptions of all the connected clients and consolidates a source demand list
  //which is then send to each client when it connects and to all the connected clients when another
  //client changes its exception list
}

/**
 * @function deviceControllerCommand
 * @description - description
 * @param {Object} devicex - An object containing a device object
 * @param {String} compressData - compressData
 * @param {Object} wsSession - A WebSocket session
 */
function deviceControllerCommand(devicex, compressData, wsSession) {

  var device = convertToDevice(devicex.Device);

  device.lastUpdateDateTime = new Date().getTime();
  device.socketID = wsSession.sessionID;

  if (!(device.sessionID in allSessionsList)) {
    allSessionsList[device.sessionID] = new Session(device.sessionID, wsSession);
  }

  switch (device.deviceType) {
    case deviceType.Kinect:
      allSessionsList[device.sessionID].allSkeletonList[device.deviceID] = devicex;
      break;
    case deviceType.Wiimote:
    case deviceType.WiiBalanceboard:
      allSessionsList[device.sessionID].allWiimoteList[device.deviceID] = devicex;
      break;
    case deviceType.Mindwave:
      allSessionsList[device.sessionID].allMindwaveList[device.deviceID] = devicex;
      break;
    case deviceType.RGBVideo:
      allSessionsList[device.sessionID].allColorVideoList[device.deviceID] = devicex;
      break;
    case deviceType.AndroidSensor:
      allSessionsList[device.sessionID].allAndroidSensorList[device.deviceID] = devicex;
      break;
    case deviceType.Epoc:
      allSessionsList[device.sessionID].allEpocList[device.deviceID] = devicex;
      break;
    case deviceType.Event:
      allSessionsList[device.sessionID].allEventList[device.deviceID] = devicex;
      break;
    case deviceType.MicrosoftBand:
      allSessionsList[device.sessionID].allMicrosoftBandList[device.deviceID] = devicex;
      break;
    default:
      // default behaviour
      break;
  }

  sendDataToSessionClients(device.sessionID, device, wsSession.sessionID, devicex, compressData);
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
      var deviceName = getDeviceName(deviceSource.deviceType);

      if ((wsSession === null) || (wsSession.session === null) || (wsSession.session.sessionID === null) || (wsSession.streamChannelIsFree(deviceName) === false))
        continue;

      if ((wsSession.session.sessionID !== senderSocketID) && ((wsSession.transmissionInProgress === false) || (deviceSource.obligatoryTransmission === true))) {
        // If a client has requested exception for this device, continue with the next WebSocket session
        if (deviceSource != null) {
          var foundIndex = wsSession.findkDeviceException(deviceSource);
          if (foundIndex >= 0)
            continue;
        }

        try {
          wsSession.transmissionInProgress = true;
          // Check if the client requested compressed data
          if (wsSession.receiveCompressedData == true) {
            //compressData();
          } else {
            wsSession.setChannelStatus(getDeviceName(deviceSource.deviceType), false); // channel not free
            wsSession.session.send(JSON.stringify(data_));
          }
        }
        catch (err) {
          wsSession.transmissionInProgress = false;
          wsSession.setChannelStatus(getDeviceName(deviceSource.deviceType), true); // channel free
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

  var dev = convertToDevice(device);

  // Change device exceptions
  for (var key in allSessionsList[device.SessionID].allWebSocketSessionList) {
    wsSessionx = allSessionsList[device.SessionID].allWebSocketSessionList[key];

    if (wsSessionx.session.sessionID === senderSocketID) {
      if (dev.deviceExceptionCmd === deviceExceptionCmd.addException)
        wsSessionx.addDeviceException(dev);
      else if (dev.deviceExceptionCmd === deviceExceptionCmd.removeException)
        wsSessionx.removeDeviceException(dev);
      else if (dev.deviceExceptionCmd === deviceExceptionCmd.clearAllExceptions)
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

          if (!allSessionsList[sessionID]) {
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
            if (typeof session.allWebSocketSessionList[wsSession.sessionID] !== 'undefined') {
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
              if (session.allWebSocketSessionList.hasOwnProperty(wsSession.sessionID)) {
                wsSessionx = session.allWebSocketSessionList[wsSession.sessionID];
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

        wsSession.send("OK"); // Message received

      }
    }
    catch (err) {
      // console.log(err);
    }
  }
}