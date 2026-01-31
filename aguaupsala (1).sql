-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 31-01-2026 a las 07:01:04
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
  `bidones_adeudados` int(11) DEFAULT 0,
  `estado_pago` varchar(50) DEFAULT NULL,
  `cantidad_bidones` int(11) DEFAULT 0,
  `precio_bidon` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `nombre`, `direccion`, `telefono`, `usuario_id`, `bidones_adeudados`, `estado_pago`, `cantidad_bidones`, `precio_bidon`) VALUES
(2, 'wdwd', 'wddwwd', 'wdwddw', 1, 0, NULL, 0, 0.00),
(3, 'dw', 'dwdwd', 'wdwwd', 1, 2, NULL, 0, 0.00),
(4, 'aaaaaaaaaaaaaa', 'zzzzzzzzzzzz', '22222222222', 1, 0, NULL, 0, 0.00),
(5, '2222', 'dwdwwd', '223232', 1, 0, NULL, 0, 0.00),
(6, 'edeeeeee', 'eddddd', '222', 1, 0, NULL, 0, 0.00),
(7, 'jejeje', 'ememee', '222', 1, 0, NULL, 0, 0.00),
(8, 'jeremías Agustín', 'hbllbbl', '2', 1, 0, NULL, 0, 0.00),
(9, 'jib', 'uhuhuh', '888', 1, 0, NULL, 0, 0.00),
(10, 'njjj', '888', '8888', 1, 0, NULL, 0, 0.00),
(11, 'bhu', 'huuuu', '8978', 1, 0, NULL, 0, 0.00),
(12, 'huuu77', '888888887', '877777', 1, 0, NULL, 0, 0.00),
(13, 'bill', 'frias 112', '344334334', 1, 2, NULL, 0, 0.00),
(14, 'adrian', 'la valle 925', '534030', 2, 0, NULL, 0, 0.00),
(15, 'alicia', '88 317', '602052', 2, 0, NULL, 0, 0.00),
(16, 'leon', 'carlota gsman 71', '563858', 2, 0, NULL, 0, 0.00),
(17, 'jeremias', 'frias 112', '506029', 2, 0, NULL, 0, 0.00),
(19, 'ignacio', 'frias 118', '897054', 2, 0, NULL, 0, 0.00),
(20, 'wd', 'belgrano 112', '387056', 2, 0, NULL, 0, 0.00),
(21, 'matias', 'rfjfrf', 'rfjfrjfrj', 3, 2, NULL, 0, 0.00),
(22, 'mfrmfrm', 'rfkfkfr', 'fkrkf', 3, 0, NULL, 0, 0.00),
(24, 'jeremias bandeli', 'bancora 275', '54 9 2346 53-3182', 4, 0, NULL, 0, 0.00),
(25, 'jonas poelstra', 'rivadavia 12', '54 9 2346 53-2142', 4, 0, NULL, 0, 0.00),
(26, 'maria antonella', 'yrigoyen 111', '54 9 2346 53-2127', 4, 0, NULL, 0, 0.00),
(27, 'gustavo martinez', 'rivadavia 14', '54 9 2346 53-2173', 4, 0, NULL, 0, 0.00),
(28, 'ignacio', 'yapeyu 20', ' 54 9 2346 53-3269', 4, 0, NULL, 0, 0.00),
(29, 'abigail', 'belgrano 112', '54 9 2346 53-4621', 4, 0, NULL, 0, 0.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuentas`
--

CREATE TABLE `cuentas` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `estado_pago` tinyint(4) NOT NULL,
  `cantidad_bidones` int(11) NOT NULL,
  `precio_bidon` decimal(10,2) NOT NULL,
  `total` decimal(10,2) GENERATED ALWAYS AS (`cantidad_bidones` * `precio_bidon`) STORED,
  `fecha_publicacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cuentas`
--

INSERT INTO `cuentas` (`id`, `cliente_id`, `estado_pago`, `cantidad_bidones`, `precio_bidon`, `fecha_publicacion`) VALUES
(3, 2, 2, 2, 1200.00, '2025-05-11 00:20:19'),
(4, 2, 2, 2, 1200.00, '2025-05-11 00:20:46'),
(5, 2, 1, 2, 1200.00, '2025-05-11 00:21:13'),
(6, 2, 1, 2, 2222.00, '2025-05-11 00:28:12'),
(7, 2, 0, 4, 10000.00, '2025-05-11 00:28:23'),
(8, 2, 2, 2, 100000.00, '2025-05-11 00:28:33'),
(9, 3, 2, 2, 120000.00, '2025-05-11 00:29:33'),
(10, 3, 2, 22, 222.00, '2025-05-11 00:29:43'),
(13, 17, 1, 2, 4200.00, '2025-06-15 16:43:44'),
(14, 17, 0, 1, 4299.00, '2025-06-15 16:44:22'),
(15, 17, 2, 2, 4200.00, '2025-06-15 16:44:36'),
(16, 17, 0, 2, 4200.00, '2025-06-15 16:44:47'),
(17, 14, 2, 4, 4200.00, '2025-06-15 16:45:49'),
(18, 14, 0, 3, 4200.00, '2025-06-15 16:46:03'),
(19, 14, 2, 3, 4200.00, '2025-06-15 16:46:13'),
(20, 21, 2, 2, 2400.00, '2025-08-06 22:31:16'),
(21, 21, 0, 2, 2000.00, '2025-08-06 22:31:33'),
(22, 21, 1, 3, 4000.00, '2025-08-06 22:32:14'),
(23, 22, 2, 3, 2000.00, '2025-08-06 22:33:10'),
(24, 22, 2, 100, 2000.00, '2025-08-06 22:33:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `gmail` varchar(100) NOT NULL,
  `contraseña` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `gmail`, `contraseña`) VALUES
(1, 'jeremías Agustín', 'jeremias@gmail.com', 'jeret445'),
(2, 'fernando bandelli', 'fernandobande@gmail.com', '1234'),
(3, 'jeremías Agustín', 'anal@gmail.com', 'jeret445'),
(4, 'jonas poelstra', 'ignacio@gmail.com', '22'),
(5, 'ariel ', 'e@gmail.com', '22');

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
-- Indices de la tabla `cuentas`
--
ALTER TABLE `cuentas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cuentas_ibfk_1` (`cliente_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `cuentas`
--
ALTER TABLE `cuentas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `cuentas`
--
ALTER TABLE `cuentas`
  ADD CONSTRAINT `cuentas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
