-- Powers accent-insensitive search (see accentInsensitiveSearch.ts): unaccent(text) strips
-- diacritics so "gomez" matches "Gómez".
CREATE EXTENSION IF NOT EXISTS unaccent;
