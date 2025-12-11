import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  companyName: z.string().max(200).optional(),
  businessType: z.string().optional(),
  annualIncome: z.string().optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(['Active', 'Inactive', 'Prospect']),
});

export default function ClientNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    businessType: 'S-Corporation',
    annualIncome: '',
    notes: '',
    status: 'Active' as const,
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      clientSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user!.id,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company_name: formData.companyName.trim() || null,
          business_type: formData.businessType || null,
          annual_income: formData.annualIncome.trim() || null,
          notes: formData.notes.trim() || null,
          status: formData.status,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Client created',
        description: `${formData.firstName} ${formData.lastName} has been added.`,
      });

      navigate(`/clients/${data.id}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create client',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="mb-6">
          <Link 
            to="/clients" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Add New Client</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-destructive' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-destructive' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => handleChange('businessType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S-Corporation">S-Corporation</SelectItem>
                      <SelectItem value="C-Corporation">C-Corporation</SelectItem>
                      <SelectItem value="LLC">LLC</SelectItem>
                      <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualIncome">Annual Income</Label>
                  <Select
                    value={formData.annualIncome}
                    onValueChange={(value) => handleChange('annualIncome', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$100k - $250k">$100k - $250k</SelectItem>
                      <SelectItem value="$250k - $500k">$250k - $500k</SelectItem>
                      <SelectItem value="$500k - $1M">$500k - $1M</SelectItem>
                      <SelectItem value="$1M - $5M">$1M - $5M</SelectItem>
                      <SelectItem value="$5M+">$5M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Any additional notes about this client..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/clients')}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="navy" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Client'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
