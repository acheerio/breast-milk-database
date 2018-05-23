-- Breast Milk Buying and Selling Database
-- CS340 Spring 2018
-- Final Project Data Definition - Procedures
-- Alice O'Herin and John Howe

--
-- PROCEDURES
--

--
-- USER
--

DROP PROCEDURE IF EXISTS delete_user;

delimiter $$

CREATE PROCEDURE delete_user (IN uid_input INT)
BEGIN
-- part 1, user's merchant account record
-- user's merchant ID, -1 if none
SET @del_user_merchID = (SELECT IFNULL((SELECT merchFK FROM `user` WHERE uid = uid_input), -1));
-- list of users who reviewed listings by to-be-deleted user merchant account (update num_reviews)
CREATE TEMPORARY TABLE del_user_reviewsu
  SELECT DISTINCT userFK AS user_id FROM `review`
  INNER JOIN `listing` ON lid = listingFK
  WHERE merchFK = @del_user_merchID;
-- placeholder value so WHERE IN never gets an empty list
INSERT INTO del_user_reviewsu VALUES (-1);
-- list of reviews of listings by to-be-deleted user merchant account
CREATE TEMPORARY TABLE del_user_reviews
  SELECT DISTINCT userFK AS user_id, rid FROM `review`
  INNER JOIN `listing` ON lid = listingFK
  WHERE merchFK = @del_user_merchID;
-- update num_reviews for affected users
UPDATE `user` SET num_reviews = num_reviews -
  (SELECT COUNT(rid) FROM del_user_reviews
  WHERE uid = user_id)
WHERE uid IN
  (SELECT DISTINCT user_id FROM del_user_reviewsu);
-- remove merchant associated with user, if any
DELETE FROM `merchant` WHERE mid = @del_user_merchID;
-- cascades to delete listings, reviews of listings, 'helpful' reaction to reviews
-- updates user merchFK to NULL if not already
-- drop temporary tables
DROP TEMPORARY TABLE del_user_reviews;
DROP TEMPORARY TABLE del_user_reviewsu;
-- part 2, user record
-- list of merchants who received user's review(s) (update num_reviews_rcvd, ave_reviews_rcvd)
CREATE TEMPORARY TABLE del_user_reviewedm
  SELECT merchFK AS merchid FROM `review`
  INNER JOIN `listing` ON lid = listingFK
  WHERE userFK = uid_input;
-- placeholder value so WHERE IN never gets an empty list
INSERT INTO del_user_reviewedm VALUES (-1);
-- list of user's reviews
CREATE TEMPORARY TABLE del_user_reviewed
  SELECT merchFK AS merchid, rid FROM `review`
  INNER JOIN `listing` ON lid = listingFK
  WHERE userFK = uid_input;
-- update num_reviews_rcvd
UPDATE `merchant` SET num_reviews_rcvd = num_reviews_rcvd -
  (SELECT COUNT(rid) FROM del_user_reviewed
  WHERE mid = merchid)
WHERE mid IN
  (SELECT DISTINCT merchid FROM del_user_reviewedm);
-- remove user
DELETE FROM `user` WHERE uid = uid_input; 
-- cascades to delete 'helpful' reactions by user, reviews written by user, and 'helpful' reactions to those reviews
-- update ave_reviews_rcvd
UPDATE `merchant` SET ave_reviews_rcvd = 
  IF(num_reviews_rcvd > 0,
    (SELECT (1.0*SUM(rating)/num_reviews_rcvd) FROM 
      (SELECT rating, merchFK FROM review
      INNER JOIN listing ON lid = listingFK) as tbl
    WHERE merchFK = mid),
  0)
WHERE mid IN 
  (SELECT DISTINCT merchid FROM del_user_reviewed);
-- drop temporary tables
DROP TEMPORARY TABLE del_user_reviewed;
DROP TEMPORARY TABLE del_user_reviewedm;
END$$

delimiter ;

--
-- MERCHANT
--

DROP PROCEDURE IF EXISTS add_merchant;

delimiter $$

CREATE PROCEDURE add_merchant (IN shop_nameInput VARCHAR(255), IN uidInput INT)
BEGIN
-- add new merchant
INSERT INTO `merchant` (`shop_name`) VALUES (shop_nameInput);
-- map user record to new merchant record
UPDATE `user` SET merchFK = LAST_INSERT_ID() WHERE uid = uidInput;

