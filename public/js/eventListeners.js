
var messageTxt = document.getElementById('msgtxt').value;
var username = document.getElementById('username').value;
var key = document.getElementById('key').value; //current value
const keyField = document.getElementById('key'); //actual element
//Source: https://stackoverflow.com/questions/1085801/get-selected-value-in-dropdown-list-using-javascript
var encryptionMethod = document.getElementById('encryptionMethods').value;
const cleartextList = document.getElementById('cleartextList');
const ciphertextList = document.getElementById('ciphertextList');



const socket = io();

function addCleartextAndCiphertext(ciphertext, username, decryptionMethod){
    const list = document.createElement('li');

    //Gets Key
    key = document.getElementById('key').value;

    //Gets decryption method and decrypts message (unless its plaintext)
    var cleartext = "Something went wrong :/"
    switch(decryptionMethod){
        case "Plaintext":
            cleartext = ciphertext;
            break;
        case "AES256":
            //Encrypts the message to AES256
            var cleartext = DecryptAES256(ciphertext, key);
            break;
        case "3DES":
            //Encrypts the message to 3DES
            var cleartext = Decrypt3DES(ciphertext, key);
            break;
        case "DES":
            //Encrypts the message to DES
            var cleartext = DecryptDES(ciphertext, key);
            break;
        case "Rabbit":
            //Encrypts the message to Rabbit
            var cleartext = DecryptRabbit(ciphertext, key);
            break;
        case "RC4":
            //Encrypts the message to RC4
            var cleartext = DecryptRC4(ciphertext, key);
    }

    //Adds the encryption method bubble headers
    ciphertextList.appendChild(addBubbleHeaders(username, decryptionMethod, ));
    cleartextList.appendChild(addBubbleHeaders(username, decryptionMethod));

    //Adds the bubbles
    ciphertextList.appendChild(addBubble(ciphertext, username));
    cleartextList.appendChild(addBubble(cleartext, username));
}

//Function for adding the encryption type headers to the top of the plaintext bubbles
function addBubbleHeaders(username, decryptionMethod){
    const bubbleHeaderListItem = document.createElement('li');
    
    //Creates the content of the bubble header to appended to the message lists
    bubbleHeaderListItem.textContent = "Encryption Method: " + decryptionMethod;
    

    if (username === 'You') { 
        bubbleHeaderListItem.classList.add('bubble-header-right'); //Adds bubble headers for your message bubbles
    } else {
        bubbleHeaderListItem.classList.add('bubble-header-left'); //Adds the bubble headers for messages sent to you
    }

    const clearTextList = document.getElementById('cleartextList');
    clearTextList.appendChild(bubbleHeaderListItem);
    
    const cipherTextList = document.getElementById('ciphertextList');
    cipherTextList.appendChild(bubbleHeaderListItem);

    const rectangle = document.querySelector('.rectangle');
    rectangle.scrollTop = rectangle.scrollHeight;

    return bubbleHeaderListItem;
}

//Function for adding bubbles to the chat boxes (encrypted and unencrypted)
function addBubble(msg, username){
    const bubbleListItem = document.createElement('li');
    
    //Creates the content of the bubble to appended to the message lists
    bubbleListItem.textContent = username + ": " + msg;
    

    if (username === 'You') { //Adds bubbles your message bubbles
        bubbleListItem.classList.add('bubbleRight');
        bubbleListItem.classList.add('bubble-bottom-right');
    } else {
        bubbleListItem.classList.add('bubbleLeft'); //Adds the bubbles for messages sent to you
        bubbleListItem.classList.add('bubble-bottom-left');
    }

    const clearTextList = document.getElementById('cleartextList');
    clearTextList.appendChild(bubbleListItem);
    
    const cipherTextList = document.getElementById('ciphertextList');
    cipherTextList.appendChild(bubbleListItem);

    const rectangle = document.querySelector('.rectangle');
    rectangle.scrollTop = rectangle.scrollHeight;

    return bubbleListItem;
}

