const router = require('express').Router();
const handler = require('./handler');

module.exports = router.get('/health', handler);
