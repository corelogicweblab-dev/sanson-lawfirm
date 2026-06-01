-- 024: Extended user profile (nickname, birthday, richer account fields)

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(80),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN user_profiles.nickname IS 'Preferred display nickname';
COMMENT ON COLUMN user_profiles.date_of_birth IS 'Birth date for age display';
