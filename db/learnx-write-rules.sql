-- Write rules for course data uploaded by learnX, enforced in the database so they
-- hold for every learnX version: old ones that write straight to Hasura with the
-- token they ship, and new ones that go through /api/learnx/courses (which writes
-- as the same role). They apply only to the `learnx` Hasura role; the admin role
-- (console, scripts) is not affected.
--
-- - A new course is inserted only when it passes the same checks as
--   lib/learnxCourses.ts; any other row is skipped and the rest of the upload goes
--   ahead. A schedule that isn't a bounded JSON array of strings (or is missing) is
--   stored as '[]', so a course page can't fail to parse it.
-- - An existing course keeps its names, teacher, semester, number and section; only
--   its schedule changes, and only to a valid, non-empty one. A name that is still
--   empty may be filled in with a valid one.
-- - A teacher's name changes only from empty, or from one without Chinese
--   characters to one with them: learn.tsinghua gives teacher names in the user's
--   language, so uploads alternate between Chinese and English otherwise. A new
--   teacher whose name doesn't look right is stored with an empty name.
-- - Every change a learnX upload makes is recorded in learnx_audit, so bad data can
--   be found and undone. Nothing in it identifies the uploader.
--
-- Apply in the Hasura console (Data > SQL), or with psql. Safe to run again.

CREATE OR REPLACE FUNCTION learnx_writing() RETURNS boolean
LANGUAGE sql STABLE AS $$
  -- Unset, or '' once a pooled connection has had it set, outside Hasura.
  SELECT coalesce(
    nullif(current_setting('hasura.user', true), '')::json ->> 'x-hasura-role'
      = 'learnx',
    false
  )
$$;

CREATE OR REPLACE FUNCTION learnx_has_chinese(s text) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(s ~ '[㐀-鿿]', false)
$$;

-- Course, teacher and course number ids, as learn.tsinghua uses them.
CREATE OR REPLACE FUNCTION learnx_valid_id(s text) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(s ~ '^[A-Za-z0-9_-]{1,64}$', false)
$$;

-- Text of at most max characters, without control or invisible formatting
-- characters (zero-width spaces, bidi overrides).
CREATE OR REPLACE FUNCTION learnx_valid_text(s text, max integer) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(
    char_length(s) <= max
      AND s !~ '[\u0001-\u001f\u007f-\u009f\u00ad\u0600-\u0605\u061c\u06dd\u070f\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u206f\ufeff\ufff9-\ufffb]',
    false
  )
$$;

-- Semesters from two school years back to the next one, as in lib/learnxCourses.ts.
CREATE OR REPLACE FUNCTION learnx_plausible_semester(s text) RETURNS boolean
LANGUAGE plpgsql STABLE AS $$
DECLARE
  m text[];
  year integer := extract(year FROM now())::integer;
BEGIN
  m := regexp_match(s, '^(\d{4})-(\d{4})-([123])$');
  IF m IS NULL THEN
    RETURN false;
  END IF;
  RETURN m[2]::integer = m[1]::integer + 1
    AND m[1]::integer BETWEEN year - 2 AND year;
END
$$;

