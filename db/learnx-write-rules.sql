-- Write rules for course data uploaded by learnX, enforced in the database so they
-- hold for every learnX version: old ones that write straight to Hasura with the
-- token they ship, and new ones that go through /api/learnx/courses (which writes
-- as the same role). They apply only to the `learnx` Hasura role; the admin role
-- (console, scripts) is not affected.
--
-- - New courses and teachers are inserted. A schedule that isn't a JSON array of
--   strings (or is missing) is stored as '[]', so a course page can't fail to parse it.
-- - An existing course keeps its names, teacher, semester, number and section; only
--   its schedule changes, and only to a valid, non-empty one. A name that is still
--   empty may be filled in.
-- - A teacher's name changes only from empty, or from one without Chinese
--   characters to one with them: learn.tsinghua gives teacher names in the user's
--   language, so uploads alternate between Chinese and English otherwise.
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
  SELECT coalesce(s ~ '[\u3400-\u9fff]', false)
$$;

-- A JSON array of strings, as course pages expect in time_location.
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
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(j) e WHERE jsonb_typeof(e) <> 'string'
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
    IF NOT learnx_valid_schedule(NEW.time_location) THEN
      NEW.time_location := '[]';
    END IF;
    RETURN NEW;
  END IF;

  IF coalesce(OLD.name, '') <> '' THEN
    NEW.name := OLD.name;
  END IF;
  IF coalesce(OLD."englishName", '') <> '' THEN
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

  IF NOT (
    (coalesce(OLD.name, '') = '' AND coalesce(NEW.name, '') <> '')
    OR (NOT learnx_has_chinese(OLD.name) AND learnx_has_chinese(NEW.name))
  ) THEN
    NEW.name := OLD.name;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS learnx_course_rules ON course;
CREATE TRIGGER learnx_course_rules
  BEFORE INSERT OR UPDATE ON course
  FOR EACH ROW EXECUTE FUNCTION learnx_course_rules();

DROP TRIGGER IF EXISTS learnx_teacher_rules ON teacher;
CREATE TRIGGER learnx_teacher_rules
  BEFORE UPDATE ON teacher
  FOR EACH ROW EXECUTE FUNCTION learnx_teacher_rules();
