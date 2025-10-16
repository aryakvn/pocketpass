/*
Utility crypto helpers for the browser (Web Crypto API)
Provides:
  - generateKeyPair() -> returns PEM-formatted keys for encryption (RSA-OAEP) and signing (RSA-PSS)
  - encryptWithPublicKey(publicKeyPem, message) -> base64 ciphertext (RSA-OAEP)
  - decryptWithPrivateKey(privateKeyPem, base64Cipher) -> plaintext
  - encryptWithPassword(password, plaintext) -> JSON string with salt, iv, ciphertext (all base64)
  - decryptWithPassword(password, jsonString) -> plaintext
  - signMessage(privateKeyPem, message) -> base64 signature (RSA-PSS)
  - verifySignature(publicKeyPem, message, base64Signature) -> boolean

Notes:
  - Uses Web Crypto Subtle API available in modern browsers (and Node >=16 via globalThis.crypto.subtle)
  - RSA has limits on message size; for large payloads prefer hybrid encryption (encrypt data with AES then encrypt key with RSA)
  - Keys are exported/imported as PEM strings (PKCS8 for private, SPKI for public)
*/

// Helper: text <-> ArrayBuffer
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function str2ab(str) {
  return encoder.encode(str);
}
function ab2str(ab) {
  return decoder.decode(ab);
}

// base64 helpers
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCodePoint(bytes[i]);
  }
  return btoa(binary);
}
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.codePointAt(i);
  }
  return bytes.buffer;
}

// PEM <-> ArrayBuffer
function pemToArrayBuffer(pem) {
  // remove header/footer and newlines
  const b64 = pem.replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '');
  return base64ToArrayBuffer(b64);
}

function arrayBufferToPem(buffer, type) {
  const b64 = arrayBufferToBase64(buffer);
  const lineLength = 64;
  let lines = '';
  for (let i = 0; i < b64.length; i += lineLength) {
    lines += b64.slice(i, i + lineLength) + '\n';
  }
  const header = type === 'public' ? 'PUBLIC' : 'PRIVATE';
  return `-----BEGIN ${header} KEY-----\n${lines}-----END ${header} KEY-----\n`;
}

// Export CryptoKey to PEM
async function exportCryptoKeyToPem(key) {
  const type = key.type; // 'public' or 'private'
  if (type === 'public') {
    const spki = await crypto.subtle.exportKey('spki', key);
    return arrayBufferToPem(spki, 'public');
  } else if (type === 'private') {
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', key);
    return arrayBufferToPem(pkcs8, 'private');
  }
  throw new Error('Unsupported key type');
}

// Import PEM to CryptoKey
async function importPublicKeyPem(pem, algorithm) {
  const ab = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    'spki',
    ab,
    algorithm,
    true,
    algorithm.name === 'RSA-OAEP' ? ['encrypt'] : ['verify']
  );
}
async function importPrivateKeyPem(pem, algorithm) {
  const ab = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    'pkcs8',
    ab,
    algorithm,
    true,
    algorithm.name === 'RSA-OAEP' ? ['decrypt'] : ['sign']
  );
}

// 1. generateKeyPair
// Returns object: { encryption: { publicKey, privateKey }, signing: { publicKey, privateKey } }
// PEM strings
export async function generateKeyPair() {
  // RSA-OAEP for encryption
  const encAlg = {
    name: 'RSA-OAEP',
    modulusLength: 2048,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: 'SHA-256',
  };
  const encKeys = await crypto.subtle.generateKey(encAlg, true, ['encrypt', 'decrypt']);

  // RSA-PSS for signing
  const signAlg = {
    name: 'RSA-PSS',
    modulusLength: 2048,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: 'SHA-256',
  };
  const signKeys = await crypto.subtle.generateKey(signAlg, true, ['sign', 'verify']);

  const encPublicPem = await exportCryptoKeyToPem(encKeys.publicKey);
  const encPrivatePem = await exportCryptoKeyToPem(encKeys.privateKey);
  const signPublicPem = await exportCryptoKeyToPem(signKeys.publicKey);
  const signPrivatePem = await exportCryptoKeyToPem(signKeys.privateKey);

  return {
    encryption: { publicKey: encPublicPem, privateKey: encPrivatePem },
    signing: { publicKey: signPublicPem, privateKey: signPrivatePem },
  };
}

// 2. encrypt a message via a public key (RSA-OAEP)
export async function encryptWithPublicKey(publicKeyPem, message) {
  const algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' };
  const pubKey = await importPublicKeyPem(publicKeyPem, algorithm);
  const data = str2ab(message);
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pubKey, data);
  return arrayBufferToBase64(encrypted);
}

// 3. decrypt via private key
export async function decryptWithPrivateKey(privateKeyPem, base64Cipher) {
  const algorithm = { name: 'RSA-OAEP', hash: 'SHA-256' };
  const privKey = await importPrivateKeyPem(privateKeyPem, algorithm);
  const cipherAb = base64ToArrayBuffer(base64Cipher);
  const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privKey, cipherAb);
  return ab2str(decrypted);
}

// 4/5 AES password-based encryption/decryption using PBKDF2 -> AES-GCM
function getRandomBytes(len) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return b;
}

async function deriveKeyFromPassword(password, salt, keyLen = 256) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    str2ab(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: keyLen },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptWithPassword(password, plaintext) {
  const salt = getRandomBytes(16);
  const iv = getRandomBytes(12);
  const key = await deriveKeyFromPassword(password, salt);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, str2ab(plaintext));

  // concatenate salt + iv + ciphertext into a single ArrayBuffer, then base64 encode
  const cipherBytes = new Uint8Array(cipher);
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + cipherBytes.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(cipherBytes, salt.byteLength + iv.byteLength);

  return arrayBufferToBase64(combined.buffer);
}

export async function decryptWithPassword(password, combinedBase64) {
  // combinedBase64 is base64(salt || iv || ciphertext)
  const combinedAb = base64ToArrayBuffer(combinedBase64);
  const combined = new Uint8Array(combinedAb);
  // salt = first 16 bytes, iv = next 12 bytes, ciphertext = rest
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28).buffer;
  const key = await deriveKeyFromPassword(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return ab2str(decrypted);
}

// 6. sign a message using private key (RSA-PSS)
export async function signMessage(privateKeyPem, message) {
  const algorithm = { name: 'RSA-PSS', hash: 'SHA-256' };
  const privKey = await importPrivateKeyPem(privateKeyPem, algorithm);
  const signature = await crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, privKey, str2ab(message));
  return arrayBufferToBase64(signature);
}

// 7. verify signature using public key
export async function verifySignature(publicKeyPem, message, base64Signature) {
  const algorithm = { name: 'RSA-PSS', hash: 'SHA-256' };
  const pubKey = await importPublicKeyPem(publicKeyPem, algorithm);
  const sigAb = base64ToArrayBuffer(base64Signature);
  return crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, pubKey, sigAb, str2ab(message));
}

// Export default convenience object
export default {
  generateKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  encryptWithPassword,
  decryptWithPassword,
  signMessage,
  verifySignature,
};