END$$

delimiter ;

DROP PROCEDURE IF EXISTS delete_merchant;

delimiter $$

CREATE PROCEDURE delete_merchant (IN midInput INT)
BEGIN

-- REMOVE MERCHANT
-- list of users who have reviewed a listing by merchant
CREATE TEMPORARY TABLE del_merch_users
  SELECT DISTINCT userFK FROM listing
  INNER JOIN review ON lid = listingFK
  WHERE merchFK = midInput;
-- placeholder value so WHERE IN never gets an empty list
INSERT INTO del_merch_users VALUES (-1);
-- list of reviews of listings by merchant
CREATE TEMPORARY TABLE del_merch_reviews
  SELECT DISTINCT userFK as user_id, rid FROM listing
  INNER JOIN review ON lid = listingFK
  WHERE merchFK = midInput;
-- update users' num_reviews
UPDATE `user` SET num_reviews = num_reviews - (SELECT COUNT(rid) FROM del_merch_reviews WHERE uid = user_id)
  WHERE uid IN (SELECT * FROM del_merch_users);
-- remove merchant
DELETE FROM `merchant` WHERE mid = midInput;
-- cascades to delete listings, reviews of those listings, and 'helpful' reactions to those reviews
-- updates user merchFK to NULL
-- drop temporary tables
DROP TEMPORARY TABLE del_merch_users;
DROP TEMPORARY TABLE del_merch_reviews;

END$$

delimiter ;

--
-- REVIEW
--

-- ADD REVIEW

DROP PROCEDURE IF EXISTS add_review;

delimiter $$

CREATE PROCEDURE add_review (IN ratingInput INT, IN titleInput VARCHAR(255), IN bodyInput VARCHAR(255), IN listingFKInput INT, IN userFKInput INT)
BEGIN

INSERT INTO `review` (`rating`, `title`, `body`, `listingFK`, `userFK`) VALUES
(ratingInput, titleInput, bodyInput, listingFKInput, userFKInput);
-- update user entity num_reviews attribute
UPDATE `user` SET num_reviews = num_reviews + 1 WHERE uid = userFKInput;
-- get the merchant ID of merchant whose listing was reviewed
SET @last_rev_merchID = 
  (SELECT merchFK FROM `review`
  INNER JOIN `listing` ON lid = listingFK
  WHERE rid = LAST_INSERT_ID());
-- update merchant entity num_reviews_rcvd, ave_reviews_rcvd
-- num_reviews_rcvd must be updated first or ave_reviews_rcvd will not calculate correctly
UPDATE `merchant` SET num_reviews_rcvd = num_reviews_rcvd + 1,
  ave_reviews_rcvd = (SELECT (1.0*SUM(rating)/num_reviews_rcvd) FROM
    (SELECT rating FROM review
    INNER JOIN listing ON lid = listingFK
    WHERE merchFK = @last_rev_merchID) as tbl)
  WHERE mid = @last_rev_merchID;

END$$

delimiter ;

-- UPDATE REVIEW

DROP PROCEDURE IF EXISTS update_review;

delimiter $$

CREATE PROCEDURE update_review (IN ridInput INT, IN ratingInput INT, IN titleInput VARCHAR(255), IN bodyInput VARCHAR(255), IN userFKInput INT, IN listingFKInput INT)
BEGIN

-- save previous user who wrote review
SET @update_review_prevuser = 
(SELECT userFK FROM `review` WHERE rid = ridInput);
-- save previous merchant whose listing was reviewed
SET @update_review_merch =
  (SELECT merchFK FROM `review`
  INNER JOIN `listing` ON lid = listingFK
  WHERE rid = ridInput);
-- update with new inputs
UPDATE `review` SET
  rating = ratingInput,
  title = titleInput,
  body = bodyInput,
  userFK = userFKInput,
  listingFK = listingFKInput
WHERE rid = ridInput;
-- update old user's num_reviews
UPDATE `user` SET num_reviews = num_reviews - 1
WHERE uid = @update_review_prevuser;
-- update new user's num_reviews
UPDATE `user` SET num_reviews = num_reviews + 1
WHERE uid =
  (SELECT userFK FROM `review` WHERE rid = ridInput);
