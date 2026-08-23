const express = require('express');
const app = express();
app.use(express.json());
app.post('/', (req, res) => res.json({ body: req.body }));
const server = app.listen(0, async () => {
  const port = server.address().port;
  const axios = require('axios');
  try {
    const res1 = await axios.post(`http://localhost:${port}/`, undefined, { headers: { 'Content-Type': 'application/json' } });
    console.log('With header:', res1.data);
    const res2 = await axios.post(`http://localhost:${port}/`);
    console.log('Without header:', res2.data);
  } finally {
    server.close();
  }
});
