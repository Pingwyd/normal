-- Deny direct client access; FastAPI uses service_role.

ALTER TABLE research_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_jobs FORCE ROW LEVEL SECURITY;

ALTER TABLE research_provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_provider_credentials FORCE ROW LEVEL SECURITY;

REVOKE ALL ON research_jobs FROM anon, authenticated;
REVOKE ALL ON research_provider_credentials FROM anon, authenticated;
