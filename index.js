import express from 'express';
import bodyParser from 'body-parser';
import { loadBackend } from './src/back/index.js';


let PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());
app.use('/', express.static('public'));

loadBackend(app);

app.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
});
