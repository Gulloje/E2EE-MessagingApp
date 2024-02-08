import express from "express"
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {Server as SocketIO} from 'socket.io';
import http from "http";
import { DiffieHellman, createDiffieHellman } from "crypto";


const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new SocketIO(server); 

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
const __dirname = dirname(fileURLToPath(
    import.meta.url));
app.use(express.static(__dirname + '/public/'));

app.get("/", async (req, res) => {
    res.render('index', {


    })
});


io.on("connection", (socket) => {
    // The socket parameter represents a single connection between a client and the server.
    // You can use socket.on() and socket.emit() to listen for and send events.
    socket.on("message", (msg, username, decryptionMethod) => {
        console.log("Username: " + username);
        console.log("Ciphertext: " + msg);
        console.log("Encryption Method: " + decryptionMethod);

        //Send encrypted Message to server
        socket.broadcast.emit("message", msg, username, decryptionMethod);
        
        // Send encrypted message to yourself
        socket.emit("message", msg, "You", decryptionMethod);
    })
    

    //Source: https://nodejs.org/api/crypto.html#class-diffiehellman
    socket.on('startKeyExchange', () => {
        const alice = createDiffieHellman(512); //alice initates dh exchange with p and g
        //returns Alices' public key, A, and creates alice private key 
        const alicePublicKey = alice.generateKeys(); 
        //send alice public key to server/to bob
        socket.emit('alicePublicKey', alicePublicKey);
        //Start bob part of exchange
        socket.on('bobPublicKey', () => {
            //create DH with same p and g as alice
            const bob = createDiffieHellman(alice.getPrime(), alice.getGenerator(), 512);
            //const bob = createDiffieHellman( 512); //Example of fail line
            const bobPublicKey = bob.generateKeys();
            //send bob public key to other clients
            socket.broadcast.emit("bobToAlice", bobPublicKey);
            //verify B^a and A^b mod p match
            const bobSecret = bob.computeSecret(alicePublicKey);
            const aliceSecret = alice.computeSecret(bobPublicKey);

            console.log("bobsecret   " + bobSecret.toString('hex'));
            console.log("alicesecret " + aliceSecret.toString('hex'));
            //if match, want to display in text field
            if (bobSecret.toString('hex') == aliceSecret.toString('hex')) {
                console.log("successful key exchange");
                app.get('/goodKeys', async (req, res) => { 
                    res.send(bobSecret.toString('hex')); 
                })
            } else {
                console.log("bad key exchange");
            }
            
        })

    })
    
});

server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});