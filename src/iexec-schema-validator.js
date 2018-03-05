const Debug = require('debug');
const Joi = require('joi');
const semver = require('semver');

const debug = Debug('validate');

const myJoi = Joi.extend({
  base: Joi.string(),
  name: 'string',
  language: {
    semver: 'needs to be a valid semver version',
  },
  rules: [{
    name: 'semver',
    validate(params, value, state, options) {
      debug('validate called', params, value, state, options);
      if (!semver.valid(value)) {
        return this.createError('string.semver', { v: value }, state, options);
      }
      return value;
    },
  }],
});

const githubSchema = Joi.object({
  version: myJoi.string().semver().required(),
  description: Joi.string().min(150).max(2000).required(),
  license: Joi.string().required(),
  homepage: Joi.string().required(),
  logo: Joi.string().required(),
  author: Joi.object({
    name: Joi.string().min(1).max(40).required(),
    email: Joi.string().email(),
  }).required(),
  chains: Joi.object(),
  social: Joi.object(),
  updatedAt: Joi.string().isoDate().required(),
});

const fileDBSchema = Joi.object().keys({
  type: Joi.string().required().valid('dapp'),
  name: Joi.string().min(1).max(40).required(),
  branch: Joi.string().required(),
  price: Joi.number().integer().positive().required(),
  created: Joi.string().isoDate().required(),
});

const validateGithub = (obj) => {
  const result = githubSchema.validate(obj);
  if (result.error) throw Error(result.error.details.map(e => e.message).join(' + '));
  debug('result.error', result.error);
};

const validateFileDB = (obj) => {
  const result = fileDBSchema.validate(obj);
  if (result.error) throw Error(result.error.details.map(e => e.message).join(' + '));
  debug('result.error', result.error);
};

module.exports = {
  validateGithub,
  validateFileDB,
};
