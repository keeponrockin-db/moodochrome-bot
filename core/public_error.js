'use strict'
const reload = require('require-reload')(require);
const logger = require('./logger.js');
const assert = require('assert');
const strings = reload('./string_factory.js').publicError;
const ErisUtils = reload('./util/eris_utils.js');

const PublicMessageType = {
  NONE: 0,
  GENERIC: 1,
  INSUFFICIENT_PRIVILEGE: 2,
};

/**
* An error containing a message that should be sent to the channel the command was invoked in.
* That message gets sent instead of the generic error message (assuming commands and message processors
* and such are returning their promises).
*/
class PublicError extends Error {
  // Don't invoke this constructor, use the static factory methods.
  constructor(publicMessage, deleteAutomatically, logDescription, internalErr) {
    super(publicMessage, internalErr && internalErr.fileName, internalErr && internalErr.lineNumber);
    this.publicMessage_ = publicMessage;
    this.internalErr_ = internalErr;
    this.logDescription_ = logDescription;
    this.deleteAutomatically_ = !!deleteAutomatically;
  }

  /**
  * Factory method for constructing an error with a custom public message.
  * @param {String} publicMessage - The public message to send to the channel.
  * @param {Boolean} deleteAutomatically - Whether the public message should be deleted automatically after a short period of time.
  * @param {String} logDescription - Brief description of the error (for logging). If this evaluates to false, a generic description will be used.
  * @param {Error} [internalError] - The original error that was thrown (if one exists and you want its stack trace logged).
  */
  static createWithCustomPublicMessage(publicMessage, deleteAutomatically, logDescription, internalErr) {
    return new PublicError(publicMessage, deleteAutomatically, logDescription, internalErr);
  }

  /**
  * Factory method for constructing an error with a generic public message.
  * @param {Boolean} deleteAutomatically - Whether the public message should be deleted automatically after a short period of time.
  * @param {String} logDescription - Brief description of the error (for logging). If this evaluates to false, a generic description will be used.
  * @param {Error} [internalError] - The original error that was thrown (if one exists and you want its stack trace logged).
  */
  static createWithGenericPublicMessage(deleteAutomatically, logDescription, internalErr) {
    return new PublicError(PublicMessageType.GENERIC, deleteAutomatically, logDescription, internalErr);
  }

  /**
  * Factory method for constructing an error with no public message.
  * @param {Boolean} deleteAutomatically - Whether the public message should be deleted automatically after a short period of time.
  * @param {String} logDescription - Brief description of the error (for logging). If this evaluates to false, a generic description will be used.
  * @param {Error} [internalError] - The original error that was thrown (if one exists and you want its stack trace logged).
  */
  static createWithNoPublicMessage(logDescription, internalErr) {
    return new PublicError(PublicMessageType.NONE, false, logDescription, internalErr);
  }

  /**
  * Factory method for constructing an insufficient privilege error. Returns undefined if the error is not an insufficient privilege error.
  * @param {Error} err - The internal error.
  * @returns {(PublicError|undefined)} Undefined if the error is not an insufficient privilege error. A PublicError object otherwise.
  */
  static createInsufficientPrivilegeError(err) {
    if (err.output && err.publicMessage_ === PublicMessageType.INSUFFICIENT_PRIVILEGE) {
      return err;
    }
    let isInsufficientPrivilegeError = err.message.indexOf(strings.missingPermissionsDiscordError) !== -1;
    if (isInsufficientPrivilegeError) {
      return new PublicError(PublicMessageType.INSUFFICIENT_PRIVILEGE, false, 'Insufficient privileges', err);
    }
  }

  output(logger, loggerTitle, config, msg, forceSilentFail) {
    let publicMessage = this.publicMessage_;
    if (forceSilentFail) {
      publicMessage = PublicMessageType.NONE;
    }
    if (publicMessage === PublicMessageType.GENERIC) {
      publicMessage = config.genericErrorMessage;
    } else if (publicMessage === PublicMessageType.INSUFFICIENT_PRIVILEGE) {
      publicMessage = config.missingPermissionsErrorMessage;
    } else if (publicMessage === PublicMessageType.NONE) {
      publicMessage = undefined;
    }

    if (publicMessage) {
      if (this.deleteAutomatically_) {
        ErisUtils.sendMessageAndDelete(msg, publicMessage);
      } else {
        msg.channel.createMessage(publicMessage);
      }
    }

    let logDescription = this.logDescription_;
    if (!logDescription) {
      logDescription = strings.genericErrorDescriptionLog;
    }

    logger.logInputReaction(loggerTitle, msg, '', false, logDescription);
    if (this.internalErr_) {
      logger.logFailure(loggerTitle, strings.createErrorDescription(msg.content), this.internalErr_);
    }
  }
}

module.exports = PublicError;
