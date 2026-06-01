-- 023: Official firm account display names (fixes placeholder "User User")
-- Safe to re-run (idempotent updates by email).

UPDATE user_profiles p
SET
  first_name = 'Rosebelle',
  middle_name = 'L.',
  last_name = 'Sanson',
  updated_at = NOW()
FROM users u
WHERE p.user_id = u.id
  AND LOWER(u.email) = 'lawyer@sansonlaw.ph'
  AND (
    LOWER(TRIM(p.first_name)) = 'user'
    OR LOWER(TRIM(p.first_name)) = 'rosebelle'
  );

UPDATE user_profiles p
SET
  first_name = 'SANSON',
  last_name = 'Administrator',
  updated_at = NOW()
FROM users u
WHERE p.user_id = u.id
  AND LOWER(u.email) = 'admin@sansonlaw.ph'
  AND LOWER(TRIM(p.first_name)) = 'user';

UPDATE user_profiles p
SET
  first_name = 'SANSON',
  last_name = 'Paralegal',
  updated_at = NOW()
FROM users u
WHERE p.user_id = u.id
  AND LOWER(TRIM(u.email)) = 'paralegal@sansonlaw.ph'
  AND LOWER(TRIM(p.first_name)) = 'user';

UPDATE user_profiles p
SET
  first_name = 'Demo',
  last_name = 'Client',
  updated_at = NOW()
FROM users u
WHERE p.user_id = u.id
  AND LOWER(u.email) = 'client@sansonlaw.ph'
  AND LOWER(TRIM(p.first_name)) = 'user';
