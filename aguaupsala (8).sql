-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 23-06-2026 a las 08:08:32
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `aguaupsala`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `bidones_adeudados` decimal(10,2) DEFAULT NULL,
  `estado_pago` varchar(50) DEFAULT NULL,
  `cantidad_bidones` int(11) DEFAULT 0,
  `precio_bidon` decimal(10,2) DEFAULT 0.00,
  `total` decimal(10,2) DEFAULT NULL,
  `dia_reparto` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `nombre`, `direccion`, `telefono`, `usuario_id`, `bidones_adeudados`, `estado_pago`, `cantidad_bidones`, `precio_bidon`, `total`, `dia_reparto`) VALUES
(55, 'jjuancho', 'juancho', '54355544', 8, 3.00, NULL, 0, 0.00, NULL, NULL),
(57, 'algooooo', '3234', '434343', 8, 0.00, NULL, 0, 0.00, NULL, NULL),
(58, 'juana', 'juana de las juanas', '453434343', 8, 0.00, NULL, 0, 0.00, NULL, NULL),
(63, 'fernando bandelli', '344', '555', 17, 0.00, NULL, 0, 0.00, NULL, 'domingo'),
(67, '3rr', '4f4f', '22222', 2, 3.00, NULL, 0, 0.00, NULL, NULL),
(68, 'fvfv', 'frrf', '43', 2, 0.00, NULL, 0, 0.00, NULL, NULL),
(69, 'r34r', '44ef', '43', 2, 0.00, NULL, 0, 0.00, NULL, NULL),
(70, 'effe', 'effe4323', '54455215454', 2, 0.00, NULL, 0, 0.00, NULL, NULL),
(71, 'rffr', 'rffr', '4334', 2, 0.00, NULL, 0, 0.00, NULL, NULL),
(72, 'efef', 'effe', '44', 2, 0.00, NULL, 0, 0.00, NULL, NULL),
(73, 'fernando bandelli', 'frias 112', '5444', 17, 0.00, NULL, 0, 0.00, NULL, 'lunes'),
(74, 'fr', 'r4r4', '33434', 17, 0.00, NULL, 0, 0.00, NULL, 'martes'),
(75, 'fernando bandelli', 'edde', '53535555555', 2, 0.00, NULL, 0, 0.00, NULL, NULL),
(76, 'jjeremias', 'pollo 123', '4434434322', 2, 0.00, NULL, 0, 0.00, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes_estados_semanales`
--

CREATE TABLE `clientes_estados_semanales` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `semana` date NOT NULL,
  `estado` enum('compro','no_compro','no_estaba') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

CREATE TABLE `configuracion` (
  `id` int(11) NOT NULL DEFAULT 1,
  `precio_bidon` decimal(10,2) NOT NULL
) ;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id`, `precio_bidon`) VALUES
(1, 5000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuentas`
--

CREATE TABLE `cuentas` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `estado_pago` tinyint(4) NOT NULL,
  `cantidad_bidones` decimal(10,2) DEFAULT NULL,
  `precio_bidon` decimal(10,2) NOT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `fecha_publicacion` datetime DEFAULT current_timestamp(),
  `monto_pagado` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cuentas`
--

INSERT INTO `cuentas` (`id`, `cliente_id`, `estado_pago`, `cantidad_bidones`, `precio_bidon`, `total`, `fecha_publicacion`, `monto_pagado`) VALUES
(88, 55, 1, 4.00, 5000.00, 20000.00, '2026-03-10 04:50:04', 0.00),
(89, 55, 1, 1.00, 5000.00, 5000.00, '2026-03-10 04:50:28', 0.00),
(90, 55, 1, 2.00, 5000.00, 10000.00, '2026-03-10 04:50:43', 0.00),
(91, 55, 2, 4.00, 5000.00, 20000.00, '2026-03-10 04:51:21', 0.00),
(92, 55, 0, 2.00, 5000.00, 10000.00, '2026-03-10 04:51:30', 0.00),
(93, 55, 1, 3.00, 5000.00, 15000.00, '2026-03-10 04:51:41', 0.00),
(95, 55, 1, 4.00, 7000.00, 28000.00, '2026-03-11 02:03:13', 0.00),
(96, 55, 1, 3.00, 7000.00, 21000.00, '2026-03-11 02:03:23', 0.00),
(97, 55, 1, 2.00, 5000.00, 10000.00, '2026-03-11 02:03:48', 0.00),
(98, 58, 2, 999.00, 7000.00, 6993000.00, '2026-03-11 02:05:09', 0.00),
(177, 63, 1, 40000.00, 1.00, 40000.00, '2026-03-14 02:55:33', 0.00),
(178, 63, 0, 40000.00, 1.00, 40000.00, '2026-03-14 02:55:50', 0.00),
(194, 67, 1, 3.00, 5500.00, 16500.00, '2026-03-14 21:26:09', 0.00),
(195, 67, 1, 3.00, 5500.00, 16500.00, '2026-03-14 21:42:02', 0.00),
(197, 67, 1, 2.00, 5500.00, 11000.00, '2026-03-14 21:58:01', 0.00),
(198, 67, 1, 3.00, 5500.00, 16500.00, '2026-03-17 00:17:34', 0.00),
(199, 69, 0, 3.00, 5500.00, 16500.00, '2026-03-17 00:28:29', 0.00),
(200, 69, 0, 2.00, 5500.00, 11000.00, '2026-03-17 00:47:47', 0.00),
(201, 69, 2, 2.00, 5500.00, 11000.00, '2026-03-17 00:54:55', 0.00),
(202, 67, 2, 2.00, 5500.00, 11000.00, '2026-03-17 00:55:11', 0.00),
(204, 72, 2, 3.00, 5500.00, 16500.00, '2026-03-17 01:48:31', 0.00),
(205, 71, 0, 4.00, 5500.00, 22000.00, '2026-03-17 04:26:17', 0.00),
(206, 70, 0, 3.00, 5500.00, 16500.00, '2026-03-17 04:34:26', 0.00),
(211, 73, 0, 3.00, 7000.00, 21000.00, '2026-03-17 21:16:59', 0.00),
(212, 73, 0, 3.00, 7000.00, 21000.00, '2026-03-17 21:20:52', 0.00),
(213, 73, 1, 4000.00, 1.00, 4000.00, '2026-03-17 21:23:05', 0.00),
(214, 73, 0, 4.00, 7000.00, 28000.00, '2026-03-17 21:34:45', 0.00),
(215, 73, 0, 3000.00, 1.00, 3000.00, '2026-03-20 03:41:23', 0.00),
(216, 73, 0, 3.00, 7000.00, 21000.00, '2026-03-20 03:50:11', 0.00),
(219, 73, 0, 4.00, 7000.00, 28000.00, '2026-03-20 03:51:31', 0.00),
(220, 73, 2, 4.00, 7000.00, 28000.00, '2026-03-20 03:51:40', 0.00),
(221, 73, 0, 4.00, 7000.00, 28000.00, '2026-03-20 04:01:30', 0.00),
(222, 73, 1, 3.00, 7000.00, 21000.00, '2026-03-20 04:01:55', 0.00),
(223, 73, 0, 4000.00, 1.00, 4000.00, '2026-03-20 04:02:12', 0.00),
(224, 73, 0, 1.00, 7000.00, 7000.00, '2026-03-20 04:02:28', 0.00),
(225, 73, 0, 10000.00, 1.00, 10000.00, '2026-03-20 04:03:23', 0.00),
(226, 73, 1, 1.00, 7000.00, 7000.00, '2026-03-20 04:03:40', 0.00),
(227, 73, 0, 1.00, 7000.00, 7000.00, '2026-03-20 04:04:05', 0.00),
(228, 74, 1, 3.00, 7000.00, 21000.00, '2026-03-20 04:09:23', 0.00),
(229, 74, 0, 3.00, 7000.00, 21000.00, '2026-03-20 04:09:42', 0.00),
(230, 67, 1, 3.00, 5500.00, 16500.00, '2026-03-20 22:32:35', 0.00),
(231, 67, 1, 0.64, 5500.00, 3500.00, '2026-03-20 22:33:14', 0.00),
(232, 67, 2, 1.00, 5500.00, 5500.00, '2026-03-20 22:33:21', 0.00),
(233, 72, 0, 2.00, 5500.00, 11000.00, '2026-03-20 23:12:03', 0.00),
(234, 67, 1, 1.00, 5500.00, 5500.00, '2026-03-20 23:13:16', 0.00),
(235, 70, 1, 3.00, 5500.00, 16500.00, '2026-03-20 23:13:49', 0.00),
(237, 67, 0, 1.00, 300.00, 300.00, '2026-06-23 02:59:47', 0.00),
(238, 67, 1, 3.00, 300.00, 900.00, '2026-06-23 03:00:16', 0.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `entregas_diarias`
--

CREATE TABLE `entregas_diarias` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `entregas_diarias`
--

INSERT INTO `entregas_diarias` (`id`, `cliente_id`, `fecha`, `creado_en`) VALUES
(38, 67, '2026-06-08', '2026-06-08 06:39:57'),
(39, 71, '2026-06-08', '2026-06-08 06:40:55'),
(41, 67, '2026-06-22', '2026-06-22 04:47:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_chat`
--

CREATE TABLE `mensajes_chat` (
  `id` int(11) NOT NULL,
  `remitente_id` int(11) NOT NULL,
  `destinatario_id` int(11) DEFAULT NULL,
  `tipo_mensaje` enum('texto','imagen','video','archivo') DEFAULT 'texto',
  `contenido` text NOT NULL,
  `fecha_envio` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes_chat`
--

INSERT INTO `mensajes_chat` (`id`, `remitente_id`, `destinatario_id`, `tipo_mensaje`, `contenido`, `fecha_envio`) VALUES
(1, 2, NULL, 'texto', 'hola', '2026-03-02 04:23:23'),
(2, 2, NULL, 'texto', 's', '2026-03-02 04:23:30'),
(3, 2, NULL, 'texto', 'efef', '2026-03-02 04:23:34'),
(4, 2, NULL, 'archivo', '/uploads/1772425432308-428427283.docx', '2026-03-02 04:23:52'),
(6, 2, NULL, 'texto', 'hola', '2026-03-02 04:29:35'),
(7, 2, NULL, 'texto', 'e', '2026-03-02 04:29:41'),
(8, 2, NULL, 'archivo', '/uploads/1772425786847-374605716.docx', '2026-03-02 04:29:46'),
(18, 2, NULL, 'texto', 's', '2026-03-02 05:10:36'),
(20, 2, NULL, 'texto', 'a', '2026-03-02 06:11:23'),
(21, 2, 4, 'texto', 'hola', '2026-03-02 06:42:04'),
(25, 2, NULL, 'texto', 'xd', '2026-03-02 06:46:53'),
(27, 2, 4, 'texto', 'nl.', '2026-03-02 07:06:43'),
(28, 2, 4, 'texto', 'sx', '2026-03-02 07:06:48'),
(29, 2, 4, 'texto', 'hola', '2026-03-02 07:21:53'),
(34, 2, 4, 'texto', 'ede', '2026-03-02 07:23:43'),
(42, 8, NULL, 'texto', 'buenas', '2026-03-02 07:51:26'),
(51, 2, NULL, 'texto', 'hola', '2026-03-02 09:02:28'),
(52, 8, NULL, 'texto', 'hola', '2026-03-02 09:03:49'),
(54, 2, NULL, 'texto', 'hp', '2026-03-02 09:04:21'),
(55, 2, NULL, 'texto', 'dwd', '2026-03-02 09:04:34'),
(67, 2, NULL, 'texto', 'hola', '2026-03-03 02:08:10'),
(68, 2, NULL, 'texto', 'ss', '2026-03-03 02:08:12'),
(84, 2, NULL, 'texto', 'rffrf', '2026-03-03 05:31:32'),
(85, 2, NULL, 'texto', 'rf', '2026-03-03 05:31:34'),
(86, 2, NULL, 'texto', 'fr', '2026-03-03 05:31:35'),
(87, 2, NULL, 'texto', 'rf', '2026-03-03 05:31:41'),
(111, 8, NULL, 'texto', 'hth', '2026-03-03 07:22:34'),
(136, 2, NULL, 'texto', 'wddwd', '2026-03-04 02:52:15'),
(137, 2, NULL, 'texto', 'wddwwdwd', '2026-03-04 02:54:25'),
(138, 2, NULL, 'texto', 'wdw', '2026-03-04 02:54:27'),
(142, 2, NULL, 'texto', 'edededee', '2026-03-04 03:19:29'),
(144, 2, NULL, 'texto', 'eded', '2026-03-04 03:20:05'),
(145, 2, NULL, 'texto', 'ded', '2026-03-04 03:20:14'),
(146, 2, NULL, 'texto', 'deed', '2026-03-04 03:20:26'),
(148, 2, NULL, 'texto', 'ededed', '2026-03-04 03:20:39'),
(152, 2, NULL, 'texto', '1', '2026-03-04 04:01:53'),
(153, 2, NULL, 'texto', 'dsddsd', '2026-03-04 04:06:47'),
(154, 8, NULL, 'texto', 'wdwdwd', '2026-03-04 04:46:24'),
(160, 8, 2, 'texto', 'buenas', '2026-03-05 14:57:31'),
(161, 2, 9, 'texto', 'hola', '2026-03-05 22:44:40'),
(162, 8, 2, 'texto', 'hola', '2026-03-05 22:48:59'),
(166, 2, 8, 'texto', 'hola', '2026-03-05 22:58:34'),
(168, 2, NULL, 'texto', 'hola', '2026-03-08 04:08:18'),
(169, 2, 8, 'texto', 'jj', '2026-03-08 04:08:26'),
(170, 2, 8, 'texto', 'k', '2026-03-08 04:08:29'),
(171, 2, 8, 'texto', 'hola', '2026-03-09 07:25:48'),
(172, 2, 8, 'texto', 'dedde', '2026-03-09 07:25:49'),
(176, 2, NULL, 'texto', 'rf', '2026-06-23 00:57:55'),
(177, 2, NULL, 'imagen', '/uploads/1782176279246-881805630.jpg', '2026-06-23 00:57:59');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_leidos`
--

CREATE TABLE `mensajes_leidos` (
  `usuario_id` int(11) NOT NULL,
  `chat_tipo` enum('grupal','privado') NOT NULL,
  `otro_usuario_id` int(11) NOT NULL,
  `ultimo_mensaje_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes_leidos`
--

INSERT INTO `mensajes_leidos` (`usuario_id`, `chat_tipo`, `otro_usuario_id`, `ultimo_mensaje_id`) VALUES
(2, 'privado', 4, 34),
(2, 'privado', 9, 161),
(8, 'privado', 2, 172),
(2, 'grupal', 0, 177);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notas`
--

CREATE TABLE `notas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `compartida` tinyint(1) DEFAULT 0,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notas`
--

INSERT INTO `notas` (`id`, `usuario_id`, `titulo`, `contenido`, `compartida`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(29, 2, 'facturas', 'facturasee', 1, '2026-03-05 03:19:14', '2026-06-23 03:01:56'),
(30, 2, ' hnnuj', 'jnjnjj', 1, '2026-03-08 01:10:10', '2026-03-08 01:10:10'),
(31, 2, 'hhehe', 'eheh', 1, '2026-06-22 01:38:45', '2026-06-22 01:38:45'),
(32, 2, 'call of duty warzone 1', 'eb', 0, '2026-06-23 03:01:43', '2026-06-23 03:01:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notas_archivos`
--

CREATE TABLE `notas_archivos` (
  `id` int(11) NOT NULL,
  `nota_id` int(11) NOT NULL,
  `nombre_original` varchar(255) NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `ruta` varchar(500) NOT NULL,
  `fecha_subida` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notas_archivos`
--

INSERT INTO `notas_archivos` (`id`, `nota_id`, `nombre_original`, `nombre_archivo`, `tipo`, `ruta`, `fecha_subida`) VALUES
(34, 29, '1772316047992-714475340.xlsx', '1772691554973-90419263.xlsx', 'excel', '/uploads/notas/1772691554973-90419263.xlsx', '2026-03-05 03:19:14'),
(35, 30, 'UNIVERSIDAD TECNOLÃGICA NACIONAL.docx', '1772943010293-597431162.docx', 'word', '/uploads/notas/1772943010293-597431162.docx', '2026-03-08 01:10:10'),
(36, 31, '53c0aaaf45f77e21b54303852abb743a.jpg', '1782103125723-884669537.jpg', 'image', '/uploads/notas/1782103125723-884669537.jpg', '2026-06-22 01:38:45'),
(37, 32, 'UNIVERSIDAD TECNOLÃGICA NACIONAL (2) (3) (3) (1) (1).docx', '1782194503419-350331044.docx', 'word', '/uploads/notas/1782194503419-350331044.docx', '2026-06-23 03:01:43');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('Gpml3tZoJGZ8AP9GVebG_r6xNPX4HM65', 1773115973, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-03-10T04:11:41.976Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"usuario\":{\"id\":2,\"nombre\":\"fernando bandelli\",\"rol\":\"admin\",\"estado_permiso\":\"pendiente\"}}');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `gmail` varchar(100) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `rol` enum('admin','usuario','gabriel') NOT NULL DEFAULT 'usuario',
  `estado_permiso` enum('pendiente','aceptado','rechazado','bloqueado') DEFAULT 'pendiente',
  `precio_bidon` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `gmail`, `contraseña`, `rol`, `estado_permiso`, `precio_bidon`) VALUES
(1, 'jeremías Agustín', 'jeremias@gmail.com', '$2b$10$QVpGfje3u3Vum7Ai4cV4GeYtJOObFTcJldaSPkyMI31VX/JW.sltW', 'usuario', 'aceptado', 0.00),
(2, 'fernando bandelli', 'fernandobande@gmail.com', '$2b$10$eBKSC25AIV499ZLc/fBOVOsDYalSS9jPUULkGg0zIvOaeMrioiQqW', 'admin', 'pendiente', 5999.00),
(4, 'jonas poelstra', 'ignacio@gmail.com', '$2b$10$nM4e0xS76pIrucIE0cRwduJvKT0IkgUlK3.Kn8KhHLF536eKvoMxG', 'usuario', 'aceptado', 0.00),
(8, 'jonas poelstra', 'jonas@gmail.com', '$2b$10$gsG1/klKHkX6eOnkpP66F.zbKjBAHPujkKfbXjztHFwzzvvhD7M/6', 'usuario', 'aceptado', 7000.00),
(9, 'julio pass', 'julio@gmail.com', '$2b$10$RLH5./nJuzG7tGBpZLJ4TORMIly9s3Bpn058s/q6fpZDAcPghlI7e', 'usuario', 'aceptado', 0.00),
(12, 'jual', 'jual@gmail.com', '$2b$10$A4lFyuWUtRUipMA5ffjl/eru6n4hk7G7AF0DURD0TiHnc2UTqb7EG', 'usuario', 'aceptado', 0.00),
(14, 'juan pablo ', 'juanpablo@gmail.com', '$2b$10$xEszYNzBTuFXIrfu2r1El.rrFldGpyyhc12OV2VuWZOQ8tQqk4VtG', 'usuario', 'aceptado', 0.00),
(17, 'gabriel', 'gabriel@gmail.com', '$2b$10$WTaBJpXadGFRU56ze3u7r.jpSCYY4eOd5WBM5OQdq1GrE0uH3Cw.m', 'gabriel', 'aceptado', 7000.00),
(18, 'juansa', 'juansa@gmail.com', '$2b$10$3xSV2Up6T/8SQ4bUybIcf.MEG0UrDHBnj9s.xyOi6/cK09jLI8Ly6', 'usuario', 'aceptado', 5000.00),
(20, 'juales', 'juales@gmail.com', '$2b$10$1goHrT31hNutmd2LJvNS7.lYR/eLcEA3UjiY5YYwHolBymTwEKFte', 'usuario', 'aceptado', 5000.00),
(21, 'juales1', 'juales1@gmail.com', '$2b$10$0yLe5sw82k6RlmxDYAvx4eDj0XIHrZzSLy9uMhrdH0LKuiQtorC6O', 'usuario', 'aceptado', 5000.00),
(22, 'n', 'm@gmail.com', '$2b$10$lKW6bZ38tLX1hywVzZq0t.ATDiQURuiti/7uu6knIS0NVwIXrF3Dy', 'usuario', 'aceptado', 5000.00);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `clientes_estados_semanales`
--
ALTER TABLE `clientes_estados_semanales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cliente_semana` (`cliente_id`,`semana`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `cuentas`
--
ALTER TABLE `cuentas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cuentas_ibfk_1` (`cliente_id`);

--
-- Indices de la tabla `entregas_diarias`
--
ALTER TABLE `entregas_diarias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cliente_fecha` (`cliente_id`,`fecha`);

--
-- Indices de la tabla `mensajes_chat`
--
ALTER TABLE `mensajes_chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `remitente_id` (`remitente_id`),
  ADD KEY `destinatario_id` (`destinatario_id`);

--
-- Indices de la tabla `mensajes_leidos`
--
ALTER TABLE `mensajes_leidos`
  ADD PRIMARY KEY (`usuario_id`,`chat_tipo`,`otro_usuario_id`),
  ADD UNIQUE KEY `unique_leido` (`usuario_id`,`chat_tipo`,`otro_usuario_id`),
  ADD KEY `ultimo_mensaje_id` (`ultimo_mensaje_id`);

--
-- Indices de la tabla `notas`
--
ALTER TABLE `notas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `notas_archivos`
--
ALTER TABLE `notas_archivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nota_id` (`nota_id`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `gmail` (`gmail`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT de la tabla `clientes_estados_semanales`
--
ALTER TABLE `clientes_estados_semanales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `cuentas`
--
ALTER TABLE `cuentas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=239;

--
-- AUTO_INCREMENT de la tabla `entregas_diarias`
--
ALTER TABLE `entregas_diarias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `mensajes_chat`
--
ALTER TABLE `mensajes_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=178;

--
-- AUTO_INCREMENT de la tabla `notas`
--
ALTER TABLE `notas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `notas_archivos`
--
ALTER TABLE `notas_archivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `clientes_estados_semanales`
--
ALTER TABLE `clientes_estados_semanales`
  ADD CONSTRAINT `clientes_estados_semanales_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `cuentas`
--
ALTER TABLE `cuentas`
  ADD CONSTRAINT `cuentas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `entregas_diarias`
--
ALTER TABLE `entregas_diarias`
  ADD CONSTRAINT `entregas_diarias_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `mensajes_chat`
--
ALTER TABLE `mensajes_chat`
  ADD CONSTRAINT `mensajes_chat_ibfk_1` FOREIGN KEY (`remitente_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `mensajes_chat_ibfk_2` FOREIGN KEY (`destinatario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `mensajes_leidos`
--
ALTER TABLE `mensajes_leidos`
  ADD CONSTRAINT `mensajes_leidos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `mensajes_leidos_ibfk_2` FOREIGN KEY (`ultimo_mensaje_id`) REFERENCES `mensajes_chat` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notas`
--
ALTER TABLE `notas`
  ADD CONSTRAINT `notas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `notas_archivos`
--
ALTER TABLE `notas_archivos`
  ADD CONSTRAINT `notas_archivos_ibfk_1` FOREIGN KEY (`nota_id`) REFERENCES `notas` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
