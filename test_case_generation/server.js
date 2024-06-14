const express = require('express');
const app = express();
const port = 3000;

// Define a route that responds with "hi"
app.get('/', (req, res) => {
  res.send('hi');
});

// Start the server
app.listen(port, () => {
  console.log(`Local service listening at http://localhost:${port}`);
});