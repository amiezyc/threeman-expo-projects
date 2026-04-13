import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
}

const CategoriesPage = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMainName, setNewMainName] = useState('');
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('expense_categories').select('*').order('sort_order');
    setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const mainCats = categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const getSubCats = (parentId: string) => categories.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

  const addMainCategory = async () => {
    if (!newMainName.trim()) return;
    const maxOrder = mainCats.length > 0 ? Math.max(...mainCats.map(c => c.sort_order)) + 1 : 1;
    const { error } = await supabase.from('expense_categories').insert({ name: newMainName.trim(), sort_order: maxOrder });
    if (error) { toast.error(t('expenses.saveFailed')); return; }
    setNewMainName('');
    load();
    toast.success(t('common.save'));
  };

  const addSubCategory = async (parentId: string) => {
    const name = newSubNames[parentId]?.trim();
    if (!name) return;
    const subs = getSubCats(parentId);
    const maxOrder = subs.length > 0 ? Math.max(...subs.map(c => c.sort_order)) + 1 : 1;
    const { error } = await supabase.from('expense_categories').insert({ name, parent_id: parentId, sort_order: maxOrder });
    if (error) { toast.error(t('expenses.saveFailed')); return; }
    setNewSubNames(prev => ({ ...prev, [parentId]: '' }));
    load();
    toast.success(t('common.save'));
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('expense_categories').delete().eq('id', id);
    load();
    toast.success(t('common.delete'));
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await supabase.from('expense_categories').update({ name: editName.trim() }).eq('id', editingId);
    setEditingId(null);
    load();
    toast.success(t('common.save'));
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
        <p className="text-muted-foreground">{t('categories.subtitle')}</p>
      </div>

      <div className="grid gap-4">
        {mainCats.map(main => (
          <Card key={main.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {editingId === main.id ? (
                  <div className="flex items-center gap-2">
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 w-48" onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {main.name}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(main)}><Pencil className="h-3 w-3" /></Button>
                  </CardTitle>
                )}
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCategory(main.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {getSubCats(main.id).map(sub => (
                <div key={sub.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                  {editingId === sub.id ? (
                    <div className="flex items-center gap-2">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 w-40 text-sm" onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <span className="text-sm flex items-center gap-2">
                      {sub.name}
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(sub)}><Pencil className="h-3 w-3" /></Button>
                    </span>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteCategory(sub.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newSubNames[main.id] || ''}
                  onChange={e => setNewSubNames(prev => ({ ...prev, [main.id]: e.target.value }))}
                  placeholder={t('categories.addSub')}
                  className="h-8 text-sm"
                  onKeyDown={e => e.key === 'Enter' && addSubCategory(main.id)}
                />
                <Button size="sm" variant="outline" onClick={() => addSubCategory(main.id)} className="h-8 gap-1">
                  <Plus className="h-3 w-3" /> {t('common.add')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newMainName}
          onChange={e => setNewMainName(e.target.value)}
          placeholder={t('categories.addMain')}
          className="max-w-xs"
          onKeyDown={e => e.key === 'Enter' && addMainCategory()}
        />
        <Button onClick={addMainCategory} className="gap-1">
          <Plus className="h-4 w-4" /> {t('categories.addMain')}
        </Button>
      </div>
    </div>
  );
};

export default CategoriesPage;
