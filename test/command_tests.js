const assert = require('assert');
const Command = require('./../core/command.js');
const MockMessage = require('./mock_objects/mock_message.js');
const MockConfig = require('./mock_objects/mock_config.js');
const persistence = require('./../core/persistence.js');
const Storage = require('node-persist');
const MockLogger = require('./mock_objects/mock_logger.js');
const SettingsManager = require('./../core/settings_manager.js');
const strings = require('./../core/string_factory.js').command;

const MsgNoPerms = new MockMessage('channel1', 'user1', 'Username', ['Server Admin'], []);
const MsgIsServerAdminWithTag = new MockMessage('channel1', 'user1', 'Username', ['Server Admin'], ['Server Admin']);
const MsgIsServerAdmin = new MockMessage('channel1', 'user1', 'Username', [], [], 'content', ['manageGuild']);
const MsgIsBotAdmin = new MockMessage('channel1', 'bot-admin-id', 'Username');
const MsgIsBotAndServerAdmin = new MockMessage('channel1', 'bot-admin-id', 'Username', ['Server Admin'], ['Server Admin']);
const MsgDM = new MockMessage('channel1', 'not-bot-admin', 'Username');
const config = new MockConfig('Server Admin', ['bot-admin-id']);

let enabledSettingsGetter = {
  getSettings: (bot, msg, fullyQualifiedUserFacingSettingNames) => {
    let settings = {
      serverSettings: {},
    };
    for (let fullyQualifiedUserFacingSettingName of fullyQualifiedUserFacingSettingNames) {
      settings.serverSettings[fullyQualifiedUserFacingSettingName] = true;
    }
    return Promise.resolve(settings);
  }
};

if (!persistence.initialized_) {
  persistence.init({dir: './test/persistence'});
}

Storage.clearSync();

const commandDataNoAliases = {
  commandAliases: [],
  canBeChannelRestricted: false,
  action(bot, msg, suffix) { },
};

const commandDataUndefinedAliases = {
  canBeChannelRestricted: false,
  action(bot, msg, suffix) { },
};

const commandDataBlankAlias = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', ''],
  action(bot, msg, suffix) { },
};

const commandDataNonStringAliases = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 5],
  action(bot, msg, suffix) { },
};

const commandDataNonNumberCooldown = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  cooldown: 'string',
  action(bot, msg, suffix) { },
};

const commandDataNegativeCooldown = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  cooldown: -5,
  action(bot, msg, suffix) { },
};

const commandDataNoAction = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
};

const commandDataInvalidAction = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  action: 'invalid',
};

const commandDataMissingUniqueId = {
  commandAliases: ['alias1', 'alias2'],
  canBeChannelRestricted: true,
  action(bot, msg, suffix) { },
};

const commandDataNonStringUniqueId = {
  commandAliases: ['alias1', 'alias2'],
  canBeChannelRestricted: true,
  uniqueId: 5,
  action(bot, msg, suffix) { },
};

const commandDataInvalidServerAdminOnly = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  serverAdminOnly: 'invalid',
  action(bot, msg, suffix) { },
};

const commandDataInvalidBotAdminOnly = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  botAdminOnly: 'invalid',
  action(bot, msg, suffix) { },
};

const commandDataInvalidCanBeChannelRestricted = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  canBeChannelRestricted: 'invalid',
  action(bot, msg, suffix) { },
};

const commandDataInvalidOnlyInServer = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  onlyInServer: 'invalid',
  action(bot, msg, suffix) { },
};

const validCommandDataWith1SecondCooldown = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  cooldown: 1,
  action(bot, msg, suffix) { this.invoked = true; },
};

const validCommandDataBotAdminOnly = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  botAdminOnly: true,
  action(bot, msg, suffix) { this.invoked = true; },
};

const validCommandDataServerAdminOnly = {
  canBeChannelRestricted: false,
  commandAliases: ['alias1', 'alias2'],
  serverAdminOnly: true,
  action(bot, msg, suffix) { this.invoked = true; },
};