document.addEventListener('click', function (event) {
    if (event.target.id === 'sendButton') {
        messageTxt = document.getElementById('msgtxt').value;
        username = document.getElementById('username').value;
        // console.log("Cleartext: " + messageTxt);
        // console.log(username);

        //Get key
        key = this.getElementById('key').value;
        
        //Gets encryption method and encrypts message (unless its plaintext)
        var ciphertext = "Something went wrong :/"
        encryptionMethod = document.getElementById('encryptionMethods').value;
        //console.log("encryptionMethod: " + encryptionMethod);
        switch(encryptionMethod){
            case "Plaintext":
                ciphertext = messageTxt;
                break;
            case "AES256":
                //Encrypts the message to AES256
                var ciphertext = EncryptAES256(messageTxt, key);
                break;
            case "3DES":
                //Encrypts the message to 3DES
                var ciphertext = Encrypt3DES(messageTxt, key);
                break;
            case "DES":
                //Encrypts the message to DES
                var ciphertext = EncryptDES(messageTxt, key);
                break;
            case "Rabbit":
                //Encrypts the message to Rabbit
                var ciphertext = EncryptRabbit(messageTxt, key);
                break;
            case "RC4":
                //Encrypts the message to RC4
                var ciphertext = EncryptRC4(messageTxt, key);
        }
        
        //Emits the encrypted message to the socket.io server
        socket.emit('message', ciphertext, username, encryptionMethod);
    } else if (event.target.id == "btnDHExchange") {
        console.log('hit button');
        socket.emit('startKeyExchange');

    }
});

socket.on('key', (key) => {
    keyField.value = key;                  
})
socket.on('alicePublicKey', (bigA) => {
    console.log("alice A: " + bigA.toString('hex')); //verify Alice A
    socket.emit('bobPublicKey'); //start bobs part of exchange
    //get the key to display, normally wouldnt do
    fetch('/goodKeys')
    .then((response) => response.text())
    .then((sharedKey) => {
        keyField.value = sharedKey;
    })
    .catch((error) => {
        console.error(error);
        keyField.value = "Bad Key Exchange";
    })
})
socket.on('bobToAlice', (bigB)=> {
    console.log('bob to alice' + bigB); //verify Bob B
    //get the key to display, normally wouldnt do
    fetch('/goodKeys')
    .then((response) => response.text())
    .then((sharedKey) => {
        keyField.value = sharedKey;
    })
    .catch((error) => {
        keyField.value = "Bad Key Exchange";
    })
})



//When theres a message in the socket.io server, it calls the addCleartextAndCiphertext method
socket.on('message', (msg, username, decryptionMethod) => {
    addCleartextAndCiphertext(msg, username, decryptionMethod);
})

//#region Encryption Methods
//Source: https://cryptojs.gitbook.io/docs/
//Source: https://www.npmjs.com/package/crypto-js

//AES256
function EncryptAES256(cleartext, key){
    var ciphertext = CryptoJS.AES.encrypt(cleartext, key).toString();
    console.log('Ciphertext: ' + ciphertext);

    return ciphertext;
}
function DecryptAES256(ciphertext, key){
    var bytes = CryptoJS.AES.decrypt(ciphertext, key);
    var cleartext = bytes.toString(CryptoJS.enc.Utf8);

    return cleartext;
}

//3DES
function Encrypt3DES(cleartext, key){
    var ciphertext = CryptoJS.TripleDES.encrypt(cleartext, key).toString();
    console.log('Ciphertext: ' + ciphertext);

    return ciphertext;
}
function Decrypt3DES(ciphertext, key){
    var bytes = CryptoJS.TripleDES.decrypt(ciphertext, key);
    var cleartext = bytes.toString(CryptoJS.enc.Utf8);

    return cleartext;
}

//DES
function EncryptDES(cleartext, key){
    var ciphertext = CryptoJS.DES.encrypt(cleartext, key).toString();
    console.log('Ciphertext: ' + ciphertext);

    return ciphertext;
}
function DecryptDES(ciphertext, key){
    var bytes = CryptoJS.DES.decrypt(ciphertext, key);
    var cleartext = bytes.toString(CryptoJS.enc.Utf8);

    return cleartext;
}

//Rabbit
function EncryptRabbit(cleartext, key){
    var ciphertext = CryptoJS.Rabbit.encrypt(cleartext, key).toString();
    console.log('Ciphertext: ' + ciphertext);

    return ciphertext;
}
function DecryptRabbit(ciphertext, key){
    var bytes = CryptoJS.Rabbit.decrypt(ciphertext, key);
    var cleartext = bytes.toString(CryptoJS.enc.Utf8);

    return cleartext;
}

//RC4
function EncryptRC4(cleartext, key){
    var ciphertext = CryptoJS.RC4.encrypt(cleartext, key).toString();
    console.log('Ciphertext: ' + ciphertext);

    return ciphertext;
}
function DecryptRC4(ciphertext, key){
    var bytes = CryptoJS.RC4.decrypt(ciphertext, key);
    var cleartext = bytes.toString(CryptoJS.enc.Utf8);

    return cleartext;
}
//#endregion