-- Align reflections tables with secure_public_rls (20260813160000).
-- FastAPI uses service_role (bypasses RLS). anon/authenticated must not reach app data.

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections FORCE ROW LEVEL SECURITY;

ALTER TABLE reflection_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_tags FORCE ROW LEVEL SECURITY;

ALTER TABLE reflection_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_blocks FORCE ROW LEVEL SECURITY;

REVOKE ALL ON reflections FROM anon, authenticated;
REVOKE ALL ON reflection_tags FROM anon, authenticated;
REVOKE ALL ON reflection_blocks FROM anon, authenticated;
