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

// Module exports
exports.deviceType = deviceType;
exports.deviceExceptionCmd = deviceExceptionCmd;