// Reemplaza todo el contenido de tu archivo de conexión con esto
const mysql = require('mysql2/promise');

// Crear pool de conexiones (en lugar de una conexión única)
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "aguaupsala",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 20,                // Ajusta según Alwaysdata (máx 40 por usuario)
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});

// Probar la conexión al arrancar (opcional, para confirmar que todo está bien)
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("¡Conectado exitosamente a la base de datos!");
        connection.release(); // Liberar la conexión de prueba
    } catch (error) {
        console.log("Error detallado de conexión:", error);
        // No detenemos la aplicación, pero el error quedará registrado
    }
})();

// Exportar el pool, no la conexión individual
module.exports = pool;