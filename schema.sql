-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 12, 2025 at 05:21 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fitness_trainer_platform`
--

-- --------------------------------------------------------

--
-- Table structure for table `articles`
--

CREATE TABLE `articles` (
  `id` int(11) NOT NULL,
  `title` varchar(300) NOT NULL,
  `slug` varchar(300) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` longtext NOT NULL,
  `featured_image_url` varchar(500) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `author_id` int(11) NOT NULL,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `is_featured` tinyint(1) DEFAULT 0,
  `view_count` int(11) DEFAULT 0,
  `reading_time_minutes` int(11) DEFAULT NULL,
  `seo_title` varchar(300) DEFAULT NULL,
  `seo_description` text DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `booking_code` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `package_id` int(11) DEFAULT NULL,
  `session_date` date NOT NULL,
  `session_time` time NOT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 60,
  `location_type` enum('gym','home','outdoor','online') DEFAULT 'gym',
  `location_name` varchar(200) DEFAULT NULL,
  `location_address` text DEFAULT NULL,
  `location_lat` decimal(10,6) DEFAULT NULL,
  `location_lng` decimal(10,6) DEFAULT NULL,
  `status` enum('pending','confirmed','in_progress','completed','cancelled','rescheduled') DEFAULT 'pending',
  `price` decimal(10,2) NOT NULL,
  `payment_status` enum('pending','paid','refunded','failed') DEFAULT 'pending',
  `session_type` varchar(100) DEFAULT NULL,
  `customer_notes` text DEFAULT NULL,
  `trainer_notes` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_by` enum('customer','trainer','admin') DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `rescheduled_from` int(11) DEFAULT NULL,
  `reminder_sent` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `bookings`
--
DELIMITER $$
CREATE TRIGGER `update_customer_stats` AFTER UPDATE ON `bookings` FOR EACH ROW BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE customers SET 
            total_sessions = total_sessions + 1,
            total_spent = total_spent + NEW.price
        WHERE id = NEW.customer_id;
        
        UPDATE trainers SET 
            total_sessions = total_sessions + 1,
            total_customers = (
                SELECT COUNT(DISTINCT customer_id) 
                FROM bookings 
                WHERE trainer_id = NEW.trainer_id AND status = 'completed'
            )
        WHERE id = NEW.trainer_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#232956',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_rooms`
--