-- update old merchant num_reviews_rcvd
UPDATE `merchant` SET num_reviews_rcvd = num_reviews_rcvd - 1
WHERE mid = @update_review_merch;
-- update old merchant ave_reviews_rcvd
UPDATE `merchant` SET ave_reviews_rcvd = 
  IF(num_reviews_rcvd > 0, 
    (SELECT 1.0*SUM(rating)/num_reviews_rcvd FROM 
      (SELECT rating, merchFK FROM review
      INNER JOIN listing ON lid = listingFK) as tbl
    WHERE merchFK = @update_review_merch),
  0)
WHERE mid = @update_review_merch;
-- save new user who wrote review
SET @update_review_merch =
  (SELECT merchFK FROM `review`
  INNER JOIN `listing` ON lid = listingFK
  WHERE rid = ridInput);
-- update new merchant num_reviews_rcvd
UPDATE `merchant` SET num_reviews_rcvd = num_reviews_rcvd + 1
WHERE mid = @update_review_merch;
  -- update new merchant ave_reviews_rcvd
UPDATE `merchant` SET ave_reviews_rcvd = 
  IF(num_reviews_rcvd > 0, 
    (SELECT 1.0*SUM(rating)/num_reviews_rcvd FROM 
      (SELECT rating, merchFK FROM review
      INNER JOIN listing ON lid = listingFK) as tbl
    WHERE merchFK = @update_review_merch),
  0)
WHERE mid = @update_review_merch;

END$$

delimiter ;

-- REMOVE REVIEW

DROP PROCEDURE IF EXISTS delete_review;

delimiter $$

CREATE PROCEDURE delete_review (IN ridInput INT)
BEGIN

-- save user id
SET @del_rev_userID = (SELECT userFK FROM `review` WHERE rid = ridInput);
-- save merchant id
SET @del_rev_merchID = (SELECT merchFK FROM `review` 
INNER JOIN `listing` ON lid = listingFK
WHERE rid = ridInput);
-- remove review
DELETE FROM `review` WHERE rid = ridInput;
-- cascades to delete 'helpful' reactions to review
-- update user's num_reviews
UPDATE `user` SET num_reviews = num_reviews - 1 
WHERE uid = @del_rev_userID;
-- update merchant's num_reviews_rcvd
UPDATE `merchant` SET num_reviews_rcvd = num_reviews_rcvd - 1
WHERE mid = @del_rev_merchID;
-- update merchant's ave_reviews_rcvd
UPDATE `merchant` SET ave_reviews_rcvd = 
  IF(num_reviews_rcvd > 0, 
    (SELECT 1.0*SUM(rating)/num_reviews_rcvd FROM 
      (SELECT rating, merchFK FROM review
      INNER JOIN listing ON lid = listingFK) as tbl
    WHERE merchFK = @del_rev_merchID),
  0)
WHERE mid = @del_rev_merchID;

END$$

delimiter ;

--
-- LISTING
--

-- ADD LISTING
DROP PROCEDURE IF EXISTS add_listing;

delimiter $$

CREATE PROCEDURE add_listing (IN listing_titleInput VARCHAR(255), IN amountInput DOUBLE(6,1), IN priceInput DOUBLE(7,2), 
IN dairy_freeInput BOOLEAN, IN frozenInput BOOLEAN, IN date_startInput DATE, IN date_endInput DATE, IN merchFKInput INT)

BEGIN

INSERT INTO `listing` (`listing_title`, `amount`, `price`, `dairy_free`, `frozen`, `date_start`, `date_end`, `active`, `merchFK`) VALUES
(listing_titleInput, amountInput, priceInput, dairy_freeInput, frozenInput, date_startInput, date_endInput, TRUE, merchFKInput);
-- price per
UPDATE `listing` SET price_per = (SELECT 1.0*price/amount) WHERE lid = LAST_INSERT_ID();
-- update total_listings on merchant entity
UPDATE `merchant` SET total_listings = total_listings + 1
WHERE mid = merchFKInput;
-- update active_listings on merchant entity
UPDATE `merchant` SET active_listings = active_listings + 1
WHERE mid = merchFKInput;

END$$

delimiter ;

-- UPDATE LISTING

DROP PROCEDURE IF EXISTS update_listing;

delimiter $$

