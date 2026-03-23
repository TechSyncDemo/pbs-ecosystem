ALTER TABLE authorizations ADD COLUMN validity_days integer NOT NULL DEFAULT 365;
ALTER TABLE authorizations ADD COLUMN fees numeric NOT NULL DEFAULT 0;
ALTER TABLE authorizations ADD COLUMN commission_rate numeric NOT NULL DEFAULT 0;