CREATE TABLE `chat_rooms` (
  `id` int(11) NOT NULL,
  `room_code` varchar(20) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `status` enum('active','archived','blocked') DEFAULT 'active',
  `last_message_id` int(11) DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `customer_unread_count` int(11) DEFAULT 0,
  `trainer_unread_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `customer_code` varchar(20) NOT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_relation` varchar(50) DEFAULT NULL,
  `health_conditions` text DEFAULT NULL,
  `fitness_goals` text DEFAULT NULL,
  `current_weight` decimal(5,2) DEFAULT NULL,
  `target_weight` decimal(5,2) DEFAULT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `activity_level` enum('sedentary','light','moderate','active','very_active') DEFAULT 'moderate',
  `dietary_restrictions` text DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `injuries_or_limitations` text DEFAULT NULL,
  `total_sessions` int(11) DEFAULT 0,
  `total_spent` decimal(12,2) DEFAULT 0.00,
  `preferred_trainer_gender` enum('male','female','no_preference') DEFAULT 'no_preference',
  `preferred_session_time` enum('morning','afternoon','evening','flexible') DEFAULT 'flexible',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `customer_details`
-- (See below for the actual view)
--
CREATE TABLE `customer_details` (
`id` int(11)
,`user_id` int(11)
,`customer_code` varchar(20)
,`emergency_contact_name` varchar(100)
,`emergency_contact_phone` varchar(20)
,`emergency_contact_relation` varchar(50)
,`health_conditions` text
,`fitness_goals` text
,`current_weight` decimal(5,2)
,`target_weight` decimal(5,2)
,`height` decimal(5,2)
,`activity_level` enum('sedentary','light','moderate','active','very_active')
,`dietary_restrictions` text
,`allergies` text
,`injuries_or_limitations` text
,`total_sessions` int(11)
,`total_spent` decimal(12,2)
,`preferred_trainer_gender` enum('male','female','no_preference')
,`preferred_session_time` enum('morning','afternoon','evening','flexible')
,`created_at` timestamp
,`updated_at` timestamp
,`first_name` varchar(100)
,`last_name` varchar(100)
,`display_name` varchar(200)
,`phone` varchar(20)
,`avatar_url` varchar(500)
,`total_bookings` bigint(21)
,`completed_sessions` bigint(21)
,`unique_trainers` bigint(21)
,`avg_rating_given` decimal(14,4)
,`latest_weight` decimal(5,2)
,`latest_bmi` decimal(4,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `customer_health_data`
--

CREATE TABLE `customer_health_data` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `body_fat_percentage` decimal(5,2) DEFAULT NULL,
  `muscle_mass` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(4,2) DEFAULT NULL,
  `chest_circumference` decimal(5,2) DEFAULT NULL,
  `waist_circumference` decimal(5,2) DEFAULT NULL,
  `hip_circumference` decimal(5,2) DEFAULT NULL,
  `arm_circumference` decimal(5,2) DEFAULT NULL,
  `thigh_circumference` decimal(5,2) DEFAULT NULL,
  `resting_heart_rate` int(11) DEFAULT NULL,
  `blood_pressure_systolic` int(11) DEFAULT NULL,
  `blood_pressure_diastolic` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `measured_by` enum('self','trainer','medical') DEFAULT 'self',
  `measurement_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `title` varchar(300) NOT NULL,
  `slug` varchar(300) NOT NULL,
  `description` text DEFAULT NULL,
  `featured_image_url` varchar(500) DEFAULT NULL,
  `event_type` varchar(100) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `location_name` varchar(200) DEFAULT NULL,
  `location_address` text DEFAULT NULL,
  `location_lat` decimal(10,6) DEFAULT NULL,
  `location_lng` decimal(10,6) DEFAULT NULL,
  `max_participants` int(11) DEFAULT NULL,
  `registration_fee` decimal(10,2) DEFAULT 0.00,
  `registration_start` date DEFAULT NULL,
  `registration_end` date DEFAULT NULL,
  `status` enum('draft','published','ongoing','completed','cancelled') DEFAULT 'draft',
  `is_featured` tinyint(1) DEFAULT 0,
  `organizer_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_registrations`
--

CREATE TABLE `event_registrations` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `registration_status` enum('pending','confirmed','cancelled','waitlist') DEFAULT 'pending',
  `payment_status` enum('pending','paid','refunded') DEFAULT 'pending',
  `payment_amount` decimal(10,2) DEFAULT 0.00,
  `additional_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additional_info`)),
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exercise_database`
--

CREATE TABLE `exercise_database` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `category` varchar(100) NOT NULL,
  `muscle_groups` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`muscle_groups`)),
  `equipment` varchar(100) DEFAULT NULL,
  `difficulty_level` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
  `description` text DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `calories_per_minute` decimal(4,2) DEFAULT NULL,
  `tips` text DEFAULT NULL,
  `precautions` text DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `food_database`
--

CREATE TABLE `food_database` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `serving_size` varchar(50) NOT NULL,
  `calories_per_serving` decimal(6,2) NOT NULL,
  `protein_per_serving` decimal(6,2) NOT NULL,
  `carbs_per_serving` decimal(6,2) NOT NULL,
  `fat_per_serving` decimal(6,2) NOT NULL,
  `fiber_per_serving` decimal(6,2) DEFAULT 0.00,
  `sugar_per_serving` decimal(6,2) DEFAULT 0.00,
  `sodium_per_serving` decimal(6,2) DEFAULT 0.00,
  `image_url` varchar(500) DEFAULT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `sender_type` enum('customer','trainer') NOT NULL,
  `message_type` enum('text','image','file','voice','video','system') DEFAULT 'text',
  `content` text DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT NULL,
  `reply_to_message_id` int(11) DEFAULT NULL,
  `is_edited` tinyint(1) DEFAULT 0,
  `edited_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `read_by_customer` tinyint(1) DEFAULT 0,
  `read_by_trainer` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `messages`
--
DELIMITER $$
CREATE TRIGGER `update_chat_room_last_message` AFTER INSERT ON `messages` FOR EACH ROW BEGIN
    UPDATE chat_rooms SET 
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        customer_unread_count = CASE 
            WHEN NEW.sender_type = 'trainer' THEN customer_unread_count + 1 
            ELSE customer_unread_count 
        END,
        trainer_unread_count = CASE 
            WHEN NEW.sender_type = 'customer' THEN trainer_unread_count + 1 
            ELSE trainer_unread_count 
        END
    WHERE id = NEW.room_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `action_label` varchar(100) DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nutrition_logs`
--

CREATE TABLE `nutrition_logs` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `nutrition_plan_id` int(11) DEFAULT NULL,
  `food_id` int(11) NOT NULL,
  `meal_type` enum('breakfast','lunch','dinner','snack') NOT NULL,
  `serving_amount` decimal(6,2) NOT NULL,
  `log_date` date NOT NULL,
  `calories_consumed` decimal(8,2) NOT NULL,
  `protein_consumed` decimal(6,2) NOT NULL,
  `carbs_consumed` decimal(6,2) NOT NULL,
  `fat_consumed` decimal(6,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nutrition_plans`
--

CREATE TABLE `nutrition_plans` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `target_calories` int(11) DEFAULT NULL,
  `target_protein` decimal(6,2) DEFAULT NULL,
  `target_carbs` decimal(6,2) DEFAULT NULL,
  `target_fat` decimal(6,2) DEFAULT NULL,
  `target_fiber` decimal(6,2) DEFAULT NULL,
  `meal_plan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`meal_plan`)),
  `dietary_restrictions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dietary_restrictions`)),
  `is_active` tinyint(1) DEFAULT 1,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

