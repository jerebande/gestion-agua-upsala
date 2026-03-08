const mysql = require("mysql");

// Crear conexión dinámica
const conx = mysql.createConnection({
    // Usa la variable de Render, si no existe usa 'localhost' (para cuando trabajes local)
    "host": process.env.DB_HOST || "localhost",
    "user": process.env.DB_USER || "root",
    "password": process.env.DB_PASSWORD || "",
    "database": process.env.DB_NAME || "aguaupsala",
    "port": process.env.DB_PORT || 3306
});

conx.connect((error) => {
   if(error){
    console.log("Error detallado de conexión:", error);
    return;
   }
   console.log("¡Conectado exitosamente a la base de datos!");
});

module.exports = conx;