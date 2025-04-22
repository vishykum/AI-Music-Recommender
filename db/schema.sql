-- schema.sql

-- This SQL script creates the database and tables for the application.

-- Create the database
CREATE DATABASE IF NOT EXISTS appdb;

USE appdb;

-- Create the users table
CREATE TABLE IF NOT EXISTS `users` (
    `email_id` varchar(50),
    `password` char(60) NOT NULL,
    `verified` boolean NOT NULL,
    `music_platform` varchar(15) NOT NULL,
    `first_name` varchar(20) NOT NULL,
    `last_name` varchar(20) NOT NULL,
    PRIMARY KEY (`email_id`)
);

-- Create the chats table
CREATE TABLE IF NOT EXISTS `chats` (
	`message_id` bigint AUTO_INCREMENT,
    `timestamp` datetime NOT NULL,
    `email_id` varchar(50),
    `user_message` text,
    `bot_response` text,
    PRIMARY KEY (`message_id`),
    FOREIGN KEY (`email_id`) REFERENCES users(`email_id`)
);

-- Create the recommendation table
CREATE TABLE IF NOT EXISTS `recommendation` (
	`rec_id` bigint AUTO_INCREMENT,
    `message_id` bigint,
    `song_name` varchar(50),
    `artist_name` varchar(50),
    primary key (`rec_id`),
    foreign key (`message_id`) references chats(`message_id`)
);