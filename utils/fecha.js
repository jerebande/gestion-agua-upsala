// utils/fecha.js
// Función para obtener la fecha local en formato YYYY-MM-DD
function obtenerFechaLocal() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

// Función para obtener el lunes de la semana actual (fecha local)
function obtenerLunesSemanaActual() {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes...
    const diff = diaSemana === 0 ? 6 : diaSemana - 1; // Diferencia para llegar al lunes
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diff);
    const año = lunes.getFullYear();
    const mes = String(lunes.getMonth() + 1).padStart(2, '0');
    const dia = String(lunes.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

module.exports = { obtenerFechaLocal, obtenerLunesSemanaActual };