const bcrypt = require('bcryptjs');

const plaintextPassword = '123456'; // La contraseña en texto plano que quieres encriptar

bcrypt.hash(plaintextPassword, 10, (err, hash) => {
    if (err) throw err;
    console.log('Hashed Password:', hash);
});
