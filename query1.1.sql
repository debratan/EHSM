-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               9.1.0 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table exam_hall_db.buildings
CREATE TABLE IF NOT EXISTS `buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.buildings: ~3 rows (approximately)
REPLACE INTO `buildings` (`id`, `name`) VALUES
	(1, 'Main Building'),
	(2, 'Dash Building'),
	(3, 'Building C');

-- Dumping structure for table exam_hall_db.exams
CREATE TABLE IF NOT EXISTS `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `college_code` varchar(50) NOT NULL,
  `branch` varchar(50) NOT NULL,
  `sem` int NOT NULL,
  `subject` varchar(100) NOT NULL,
  `exam_date` date NOT NULL,
  `exam_time` time NOT NULL,
  `roll_start` varchar(50) NOT NULL,
  `roll_end` varchar(50) NOT NULL,
  `total_students` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.exams: ~3 rows (approximately)
REPLACE INTO `exams` (`id`, `college_code`, `branch`, `sem`, `subject`, `exam_date`, `exam_time`, `roll_start`, `roll_end`, `total_students`) VALUES
	(1, 'CSE', 'Computer_Science', 1, 'Data Structures', '2023-11-01', '09:00:00', '101', '150', 50),
	(2, 'ECE', 'Electronics', 1, 'Circuit Analysis', '2023-11-02', '10:00:00', '201', '250', 50),
	(3, 'ME', 'Mechanical', 2, 'Thermodynamics', '2023-11-03', '11:00:00', '301', '350', 50);

-- Dumping structure for table exam_hall_db.rooms
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `building_id` int DEFAULT NULL,
  `room_number` varchar(50) NOT NULL,
  `column_count` int NOT NULL,
  `row_count` int NOT NULL,
  `total_seats` int NOT NULL,
  `floor` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `building_id` (`building_id`),
  CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.rooms: ~7 rows (approximately)
REPLACE INTO `rooms` (`id`, `building_id`, `room_number`, `column_count`, `row_count`, `total_seats`, `floor`) VALUES
	(20, 1, '100', 4, 6, 20, 1),
	(21, 2, '200', 4, 4, 16, 1),
	(25, 2, '201', 4, 6, 24, 1),
	(26, 1, '354', 2, 2, 4, 2),
	(27, 1, '354', 2, 2, 4, 2),
	(28, 1, '122', 4, 4, 12, 2),
	(29, 3, '203', 4, 5, 20, 3);

