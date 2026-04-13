import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryItem {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('expense_categories').select('*').order('sort_order');
    setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const mainCategories = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const getSubCategories = (parentId: string) => categories.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

  return { categories, mainCategories, getSubCategories, loading, reload: load };
};
