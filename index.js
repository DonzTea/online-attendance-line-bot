const express = require('express');
const bodyParser = require('body-parser');

const {
  middleware,
  JSONParseError,
  SignatureValidationFailed,
} = require('@line/bot-sdk');

const db = require('./db.js');
const bot = require('./services/bot.js');

require('dotenv').config();

db.once('open', () => {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use('/webhook', middleware(bot.config));
  app.use(bodyParser.json());

  app.post('/webhook', async (req, res) => {
    const event = req.body.events[0];
    const statusCode = await bot.handleRequest(event);
    res.status(statusCode).end();
  });

  app.use((err, req, res, next) => {
    if (err instanceof SignatureValidationFailed) {
      res.status(401).send(err.signature);
      return;
    } else if (err instanceof JSONParseError) {
      res.status(400).send(err.raw);
      return;
    }
    next(err); // will throw default 500
  });

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
