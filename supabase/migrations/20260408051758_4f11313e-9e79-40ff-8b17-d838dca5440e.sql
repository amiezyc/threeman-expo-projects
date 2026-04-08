
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

CREATE POLICY "Allow public upload to receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Allow public read from receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Allow public delete from receipts" ON storage.objects FOR DELETE USING (bucket_id = 'receipts');
