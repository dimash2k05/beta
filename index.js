const express = require('express');
const crypto = require('crypto');
const ethers = require('ethers');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

app.use(express.static(__dirname));
app.use(express.json());
app.use(bodyParser.json());

const secretKey = 'Thisismysecretkey';

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.post('/login', (req, res) => {
    const {signedMessage, message, address} = req.body;
    const recoveredAddress = ethers.utils.verifyMessage(message, signedMessage);
    
    console.log(req.body);

    if (recoveredAddress != address) {
        return res.status(401).json({error: 'Invalid Signature'});
    }

    const token = jwt.sign({address}, secretKey, {expiresIn : '10s'});
    res.json(token);
})

app.post('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({error: 'Invalid Token'});
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, secretKey);
    console.log(decoded);

    const currenTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currenTime) {
        res.json("token Expired");
    } 
    else {
        res.json("OK");
    }
})

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname + '/success.html'));
})

app.get('/nonce', (req, res) => {
    const nonce = crypto.randomBytes(32).toString('hex');
    res.json({nonce});
})

app.listen(3000, () => {
    console.log('Server started on port 3000');
})