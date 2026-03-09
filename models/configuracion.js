// models/configuracion.js
const pool = require("../database/db");

class ConfiguracionModel {
    async obtenerPrecioBidon() {
        const sql = "SELECT precio_bidon FROM configuracion WHERE id = 1";
        const [rows] = await pool.query(sql);
        if (rows.length > 0) {
            return rows[0].precio_bidon;
        } else {
            // Si no existe, crear con valor por defecto 0
            const insertSql = "INSERT INTO configuracion (id, precio_bidon) VALUES (1, 0)";
            await pool.query(insertSql);
            return 0;
        }
    }

    async actualizarPrecioBidon(nuevoPrecio) {
        const sql = "UPDATE configuracion SET precio_bidon = ? WHERE id = 1";
        const [result] = await pool.query(sql, [nuevoPrecio]);
        return result;
    }
}

module.exports = ConfiguracionModel;