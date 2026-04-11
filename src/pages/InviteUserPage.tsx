import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, UserPlus, Pencil, KeyRound, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

interface ProfileRow {
  id: string;
  name: string;
  role: string;
  daily_rate: number | null;
  hourly_rate: number | null;
}

const InviteUserPage = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [dailyRate, setDailyRate] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [loading, setLoading] = useState(false);

  const [tempPassword, setTempPassword] = useState('');
  const [tempDialogOpen, setTempDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);

  const [editProfile, setEditProfile] = useState<ProfileRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'employee'>('employee');
  const [editDailyRate, setEditDailyRate] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [resetLoading, setResetLoading] = useState<string | null>(null);

  const loadProfiles = async () => {
    const { data } = await supabase.from('profiles').select('id, name, role, daily_rate, hourly_rate');
    setProfiles((data as ProfileRow[]) || []);
  };

  useEffect(() => { loadProfiles(); }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('create-invite', {
      body: { email, name, role, daily_rate: dailyRate ? Number(dailyRate) : null, hourly_rate: hourlyRate ? Number(hourlyRate) : null },
    });
    setLoading(false);
    if (error || data?.error) {
      toast.error(`${t('users.inviteFailed')}: ${data?.error || error?.message || t('common.unknown')}`);
    } else {
      toast.success(`${t('users.userCreated')} ${email}`);
      setTempPassword(data?.tempPassword || '');
      setTempDialogOpen(true);
      setEmail(''); setName(''); setDailyRate(''); setHourlyRate('');
      loadProfiles();
    }
  };

  const handleEditOpen = (p: ProfileRow) => {
    setEditProfile(p);
    setEditName(p.name);
    setEditRole(p.role as 'admin' | 'employee');
    setEditDailyRate(p.daily_rate?.toString() || '');
    setEditHourlyRate(p.hourly_rate?.toString() || '');
  };

  const handleEditSave = async () => {
    if (!editProfile) return;
    setEditLoading(true);
    const { data, error } = await supabase.functions.invoke('update-profile-admin', {
      body: { userId: editProfile.id, name: editName, role: editRole, daily_rate: editDailyRate ? Number(editDailyRate) : null, hourly_rate: editHourlyRate ? Number(editHourlyRate) : null },
    });
    setEditLoading(false);
    if (error || data?.error) {
      toast.error(`${t('users.updateFailed')}: ${data?.error || error?.message}`);
    } else {
      toast.success(t('users.updated'));
      setEditProfile(null);
      loadProfiles();
    }
  };

  const handleResetPassword = async (userId: string) => {
    setResetLoading(userId);
    const { data, error } = await supabase.functions.invoke('reset-password', { body: { userId } });
    setResetLoading(null);
    if (error || data?.error) {
      toast.error(`${t('users.resetFailed')}: ${data?.error || error?.message}`);
    } else {
      setTempPassword(data?.tempPassword || '');
      setTempDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('users.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('users.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> {t('users.inviteNew')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('users.name')}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>{t('users.email')}</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>{t('users.role')}</Label>
                <Select value={role} onValueChange={v => setRole(v as 'admin' | 'employee')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">{t('nav.employee')}</SelectItem>
                    <SelectItem value="admin">{t('nav.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('users.dailyRate')}</Label>
                <Input type="number" value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="250" />
              </div>
              <div className="space-y-2">
                <Label>{t('users.hourlyRate')}</Label>
                <Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder={t('users.hourlyOptional')} />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('users.createUser')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('users.existingUsers')}</CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('users.noUsers')}</p>
          ) : (
            <div className="space-y-2">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-border/50 px-4 py-3">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.role === 'admin' ? t('nav.admin') : t('nav.employee')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2">
                      {p.daily_rate != null && `${t('users.dailyRate')} $${p.daily_rate}`}
                      {p.hourly_rate != null && ` / ${t('users.hourlyRate')} $${p.hourly_rate}`}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleEditOpen(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> {t('users.edit')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleResetPassword(p.id)} disabled={resetLoading === p.id}>
                      {resetLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <KeyRound className="h-3.5 w-3.5 mr-1" />}
                      {t('users.resetPassword')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={tempDialogOpen} onOpenChange={(open) => { if (!open) setTempPassword(''); setTempDialogOpen(open); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('users.tempPassword')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t('users.tempPasswordDesc')}</p>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-lg tracking-wider">
            <span className="flex-1 select-all">{tempPassword}</span>
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('users.tempPasswordNote')}</p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProfile} onOpenChange={(open) => { if (!open) setEditProfile(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('users.editUser')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('users.name')}</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('users.role')}</Label>
              <Select value={editRole} onValueChange={v => setEditRole(v as 'admin' | 'employee')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">{t('nav.employee')}</SelectItem>
                  <SelectItem value="admin">{t('nav.admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('users.dailyRate')}</Label>
              <Input type="number" value={editDailyRate} onChange={e => setEditDailyRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('users.hourlyRate')}</Label>
              <Input type="number" value={editHourlyRate} onChange={e => setEditHourlyRate(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleEditSave} disabled={editLoading}>
              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InviteUserPage;