-- Dumping structure for table exam_hall_db.room_20
CREATE TABLE IF NOT EXISTS `room_20` (
  `id` int NOT NULL AUTO_INCREMENT,
  `column_number` int DEFAULT NULL,
  `row_number` int DEFAULT NULL,
  `seat_status` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.room_20: ~20 rows (approximately)
REPLACE INTO `room_20` (`id`, `column_number`, `row_number`, `seat_status`) VALUES
	(1, 1, 1, 0),
	(2, 1, 2, 0),
	(3, 1, 3, 0),
	(4, 1, 4, 0),
	(5, 1, 5, 0),
	(6, 1, 6, 0),
	(7, 2, 1, 0),
	(8, 2, 2, 0),
	(9, 2, 3, 0),
	(10, 2, 4, 0),
	(11, 3, 1, 0),
	(12, 3, 2, 0),
	(13, 3, 3, 0),
	(14, 3, 4, 0),
	(15, 4, 1, 0),
	(16, 4, 2, 0),
	(17, 4, 3, 0),
	(18, 4, 4, 0),
	(19, 4, 5, 0),
	(20, 4, 6, 0);

-- Dumping structure for table exam_hall_db.room_21
CREATE TABLE IF NOT EXISTS `room_21` (
  `id` int NOT NULL AUTO_INCREMENT,
  `column_number` int DEFAULT NULL,
  `row_number` int DEFAULT NULL,
  `seat_status` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.room_21: ~16 rows (approximately)
REPLACE INTO `room_21` (`id`, `column_number`, `row_number`, `seat_status`) VALUES
	(1, 1, 1, 0),
	(2, 1, 2, 0),
	(3, 1, 3, 0),
	(4, 1, 4, 0),
	(5, 2, 1, 0),
	(6, 2, 2, 0),
	(7, 2, 3, 0),
	(8, 2, 4, 0),
	(9, 3, 1, 0),
	(10, 3, 2, 0),
	(11, 3, 3, 0),
	(12, 3, 4, 0),
	(13, 4, 1, 0),
	(14, 4, 2, 0),
	(15, 4, 3, 0),
	(16, 4, 4, 0);

-- Dumping structure for table exam_hall_db.room_25
CREATE TABLE IF NOT EXISTS `room_25` (
  `id` int NOT NULL AUTO_INCREMENT,
  `column_number` int DEFAULT NULL,
  `row_number` int DEFAULT NULL,
  `seat_status` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.room_25: ~24 rows (approximately)
REPLACE INTO `room_25` (`id`, `column_number`, `row_number`, `seat_status`) VALUES
	(1, 1, 1, 0),
	(2, 1, 2, 0),
	(3, 1, 3, 0),
	(4, 1, 4, 0),
	(5, 1, 5, 0),
	(6, 1, 6, 0),
	(7, 2, 1, 0),
	(8, 2, 2, 0),
	(9, 2, 3, 0),
	(10, 2, 4, 0),
	(11, 2, 5, 0),
	(12, 2, 6, 0),
	(13, 3, 1, 0),
	(14, 3, 2, 0),
	(15, 3, 3, 0),
	(16, 3, 4, 0),
	(17, 3, 5, 0),
	(18, 3, 6, 0),
	(19, 4, 1, 0),
	(20, 4, 2, 0),
	(21, 4, 3, 0),
	(22, 4, 4, 0),
	(23, 4, 5, 0),
	(24, 4, 6, 0);

-- Dumping structure for table exam_hall_db.room_26
CREATE TABLE IF NOT EXISTS `room_26` (
  `id` int NOT NULL AUTO_INCREMENT,
  `column_number` int DEFAULT NULL,
  `row_number` int DEFAULT NULL,
  `seat_status` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.room_26: ~4 rows (approximately)
REPLACE INTO `room_26` (`id`, `column_number`, `row_number`, `seat_status`) VALUES
	(1, 1, 1, 0),
	(2, 1, 2, 0),
	(3, 2, 1, 0),
	(4, 2, 2, 0);

-- Dumping structure for table exam_hall_db.room_27
CREATE TABLE IF NOT EXISTS `room_27` (
  `id` int NOT NULL AUTO_INCREMENT,
  `column_number` int DEFAULT NULL,
  `row_number` int DEFAULT NULL,
  `seat_status` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.room_27: ~4 rows (approximately)
REPLACE INTO `room_27` (`id`, `column_number`, `row_number`, `seat_status`) VALUES
	(1, 1, 1, 0),
	(2, 1, 2, 0),
	(3, 2, 1, 0),
	(4, 2, 2, 0);

-- Dumping structure for table exam_hall_db.room_28
CREATE TABLE IF NOT EXISTS `room_28` (
  `id` int NOT NULL AUTO_INCREMENT,
  `column_number` int DEFAULT NULL,
  `row_number` int DEFAULT NULL,
  `seat_status` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.room_28: ~12 rows (approximately)
REPLACE INTO `room_28` (`id`, `column_number`, `row_number`, `seat_status`) VALUES
	(1, 1, 1, 0),
	(2, 1, 2, 0),
	(3, 1, 3, 0),
	(4, 1, 4, 0),
	(5, 2, 1, 0),
	(6, 2, 2, 0),
	(7, 3, 1, 0),
	(8, 3, 2, 0),
	(9, 3, 3, 0),
	(10, 3, 4, 0),
	(11, 4, 1, 0),
	(12, 4, 2, 0);

-- Dumping structure for table exam_hall_db.room_29
CREATE TABLE IF NOT EXISTS `room_29` (
  `id` int NOT NULL AUTO_INCREMENT,
  `column_number` int DEFAULT NULL,
  `row_number` int DEFAULT NULL,
  `seat_status` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.room_29: ~20 rows (approximately)
REPLACE INTO `room_29` (`id`, `column_number`, `row_number`, `seat_status`) VALUES
	(1, 1, 1, 0),
	(2, 1, 2, 0),
	(3, 1, 3, 0),
	(4, 1, 4, 0),
	(5, 1, 5, 0),
	(6, 2, 1, 0),
	(7, 2, 2, 0),
	(8, 2, 3, 0),
	(9, 2, 4, 0),
	(10, 2, 5, 0),
	(11, 3, 1, 0),
	(12, 3, 2, 0),
	(13, 3, 3, 0),
	(14, 3, 4, 0),
	(15, 3, 5, 0),
	(16, 4, 1, 0),
	(17, 4, 2, 0),
	(18, 4, 3, 0),
	(19, 4, 4, 0),
	(20, 4, 5, 0);

-- Dumping structure for table exam_hall_db.seats
CREATE TABLE IF NOT EXISTS `seats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int DEFAULT NULL,
  `seat_number` varchar(10) DEFAULT NULL,
  `allocated_to_roll_number` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `seats_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.seats: ~0 rows (approximately)

-- Dumping structure for table exam_hall_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Dumping data for table exam_hall_db.users: ~3 rows (approximately)
REPLACE INTO `users` (`id`, `password`) VALUES
	('admin', 'adminpass'),
	('user1', 'password1'),
	('user2', 'password2');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
