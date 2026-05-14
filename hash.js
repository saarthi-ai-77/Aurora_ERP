const argon2 = require('argon2');

(async () => {
    console.log(await argon2.hash('Aurora@123', {
        type: argon2.argon2id,
    }));
})();