import express from 'express';
import bodyParser from 'body-parser';
import { loadBackend } from './src/back/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());

app.use('/', express.static('public'));
app.use('/about', express.static(path.join(__dirname, "public", "about.html")));


app.get('/', (req, res) => {
    res.send(`<h1>SOS2526-JUL-MRR</h1>
        <hr>
        <ul>
            <li><b> About</b>: <a href="https://sos2526-jul-mrr.onrender.com/about" target="_blank">https://sos2526-jul-mrr.onrender.com/about</a></li>
            <br>
            <li><b> API's</b>:
                <ul style="list-style-type: '-'">
                    <li> &nbsp; María Rodríguez Romero: <a href="https://sos2526-jul-mrr.onrender.com/api/v1/online-sales-popular-marketplaces/docs" target="_blank">https://sos2526-jul-mrr.onrender.com/api/v1/online-sales-popular-marketplaces/docs</a></li>
                </ul>
            </li>
        </ul>`
    );
});

loadBackend(app);

app.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
});
