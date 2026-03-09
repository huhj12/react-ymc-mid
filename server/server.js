const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const bulletinRoutes = require('./routes/bulletin');
const postRoutes = require('./routes/posts');
const scoreRoutes = require('./routes/scores');

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection failed:', err));

app.use('/api/bulletin', bulletinRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/scores', scoreRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
