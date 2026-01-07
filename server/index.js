require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const stationsRouter = require('./routes/stations');
const faresRouter = require('./routes/fares');
const routesRouter = require('./routes/routes');
const fareRouter = require('./routes/fare');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/stations', stationsRouter);
app.use('/fares', faresRouter);
app.use('/routes', routesRouter);
app.use('/fare', fareRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web API running on port ${PORT}`);
});
