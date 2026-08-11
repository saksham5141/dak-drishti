-- ============================================================================
-- DakDrishti 4.0 - Comprehensive MySQL Seed Data
-- Department of Posts (DoP), Ministry of Communications, Govt. of India
-- ============================================================================

USE `dak_drishti_db`;

-- 1. Postal Circles
INSERT INTO `postal_circles` (`circle_id`, `circle_name`, `cpmg_name`, `headquarters`) VALUES
('DL', 'Delhi Postal Circle', 'Smt. Vandana Sharma, CPMG', 'Meghdoot Bhawan, New Delhi'),
('MH', 'Maharashtra Postal Circle', 'Shri K. K. Sharma, CPMG', 'GPO Complex, Mumbai'),
('KA', 'Karnataka Postal Circle', 'Dr. S. Rajagopalan, CPMG', 'Bengaluru GPO');

-- 2. Postal Divisions
INSERT INTO `postal_divisions` (`division_id`, `circle_id`, `division_name`, `sspo_name`, `headquarters`) VALUES
('ND-01', 'DL', 'New Delhi Central Division', 'Shri Rajesh Kumar, SSPO', 'Connaught Place HPO Building, New Delhi'),
('SD-02', 'DL', 'South Delhi Division', 'Dr. Meenakshi Rao, SSPO', 'Kalkaji HPO, New Delhi'),
('ED-03', 'DL', 'East Delhi Division', 'Shri A. K. Verma, SPO', 'Krishna Nagar, Delhi');

-- 3. Post Offices
INSERT INTO `post_offices` (`office_id`, `division_id`, `office_name`, `pincode`, `office_type`, `postmaster_name`, `contact_phone`, `latitude`, `longitude`) VALUES
('HPO-110002', 'ND-01', 'Connaught Place HPO', '110002', 'HPO', 'Smt. Sunita Goyal (SPM)', '011-23345678', 28.631500, 77.216700),
('GPO-110001', 'ND-01', 'New Delhi GPO', '110001', 'GPO', 'Shri B. S. Rawat (Chief Postmaster)', '011-23364500', 28.628900, 77.206500),
('SPO-110001', 'ND-01', 'Parliament Street Post Office', '110001', 'SPO', 'Shri Manoj Joshi', '011-23714422', 28.625000, 77.212000),
('SPO-110001-B', 'ND-01', 'Barakhamba Road Post Office', '110001', 'SPO', 'Shri P. C. Joshi', '011-23311234', 28.631000, 77.224000),
('SPO-110001-J', 'ND-01', 'Janpath Post Office', '110001', 'SPO', 'Shri Anil Sharma', '011-23329876', 28.621000, 77.218000),
('SPO-110002-P', 'ND-01', 'Pragati Maidan Post Office', '110002', 'SPO', 'Smt. Rekha Rani', '011-23371190', 28.618000, 77.241000);

-- 4. Staff Operators
INSERT INTO `staff_operators` (`operator_id`, `office_id`, `employee_id`, `full_name`, `designation`, `mobile_number`, `email`) VALUES
(1, 'HPO-110002', 'EMP-DOP-4891', 'Rameshwar Dayal', 'Postal Assistant (PA)', '9871100201', 'rameshwar.d@indiapost.gov.in'),
(2, 'HPO-110002', 'EMP-DOP-5102', 'Priyanka Sharma', 'Postal Assistant (PA)', '9871100202', 'priyanka.s@indiapost.gov.in'),
(3, 'HPO-110002', 'EMP-DOP-3890', 'Virender Nath', 'Senior Postal Assistant', '9871100203', 'virender.n@indiapost.gov.in'),
(4, 'HPO-110002', 'EMP-DOP-6214', 'Anita Kumari', 'Postal Assistant (PA)', '9871100204', 'anita.k@indiapost.gov.in'),
(5, 'HPO-110002', 'EMP-DOP-2901', 'Smt. Sunita Goyal', 'Sub-Postmaster (SPM)', '9871100200', 'spm.cp@indiapost.gov.in');

-- 5. Service Categories
INSERT INTO `service_categories` (`category_code`, `category_name`, `category_name_hi`, `token_prefix`, `target_sla_seconds`) VALUES
('mail', 'Speed Post & Domestic Mail', 'स्पीड पोस्ट एवं डाक सेवा', 'A', 420),
('parcel', 'Express Parcel & E-Commerce COD', 'पार्सल एवं ई-कॉमर्स बुकिंग', 'B', 480),
('banking', 'POSB Banking & IPPB Financials', 'डाकघर बचत बैंक एवं IPPB', 'C', 600),
('citizen', 'Aadhaar, PLI & Citizen Services', 'आधार, बीमा एवं नागरिक सेवाएं', 'D', 600);