CREATE TABLE `packages` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `session_count` int(11) NOT NULL,
  `duration_weeks` int(11) DEFAULT 4,
  `price` decimal(10,2) NOT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `discount_percentage` decimal(5,2) DEFAULT 0.00,
  `session_duration_minutes` int(11) DEFAULT 60,
  `package_type` enum('individual','group','online','hybrid') DEFAULT 'individual',
  `max_participants` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `terms_and_conditions` text DEFAULT NULL,
  `cancellation_policy` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `partners`
--

CREATE TABLE `partners` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `website_url` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `partner_type` enum('gym','nutrition','equipment','wellness','technology') NOT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `display_order` int(11) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `payment_code` varchar(20) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `commission_amount` decimal(10,2) NOT NULL,
  `platform_fee` decimal(10,2) DEFAULT 0.00,
  `net_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('credit_card','bank_transfer','promptpay','wallet','cash') NOT NULL,
  `payment_provider` varchar(50) DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','processing','completed','failed','cancelled','refunded') DEFAULT 'pending',
  `payment_date` timestamp NULL DEFAULT NULL,
  `refund_amount` decimal(10,2) DEFAULT 0.00,
  `refund_reason` text DEFAULT NULL,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `payout_status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `payout_date` timestamp NULL DEFAULT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `promotion_type` enum('discount_percentage','discount_amount','free_session','buy_one_get_one') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `minimum_amount` decimal(10,2) DEFAULT 0.00,
  `maximum_discount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `usage_count` int(11) DEFAULT 0,
  `user_usage_limit` int(11) DEFAULT 1,
  `applicable_to` enum('all','trainers','packages') DEFAULT 'all',
  `applicable_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`applicable_ids`)),
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promotion_usage`
--

CREATE TABLE `promotion_usage` (
  `id` int(11) NOT NULL,
  `promotion_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `title` varchar(200) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `pros` text DEFAULT NULL,
  `cons` text DEFAULT NULL,
  `would_recommend` tinyint(1) DEFAULT 1,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `is_verified` tinyint(1) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `helpful_count` int(11) DEFAULT 0,
  `reported_count` int(11) DEFAULT 0,
  `status` enum('pending','approved','rejected','hidden') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `reviews`
--
DELIMITER $$
CREATE TRIGGER `update_trainer_rating` AFTER INSERT ON `reviews` FOR EACH ROW BEGIN
    UPDATE trainers SET 
        rating = (
            SELECT AVG(rating) 
            FROM reviews 
            WHERE trainer_id = NEW.trainer_id AND status = 'approved'
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE trainer_id = NEW.trainer_id AND status = 'approved'
        )
    WHERE id = NEW.trainer_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `session_reports`
--

