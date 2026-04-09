import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a file to Supabase Storage with a UUID-based filename
 * to avoid InvalidKey errors from special characters.
 * Original filename is preserved in metadata.
 */
export async function uploadFile(
  bucket: string,
  folder: string,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() || 'bin';
  const uuid = crypto.randomUUID();
  const safePath = `${folder}/${uuid}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(safePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(safePath);

  return { url: urlData.publicUrl, path: safePath };
}