-- 6. Services Catalog
INSERT INTO `services_catalog` (`category_code`, `service_code`, `service_name`, `service_name_hi`, `avg_service_time_seconds`) VALUES
('mail', 'SP_DOM', 'Domestic Speed Post Booking', 'घरेलू स्पीड पोस्ट बुकिंग', 180),
('mail', 'REG_POST', 'Registered Letter Booking', 'पंजीकृत पत्र बुकिंग', 150),
('parcel', 'EXP_PARCEL', 'Express Parcel / COD Booking', 'एक्सप्रेस पार्सल बुकिंग', 240),
('parcel', 'BUS_PARCEL', 'Business Bulk Parcel Booking', 'व्यावसायिक पार्सल बुकिंग', 300),
('banking', 'POSB_DEP', 'Savings Bank Cash Deposit / Withdrawal', 'बचत खाता जमा / निकासी', 320),
('banking', 'POSB_SCSS', 'Senior Citizen Savings Scheme (SCSS)', 'वरिष्ठ नागरिक बचत योजना', 480),
('banking', 'POSB_SSA', 'Sukanya Samriddhi Yojana (SSA)', 'सुकन्या समृद्धि योजना', 420),
('banking', 'IPPB_AEPS', 'IPPB Aadhaar ATM (AePS Cash Transfer)', 'IPPB आधार आधारित भुगतान', 240),
('citizen', 'UIDAI_BIO', 'Aadhaar Biometric & Mobile Update', 'आधार बायोमेट्रिक व मोबाइल अपडेट', 360),
('citizen', 'DLC_JEEVAN', 'Digital Life Certificate (Jeevan Pramaan)', 'डिजिटल जीवन प्रमाण पत्र', 240),
('citizen', 'PLI_PREM', 'Postal Life Insurance Premium Deposit', 'डाक जीवन बीमा प्रीमियम जमा', 300);

-- 7. Counters (Connaught Place HPO)
INSERT INTO `counters` (`counter_id`, `office_id`, `counter_code`, `counter_name`, `counter_name_hi`, `category_code`, `assigned_operator_id`, `status`, `current_token_id`, `operator_present`, `queue_count`, `today_served_count`, `sla_threshold_sec`) VALUES
(1, 'HPO-110002', 'C-01', 'Counter 1 - Speed Post & Domestic Mail', 'काउंटर 1 - स्पीड पोस्ट एवं डाक सेवा', 'mail', 1, 'serving', 'A-108', TRUE, 6, 54, 420),
(2, 'HPO-110002', 'C-02', 'Counter 2 - Express Parcel & COD', 'काउंटर 2 - पार्सल एवं ई-कॉमर्स बुकिंग', 'parcel', 2, 'serving', 'B-204', TRUE, 4, 38, 480),
(3, 'HPO-110002', 'C-03', 'Counter 3 - POSB Banking & IPPB Financials', 'काउंटर 3 - डाकघर बचत बैंक एवं IPPB', 'banking', 3, 'congested', 'C-312', TRUE, 9, 62, 600),
(4, 'HPO-110002', 'C-04', 'Counter 4 - Aadhaar, PLI & Citizen Services', 'काउंटर 4 - आधार, बीमा एवं नागरिक सेवाएं', 'citizen', 4, 'serving', 'D-407', TRUE, 5, 41, 600);

-- 8. Live Sample Queue Tokens
INSERT INTO `tokens` (`token_id`, `office_id`, `counter_id`, `category_code`, `service_id`, `citizen_name`, `citizen_mobile`, `is_priority`, `priority_type`, `status`, `wait_duration_sec`, `service_duration_sec`) VALUES
('A-108', 'HPO-110002', 1, 'mail', 1, 'Vikram Malhotra', '9871101204', FALSE, NULL, 'SERVING', 240, 145),
('A-109', 'HPO-110002', 1, 'mail', 1, 'Suresh Chandra (Sr. Citizen)', '9411008831', TRUE, 'SENIOR_CITIZEN', 'WAITING', 180, 0),
('A-110', 'HPO-110002', 1, 'mail', 1, 'Megha Singhal', '9911003341', FALSE, NULL, 'WAITING', 120, 0),
('A-111', 'HPO-110002', 1, 'mail', 2, 'Deepak Verma', '8811009921', FALSE, NULL, 'WAITING', 60, 0),

('B-204', 'HPO-110002', 2, 'parcel', 3, 'Rahul Enterprises', '9871104455', FALSE, NULL, 'SERVING', 300, 210),
('B-205', 'HPO-110002', 2, 'parcel', 3, 'Amit Bansal', '9711001122', FALSE, NULL, 'WAITING', 150, 0),

