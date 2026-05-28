const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/firmware', require('./routes/firmware'));
app.use('/api/testing', require('./routes/testing'));
app.use('/api/signoff', require('./routes/signoff'));
app.use('/api/changelog', require('./routes/changelog'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', platform: 'abckedn' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`VTD Testing API running on port ${PORT}`));
