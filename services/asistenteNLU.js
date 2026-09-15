// services/asistenteNLU.js
// Interpreta mensajes en lenguaje natural usando la API de Groq (modelos Llama)
// y devuelve datos estructurados en vez de depender de expresiones regulares.
// NOTA: transcribirAudio() usa fetch/FormData/Blob globales — requiere Node 18 o superior.
const https = require("https");

const HERRAMIENTA = {
    type: "function",
    function: {
        name: "extraer_datos",
        description: "Extrae la intención y los datos mencionados en el mensaje de un repartidor de agua para su asistente virtual.",
        parameters: {
            type: "object",
            properties: {
                intent: {
                    type: "string",
                    enum: ["crear_cliente", "registrar_venta", "pagar_fiado", "cambiar_precio", "otro"],
                    description: "Qué quiere hacer el usuario. Si ya había una conversación en curso (ver contexto) y el mensaje es una respuesta a lo que se le preguntó, usá el mismo intent que ya estaba activo. Usá 'cambiar_precio' cuando el usuario quiere actualizar/cambiar el precio del bidón de agua."
                },
                nombre: { type: ["string", "null"], description: "Nombre del cliente que se quiere crear." },
                direccion: { type: ["string", "null"], description: "Domicilio del cliente que se quiere crear (calle y número), sin incluir la palabra 'dirección' o 'domicilio'." },
                telefono: { type: ["string", "null"], description: "Teléfono del cliente que se quiere crear, solo dígitos. Si el usuario dice explícitamente que no tiene teléfono (ninguno, no tiene, no sé), devolvé un string vacío \"\"." },
                dia_reparto: { type: ["string", "null"], enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo", null], description: "Día de reparto del cliente que se quiere crear." },
                cliente_nombre_buscar: { type: ["string", "null"], description: "Nombre de un cliente YA EXISTENTE sobre el que se quiere registrar una venta/entrega o saldar un fiado." },
                cantidad_bidones: { type: ["number", "null"], description: "Cantidad de bidones de la entrega que se está registrando." },
                monto: { type: ["number", "null"], description: "Monto en pesos, si la entrega se carga por dinero en vez de por cantidad de bidones." },
                estado_pago: { type: ["integer", "null"], enum: [0, 1, 2, null], description: "Cómo quedó la entrega que se está registrando: 0 = fiado/a cuenta, 1 = pagado en efectivo, 2 = transferencia." },
                tipo_saldo: { type: ["string", "null"], enum: ["completo", "parcial", null], description: "Al saldar un fiado: si el pago es completo (todo) o parcial (una parte)." },
                monto_parcial: { type: ["number", "null"], description: "Monto en pesos que se está pagando de un fiado, cuando el pago es parcial." },
                metodo_pago: { type: ["integer", "null"], enum: [1, 2, null], description: "Método con el que se pagó/saldó: 1 = efectivo, 2 = transferencia." },
                eleccion_numero: { type: ["integer", "null"], description: "Si el usuario está eligiendo una opción de una lista numerada que se le mostró antes (ej: responde '2', 'el segundo', 'la opción 3'), el número elegido." },
                nuevo_precio: { type: ["number", "null"], description: "Nuevo precio en pesos del bidón de agua, cuando el usuario quiere cambiar/actualizar ese precio." },
                cancelar: { type: "boolean", description: "true si el usuario quiere cancelar, abortar o reiniciar la operación en curso (ej: 'cancelar', 'dejalo', 'olvidalo', 'empecemos de nuevo')." }
            },
            required: ["intent", "cancelar"]
        }
    }
};

// Modelo de Groq a usar. "openai/gpt-oss-120b" está disponible en cuentas developer normales
// y soporta tool-calling; "openai/gpt-oss-20b" es más rápido/barato si preferís priorizar velocidad.
const MODELO = "openai/gpt-oss-120b";

function llamarGroq(systemPrompt, mensajeUsuario) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return reject(new Error("Falta configurar GROQ_API_KEY en el .env"));
        }

        const body = JSON.stringify({
            model: MODELO,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: mensajeUsuario }
            ],
            tools: [HERRAMIENTA],
            tool_choice: { type: "function", function: { name: "extraer_datos" } },
            temperature: 0.2
        });

        const options = {
            hostname: "api.groq.com",
            path: "/openai/v1/chat/completions",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "Content-Length": Buffer.byteLength(body)
            },
            timeout: 15000
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) return reject(new Error(json.error.message || "Error de la API de Groq"));

                    const choice = json.choices && json.choices[0];
                    const toolCall = choice && choice.message && choice.message.tool_calls && choice.message.tool_calls[0];
                    if (!toolCall) return reject(new Error("Groq no devolvió datos estructurados."));

                    const argumentos = JSON.parse(toolCall.function.arguments);
                    resolve(argumentos);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on("timeout", () => req.destroy(new Error("Tiempo de espera agotado al contactar a Groq")));
        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

/**
 * Interpreta el mensaje del usuario dado el estado actual de la conversación.
 * @param {string} texto - mensaje escrito por el usuario
 * @param {object} estado - { intent, paso, datos } actual de req.session.asistente
 * @param {string} rolUsuario - rol del usuario logueado (para saber si hace falta el día de reparto)
 */
async function interpretarMensaje(texto, estado, rolUsuario) {
    const contexto = {
        intent_en_curso: estado.intent,
        datos_ya_conocidos: estado.datos,
        rol_del_usuario: rolUsuario
    };

    const systemPrompt =
        "Sos el motor de comprensión de lenguaje de WalterBot, el asistente virtual de una app de reparto de bidones de agua en Argentina (los mensajes pueden tener errores de tipeo, ser informales o estar mezclados). " +
        "Tu única tarea es leer el mensaje del usuario y devolver, llamando a la función 'extraer_datos', los campos que puedas identificar con certeza. " +
        "No inventes ni asumas datos que no estén realmente en el mensaje: dejalos en null si no aparecen. " +
        "Si ya hay una conversación en curso (ver 'intent_en_curso' y 'datos_ya_conocidos') y el mensaje del usuario es una respuesta a lo que se le preguntó, interpretalo en ese contexto — mantené el mismo intent y completá el o los campos que falten. " +
        "Si el mensaje no tiene nada que ver con crear un cliente, registrar una venta/entrega, saldar un fiado o cambiar el precio del bidón, y tampoco hay una conversación en curso, usá intent 'otro'. " +
        "Un mensaje puede traer varios datos a la vez (por ejemplo nombre, dirección y teléfono juntos): extraé todos los que reconozcas en la misma respuesta. " +
        "Respondé ÚNICAMENTE llamando a la función, sin texto adicional.\n\n" +
        "Contexto actual (JSON):\n" + JSON.stringify(contexto, null, 2);

    return await llamarGroq(systemPrompt, texto);
}

/**
 * Transcribe un audio a texto usando Whisper alojado en Groq.
 * @param {Buffer} buffer - contenido binario del archivo de audio
 * @param {string} mimetype - mime type del audio (ej: "audio/webm")
 * @returns {Promise<string>} el texto transcripto
 */
async function transcribirAudio(buffer, mimetype) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Falta configurar GROQ_API_KEY en el .env");

    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimetype || "audio/webm" });
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "es");
    formData.append("response_format", "json");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}` },
        body: formData
    });

    const json = await res.json();
    if (json.error) throw new Error(json.error.message || "Error al transcribir el audio");
    return (json.text || "").trim();
}

module.exports = { interpretarMensaje, transcribirAudio };