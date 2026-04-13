import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import ExpenseBreakdown from '@/components/ExpenseBreakdown';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import ProfitSharing from '@/components/ProfitSharing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/StatCard';
import { DollarSign, TrendingDown, PieChart, Plus, Trash2, Pencil, Check, X, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Project, Booth, PartnerShare } from '@/types';
import { toast } from 'sonner';

const ProjectsPage = () => {
  const { projects, addProject, updateProject, deleteProject, addBooth, updateBooth, deleteBooth, updatePartners } = useApp();
  const { t } = useLanguage();
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const toggleProject = (id: string) => setOpenProjects(prev => ({ ...prev, [id]: !prev[id] }));

  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectStart, setNewProjectStart] = useState(new Date().toISOString().split('T')[0]);

  const [addBoothProjectId, setAddBoothProjectId] = useState<string | null>(null);
  const [newBoothClient, setNewBoothClient] = useState('');
  const [newBoothContract, setNewBoothContract] = useState('');

  const [editingBoothId, setEditingBoothId] = useState<string | null>(null);
  const [editContractValue, setEditContractValue] = useState('');

  const [editPartnersProjectId, setEditPartnersProjectId] = useState<string | null>(null);
  const [editPartners, setEditPartners] = useState<PartnerShare[]>([]);

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    const project: Project = {
      id: `proj-${Date.now()}`, name: newProjectName.trim(), startDate: newProjectStart,
      booths: [], expenses: [], workLogs: [], partners: [],
    };
    addProject(project);
    setAddProjectOpen(false);
    setNewProjectName('');
    toast.success(t('projects.created'));
  };

  const handleAddBooth = () => {
    if (!addBoothProjectId || !newBoothClient.trim()) return;
    const booth: Booth = {
      id: `booth-${Date.now()}`, projectId: addBoothProjectId, clientName: newBoothClient.trim(),
      totalContract: Number(newBoothContract) || 0, payments: [],
    };
    addBooth(addBoothProjectId, booth);
    setAddBoothProjectId(null);
    setNewBoothClient('');
    setNewBoothContract('');
    toast.success(t('booth.added'));
  };

  const startEditContract = (booth: Booth) => {
    setEditingBoothId(booth.id);
    setEditContractValue(String(booth.totalContract));
  };

  const saveContract = (projectId: string, booth: Booth) => {
    const newAmount = Number(editContractValue);
    if (!isNaN(newAmount) && newAmount !== booth.totalContract) {
      updateBooth(projectId, { ...booth, totalContract: newAmount });
      toast.success(t('projects.contractUpdated'));
    }
    setEditingBoothId(null);
  };

  const openEditPartners = (project: Project) => {
    setEditPartnersProjectId(project.id);
    setEditPartners(project.partners ? [...project.partners] : []);
  };

  const savePartners = () => {
    if (editPartnersProjectId) {
      updatePartners(editPartnersProjectId, editPartners.filter(p => p.name.trim()));
      toast.success(t('partners.updated'));
    }
    setEditPartnersProjectId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('projects.title')}</h2>
          <p className="text-muted-foreground text-sm">{t('projects.subtitle')}</p>
        </div>
        <Button onClick={() => setAddProjectOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> {t('projects.newProject')}
        </Button>
      </div>

      {projects.map(project => {
        const totalContract = project.booths.reduce((s, b) => s + b.totalContract, 0);
        const totalExpenses = project.expenses.filter(e => !e.isClientCost).reduce((s, e) => s + e.amount, 0);
        const profit = totalContract - totalExpenses;

        const sharedExpenses = project.expenses.filter(e => !e.boothId && ['差旅', '物料', '人工', '电费'].includes(e.mainCategory));
        const sharedTotal = sharedExpenses.reduce((s, e) => s + e.amount, 0);

        const isOpen = openProjects[project.id] ?? false;
        return (
          <Collapsible key={project.id} open={isOpen} onOpenChange={() => toggleProject(project.id)} className="space-y-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1 transition-colors">
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                <h3 className="text-lg font-semibold">{project.name}</h3>
              </CollapsibleTrigger>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditPartners(project)} className="gap-1">
                  <Pencil className="h-3 w-3" /> {t('partners.title')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setAddBoothProjectId(project.id); setNewBoothClient(''); setNewBoothContract(''); }} className="gap-1">
                  <Plus className="h-3 w-3" /> {t('booth.add')}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { deleteProject(project.id); toast.success(t('projects.deleted')); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CollapsibleContent>

            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">{t('projects.all')}</TabsTrigger>
                {project.booths.map(b => (
                  <TabsTrigger key={b.id} value={b.id}>{b.clientName}</TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard title={t('dashboard.totalContract')} value={`$${totalContract.toLocaleString()}`} icon={DollarSign} />
                  <StatCard title={t('dashboard.totalExpenses')} value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingDown} variant="warning" />
                  <StatCard title={t('projects.profit')} value={`$${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} variant={profit > 0 ? 'success' : 'destructive'} />
                </div>

                {project.partners && project.partners.length > 0 && (
                  <ProfitSharing partners={project.partners} totalProfit={profit} />
                )}

                <div className="glass-card rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{t('projects.allExpenses')}</h4>
                    <AddExpenseDialog projectId={project.id} />
                  </div>
                  <ExpenseBreakdown expenses={project.expenses} title={`${project.name}`} />
                </div>
              </TabsContent>

              {project.booths.map(booth => {
                const boothThirdParty = project.expenses.filter(e => e.boothId === booth.id);
                const boothThirdPartyTotal = boothThirdParty.reduce((s, e) => s + e.amount, 0);
                const boothRatio = totalContract > 0 ? booth.totalContract / totalContract : 0;
                const allocatedShared = Math.round(sharedTotal * boothRatio * 100) / 100;
                const boothTotalCost = boothThirdPartyTotal + allocatedShared;
                const boothProfit = booth.totalContract - boothTotalCost;

                return (
                  <TabsContent key={booth.id} value={booth.id} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="glass-card rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{t('projects.contractAmount')}</span>
                          <div className="flex items-center gap-1">
                            {editingBoothId === booth.id ? (
                              <>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => saveContract(project.id, booth)}><Check className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingBoothId(null)}><X className="h-3 w-3" /></Button>
                              </>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditContract(booth)}><Pencil className="h-3 w-3" /></Button>
                            )}
                          </div>
                        </div>
                        {editingBoothId === booth.id ? (
                          <Input type="number" value={editContractValue} onChange={e => setEditContractValue(e.target.value)} onBlur={() => saveContract(project.id, booth)} onKeyDown={e => e.key === 'Enter' && saveContract(project.id, booth)} className="h-8 text-lg font-bold" autoFocus />
                        ) : (
                          <p className="text-lg font-bold">${booth.totalContract.toLocaleString()}</p>
                        )}
                      </div>
                      <StatCard title={t('projects.thirdPartyCosts')} value={`$${boothThirdPartyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingDown} variant="warning" />
                      <StatCard title={t('projects.sharedCosts')} value={`$${allocatedShared.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} subtitle={`${t('projects.ratio')} ${(boothRatio * 100).toFixed(0)}%`} icon={PieChart} />
                      <StatCard title={t('projects.boothProfit')} value={`$${boothProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} variant={boothProfit > 0 ? 'success' : 'destructive'} />
                    </div>

                    {sharedExpenses.length > 0 && (
                      <div className="glass-card rounded-lg p-5">
                        <h4 className="font-semibold mb-2">{t('projects.sharedCostsDetail')} ({(boothRatio * 100).toFixed(0)}%)</h4>
                        <div className="space-y-1 text-sm">
                          {(['差旅', '物料', '人工'] as const).map(cat => {
                            const catItems = sharedExpenses.filter(e => e.mainCategory === cat);
                            if (catItems.length === 0) return null;
                            const catTotal = catItems.reduce((s, e) => s + e.amount, 0);
                            const allocated = Math.round(catTotal * boothRatio * 100) / 100;
                            return (
                              <div key={cat} className="flex justify-between rounded-md px-4 py-2 bg-muted/30">
                                <span>{t(`cat.${cat}` as any)}</span>
                                <span className="text-muted-foreground">
                                  ${catTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} × {(boothRatio * 100).toFixed(0)}% = <span className="font-semibold text-foreground">${allocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="glass-card rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{booth.clientName} {t('projects.thirdPartyCosts')}</h4>
                        <div className="flex items-center gap-2">
                          <AddExpenseDialog projectId={project.id} boothId={booth.id} />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { deleteBooth(project.id, booth.id); toast.success(t('booth.deleted')); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {boothThirdParty.length > 0 ? (
                        <ExpenseBreakdown expenses={boothThirdParty} />
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('projects.noThirdParty')}</p>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('projects.noProjects')}</p>
        </div>
      )}

      {/* Add Project Dialog */}
      <Dialog open={addProjectOpen} onOpenChange={setAddProjectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('projects.newProject')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('projects.projectName')}</Label>
              <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder={`${t('common.example')}: APEC 2026`} />
            </div>
            <div className="space-y-2">
              <Label>{t('projects.startDate')}</Label>
              <Input type="date" value={newProjectStart} onChange={e => setNewProjectStart(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProjectOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddProject}>{t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Booth Dialog */}
      <Dialog open={!!addBoothProjectId} onOpenChange={open => !open && setAddBoothProjectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('booth.add')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('booth.clientName')}</Label>
              <Input value={newBoothClient} onChange={e => setNewBoothClient(e.target.value)} placeholder={`${t('common.example')}: Itech`} />
            </div>
            <div className="space-y-2">
              <Label>{t('booth.contractAmount')}</Label>
              <Input type="number" value={newBoothContract} onChange={e => setNewBoothContract(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBoothProjectId(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddBooth}>{t('common.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Partners Dialog */}
      <Dialog open={!!editPartnersProjectId} onOpenChange={open => !open && setEditPartnersProjectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('partners.edit')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {editPartners.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={p.name} onChange={e => { const arr = [...editPartners]; arr[i] = { ...arr[i], name: e.target.value }; setEditPartners(arr); }} placeholder={t('partners.name')} className="flex-1" />
                <Input type="number" value={p.percentage} onChange={e => { const arr = [...editPartners]; arr[i] = { ...arr[i], percentage: Number(e.target.value) }; setEditPartners(arr); }} className="w-20" placeholder="%" />
                <span className="text-sm text-muted-foreground">%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditPartners(editPartners.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => setEditPartners([...editPartners, { name: '', percentage: 0 }])}>
              <Plus className="h-4 w-4" /> {t('partners.add')}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPartnersProjectId(null)}>{t('common.cancel')}</Button>
            <Button onClick={savePartners}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;