const validCommandServerOnly = {
  canBeChannelRestricted: true,
  uniqueId: 'serverOnlyffff',
  commandAliases: ['alias1', 'alias2'],
  onlyInServer: true,
  action(bot, msg, suffix) { this.invoked = true; },
};

const validCommandCanBeRestricted = {
  commandAliases: ['alias1', 'alias2'],
  canBeChannelRestricted: true,
  uniqueId: 'uniqueid',
  action(bot, msg, suffix) { this.invoked = true; },
};

const validCommandStringAlias = {
  commandAliases: 'alias1',
  canBeChannelRestricted: true,
  uniqueId: 'uniqueid',
  action(bot, msg, suffix) { this.invoked = true; },
};

const invalidRequiredSettings1 = {
  commandAliases: 'alias1',
  canBeChannelRestricted: false,
  requiredSettings: 534545,
  action(bot, msg, suffix) { this.invoked = true; },
};

const invalidRequiredSettings2 = {
  commandAliases: 'alias1',
  canBeChannelRestricted: false,
  requiredSettings: [534545],
  action(bot, msg, suffix) { this.invoked = true; },
};

const validRequiredSettings1 = {
  commandAliases: 'alias1',
  canBeChannelRestricted: false,
  requiredSettings: 'requiredSetting',
  action(bot, msg, suffix) { this.invoked = true; },
};

const validRequiredSettings2 = {
  commandAliases: 'alias1',
  canBeChannelRestricted: false,
  requiredSettings: ['requiredSetting'],
  action(bot, msg, suffix) { this.invoked = true; },
};

const validCommandUndefinedCanBeChannelRestrictedUserCommand = {
  commandAliases: 'alias1',
  uniqueId: 'uniqueid',
  action(bot, msg, suffix) { this.invoked = true; },
};

const validCommandUndefinedCanBeChannelRestrictedAdminCommand = {
  commandAliases: 'alias1',
  botAdminOnly: true,
  action(bot, msg, suffix) { this.invoked = true; },
};

const validCommandDatas = [
  {
    commandAliases: ['alias1', 'alias2'],
    canBeChannelRestricted: false,
    action(bot, msg, suffix) { },
  },
  {
    commandAliases: ['alias1', 'alias2'],
    canBeChannelRestricted: true,
    uniqueId: 'fffff',
    action(bot, msg, suffix) { },
  },
  {
    commandAliases: ['alias1', 'alias2'],
    canBeChannelRestricted: false,
    serverAdminOnly: true,
    action(bot, msg, suffix) { },
  },
  {
    commandAliases: ['alias1', 'alias2'],
    canBeChannelRestricted: false,
    botAdminOnly: true,
    action(bot, msg, suffix) { },
  },
  {
    commandAliases: ['alias1', 'alias2'],
    canBeChannelRestricted: false,
    onlyInServer: true,
    action(bot, msg, suffix) { },
  },
  {
    commandAliases: ['alias1', 'alias2'],
    canBeChannelRestricted: false,
    cooldown: 5,
    action(bot, msg, suffix) { },
  },
];

function errorStringMatches(error, errorString) {
  if (error.logDescription) {
    return error.logDescription === errorString;
  }
  return error.message === errorString;
}

