const mysql = require("mysql2/promise");

// Crear pool de conexiones
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "aguaupsala",
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

        connection.release();

    } catch (error) {
        console.log("Error detallado de conexión:", error);
    }
})();

// Exportar el pool
module.exports = pool;