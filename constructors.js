// Required modules
var deviceType = require('./enums.js').deviceType;
var deviceExceptionCmd = require('./enums.js').deviceExceptionCmd;

// Module exports
exports.Session = Session;
exports.WebSocketDeviceSession = WebSocketDeviceSession;
exports.Device = Device;
exports.streamChannelSettings = streamChannelSettings;

/**
 * Represents a Session.
 * @constructor
 * @param {string} sessionID - The session ID.
 * @param {string} wsSession - A WebSockets session.
 */
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
  this.allMicrosoftBandList = {};
  this.allWebSocketSessionList = {};

  // Add WebSockets session to ws session list
  if (wsSession !== null) {
    var wsDeviceSession = new WebSocketDeviceSession();
    wsDeviceSession.session = wsSession;
    wsDeviceSession.sessionID = wsSession.sessionID;
    this.allWebSocketSessionList[wsDeviceSession.sessionID] = wsDeviceSession;
  }

}

/**
 * Represents a WebSocket session.
 * @constructor
 */
function WebSocketDeviceSession() {
  this.sessionID = "";
  this.transmissionInProgress = false;
  this.receiveExceptions = [];
  this.receiveCompressedData = false;
  this.session = {};
  this.allStreamChannelSettings = {};

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

    if (deviceIndex >= 0) {
      this.receiveExceptions.splice(deviceIndex, 1);
      return true;
    }
    else
      return false;
      
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
    this.allStreamChannelSettings = {};

    for (var key in deviceType) {
      if (deviceType.hasOwnProperty(key)) {
        scs = new streamChannelSettings(deviceType[key]);
        this.allStreamChannelSettings[key] = scs;
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
    if (this.allStreamChannelSettings[deviceName].syncOn === false)
      return true;
    //the following code resets the channel's status to free when it is not free for more than 2sec
    //if ( (parseInt(this.allStreamChannelSettings[deviceName].syncOnLastMs) + 2000) < (new Date).getTime())
    //{
    //  this.allStreamChannelSettings[deviceName].channelFree = true;
    //}
    return this.allStreamChannelSettings[deviceName].channelFree;
  }

  /**
   * @function findkDeviceException
   * @description - findkDeviceException
   * @param  {String} deviceException - deviceException
   * @return {Number} - The index of the deviceException found in the receiveExceptions. Otherwise, it returns -1.
   */
  /*
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
    */

  this.findkDeviceException = function (deviceException) {

    var exception;
    var exceptionsLength = this.receiveExceptions.length;
    var index = -1;

    for (var i = 0; i < exceptionsLength; i++) {
      var exception = this.receiveExceptions[i];
      if (exception.deviceType !== deviceType.unknown){
         if(exception.deviceType !== deviceException.deviceType)
            continue;
      }
      if ((exception.DeviceID !== null) && (exception.DeviceID !== "")){
        if (exception.DeviceID !== exception.DeviceID)
          continue;
      }
      index = i;
    }
    return index;
  }

  /**
 * @function setChannelStatus
 * @description - Sets the status of a channel
 * @param {Number} deviceType - The device type
 * @param {Boolean} setChannelFree - True if the channel is free
 */
  this.setChannelStatus = function (deviceType, setChannelFree) {
    this.allStreamChannelSettings[deviceType].channelFree = setChannelFree;
    if(setChannelFree === false)
      this.allStreamChannelSettings[deviceType].syncOnLastMs = parseInt((new Date).getTime());
  }

  /**
   * @function setSyncStatus
   * @description - Sets synchronisation status of a channel
   * @param {Number} deviceType - The device type
   * @param {Boolean} setSyncOn - True if the channel is synchronised
   */
  this.setSyncStatus = function (deviceType, setSyncOn) {
    this.allStreamChannelSettings[deviceType].syncOn = setSyncOn;    
  }

  this.initiateAllStreamChannelSettings();
  this.addRGBException();
}

/**
 * Represents a Device.
 * @constructor
 */
function Device() {
  this.id = 0;
  this.deviceID = ""; // in case of two connected wiimotes the guid, lanip, publicip and devicetype will be identical. The ID will be used to unique identify them
  this.publicIP = "";
  this.lanIP = "";
  this.guid = "";
  this.deviceType = deviceType.Unknown;
  //this.lastUpdateDateTime = new Date().getTime();
  this.socketID = "";
  this.sessionID = "";
  this.deviceExceptionCmd = deviceExceptionCmd.unknown;
  this.obligatoryTransmission = false;
}

/**
 * Represents a channel setting.
 * @constructor
 * @param deviceType - The type of the device.
 */
function streamChannelSettings(deviceType) {
  this.deviceType = deviceType;
  this.syncOn = false;
  this.syncOnLastMs = parseInt((new Date).getTime());
  this.channelFree = true;
};