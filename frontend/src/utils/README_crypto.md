crypto.js — usage examples

Location
- src/utils/crypto.js

Overview
This module provides simple wrappers around the Web Crypto API for common tasks:
- RSA keypair generation (encryption + signing)
- RSA-OAEP encryption/decryption (public/private key)
- AES-GCM password-based encryption/decryption (PBKDF2-derived key)
- RSA-PSS signing and verification

All functions are asynchronous and return Promises.

Quick notes
- Keys are exported/imported as PEM strings (SPKI for public, PKCS8 for private).
- RSA keys are 2048-bit and use SHA-256.
- AES uses PBKDF2 (100,000 iterations) and AES-GCM (12-byte IV). The encrypt helper returns a single base64 string containing salt || iv || ciphertext concatenated.
- This runs in browsers (Web Crypto API). Node 18+ also supports Web Crypto via globalThis.crypto.

Importing
```js
// default import
import crypto from '@/utils/crypto.js';

// or named imports
import {
  generateKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPassword,
  decryptWithPassword,
  signMessage,
  verifySignature,
} from '@/utils/crypto.js';
```

Example flows (use inside an async context)

1) Generate keypairs
```js
const keys = await crypto.generateKeyPair();
// keys.encryption.publicKey  -> PEM string
// keys.encryption.privateKey -> PEM string
// keys.signing.publicKey     -> PEM string
// keys.signing.privateKey    -> PEM string

console.log(keys.encryption.publicKey);
```

2) RSA encrypt / decrypt
```js
const plaintext = 'Hello world';

// encrypt with recipient's public key
const ciphertextBase64 = await crypto.encryptWithPublicKey(keys.encryption.publicKey, plaintext);
console.log('ciphertext:', ciphertextBase64);

// decrypt with private key
const recovered = await crypto.decryptWithPrivateKey(keys.encryption.privateKey, ciphertextBase64);
console.log('recovered:', recovered); // 'Hello world'
```

Note: RSA can only encrypt small payloads. For larger data, use hybrid encryption (encrypt data with AES and encrypt AES key with RSA).

3) AES password-based encrypt / decrypt
```js
const password = 'my-strong-password';
const secret = 'Sensitive data to store';

// encrypt
// encryptWithPassword now returns a single base64 string which is the concatenation: base64(salt || iv || ciphertext)
const payloadBase64 = await crypto.encryptWithPassword(password, secret);
// payloadBase64 is a single base64 string containing the salt (16 bytes) + iv (12 bytes) + ciphertext

// persist or transmit payloadBase64 safely

// decrypt
const decrypted = await crypto.decryptWithPassword(password, payloadBase64);
console.log(decrypted); // 'Sensitive data to store'
```

4) Sign and verify (RSA-PSS)
```js
const message = 'Important message to sign';

// sign with private key
const signatureBase64 = await crypto.signMessage(keys.signing.privateKey, message);
console.log('signature:', signatureBase64);

// verify with public key
const ok = await crypto.verifySignature(keys.signing.publicKey, message, signatureBase64);
console.log('signature valid?', ok); // true
```

Error handling
Wrap calls in try/catch to catch decryption failures or invalid inputs:
```js
try {
  const txt = await crypto.decryptWithPrivateKey(badPrivateKeyPem, cipher);
} catch (err) {
  console.error('decrypt failed', err);
}
```

Browser console quick test
In a page where your app is loaded, open the console and run:
```js
import crypto from '/src/utils/crypto.js';
(async () => {
  const keys = await crypto.generateKeyPair();
  const cipher = await crypto.encryptWithPublicKey(keys.encryption.publicKey, 'Hi');
  const plain = await crypto.decryptWithPrivateKey(keys.encryption.privateKey, cipher);
  console.log(plain);

  const payload = await crypto.encryptWithPassword('test-pass', 'secret');
  const recovered = await crypto.decryptWithPassword('test-pass', payload);
  console.log('recovered', recovered);
})();
```

Security notes
- Keep private keys secret. If used in client code, they are not secret (stored in the client) and should only be used for demonstration or signing operations intended to be public.
- Increase PBKDF2 iterations if you can afford the CPU/time.
- Consider hybrid encryption for large payloads.

If you want, I can also add:
- A small automated test file (Vitest/Jest) that validates these flows.
- A hybrid-encrypt helper that encrypts arbitrary-length data using AES + RSA-wrapped key.
