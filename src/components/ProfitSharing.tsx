import { PartnerShare } from '@/types';
import { Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ProfitSharingProps {
  partners: PartnerShare[];
  totalProfit: number;
}

const ProfitSharing = ({ partners, totalProfit }: ProfitSharingProps) => {
  const { t } = useLanguage();
  return (
    <div className="glass-card rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Users className="h-4 w-4 text-primary" />
        <h4 className="font-semibold">{t('partners.profitSharing')}</h4>
        <span className="ml-auto text-sm text-muted-foreground">
          {t('partners.totalProfit')}: <span className={`font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
            ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </span>
      </div>

      <div className="space-y-2">
        {partners.map(partner => {
          const share = totalProfit * (partner.percentage / 100);
          return (
            <div key={partner.name} className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {partner.name[0]}
                </div>
                <div>
                  <span className="font-medium">{partner.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{partner.percentage}%</span>
                </div>
              </div>
              <span className={`font-semibold ${share >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                ${share.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfitSharing;
