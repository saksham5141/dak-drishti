-- ============================================================================
-- DakDrishti 4.0 (डाक सेवा दृष्टि) - Complete MySQL Database Schema
-- Department of Posts (DoP), Ministry of Communications, Govt. of India
-- ============================================================================

DROP DATABASE IF EXISTS `dak_drishti_db`;
CREATE DATABASE IF NOT EXISTS `dak_drishti_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `dak_drishti_db`;

-- ----------------------------------------------------------------------------
-- 1. Administrative Hierarchy Tables (Circle, Division, HPO, Sub-PO)
-- ----------------------------------------------------------------------------

CREATE TABLE `postal_circles` (
    `circle_id` VARCHAR(10) PRIMARY KEY,
    `circle_name` VARCHAR(100) NOT NULL,
    `cpmg_name` VARCHAR(150) NOT NULL,
    `headquarters` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `postal_divisions` (
    `division_id` VARCHAR(20) PRIMARY KEY,
    `circle_id` VARCHAR(10) NOT NULL,
    `division_name` VARCHAR(120) NOT NULL,
    `sspo_name` VARCHAR(150) NOT NULL,
    `headquarters` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`circle_id`) REFERENCES `postal_circles`(`circle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `post_offices` (
    `office_id` VARCHAR(20) PRIMARY KEY,
    `division_id` VARCHAR(20) NOT NULL,
    `office_name` VARCHAR(150) NOT NULL,
    `pincode` VARCHAR(6) NOT NULL,
    `office_type` ENUM('GPO', 'HPO', 'SPO', 'BO') NOT NULL DEFAULT 'SPO',
    `postmaster_name` VARCHAR(150) NOT NULL,
    `contact_phone` VARCHAR(20),
    `address` TEXT,
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`division_id`) REFERENCES `postal_divisions`(`division_id`) ON DELETE CASCADE,
    INDEX `idx_pincode` (`pincode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2. Staff, Service Catalog & Counter Infrastructure
-- ----------------------------------------------------------------------------

CREATE TABLE `staff_operators` (
    `operator_id` INT AUTO_INCREMENT PRIMARY KEY,
    `office_id` VARCHAR(20) NOT NULL,
    `employee_id` VARCHAR(30) UNIQUE NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `designation` VARCHAR(100) NOT NULL, -- e.g. Postal Assistant (PA), Senior PA, Sub-Postmaster
    `mobile_number` VARCHAR(15),
    `email` VARCHAR(100),
    `shift_start` TIME DEFAULT '09:00:00',
    `shift_end` TIME DEFAULT '17:00:00',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`office_id`) REFERENCES `post_offices`(`office_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `service_categories` (
    `category_code` VARCHAR(20) PRIMARY KEY, -- 'mail', 'parcel', 'banking', 'insurance', 'citizen'
    `category_name` VARCHAR(100) NOT NULL,
    `category_name_hi` VARCHAR(150) NOT NULL,
    `token_prefix` CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
    `target_sla_seconds` INT NOT NULL DEFAULT 420 -- 7.0 minutes default
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `services_catalog` (
    `service_id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_code` VARCHAR(20) NOT NULL,
    `service_code` VARCHAR(50) UNIQUE NOT NULL,
    `service_name` VARCHAR(150) NOT NULL,
    `service_name_hi` VARCHAR(200),
    `description` TEXT,
    `avg_service_time_seconds` INT NOT NULL DEFAULT 240, -- Estimated TAT
    `is_active` BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (`category_code`) REFERENCES `service_categories`(`category_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `counters` (
    `counter_id` INT AUTO_INCREMENT PRIMARY KEY,
    `office_id` VARCHAR(20) NOT NULL,
    `counter_code` VARCHAR(10) NOT NULL, -- e.g. 'C-01', 'C-02'
    `counter_name` VARCHAR(150) NOT NULL,
    `counter_name_hi` VARCHAR(200),
    `category_code` VARCHAR(20) NOT NULL,
    `assigned_operator_id` INT,
    `status` ENUM('serving', 'idle', 'congested', 'closed') NOT NULL DEFAULT 'idle',
    `current_token_id` VARCHAR(20) NULL,
    `operator_present` BOOLEAN DEFAULT TRUE,
    `unmanned_duration_sec` INT DEFAULT 0,
    `queue_count` INT DEFAULT 0,
    `today_served_count` INT DEFAULT 0,
    `sla_threshold_sec` INT DEFAULT 420,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`office_id`) REFERENCES `post_offices`(`office_id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_code`) REFERENCES `service_categories`(`category_code`),
    FOREIGN KEY (`assigned_operator_id`) REFERENCES `staff_operators`(`operator_id`) ON DELETE SET NULL,
    UNIQUE KEY `uk_office_counter` (`office_id`, `counter_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3. Queue Tokens & Service Transactions
-- ----------------------------------------------------------------------------

CREATE TABLE `tokens` (
    `token_id` VARCHAR(30) PRIMARY KEY, -- e.g. 'A-108', 'C-312'
    `office_id` VARCHAR(20) NOT NULL,
    `counter_id` INT NOT NULL,
    `category_code` VARCHAR(20) NOT NULL,
    `service_id` INT NULL,
    `citizen_name` VARCHAR(150) NOT NULL,
    `citizen_mobile` VARCHAR(15),
    `is_priority` BOOLEAN DEFAULT FALSE, -- Senior Citizen (60+ yrs), PwD, Expectant Mother
    `priority_type` VARCHAR(50) NULL,
    `status` ENUM('WAITING', 'SERVING', 'COMPLETED', 'NO_SHOW', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `service_start_at` TIMESTAMP NULL,
    `service_end_at` TIMESTAMP NULL,
    `wait_duration_sec` INT DEFAULT 0,
    `service_duration_sec` INT DEFAULT 0,
    `sla_breached` BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (`office_id`) REFERENCES `post_offices`(`office_id`) ON DELETE CASCADE,
    FOREIGN KEY (`counter_id`) REFERENCES `counters`(`counter_id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_code`) REFERENCES `service_categories`(`category_code`),
    FOREIGN KEY (`service_id`) REFERENCES `services_catalog`(`service_id`) ON DELETE SET NULL,
    INDEX `idx_token_status` (`status`),
    INDEX `idx_token_issued` (`issued_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 4. Industry 4.0 AI Computer Vision & IoT Telemetry
-- ----------------------------------------------------------------------------

CREATE TABLE `vision_cctv_nodes` (
    `node_id` VARCHAR(50) PRIMARY KEY,
    `office_id` VARCHAR(20) NOT NULL,
    `counter_id` INT NOT NULL,
    `camera_label` VARCHAR(100) NOT NULL, -- e.g. 'CAM 01 - SPEED POST DESK'
    `rtsp_stream_url` VARCHAR(255),
    `resolution` VARCHAR(20) DEFAULT '1920x1080',
    `fps` INT DEFAULT 30,
    `model_type` VARCHAR(50) DEFAULT 'YOLOv8-Edge / TF.js',
    `is_online` BOOLEAN DEFAULT TRUE,
    `last_ping` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`office_id`) REFERENCES `post_offices`(`office_id`) ON DELETE CASCADE,
    FOREIGN KEY (`counter_id`) REFERENCES `counters`(`counter_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ai_vision_telemetry` (
    `telemetry_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `node_id` VARCHAR(50) NOT NULL,
    `counter_id` INT NOT NULL,
    `detected_queue_length` INT NOT NULL,
    `detected_serving_dwell_sec` INT NOT NULL,
    `operator_detected` BOOLEAN NOT NULL,
    `crowd_density_score` DECIMAL(4, 2) NOT NULL, -- 0.00 to 10.00
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`node_id`) REFERENCES `vision_cctv_nodes`(`node_id`) ON DELETE CASCADE,
    FOREIGN KEY (`counter_id`) REFERENCES `counters`(`counter_id`) ON DELETE CASCADE,
    INDEX `idx_telemetry_time` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `ai_alerts` (
    `alert_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `office_id` VARCHAR(20) NOT NULL,
    `counter_id` INT NULL,
    `severity` ENUM('info', 'medium', 'high', 'critical') NOT NULL DEFAULT 'info',
    `alert_type` VARCHAR(80) NOT NULL, -- 'UNATTENDED_COUNTER', 'QUEUE_SURGE', 'SLA_BREACH_RISK', 'SENIOR_CITIZEN_WAIT'
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `suggested_action` TEXT,
    `is_resolved` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` TIMESTAMP NULL,
    FOREIGN KEY (`office_id`) REFERENCES `post_offices`(`office_id`) ON DELETE CASCADE,
    FOREIGN KEY (`counter_id`) REFERENCES `counters`(`counter_id`) ON DELETE SET NULL,
    INDEX `idx_alert_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 5. Citizen Grievance, Ratings & Feedback
-- ----------------------------------------------------------------------------

CREATE TABLE `citizen_feedback` (
    `feedback_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `token_id` VARCHAR(30) NULL,
    `office_id` VARCHAR(20) NOT NULL,
    `counter_id` INT NULL,
    `service_category` VARCHAR(50) NOT NULL,
    `rating_score` TINYINT NOT NULL CHECK (`rating_score` BETWEEN 1 AND 5),
    `comments` TEXT,
    `sentiment_class` ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE') NOT NULL,
    `sentiment_confidence` DECIMAL(5, 2) DEFAULT 95.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`office_id`) REFERENCES `post_offices`(`office_id`) ON DELETE CASCADE,
    FOREIGN KEY (`counter_id`) REFERENCES `counters`(`counter_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 6. Aggregated Daily Audit & Industry 4.0 Predictive Forecasting
-- ----------------------------------------------------------------------------

CREATE TABLE `daily_counter_audit` (
    `audit_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `audit_date` DATE NOT NULL,
    `office_id` VARCHAR(20) NOT NULL,
    `counter_id` INT NOT NULL,
    `operator_id` INT NULL,
    `tokens_served` INT NOT NULL DEFAULT 0,
    `avg_wait_time_sec` INT NOT NULL DEFAULT 0,
    `avg_service_time_sec` INT NOT NULL DEFAULT 0,
    `sla_breaches_count` INT NOT NULL DEFAULT 0,
    `compliance_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    `operator_efficiency_score` DECIMAL(5, 2) NOT NULL DEFAULT 95.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_audit_day_counter` (`audit_date`, `counter_id`),
    FOREIGN KEY (`office_id`) REFERENCES `post_offices`(`office_id`) ON DELETE CASCADE,
    FOREIGN KEY (`counter_id`) REFERENCES `counters`(`counter_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `predictive_rush_forecast` (
    `forecast_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `office_id` VARCHAR(20) NOT NULL,
    `day_of_week` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    `hour_slot` VARCHAR(10) NOT NULL, -- e.g. '11:00-12:00'
    `predicted_footfall` INT NOT NULL,
    `is_pension_disbursement_window` BOOLEAN DEFAULT FALSE,
    `is_festive_rush` BOOLEAN DEFAULT FALSE,
    `recommended_active_counters` INT NOT NULL DEFAULT 4,
    FOREIGN KEY (`office_id`) REFERENCES `post_offices`(`office_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