-- A JSON array of at most 50 strings of at most 500 characters each, as course
-- pages expect in time_location.
CREATE OR REPLACE FUNCTION learnx_valid_schedule(s text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  j jsonb;
BEGIN
  IF s IS NULL THEN
    RETURN false;
  END IF;
  j := s::jsonb;
  RETURN jsonb_typeof(j) = 'array'
    AND jsonb_array_length(j) <= 50
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(j) e
      WHERE jsonb_typeof(e) <> 'string'
        OR NOT learnx_valid_text(e #>> '{}', 500)
    );
EXCEPTION WHEN others THEN
  RETURN false;
END
$$;

CREATE OR REPLACE FUNCTION learnx_course_rules() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT learnx_writing() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Returning NULL skips this row only. For an existing course (INSERT ... ON
    -- CONFLICT DO UPDATE) that skips its update too.
    IF NOT (
      learnx_valid_id(NEW.id)
      AND learnx_valid_id(NEW.teacher_id)
      AND learnx_valid_id(NEW.number)
      AND learnx_plausible_semester(NEW.semester_id)
      AND NEW."index" >= 0
      AND learnx_valid_text(NEW.name, 100) AND btrim(NEW.name) <> ''
      AND learnx_valid_text(NEW."englishName", 200)
    ) THEN
      RETURN NULL;
    END IF;
    IF NOT learnx_valid_schedule(NEW.time_location) THEN
      NEW.time_location := '[]';
    END IF;
    RETURN NEW;
  END IF;

  IF coalesce(OLD.name, '') <> ''
    OR NOT learnx_valid_text(NEW.name, 100) THEN
    NEW.name := OLD.name;
  END IF;
  IF coalesce(OLD."englishName", '') <> ''
    OR NOT learnx_valid_text(NEW."englishName", 200) THEN
    NEW."englishName" := OLD."englishName";
  END IF;
  NEW.teacher_id := OLD.teacher_id;
  NEW.semester_id := OLD.semester_id;
  NEW.number := OLD.number;
  NEW."index" := OLD."index";
  -- Uploads are INSERT ... ON CONFLICT DO UPDATE, so a missing schedule arrives
  -- here as the '[]' the insert step put in; it never replaces a stored one.
  IF NOT learnx_valid_schedule(NEW.time_location) THEN
    NEW.time_location := OLD.time_location;
  ELSIF NEW.time_location::jsonb = '[]'::jsonb THEN
    NEW.time_location := OLD.time_location;
  END IF;
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION learnx_teacher_rules() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT learnx_writing() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Courses reference the teacher, so a bad id fails the upload rather than
    -- leaving a course without its teacher.
    IF NOT learnx_valid_id(NEW.id) THEN
      RAISE EXCEPTION 'learnX: invalid teacher id';
    END IF;
    IF NOT learnx_valid_text(NEW.name, 50) THEN
      NEW.name := '';
    END IF;
    RETURN NEW;
  END IF;

  IF NOT learnx_valid_text(NEW.name, 50) OR NOT (
    (coalesce(OLD.name, '') = '' AND coalesce(NEW.name, '') <> '')
    OR (NOT learnx_has_chinese(OLD.name) AND learnx_has_chinese(NEW.name))
  ) THEN
    NEW.name := OLD.name;
  END IF;
  RETURN NEW;
END
$$;

-- Changes made by learnX uploads. To undo one, write `old` back as the admin role.
-- To trim it: DELETE FROM learnx_audit WHERE at < now() - interval '1 year';
CREATE TABLE IF NOT EXISTS learnx_audit (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  table_name text NOT NULL,
  row_id text NOT NULL,
  old jsonb,
  new jsonb NOT NULL
);

CREATE OR REPLACE FUNCTION learnx_audit_change() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  old_row jsonb;
  new_row jsonb := to_jsonb(NEW) - 'created_at' - 'updated_at';
BEGIN
  IF NOT learnx_writing() THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    old_row := to_jsonb(OLD) - 'created_at' - 'updated_at';
    IF old_row = new_row THEN
      RETURN NULL;
    END IF;
  END IF;
  INSERT INTO learnx_audit (table_name, row_id, old, new)
  VALUES (TG_TABLE_NAME, NEW.id, old_row, new_row);
  RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS learnx_course_rules ON course;
CREATE TRIGGER learnx_course_rules
  BEFORE INSERT OR UPDATE ON course
  FOR EACH ROW EXECUTE FUNCTION learnx_course_rules();

DROP TRIGGER IF EXISTS learnx_teacher_rules ON teacher;
CREATE TRIGGER learnx_teacher_rules
  BEFORE INSERT OR UPDATE ON teacher
  FOR EACH ROW EXECUTE FUNCTION learnx_teacher_rules();

DROP TRIGGER IF EXISTS learnx_course_audit ON course;
CREATE TRIGGER learnx_course_audit
  AFTER INSERT OR UPDATE ON course
  FOR EACH ROW EXECUTE FUNCTION learnx_audit_change();

DROP TRIGGER IF EXISTS learnx_teacher_audit ON teacher;
CREATE TRIGGER learnx_teacher_audit
  AFTER INSERT OR UPDATE ON teacher
  FOR EACH ROW EXECUTE FUNCTION learnx_audit_change();