CREATE TABLE `session_reports` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `session_completed` tinyint(1) DEFAULT 0,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `actual_duration_minutes` int(11) DEFAULT NULL,
  `workout_type` varchar(100) DEFAULT NULL,
  `exercises_performed` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`exercises_performed`)),
  `calories_burned` int(11) DEFAULT NULL,
  `customer_effort_level` enum('low','moderate','high','very_high') DEFAULT NULL,
  `customer_satisfaction` enum('poor','fair','good','excellent') DEFAULT NULL,
  `performance_notes` text DEFAULT NULL,
  `progress_notes` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `next_session_focus` text DEFAULT NULL,
  `measurements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`measurements`)),
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json','text') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `is_public`, `updated_by`, `updated_at`) VALUES
(1, 'app_name', 'PT Thailand Plus', 'string', 'ชื่อแอปพลิเคชัน', 1, NULL, '2025-07-11 15:13:00'),
(2, 'app_version', '1.0.0', 'string', 'เวอร์ชันแอปพลิเคชัน', 1, NULL, '2025-07-11 15:13:00'),
(3, 'commission_rate', '10.00', 'number', 'อัตราค่าคอมมิชชั่นเริ่มต้น (%)', 0, NULL, '2025-07-11 15:13:00'),
(4, 'platform_fee', '2.50', 'number', 'ค่าธรรมเนียมแพลตฟอร์ม (%)', 0, NULL, '2025-07-11 15:13:00'),
(5, 'max_booking_advance_days', '30', 'number', 'จำนวนวันสูงสุดที่สามารถจองล่วงหน้า', 0, NULL, '2025-07-11 15:13:00'),
(6, 'cancellation_window_hours', '24', 'number', 'ระยะเวลาก่อนยกเลิกได้ (ชั่วโมง)', 0, NULL, '2025-07-11 15:13:00'),
(7, 'auto_approval_bookings', 'false', 'boolean', 'อนุมัติการจองอัตโนมัติ', 0, NULL, '2025-07-11 15:13:00'),
(8, 'email_notifications', 'true', 'boolean', 'เปิดใช้การแจ้งเตือนทางอีเมล', 0, NULL, '2025-07-11 15:13:00');

-- --------------------------------------------------------

--
-- Table structure for table `trainers`
--

CREATE TABLE `trainers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `trainer_code` varchar(20) NOT NULL,
  `business_name` varchar(200) DEFAULT NULL,
  `business_bio` text DEFAULT NULL,
  `experience_years` int(11) DEFAULT 0,
  `hourly_rate` decimal(10,2) DEFAULT 0.00,
  `rating` decimal(3,2) DEFAULT 0.00,
  `total_reviews` int(11) DEFAULT 0,
  `total_sessions` int(11) DEFAULT 0,
  `total_customers` int(11) DEFAULT 0,
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `verification_date` timestamp NULL DEFAULT NULL,
  `verification_documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`verification_documents`)),
  `is_featured` tinyint(1) DEFAULT 0,
  `is_available` tinyint(1) DEFAULT 1,
  `accepts_new_clients` tinyint(1) DEFAULT 1,
  `max_clients` int(11) DEFAULT 50,
  `commission_rate` decimal(5,2) DEFAULT 15.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trainer_certifications`
--

CREATE TABLE `trainer_certifications` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `certification_name` varchar(200) NOT NULL,
  `issuing_organization` varchar(200) NOT NULL,
  `issue_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `certificate_url` varchar(500) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `trainer_details`
-- (See below for the actual view)
--
CREATE TABLE `trainer_details` (
`id` int(11)
,`user_id` int(11)
,`trainer_code` varchar(20)
,`business_name` varchar(200)
,`business_bio` text
,`experience_years` int(11)
,`hourly_rate` decimal(10,2)
,`rating` decimal(3,2)
,`total_reviews` int(11)
,`total_sessions` int(11)
,`total_customers` int(11)
,`verification_status` enum('pending','verified','rejected')
,`verification_date` timestamp
,`verification_documents` longtext
,`is_featured` tinyint(1)
,`is_available` tinyint(1)
,`accepts_new_clients` tinyint(1)
,`max_clients` int(11)
,`commission_rate` decimal(5,2)
,`created_at` timestamp
,`updated_at` timestamp
,`first_name` varchar(100)
,`last_name` varchar(100)
,`display_name` varchar(200)
,`phone` varchar(20)
,`avatar_url` varchar(500)
,`city` varchar(100)
,`province` varchar(100)
,`specialties` mediumtext
,`unique_customers` bigint(21)
,`avg_satisfaction` decimal(4,4)
);

-- --------------------------------------------------------

--
-- Table structure for table `trainer_education`
--

CREATE TABLE `trainer_education` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `institution_name` varchar(200) NOT NULL,
  `degree` varchar(100) NOT NULL,
  `field_of_study` varchar(100) DEFAULT NULL,
  `start_year` year(4) NOT NULL,
  `end_year` year(4) DEFAULT NULL,
  `gpa` decimal(3,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trainer_photos`
--

CREATE TABLE `trainer_photos` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `photo_url` varchar(500) NOT NULL,
  `photo_type` enum('profile','gallery','certification','workout') DEFAULT 'gallery',
  `title` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_primary` tinyint(1) DEFAULT 0,
  `is_public` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trainer_service_areas`
--

CREATE TABLE `trainer_service_areas` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `area_name` varchar(100) NOT NULL,
  `area_type` enum('district','province','region') DEFAULT 'district',
  `travel_fee` decimal(8,2) DEFAULT 0.00,
  `max_distance_km` int(11) DEFAULT 10,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trainer_specialties`
--

CREATE TABLE `trainer_specialties` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `specialty` varchar(100) NOT NULL,
  `level` enum('beginner','intermediate','expert') DEFAULT 'intermediate',
  `years_experience` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trainer_working_hours`