describe('Command', function() {
  describe('constructor()', function() {
    it('should throw if there is no data', function() {
      assert.throws(
        () => new Command(),
        err => errorStringMatches(err, strings.validation.noData));;
    });
    it('should throw if you don\'t provide any command aliases', function() {
      assert.throws(
        () => new Command(commandDataNoAliases),
        err => errorStringMatches(err, strings.validation.noAliases));
      assert.throws(
        () => new Command(commandDataUndefinedAliases),
        err => errorStringMatches(err, strings.validation.noAliases));
    });
    it('should throw if you provide an invalid alias', function() {
      assert.throws(
        () => new Command(commandDataBlankAlias),
        err => errorStringMatches(err, strings.validation.invalidAlias));
      assert.throws(
        () => new Command(commandDataNonStringAliases),
        err => errorStringMatches(err, strings.validation.invalidAlias));
    });
    it('should throw if you provide an invalid cooldown', function() {
      assert.throws(
        () => new Command(commandDataNonNumberCooldown),
        err => errorStringMatches(err, strings.validation.invalidCooldown));
      assert.throws(
        () => new Command(commandDataNegativeCooldown),
        err => errorStringMatches(err, strings.validation.negativeCooldown));
    });
    it('should throw if provided an invalid action', function() {
      assert.throws(
        () => new Command(commandDataNoAction),
        err => errorStringMatches(err, strings.validation.noAction));
      assert.throws(
        () => new Command(commandDataInvalidAction),
        err => errorStringMatches(err, strings.validation.noAction));
    });
    it('should throw if canBeChannelRestricted is true but no/invalid uniqueId is provided', function() {
      assert.throws(
        () => new Command(commandDataMissingUniqueId),
        err => errorStringMatches(err, strings.validation.needsUniqueId));
      assert.throws(
        () => new Command(commandDataNonStringUniqueId),
        err => errorStringMatches(err, strings.validation.needsUniqueId));
    });
    it('should throw if serverAdminOnly is invalid', function() {
      assert.throws(
        () => new Command(commandDataInvalidServerAdminOnly),
        err => errorStringMatches(err, strings.validation.invalidServerAdminOnly));
    });
    it('should throw if botAdminOnly is invalid', function() {
      assert.throws(
        () => new Command(commandDataInvalidBotAdminOnly),
        err => errorStringMatches(err, strings.validation.invalidBotAdminOnly));
    });
    it('should throw if canBeChannelRestricted is invalid', function() {
      assert.throws(
        () => new Command(commandDataInvalidCanBeChannelRestricted),
        err => errorStringMatches(err, strings.validation.invalidCanBeChannelRestricted));
    });
    it('should throw if onlyInServer is invalid', function() {
      assert.throws(
        () => new Command(commandDataInvalidOnlyInServer),
        err => errorStringMatches(err, strings.validation.invalidOnlyInServer));
    });
    it('should not throw on valid command data', function() {
      for (let validCommandData of validCommandDatas) {
        new Command(validCommandData);
      }
    });
    it('should convert one string to an array', function() {
      let alias = validCommandStringAlias.commandAliases;
      let command = new Command(validCommandStringAlias);
      assert.deepEqual(command.aliases, [alias]);
    });
    it('should accept valid requiredSettings values', function() {
      let command = new Command(validRequiredSettings1);
      command = new Command(validRequiredSettings2);
    });
    it('should throw on invalid requiredSettings values', function() {
      assert.throws(
        () => new Command(invalidRequiredSettings1),
        err => errorStringMatches(err, strings.validation.invalidRequiredSettings));
      assert.throws(
        () => new Command(invalidRequiredSettings2),
        err => errorStringMatches(err, strings.validation.nonStringSetting));
    });
    it('should correctly auto-set canBeChannelRestricted if it\'s undefined', function() {
      let command1 = new Command(validCommandUndefinedCanBeChannelRestrictedAdminCommand);
      let command2 = new Command(validCommandUndefinedCanBeChannelRestrictedUserCommand);
      assert(!command1.createEnabledSetting());
      assert(command2.createEnabledSetting());
    });
  });
  describe('handle()', function() {
    it('should not execute if not cooled down', function() {
      let command = new Command(validCommandDataWith1SecondCooldown);
      return command.handle(null, MsgNoPerms, '', '', config, enabledSettingsGetter).then(result1 => {
        return assert.throws(
          () => command.handle(null, MsgNoPerms, '', '', config, enabledSettingsGetter),
          err => errorStringMatches(err, strings.invokeFailure.notCooledDownLogDescription));
      });
    });
    it('should execute if cooled down', function(done) {
      let command = new Command(validCommandDataWith1SecondCooldown);
      command.handle(null, MsgNoPerms, '', '', config, enabledSettingsGetter).then(invoke1Result => {
        setTimeout(() => {
          command.handle(null, MsgNoPerms, '', '', config, enabledSettingsGetter).then(invoke2Result => {
            if (invoke1Result === undefined && typeof invoke2Result !== typeof '') {
              done();
            } else {
              done('Failed to cool down');
            }
          }).catch(done);
        },
        1500);
      }).catch(done);
    });
    it('should not execute if user must be a bot admin but is not', function() {
      let command = new Command(validCommandDataBotAdminOnly);
      assert.throws(
        () => command.handle(null, MsgNoPerms, '', '', config, enabledSettingsGetter),
        err => errorStringMatches(err, strings.invokeFailure.onlyBotAdminLog));
      assert.throws(
        () => command.handle(null, MsgIsServerAdminWithTag, '', '', config, enabledSettingsGetter),
        err => errorStringMatches(err, strings.invokeFailure.onlyBotAdminLog));
    });
    it('should execute if user must be a bot admin and is', function() {
      let command = new Command(validCommandDataBotAdminOnly);
      return command.handle(null, MsgIsBotAdmin, '', '', config, enabledSettingsGetter).then(invoke1Result => {
        assert(invoke1Result === undefined && command.invoked);
      });
    });
    it('should not execute if must be in server but is not', function() {
      let command = new Command(validCommandServerOnly);
      assert.throws(
        () => command.handle(null, MsgDM, '', '', config, enabledSettingsGetter),
        err => errorStringMatches(err, strings.invokeFailure.onlyInServerLog));
    });
    it('should execute if must be in server and is', function() {
      let command = new Command(validCommandServerOnly);
      return command.handle(null, MsgNoPerms, '', '', config, enabledSettingsGetter).then(() => {
        assert(command.invoked);
      });
    });
    it('should not execute if user must be a server admin but is not', function() {
      let command = new Command(validCommandDataServerAdminOnly);
      assert.throws(
        () => command.handle(null, MsgNoPerms, '', '', config, enabledSettingsGetter),
        err => errorStringMatches(err, strings.invokeFailure.mustBeServerAdminLog));
    });
    it('should execute if user must be a server admin, is not, but its a DM', function() {
      let command = new Command(validCommandDataServerAdminOnly);
      return command.handle(null, MsgDM, '', '', config, enabledSettingsGetter).then(() => {
        assert(command.invoked);
      });
    });
    it('should execute if user must be a server admin and is', function() {
      let command = new Command(validCommandDataServerAdminOnly);
      return command.handle(null, MsgIsBotAdmin, '', '', config, enabledSettingsGetter).then(invokeResult => {
        assert(invokeResult === undefined && command.invoked);
        command = new Command(validCommandDataServerAdminOnly);
        return command.handle(null, MsgIsServerAdminWithTag, '', '', config, enabledSettingsGetter).then(invokeResult => {
          assert(invokeResult === undefined && command.invoked);
          command = new Command(validCommandDataServerAdminOnly);
          return command.handle(null, MsgIsServerAdmin, '', '', config, enabledSettingsGetter).then(invokeResult => {
            assert(invokeResult === undefined && command.invoked);
            command = new Command(validCommandDataServerAdminOnly);
            return command.handle(null, MsgIsBotAndServerAdmin, '', '', config, enabledSettingsGetter).then(invokeResult => {
              assert(invokeResult === undefined && command.invoked);
            });
          });
        });
      });
    });
    it('should be able to be restricted and unrestricted, and allow or refuse to allow itself to be invoked accordingly', function() {
      // TODO. Add test.
    });
  });
  describe('createEnabledSetting()', function() {
    it('should return a valid setting that the SettingsManager can load', function() {
      let logger = new MockLogger();
      let command = new Command(validCommandServerOnly);
      let setting = command.createEnabledSetting();
      let settingsManager = new SettingsManager(logger, config);
      assert(logger.failed !== true);
    });
  });
});

