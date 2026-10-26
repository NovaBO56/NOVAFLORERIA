-- Private images; owner identity is derived from the server session.
-- No public URL, no direct authenticated storage writes, no profile/role changes.
BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('profile-avatars','profile-avatars',false,2097152,ARRAY['image/webp'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=2097152,allowed_mime_types=ARRAY['image/webp'];
COMMIT;