--

CREATE TABLE `trainer_working_hours` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trainer_work_history`
--

CREATE TABLE `trainer_work_history` (
  `id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `position` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','trainer','admin') NOT NULL DEFAULT 'customer',
  `status` enum('active','inactive','suspended','pending') DEFAULT 'pending',
  `email_verified` tinyint(1) DEFAULT 0,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `verification_token` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `login_attempts` int(11) DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `display_name` varchar(200) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `country` varchar(50) DEFAULT 'Thailand',
  `line_id` varchar(100) DEFAULT NULL,
  `facebook_url` varchar(255) DEFAULT NULL,
  `instagram_url` varchar(255) DEFAULT NULL,
  `tiktok_url` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `timezone` varchar(50) DEFAULT 'Asia/Bangkok',
  `language` varchar(10) DEFAULT 'th',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workout_logs`
--

CREATE TABLE `workout_logs` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `workout_plan_id` int(11) DEFAULT NULL,
  `exercise_id` int(11) NOT NULL,
  `session_date` date NOT NULL,
  `sets_completed` int(11) DEFAULT 0,
  `reps_completed` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`reps_completed`)),
  `weight_used` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`weight_used`)),
  `duration_minutes` int(11) DEFAULT NULL,
  `distance_km` decimal(6,2) DEFAULT NULL,
  `calories_burned` int(11) DEFAULT NULL,
  `effort_level` enum('low','moderate','high','very_high') DEFAULT 'moderate',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workout_plans`
--

