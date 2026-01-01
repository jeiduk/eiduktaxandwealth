import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, X, CheckCircle } from 'lucide-react';

interface UploadedDoc {
  id: string;
  name: string;
  created_at: string;
  file_size: number | null;
  category: string | null;
}

interface ClientDocumentUploadProps {
  clientId: string;
  clientName: string;
  accessToken: string;
  onUploadComplete?: () => void;
}

const DOCUMENT_CATEGORIES = [
  'Tax Returns',
  'Business Documents',
  'Financial Statements',
  'Payroll Records',
  'Other',
];

export default function ClientDocumentUpload({ clientId, clientName, accessToken, onUploadComplete }: ClientDocumentUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Other');
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Fetch existing uploaded documents
  useState(() => {
    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from('client_documents')
        .select('id, name, created_at, file_size, category')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUploadedDocs(data);
      }
      setLoadingDocs(false);
    };
    fetchDocs();
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${clientId}/${Date.now()}-${file.name}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create document record - use client_id as user_id for audit trail
        // uploaded_by_client flag distinguishes client uploads from advisor uploads
        const { data: docData, error: docError } = await supabase
          .from('client_documents')
          .insert({
            client_id: clientId,
            user_id: clientId, // Use client_id for audit trail when client uploads
            name: file.name,
            file_path: fileName,
            file_type: fileExt || null,
            file_size: file.size,
            category: selectedCategory,
            uploaded_by_client: true,
          })
          .select()
          .single();

        if (docError) throw docError;

        setUploadedDocs(prev => [docData, ...prev]);

        // Notify advisor of the upload
        try {
          await supabase.functions.invoke('notify-document-upload', {
            body: {
              clientId,
              documentName: file.name,
              documentCategory: selectedCategory,
              clientName,
              accessToken,
            },
          });
        } catch (notifyError) {
          console.error('Failed to send notification:', notifyError);
          // Don't fail the upload if notification fails
        }

        toast({
          title: 'Document uploaded',
          description: `${file.name} has been uploaded successfully.`,
        });

      } catch (error: any) {
        console.error('Upload error:', error);
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: error.message || 'Failed to upload document',
        });
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onUploadComplete?.();
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div 
        className="p-4 text-white font-display text-lg font-semibold"
        style={{ background: 'linear-gradient(135deg, hsl(var(--eiduk-navy)) 0%, hsl(var(--eiduk-blue)) 100%)' }}
      >
        📄 Submit Your Documents
      </div>
      
      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">
          Upload your tax documents, financial statements, and other required files securely. 
          Your advisor will review them and follow up if anything else is needed.
        </p>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-eiduk-navy mb-2">
            Document Category
          </label>
          <div className="flex flex-wrap gap-2">
            {DOCUMENT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-eiduk-blue text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-eiduk-blue/30 rounded-xl p-8 text-center hover:border-eiduk-blue/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-eiduk-blue" />
              <p className="text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-eiduk-blue/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-eiduk-blue" />
              </div>
              <div>
                <p className="font-medium text-eiduk-navy">Click to upload files</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, Word, Excel, or images up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Uploaded Documents List */}
        {uploadedDocs.length > 0 && (
          <div>
            <h4 className="font-medium text-eiduk-navy mb-3">Your Uploaded Documents</h4>
            <div className="space-y-2">
              {uploadedDocs.map(doc => (
                <div 
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  <FileText className="h-5 w-5 text-eiduk-blue shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.category} • {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingDocs && uploadedDocs.length === 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
