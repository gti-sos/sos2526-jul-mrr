import express from 'express';
import bodyParser from 'body-parser';
import { loadBackend } from './src/back/index.js';

let PORT = process.env.PORT || 3000;

const app = express();

app.use('/about', express.static('./public'));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World')
})

loadBackend(app);

app.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
});