CREATE PROCEDURE update_listing (IN lidInput INT, IN listing_titleInput VARCHAR(255), IN amountInput DOUBLE(6,1), IN priceInput DOUBLE(7,2), IN dairy_freeInput BOOLEAN,
IN frozenInput BOOLEAN, IN date_startInput DATE, IN date_endInput DATE, IN activeInput BOOLEAN)

BEGIN

-- save old active boolean as integer
SET @changeactive = IF((SELECT active FROM `listing` WHERE lid = lidInput), -1, 0);
-- update with new inputs
UPDATE `listing` SET
  listing_title = listing_titleInput,
  amount = amountInput,
  price = priceInput,
  dairy_free = dairy_freeInput,
  frozen = frozenInput,
  date_start = date_startInput,
  date_end = date_endInput,
  active = activeInput
WHERE lid = lidInput;
-- update price_per
UPDATE `listing` SET price_per = (SELECT 1.0*price/amount) WHERE lid = lidInput;
-- if active/non-active is changed then update merchant active_listings
-- if T->T = 0 change in active_listings, T->F = -1, F->T = +1, F->F = 0
SET @changeactive = @changeactive + IF((SELECT active FROM `listing` WHERE lid = lidInput), 1, 0);
UPDATE `merchant` SET active_listings = active_listings + @changeactive 
WHERE mid = (SELECT merchFK FROM `listing` WHERE lid = lidInput);

END$$

delimiter ;

-- DELETE LISTING

DROP PROCEDURE IF EXISTS delete_listing;

delimiter $$

CREATE PROCEDURE delete_listing (IN lidInput INT)
BEGIN
-- save the merchant ID that owns the listing
SET @del_list_merchID = (SELECT merchFK FROM `listing` WHERE lid = lidInput);
-- save list of reviews of the listing
CREATE TEMPORARY TABLE del_list_reviews SELECT userFK AS user_id, rid FROM `review`
  INNER JOIN `listing` ON lid = listingFK
  WHERE lid = lidInput;
-- save list of users who wrote reviews of the listing
CREATE TEMPORARY TABLE del_list_users SELECT userFK AS user_id FROM `review`
  INNER JOIN `listing` ON lid = listingFK
  WHERE lid = lidInput;
-- placeholder value so WHERE IN never gets an empty list
INSERT INTO del_list_users VALUES (-1);
-- save active boolean
SET @del_list_active = (SELECT active FROM `listing` WHERE lid = lidInput);
-- update to merchant's total_listings
UPDATE `merchant` SET total_listings = total_listings - 1 WHERE mid = @del_list_merchID;
-- update merchant active_listings
UPDATE `merchant` SET active_listings = IF(@del_list_active, active_listings - 1, active_listings)
WHERE mid = @del_list_merchID;
-- update to merchant's num_reviews_rcvd, if the deleted listing had reviews
UPDATE `merchant` SET num_reviews_rcvd = num_reviews_rcvd - 
  (SELECT COUNT(rid) FROM del_list_reviews)
WHERE mid = @del_list_merchID;
-- update to reviewers/users' num_reviews
UPDATE `user` SET num_reviews = num_reviews - 
  (SELECT COUNT(rid) FROM del_list_reviews
  WHERE uid = user_id)
WHERE uid IN (SELECT DISTINCT * FROM del_list_users);
-- remove listing
DELETE FROM `listing` WHERE lid = lidInput;
-- cascades to delete reviews of the listing, and 'helpful' reactions to those reviews
-- update to specific merchant's ave_reviews_rcvd, if the deleted listing had reviews
UPDATE `merchant` SET ave_reviews_rcvd = 
  IF(num_reviews_rcvd > 0, 
    (SELECT 1.0*SUM(rating)/num_reviews_rcvd FROM 
      (SELECT rating, merchFK FROM review
      INNER JOIN listing ON lid = listingFK) as tbl
    WHERE merchFK = @del_list_merchID),
  0)
WHERE mid = @del_list_merchID;
-- drop temporary tables
DROP TEMPORARY TABLE del_list_reviews;
DROP TEMPORARY TABLE del_list_users;

END$$

delimiter ;

--
-- TEMPLATE
--
DROP PROCEDURE IF EXISTS sampleprocedure;

delimiter $$

CREATE PROCEDURE sampleprocedure (IN idInput INT)
BEGIN

END$$

delimiter ;