('C-312', 'HPO-110002', 3, 'banking', 5, 'Kailash Pati (Pensioner)', '9211007788', TRUE, 'SENIOR_CITIZEN', 'SERVING', 420, 390),
('C-313', 'HPO-110002', 3, 'banking', 5, 'Shanti Devi', '9311005566', FALSE, NULL, 'WAITING', 360, 0),
('C-314', 'HPO-110002', 3, 'banking', 6, 'Alok Gupta', '9811006677', FALSE, NULL, 'WAITING', 240, 0),
('C-315', 'HPO-110002', 3, 'banking', 7, 'Pooja Agarwal', '9911002211', FALSE, NULL, 'WAITING', 180, 0),

('D-407', 'HPO-110002', 4, 'citizen', 9, 'Mohd. Imran', '9611008899', FALSE, NULL, 'SERVING', 310, 280),
('D-408', 'HPO-110002', 4, 'citizen', 9, 'Geeta Sharma', '9511004433', FALSE, NULL, 'WAITING', 210, 0),
('D-409', 'HPO-110002', 4, 'citizen', 11, 'Harpreet Singh', '9811001144', FALSE, NULL, 'WAITING', 90, 0);

-- 9. CCTV Nodes & Real-time AI Vision
INSERT INTO `vision_cctv_nodes` (`node_id`, `office_id`, `counter_id`, `camera_label`, `resolution`, `fps`, `is_online`) VALUES
('CAM-NODE-01', 'HPO-110002', 1, 'CAM 01 - SPEED POST & MAIL BAY', '1920x1080', 30, TRUE),
('CAM-NODE-02', 'HPO-110002', 2, 'CAM 02 - PARCEL & COD DESK', '1920x1080', 30, TRUE),
('CAM-NODE-03', 'HPO-110002', 3, 'CAM 03 - POSB BANKING COUNTER', '1920x1080', 30, TRUE),
('CAM-NODE-04', 'HPO-110002', 4, 'CAM 04 - AADHAAR & CITIZEN DESK', '1920x1080', 30, TRUE);

-- 10. AI Alerts
INSERT INTO `ai_alerts` (`office_id`, `counter_id`, `severity`, `alert_type`, `title`, `description`, `suggested_action`) VALUES
('HPO-110002', 3, 'high', 'QUEUE_SURGE', 'High Queue Density on Banking Counter (C-03)', 'Vision detected 9 persons waiting in C-03 queue. Average wait time trending above 8.5 minutes.', 'Activate Load Rebalancer: Assign Counter 2 or auxiliary operator to POSB queue.'),
('HPO-110002', 1, 'medium', 'SENIOR_CITIZEN_WAIT', 'Senior Citizen Priority Queue Notice', 'Vision AI flagged Senior Citizen waiting at Counter 1 for > 3 minutes. Priority routing recommended.', 'Fast-track Token A-109 on next call cycle.'),
('HPO-110002', NULL, 'info', 'SLA_BREACH_RISK', 'SLA Milestone: 94.2% Optimal Service', 'Overall post office average turnaround time is currently 5.2 mins (Within target SLA of 7 mins).', 'Standard monitoring active.');

-- 11. Citizen Feedback Entries
INSERT INTO `citizen_feedback` (`office_id`, `counter_id`, `service_category`, `rating_score`, `comments`, `sentiment_class`, `sentiment_confidence`) VALUES
('HPO-110002', 1, 'Speed Post / Parcel Booking', 5, 'Speed Post booking was exceptionally fast. Barely waited 3 minutes.', 'POSITIVE', 98.40),
('HPO-110002', 3, 'POSB Banking / Pension Withdrawal', 4, 'Pension disbursement was smooth, though banking line was somewhat long.', 'POSITIVE', 88.20),
('HPO-110002', 4, 'Aadhaar Enrolment & Update', 5, 'Biometric update completed seamlessly by the operator.', 'POSITIVE', 96.10);

-- 12. Predictive Rush Forecast
INSERT INTO `predictive_rush_forecast` (`office_id`, `day_of_week`, `hour_slot`, `predicted_footfall`, `is_pension_disbursement_window`, `recommended_active_counters`) VALUES
('HPO-110002', 'Monday', '09:00-10:00', 24, FALSE, 2),
('HPO-110002', 'Monday', '10:00-11:00', 52, FALSE, 3),
('HPO-110002', 'Monday', '11:00-12:00', 88, TRUE, 4),
('HPO-110002', 'Monday', '12:00-13:00', 94, TRUE, 4),
('HPO-110002', 'Monday', '13:00-14:00', 68, FALSE, 3),
('HPO-110002', 'Monday', '14:00-15:00', 78, FALSE, 4),
('HPO-110002', 'Monday', '15:00-16:00', 64, FALSE, 3),
('HPO-110002', 'Monday', '16:00-17:00', 42, FALSE, 2);
