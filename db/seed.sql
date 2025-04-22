-- seed.sql

USE appdb;

-- Create a test user, the password is 'testpass'
INSERT INTO `users` (`email_id`, `password`, `verified`, `music_platform`,  `first_name`, `last_name`) VALUES 
('test', '$2b$12$8yR4FcNINkh3NAdBmalUHeZSRbCUXKrDSHvUpkBm1uG/23T7r1a62',  false, 'YT', 'Test', 'User');