CREATE TABLE `workout_plans` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `difficulty_level` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
  `duration_weeks` int(11) DEFAULT 4,
  `goal` varchar(200) DEFAULT NULL,
  `plan_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`plan_data`)),
  `is_active` tinyint(1) DEFAULT 1,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `completion_percentage` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure for view `customer_details`
--
DROP TABLE IF EXISTS `customer_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `customer_details`  AS SELECT `c`.`id` AS `id`, `c`.`user_id` AS `user_id`, `c`.`customer_code` AS `customer_code`, `c`.`emergency_contact_name` AS `emergency_contact_name`, `c`.`emergency_contact_phone` AS `emergency_contact_phone`, `c`.`emergency_contact_relation` AS `emergency_contact_relation`, `c`.`health_conditions` AS `health_conditions`, `c`.`fitness_goals` AS `fitness_goals`, `c`.`current_weight` AS `current_weight`, `c`.`target_weight` AS `target_weight`, `c`.`height` AS `height`, `c`.`activity_level` AS `activity_level`, `c`.`dietary_restrictions` AS `dietary_restrictions`, `c`.`allergies` AS `allergies`, `c`.`injuries_or_limitations` AS `injuries_or_limitations`, `c`.`total_sessions` AS `total_sessions`, `c`.`total_spent` AS `total_spent`, `c`.`preferred_trainer_gender` AS `preferred_trainer_gender`, `c`.`preferred_session_time` AS `preferred_session_time`, `c`.`created_at` AS `created_at`, `c`.`updated_at` AS `updated_at`, `up`.`first_name` AS `first_name`, `up`.`last_name` AS `last_name`, `up`.`display_name` AS `display_name`, `up`.`phone` AS `phone`, `up`.`avatar_url` AS `avatar_url`, count(distinct `b`.`id`) AS `total_bookings`, count(distinct case when `b`.`status` = 'completed' then `b`.`id` end) AS `completed_sessions`, count(distinct `b`.`trainer_id`) AS `unique_trainers`, avg(`r`.`rating`) AS `avg_rating_given`, `chd`.`weight` AS `latest_weight`, `chd`.`bmi` AS `latest_bmi` FROM ((((`customers` `c` left join `user_profiles` `up` on(`c`.`user_id` = `up`.`user_id`)) left join `bookings` `b` on(`c`.`id` = `b`.`customer_id`)) left join `reviews` `r` on(`c`.`id` = `r`.`customer_id`)) left join `customer_health_data` `chd` on(`c`.`id` = `chd`.`customer_id` and `chd`.`measurement_date` = (select max(`customer_health_data`.`measurement_date`) from `customer_health_data` where `customer_health_data`.`customer_id` = `c`.`id`))) GROUP BY `c`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `trainer_details`
--
DROP TABLE IF EXISTS `trainer_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `trainer_details`  AS SELECT `t`.`id` AS `id`, `t`.`user_id` AS `user_id`, `t`.`trainer_code` AS `trainer_code`, `t`.`business_name` AS `business_name`, `t`.`business_bio` AS `business_bio`, `t`.`experience_years` AS `experience_years`, `t`.`hourly_rate` AS `hourly_rate`, `t`.`rating` AS `rating`, `t`.`total_reviews` AS `total_reviews`, `t`.`total_sessions` AS `total_sessions`, `t`.`total_customers` AS `total_customers`, `t`.`verification_status` AS `verification_status`, `t`.`verification_date` AS `verification_date`, `t`.`verification_documents` AS `verification_documents`, `t`.`is_featured` AS `is_featured`, `t`.`is_available` AS `is_available`, `t`.`accepts_new_clients` AS `accepts_new_clients`, `t`.`max_clients` AS `max_clients`, `t`.`commission_rate` AS `commission_rate`, `t`.`created_at` AS `created_at`, `t`.`updated_at` AS `updated_at`, `up`.`first_name` AS `first_name`, `up`.`last_name` AS `last_name`, `up`.`display_name` AS `display_name`, `up`.`phone` AS `phone`, `up`.`avatar_url` AS `avatar_url`, `up`.`city` AS `city`, `up`.`province` AS `province`, group_concat(distinct `ts`.`specialty` separator ',') AS `specialties`, count(distinct `b`.`customer_id`) AS `unique_customers`, avg(case when `sr`.`customer_satisfaction` is not null then case `sr`.`customer_satisfaction` when 'poor' then 1 when 'fair' then 2 when 'good' then 3 when 'excellent' then 4 end end) AS `avg_satisfaction` FROM ((((`trainers` `t` left join `user_profiles` `up` on(`t`.`user_id` = `up`.`user_id`)) left join `trainer_specialties` `ts` on(`t`.`id` = `ts`.`trainer_id`)) left join `bookings` `b` on(`t`.`id` = `b`.`trainer_id` and `b`.`status` = 'completed')) left join `session_reports` `sr` on(`b`.`id` = `sr`.`booking_id`)) GROUP BY `t`.`id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `unique_slug` (`slug`),
  ADD KEY `idx_author_id` (`author_id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_is_featured` (`is_featured`),
  ADD KEY `idx_published_at` (`published_at`);
ALTER TABLE `articles` ADD FULLTEXT KEY `idx_title_content` (`title`,`content`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_code` (`booking_code`),
  ADD UNIQUE KEY `unique_booking_code` (`booking_code`),
  ADD KEY `rescheduled_from` (`rescheduled_from`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_package_id` (`package_id`),
  ADD KEY `idx_session_date` (`session_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_bookings_date_status` (`session_date`,`status`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_slug_unique` (`slug`);

--
-- Indexes for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `room_code` (`room_code`),
  ADD UNIQUE KEY `unique_room_code` (`room_code`),
  ADD UNIQUE KEY `unique_customer_trainer` (`customer_id`,`trainer_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_last_message_at` (`last_message_at`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customer_code` (`customer_code`),
  ADD UNIQUE KEY `unique_customer_code` (`customer_code`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_customer_code` (`customer_code`),
  ADD KEY `idx_activity_level` (`activity_level`),
  ADD KEY `idx_preferred_trainer_gender` (`preferred_trainer_gender`);

--
-- Indexes for table `customer_health_data`
--
ALTER TABLE `customer_health_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_measurement_date` (`measurement_date`),
  ADD KEY `idx_measured_by` (`measured_by`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `unique_slug` (`slug`),
  ADD KEY `idx_organizer_id` (`organizer_id`),
  ADD KEY `idx_event_type` (`event_type`),
  ADD KEY `idx_start_date` (`start_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_is_featured` (`is_featured`);

--
-- Indexes for table `event_registrations`
--
ALTER TABLE `event_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_event_user` (`event_id`,`user_id`),
  ADD KEY `idx_event_id` (`event_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_registration_status` (`registration_status`);

--
-- Indexes for table `exercise_database`
--
ALTER TABLE `exercise_database`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_equipment` (`equipment`),
  ADD KEY `idx_difficulty_level` (`difficulty_level`),
  ADD KEY `idx_is_verified` (`is_verified`);

--
-- Indexes for table `food_database`
--
ALTER TABLE `food_database`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_barcode` (`barcode`),
  ADD KEY `idx_is_verified` (`is_verified`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reply_to_message_id` (`reply_to_message_id`),
  ADD KEY `idx_room_id` (`room_id`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_message_type` (`message_type`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_is_deleted` (`is_deleted`),
  ADD KEY `idx_messages_room_created` (`room_id`,`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_notifications_user_read` (`user_id`,`is_read`,`created_at`);

--
-- Indexes for table `nutrition_logs`
--
ALTER TABLE `nutrition_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_nutrition_plan_id` (`nutrition_plan_id`),
  ADD KEY `idx_food_id` (`food_id`),
  ADD KEY `idx_log_date` (`log_date`),
  ADD KEY `idx_meal_type` (`meal_type`);

--
-- Indexes for table `nutrition_plans`
--
ALTER TABLE `nutrition_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `packages`
--
ALTER TABLE `packages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_package_type` (`package_type`),
  ADD KEY `idx_price` (`price`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_is_featured` (`is_featured`);

--
-- Indexes for table `partners`
--
ALTER TABLE `partners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_code` (`payment_code`),
  ADD UNIQUE KEY `unique_payment_code` (`payment_code`),
  ADD KEY `idx_booking_id` (`booking_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_payment_method` (`payment_method`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_payout_status` (`payout_status`),
  ADD KEY `idx_payments_date_status` (`payment_date`,`status`);

--
-- Indexes for table `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `unique_code` (`code`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_promotion_type` (`promotion_type`),
  ADD KEY `idx_start_date` (`start_date`),
  ADD KEY `idx_end_date` (`end_date`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `promotion_usage`
--
ALTER TABLE `promotion_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_promotion_id` (`promotion_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_booking_id` (`booking_id`),
  ADD KEY `idx_used_at` (`used_at`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_customer_booking` (`customer_id`,`booking_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_booking_id` (`booking_id`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_is_featured` (`is_featured`),
  ADD KEY `idx_reviews_trainer_rating` (`trainer_id`,`rating`,`status`);

--
-- Indexes for table `session_reports`
--
ALTER TABLE `session_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_booking_id` (`booking_id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_session_completed` (`session_completed`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD UNIQUE KEY `unique_setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_setting_key` (`setting_key`),
  ADD KEY `idx_is_public` (`is_public`);

--
-- Indexes for table `trainers`
--
ALTER TABLE `trainers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `trainer_code` (`trainer_code`),
  ADD UNIQUE KEY `unique_trainer_code` (`trainer_code`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_trainer_code` (`trainer_code`),
  ADD KEY `idx_verification_status` (`verification_status`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_is_featured` (`is_featured`),
  ADD KEY `idx_is_available` (`is_available`);

--
-- Indexes for table `trainer_certifications`
--
ALTER TABLE `trainer_certifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_certification_name` (`certification_name`),
  ADD KEY `idx_issue_date` (`issue_date`),
  ADD KEY `idx_expiry_date` (`expiry_date`);

--
-- Indexes for table `trainer_education`
--
ALTER TABLE `trainer_education`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_institution_name` (`institution_name`),
  ADD KEY `idx_degree` (`degree`);

--
-- Indexes for table `trainer_photos`
--
ALTER TABLE `trainer_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_photo_type` (`photo_type`),
  ADD KEY `idx_display_order` (`display_order`),
  ADD KEY `idx_is_primary` (`is_primary`);

--
-- Indexes for table `trainer_service_areas`
--
ALTER TABLE `trainer_service_areas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_trainer_area` (`trainer_id`,`area_name`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_area_name` (`area_name`),
  ADD KEY `idx_area_type` (`area_type`);

--
-- Indexes for table `trainer_specialties`
--
ALTER TABLE `trainer_specialties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_trainer_specialty` (`trainer_id`,`specialty`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_specialty` (`specialty`);

--
-- Indexes for table `trainer_working_hours`
--
ALTER TABLE `trainer_working_hours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_trainer_day` (`trainer_id`,`day_of_week`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_day_of_week` (`day_of_week`);

--
-- Indexes for table `trainer_work_history`
--
ALTER TABLE `trainer_work_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_company_name` (`company_name`),
  ADD KEY `idx_start_date` (`start_date`),
  ADD KEY `idx_is_current` (`is_current`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_verification_token` (`verification_token`),
  ADD KEY `idx_reset_token` (`reset_token`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_city` (`city`),
  ADD KEY `idx_province` (`province`);

--
-- Indexes for table `workout_logs`
--
ALTER TABLE `workout_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_workout_plan_id` (`workout_plan_id`),
  ADD KEY `idx_exercise_id` (`exercise_id`),
  ADD KEY `idx_session_date` (`session_date`);

--
-- Indexes for table `workout_plans`
--
ALTER TABLE `workout_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_trainer_id` (`trainer_id`),
  ADD KEY `idx_difficulty_level` (`difficulty_level`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `articles`
--
ALTER TABLE `articles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_health_data`
--
ALTER TABLE `customer_health_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_registrations`
--
ALTER TABLE `event_registrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `exercise_database`
--
ALTER TABLE `exercise_database`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `food_database`
--
ALTER TABLE `food_database`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nutrition_logs`
--
ALTER TABLE `nutrition_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nutrition_plans`
--
ALTER TABLE `nutrition_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `packages`
--
ALTER TABLE `packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `partners`
--
ALTER TABLE `partners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `promotion_usage`
--
ALTER TABLE `promotion_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `session_reports`
--
ALTER TABLE `session_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `trainers`
--
ALTER TABLE `trainers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainer_certifications`
--
ALTER TABLE `trainer_certifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainer_education`
--
ALTER TABLE `trainer_education`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainer_photos`
--
ALTER TABLE `trainer_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainer_service_areas`
--
ALTER TABLE `trainer_service_areas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainer_specialties`
--
ALTER TABLE `trainer_specialties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainer_working_hours`
--
ALTER TABLE `trainer_working_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trainer_work_history`
--
ALTER TABLE `trainer_work_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `workout_logs`
--
ALTER TABLE `workout_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `workout_plans`
--
ALTER TABLE `workout_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `articles`
--
ALTER TABLE `articles`
  ADD CONSTRAINT `articles_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `bookings_ibfk_4` FOREIGN KEY (`rescheduled_from`) REFERENCES `bookings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD CONSTRAINT `chat_rooms_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_rooms_ibfk_2` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_health_data`
--
ALTER TABLE `customer_health_data`
  ADD CONSTRAINT `customer_health_data_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_ibfk_1` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `event_registrations`
--
ALTER TABLE `event_registrations`
  ADD CONSTRAINT `event_registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_registrations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exercise_database`
--
ALTER TABLE `exercise_database`
  ADD CONSTRAINT `exercise_database_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `food_database`
--
ALTER TABLE `food_database`
  ADD CONSTRAINT `food_database_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`reply_to_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nutrition_logs`
--
ALTER TABLE `nutrition_logs`
  ADD CONSTRAINT `nutrition_logs_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nutrition_logs_ibfk_2` FOREIGN KEY (`nutrition_plan_id`) REFERENCES `nutrition_plans` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `nutrition_logs_ibfk_3` FOREIGN KEY (`food_id`) REFERENCES `food_database` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nutrition_plans`
--
ALTER TABLE `nutrition_plans`
  ADD CONSTRAINT `nutrition_plans_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nutrition_plans_ibfk_2` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `packages`
--
ALTER TABLE `packages`
  ADD CONSTRAINT `packages_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `promotions`
--
ALTER TABLE `promotions`
  ADD CONSTRAINT `promotions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `promotion_usage`
--
ALTER TABLE `promotion_usage`
  ADD CONSTRAINT `promotion_usage_ibfk_1` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `promotion_usage_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `promotion_usage_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `session_reports`
--
ALTER TABLE `session_reports`
  ADD CONSTRAINT `session_reports_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `session_reports_ibfk_2` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `session_reports_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `trainers`
--
ALTER TABLE `trainers`
  ADD CONSTRAINT `trainers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trainer_certifications`
--
ALTER TABLE `trainer_certifications`
  ADD CONSTRAINT `trainer_certifications_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trainer_education`
--
ALTER TABLE `trainer_education`
  ADD CONSTRAINT `trainer_education_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trainer_photos`
--
ALTER TABLE `trainer_photos`
  ADD CONSTRAINT `trainer_photos_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trainer_service_areas`
--
ALTER TABLE `trainer_service_areas`
  ADD CONSTRAINT `trainer_service_areas_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trainer_specialties`
--
ALTER TABLE `trainer_specialties`
  ADD CONSTRAINT `trainer_specialties_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trainer_working_hours`
--
ALTER TABLE `trainer_working_hours`
  ADD CONSTRAINT `trainer_working_hours_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `trainer_work_history`
--
ALTER TABLE `trainer_work_history`
  ADD CONSTRAINT `trainer_work_history_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workout_logs`
--
ALTER TABLE `workout_logs`
  ADD CONSTRAINT `workout_logs_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `workout_logs_ibfk_2` FOREIGN KEY (`workout_plan_id`) REFERENCES `workout_plans` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `workout_logs_ibfk_3` FOREIGN KEY (`exercise_id`) REFERENCES `exercise_database` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workout_plans`
--
ALTER TABLE `workout_plans`
  ADD CONSTRAINT `workout_plans_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `workout_plans_ibfk_2` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
