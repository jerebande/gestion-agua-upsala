// scripts/migrar-passwords.js
const bcrypt = require('bcryptjs');
const pool = require('../database/db');

const saltRounds = 10;

async function migrarPasswords() {
    try {
        console.log('Iniciando migración de contraseñas...');

        const [usuarios] = await pool.query(`
            SELECT id, contraseña FROM usuarios 
            WHERE contraseña NOT LIKE '$2a$%' AND contraseña NOT LIKE '$2b$%'
        `);

        if (usuarios.length === 0) {
            console.log('No se encontraron contraseñas sin hashear.');
            return;
        }

        console.log(`Se migrarán ${usuarios.length} contraseñas.`);

        for (const usuario of usuarios) {
            const hash = await bcrypt.hash(usuario.contraseña, saltRounds);
            await pool.query('UPDATE usuarios SET contraseña = ? WHERE id = ?', [hash, usuario.id]);
            console.log(`Usuario ${usuario.id} migrado.`);
        }

        console.log('Migración completada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

migrarPasswords();