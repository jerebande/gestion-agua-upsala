// Cargar variables de entorno desde .env
require('dotenv').config();

const mysql = require("mysql2/promise");

// Crear pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "u437856421_aguaupsala",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "u437856421_aguaupsala",
    port: process.env.DB_PORT || 3306,

    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

// Probar la conexión al arrancar
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("¡Conectado exitosamente a la base de datos!");
        console.log("Base de datos:", process.env.DB_NAME);
        connection.release();
    } catch (error) {
        console.error("Error detallado de conexión:", error.message);
        console.error("Host usado:", process.env.DB_HOST);
        console.error("Usuario usado:", process.env.DB_USER);
    }
})();

// Exportar el pool
module.exports = pool;