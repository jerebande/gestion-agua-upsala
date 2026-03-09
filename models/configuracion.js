const conx = require("../database/db");

class ConfiguracionModel {
    obtenerPrecioBidon() {
        return new Promise((resolve, reject) => {
            const sql = "SELECT precio_bidon FROM configuracion WHERE id = 1";
            conx.query(sql, (err, results) => {
                if (err) return reject(err);
                if (results.length > 0) {
                    resolve(results[0].precio_bidon);
                } else {
                    // Si no existe, crear con valor por defecto 0
                    const insertSql = "INSERT INTO configuracion (id, precio_bidon) VALUES (1, 0)";
                    conx.query(insertSql, (err2, results2) => {
                        if (err2) return reject(err2);
                        resolve(0);
                    });
                }
            });
        });
    }

    actualizarPrecioBidon(nuevoPrecio) {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE configuracion SET precio_bidon = ? WHERE id = 1";
            conx.query(sql, [nuevoPrecio], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
}

module.exports = ConfiguracionModel;