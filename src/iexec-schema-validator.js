const Debug = require('debug');
const Joi = require('@hapi/joi');
const { isETHAddress } = require('./utils');

const debug = Debug('iexec-schema-validator');

const myJoi = Joi.extend({
  base: Joi.string(),
  name: 'string',
  language: {
    ethaddress: 'needs to be a valid ethereum address',
    bytes32: 'needs to be a valid bytes32 hexString',
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
    {
      name: 'bytes32',
      validate(params, value, state, options) {
        if (value.length !== 66 || value.substring(0, 2) !== '0x') {
          return this.createError('string.bytes32', { v: value }, state, options);
        }
        return value;
      },
    },
  ],
});

const CATEGORIES_ARRAY = ['Other'];
const APP_TYPES_ARRAY = ['DOCKER'];

const addressListSchema = Joi.object().pattern(/^/, myJoi.string().ethaddress());

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
  addresses: addressListSchema,
  repo: Joi.string(),
});

const buyConfSchema = Joi.object({
  params: Joi.required(),
  trust: Joi.number()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER),
  tag: myJoi.string().bytes32(),
  callback: myJoi.string().ethaddress(),
});

const dappSchema = baseSchema.append({
  license: Joi.string().required(),
  author: Joi.string().required(),
  app: Joi.object({
    owner: myJoi
      .string()
      .ethaddress()
      .required(),
    name: Joi.string().required(),
    type: Joi.string().valid(APP_TYPES_ARRAY),
    multiaddr: Joi.string().required(),
    checksum: myJoi
      .string()
      .bytes32()
      .required(),
    mrenclave: Joi.string().allow(''),
  }).required(),
  buyConf: buyConfSchema.required(),
});

const datasetCompatibleDappSchema = Joi.object({
  name: Joi.string().required(),
  addresses: addressListSchema.required(),
  buyConf: buyConfSchema,
});

const datasetSchema = baseSchema.append({
  license: Joi.string().required(),
  author: Joi.string().required(),
  categories: Joi.string().valid(CATEGORIES_ARRAY),
  dataset: Joi.object({
    owner: myJoi
      .string()
      .ethaddress()
      .required(),
    name: Joi.string().required(),
    multiaddr: Joi.string().required(),
    checksum: myJoi
      .string()
      .bytes32()
      .required(),
  }).required(),
  dapps: Joi.array().items(datasetCompatibleDappSchema),
});

const workerpoolSchema = baseSchema.append({
  workerpool: Joi.object({
    owner: myJoi
      .string()
      .ethaddress()
      .required(),
    description: Joi.string().required(),
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
  rank: Joi.number().integer(),
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
  hub: Joi.string(),
  sms: Joi.string(),
  ipfsGateway: Joi.string(),
  iexecGateway: Joi.string(),
});

const chainsConfSchema = Joi.object({
  default: Joi.string(),
  chains: Joi.object()
    .pattern(/^/, chainConfSchema)
    .required(),
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

const deployedConfSchema = Joi.object().pattern(/^(app|dataset|workerpool)$/i, deployedObjSchema);

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
  validateDataset: validateObj(datasetSchema),
  validateWorkerpool: validateObj(workerpoolSchema),
  validatePartner: validateObj(partnerSchema),
  validateChainConf: validateObj(chainConfSchema),
  validateChainsConf: validateObj(chainsConfSchema),
  validateWalletConf: validateObj(walletConfSchema),
  validateDeployedConf: validateObj(deployedConfSchema),
};
