import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface ReasonableCompData {
  id?: string;
  clientId?: string;
  // Step 1: Business Info
  businessName: string;
  taxYear: string;
  industry: string;
  naicsCode: string;
  state: string;
  metroArea: string;
  grossRevenue: string;
  netIncome: string;
  employeeCount: string;
  // Step 2: Owner Info
  ownerName: string;
  roleTitle: string;
  yearsExperience: string;
  hoursPerWeek: string;
  weeksPerYear: string;
  credentials: string[];
  // Step 3: Time Allocation
  allocations: Record<string, number>;
  proficiency: Record<string, string>;
  // Step 5: IRS Factors
  selectedFactors: string[];
  // Step 6: Results
  finalWage: number;
  advisorName: string;
  justification: string;
  // Signatures
  clientAckChecked: boolean;
  advisorAckChecked: boolean;
  clientSigName: string;
  advisorSigName: string;
  clientTimestamp: string;
  advisorTimestamp: string;
  clientConfirmed: boolean;
  advisorConfirmed: boolean;
  documentLocked: boolean;
  lockTimestamp: string;
}

const defaultData: ReasonableCompData = {
  clientId: undefined,
  businessName: '',
  taxYear: '2026',
  industry: '',
  naicsCode: '',
  state: '',
  metroArea: '',
  grossRevenue: '',
  netIncome: '',
  employeeCount: '1',
  ownerName: '',
  roleTitle: '',
  yearsExperience: '',
  hoursPerWeek: '40',
  weeksPerYear: '50',
  credentials: [],
  allocations: { ceo: 20, ops: 25, sales: 20, tech: 25, admin: 10 },
  proficiency: { ceo: 'average', ops: 'average', sales: 'average', tech: 'average', admin: 'average' },
  selectedFactors: [],
  finalWage: 105000,
  advisorName: '',
  justification: '',
  clientAckChecked: false,
  advisorAckChecked: false,
  clientSigName: '',
  advisorSigName: '',
  clientTimestamp: '',
  advisorTimestamp: '',
  clientConfirmed: false,
  advisorConfirmed: false,
  documentLocked: false,
  lockTimestamp: '',
};

export function useReasonableCompFile(fileId?: string, clientId?: string) {
  const { user } = useAuth();
  const [data, setData] = useState<ReasonableCompData>(defaultData);
  const [currentFileId, setCurrentFileId] = useState<string | undefined>(fileId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing file or create new one
  useEffect(() => {
    const loadOrCreate = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (fileId) {
          // Load specific file
          const { data: file, error } = await supabase
            .from('reasonable_comp_files')
            .select('*')
            .eq('id', fileId)
            .eq('user_id', user.id)
            .single();

          if (error) throw error;

          if (file) {
            setData({
              id: file.id,
              clientId: file.client_id || undefined,
              businessName: file.business_name || '',
              taxYear: file.fiscal_year_end || '2026',
              industry: file.industry || '',
              naicsCode: file.industry_naics || '',
              state: file.state_of_incorporation || '',
              metroArea: '',
              grossRevenue: file.annual_revenue || '',
              netIncome: '',
              employeeCount: file.number_of_employees || '1',
              ownerName: file.officer_name || '',
              roleTitle: file.officer_title || '',
              yearsExperience: file.years_in_industry || '',
              hoursPerWeek: '40',
              weeksPerYear: '50',
              credentials: file.certifications ? file.certifications.split(',') : [],
              allocations: (file.time_allocation as Record<string, number>) || defaultData.allocations,
              proficiency: defaultData.proficiency,
              selectedFactors: [],
              finalWage: Number(file.salary_mid) || 105000,
              advisorName: '',
              justification: file.defense_notes || '',
              clientAckChecked: false,
              advisorAckChecked: false,
              clientSigName: '',
              advisorSigName: '',
              clientTimestamp: '',
              advisorTimestamp: '',
              clientConfirmed: false,
              advisorConfirmed: false,
              documentLocked: file.status === 'finalized',
              lockTimestamp: '',
            });
            setCurrentFileId(file.id);
          }
        } else {
          // Check for most recent draft
          const { data: files, error } = await supabase
            .from('reasonable_comp_files')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'draft')
            .order('updated_at', { ascending: false })
            .limit(1);

          if (error) throw error;

          if (files && files.length > 0) {
            const file = files[0];
            setData({
              id: file.id,
              clientId: file.client_id || undefined,
              businessName: file.business_name || '',
              taxYear: file.fiscal_year_end || '2026',
              industry: file.industry || '',
              naicsCode: file.industry_naics || '',
              state: file.state_of_incorporation || '',
              metroArea: '',
              grossRevenue: file.annual_revenue || '',
              netIncome: '',
              employeeCount: file.number_of_employees || '1',
              ownerName: file.officer_name || '',
              roleTitle: file.officer_title || '',
              yearsExperience: file.years_in_industry || '',
              hoursPerWeek: '40',
              weeksPerYear: '50',
              credentials: file.certifications ? file.certifications.split(',') : [],
              allocations: (file.time_allocation as Record<string, number>) || defaultData.allocations,
              proficiency: defaultData.proficiency,
              selectedFactors: [],
              finalWage: Number(file.salary_mid) || 105000,
              advisorName: '',
              justification: file.defense_notes || '',
              clientAckChecked: false,
              advisorAckChecked: false,
              clientSigName: '',
              advisorSigName: '',
              clientTimestamp: '',
              advisorTimestamp: '',
              clientConfirmed: false,
              advisorConfirmed: false,
              documentLocked: file.status === 'finalized',
              lockTimestamp: '',
            });
            setCurrentFileId(file.id);
          }
        }
      } catch (error) {
        console.error('Error loading reasonable comp file:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrCreate();
  }, [user, fileId]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to save');
      return false;
    }

    setSaving(true);

    try {
      const fileData = {
        user_id: user.id,
        client_id: data.clientId || null,
        business_name: data.businessName,
        fiscal_year_end: data.taxYear,
        industry: data.industry,
        industry_naics: data.naicsCode,
        state_of_incorporation: data.state,
        annual_revenue: data.grossRevenue,
        number_of_employees: data.employeeCount,
        officer_name: data.ownerName,
        officer_title: data.roleTitle,
        years_in_industry: data.yearsExperience,
        certifications: data.credentials.join(','),
        time_allocation: data.allocations as unknown as Json,
        salary_mid: data.finalWage,
        defense_notes: data.justification,
        status: data.documentLocked ? 'finalized' : 'draft',
      };

      if (currentFileId) {
        // Update existing
        const { error } = await supabase
          .from('reasonable_comp_files')
          .update(fileData)
          .eq('id', currentFileId);

        if (error) throw error;
      } else {
        // Create new
        const { data: newFile, error } = await supabase
          .from('reasonable_comp_files')
          .insert(fileData)
          .select('id')
          .single();

        if (error) throw error;
        
        if (newFile) {
          setCurrentFileId(newFile.id);
          setData(prev => ({ ...prev, id: newFile.id }));
        }
      }

      toast.success('Defense File saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving reasonable comp file:', error);
      toast.error('Failed to save Defense File');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, data, currentFileId]);

  const updateData = useCallback((updates: Partial<ReasonableCompData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const startNew = useCallback(() => {
    setData(defaultData);
    setCurrentFileId(undefined);
  }, []);

  return {
    data,
    updateData,
    save,
    loading,
    saving,
    currentFileId,
    startNew,
  };
}
