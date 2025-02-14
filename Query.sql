-- Create the database
CREATE DATABASE exam_hall_db;

-- Use the created database
USE exam_hall_db;

-- Create the users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);

-- Create the buildings table
CREATE TABLE buildings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Create the rooms table
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT,
    room_number VARCHAR(50) NOT NULL,
    column_count INT NOT NULL,
    row_count INT NOT NULL,
    total_seats INT NOT NULL,
    floor INT NOT NULL,
    FOREIGN KEY (building_id) REFERENCES buildings(id)
);

-- Create the exams table
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_code VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    sem INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
    roll_start VARCHAR(50) NOT NULL,
    roll_end VARCHAR(50) NOT NULL,
    total_students INT NOT NULL
);






### Insert some data inside database table ###

-- Insert sample data into the users table
INSERT INTO users (id, password) VALUES
('user1', 'password1'),
('user2', 'password2'),
('admin', 'adminpass');

-- Insert sample data into the buildings table
INSERT INTO buildings (name) VALUES
('Main Building'),
('Dash Building'),
('Building C');

-- Insert sample data into the rooms table
INSERT INTO rooms (building_id, room_number, column_count, row_count, total_seats, floor) VALUES
(1, '101', 5, 10, 50, 1),  -- Room in Building A
(1, '102', 5, 10, 50, 1),  -- Room in Building A
(2, '201', 6, 12, 72, 2),  -- Room in Building B
(2, '202', 6, 12, 72, 2),  -- Room in Building B
(3, '301', 4, 8, 32, 3);    -- Room in Building C

-- Insert sample data into the exams table
INSERT INTO exams (college_code, branch, sem, subject, exam_date, exam_time, roll_start, roll_end, total_students) VALUES
('CSE', 'Computer_Science', 1, 'Data Structures', '2023-11-01', '09:00:00', '101', '150', 50),
('ECE', 'Electronics', 1, 'Circuit Analysis', '2023-11-02', '10:00:00', '201', '250', 50),
('ME', 'Mechanical', 2, 'Thermodynamics', '2023-11-03', '11:00:00', '301', '350', 50);



