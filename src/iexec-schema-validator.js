const Debug = require('debug');
const Joi = require('joi');
const { isETHAddress } = require('./utils');

const debug = Debug('iexec-schema-validator');

const myJoi = Joi.extend({
  base: Joi.string(),
  name: 'string',
  language: {
    ethaddress: 'needs to be a valid ethereum address',
  },
  rules: [
    {
      name: 'ethaddress',
      validate(params, value, state, options) {
        if (!isETHAddress(value)) {
          return this.createError('string.ethaddress', { v: value }, state, options);
        }
        return value;
      },
    },
  ],
});

const baseSchema = Joi.object({
  type: Joi.string(),
  description: Joi.string()
    .min(150)
    .max(2000)
    .required(),
  logo: Joi.string().required(),
  social: Joi.object({
    website: Joi.string(),
    github: Joi.string(),
  }).required(),
  addresses: Joi.object(),
  repo: Joi.string(),
});

const dappSchema = baseSchema.append({
  license: Joi.string().required(),
  author: Joi.string().required(),
  app: Joi.object({
    name: Joi.string().required(),
    price: Joi.number()
      .integer()
      .greater(-1),
    params: Joi.object().required(),
  }).required(),
  order: Joi.object(),
});

const poolSchema = baseSchema.append({
  workerPool: Joi.object({
    description: Joi.string().required(),
    subscriptionLockStakePolicy: Joi.number()
      .integer()
      .greater(-1),
    subscriptionMinimumStakePolicy: Joi.number()
      .integer()
      .greater(-1),
    subscriptionMinimumScorePolicy: Joi.number()
      .integer()
      .greater(-1),
  }).required(),
});

const registryEntrySchema = Joi.object().keys({
  name: Joi.string()
    .min(1)
    .max(40),
  org: Joi.string()
    .min(1)
    .max(40)
    .required(),
  created: Joi.string()
    .isoDate()
    .required(),
});

const partnerSchema = registryEntrySchema.append({
  description: Joi.string()
    .min(150)
    .max(2000)
    .required(),
  logo: Joi.string().required(),
  license: Joi.string(),
  social: Joi.object({
    website: Joi.string(),
    github: Joi.string(),
    linkedin: Joi.string(),
    twitter: Joi.string(),
    medium: Joi.string(),
  }).required(),
  type: Joi.string().required(),
  link: Joi.string(),
  buttonText: Joi.string(),
  theme: Joi.string(),
  button: Joi.boolean(),
});

const chainConfSchema = Joi.object({
  host: Joi.string().required(),
  id: Joi.string().required(),
  scheduler: Joi.string().required(),
  hub: Joi.string(),
});

const chainsConfSchema = Joi.object({
  default: Joi.string(),
  chains: Joi.object()
    .pattern(/^/, chainConfSchema)
    .required(),
});

const accountConfSchema = Joi.object({
  jwtoken: Joi.string().required(),
});

const walletConfSchema = Joi.object({
  privateKey: Joi.string().required(),
  publicKey: Joi.string().required(),
  address: Joi.string().required(),
});

const deployedObjSchema = Joi.object()
  .pattern(
    /^/,
    myJoi
      .string()
      .ethaddress()
      .required(),
  )
  .required();

const deployedConfSchema = Joi.object().pattern(
  /^(app|dataset|workerPool|work)$/i,
  deployedObjSchema,
);

const validateObj = schema => (obj, { strict = true } = {}) => {
  const result = schema.validate(obj);
  if (result.error) {
    debug('validateObj()', result.error);
    if (strict) throw Error(result.error.details.map(e => e.message).join(' + '));
    return false;
  }
  return true;
};

module.exports = {
  validateRegistryEntry: validateObj(registryEntrySchema),
  validateDapp: validateObj(dappSchema),
  validatePool: validateObj(poolSchema),
  validatePartner: validateObj(partnerSchema),
  validateChainConf: validateObj(chainConfSchema),
  validateChainsConf: validateObj(chainsConfSchema),
  validateAccountConf: validateObj(accountConfSchema),
  validateWalletConf: validateObj(walletConfSchema),
  validateDeployedConf: validateObj(deployedConfSchema),
};
