const crypto = require('crypto');

const encryptedJson = '{"iv":"6piMUo6LUf3qd5yV9JjYOg==","value":"JrxRRqbyv08CMgOrKzatq2f9TrY0OgWkMh1ySl13NTvpCAbipCA2PPZ9zieJC4xTZthzwgle/rpXvKYcc1boOJ7RwBKj8JW6Uzxk1RUOc/jQDMaCYnBskiCSUYZufcr5USILvTuvAMzRcZFO/mBEoKdlAZp6OKFHrWuYLwAjZXMCDwq16NbICZZsVab78erMoyKj0L1nBJl/g8aRvC9g7/g==\n","mac":"f96262718fb7ad00b73b764d0338c892dd8306715f70e7515647d8c153c8f8c9","tag":""}';
const appKeyBase64 = '5eSMM/Ue37OMzEJc8ByOkIZt1s1O3uJl32XFg7TshcY=';

function decrypt(encryptedJson, keyBase64) {
  const key = Buffer.from(keyBase64, 'base64');
  const payload = JSON.parse(encryptedJson);
  
  const iv = Buffer.from(payload.iv, 'base64');
  const encryptedValue = Buffer.from(payload.value, 'base64');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedValue, 'binary', 'utf8');
  decrypted += decipher.final('utf8');
  
  // Laravel serializes the value, so it might be a serialized PHP string or plain string.
  // PHP serialized string often looks like: s:length:"value";
  return decrypted;
}

try {
  const decrypted = decrypt(encryptedJson, appKeyBase64);
  console.log("Decrypted DATABASE_URL:", decrypted);
} catch (e) {
  console.error("Decryption failed:", e.message);
}
