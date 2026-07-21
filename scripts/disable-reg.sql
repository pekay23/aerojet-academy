INSERT INTO system_settings (id, key, value, type, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'registration_open', 'false', 'BOOLEAN', now(), now())
ON CONFLICT (key) DO UPDATE SET value = 'false', "updatedAt" = now();
